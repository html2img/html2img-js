import {
  AuthenticationError,
  ConnectionError,
  Html2imgError,
  InsufficientCreditsError,
  NotFoundError,
  NotSubscribedError,
  RateLimitError,
  ServerError,
  TimeoutError,
  ValidationError,
  type ErrorPayload,
  type Html2imgErrorOptions,
} from './errors';
import { guardRequiredString } from './guard';
import {
  htmlRequestBody,
  screenshotRequestBody,
  type HtmlOptions,
  type ScreenshotOptions,
} from './options';
import { RenderResponse } from './response';

/**
 * A `fetch`-compatible function. The built-in global `fetch` satisfies this
 * on Node.js 18+, Bun, Deno, and edge runtimes.
 */
export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

/** Configuration for {@link Html2img}. */
export interface Html2imgOptions {
  /** Your html2img API key, sent as the `X-API-Key` header on every request. */
  apiKey: string;

  /** Base URL of the API. Override only for testing or a private deployment. */
  baseUrl?: string;

  /**
   * Request timeout in milliseconds. Defaults to just over the 30 second
   * synchronous render budget.
   */
  timeout?: number;

  /**
   * An optional custom `fetch` implementation, for proxies, custom retry
   * middleware, or runtimes without a global `fetch`. When supplied it is
   * used as is; the SDK still sends the `X-API-Key`, `Accept` and
   * `Content-Type` headers on every request.
   */
  fetch?: FetchLike;
}

/**
 * Client for the html2img.com API.
 *
 * Render HTML documents you control, capture live URLs, or render named
 * templates, each returning a {@link RenderResponse}. Every failure surfaces
 * as an {@link Html2imgError}; no raw fetch error escapes.
 */
export class Html2img {
  static readonly DEFAULT_BASE_URL = 'https://app.html2img.com';

  static readonly DEFAULT_TIMEOUT = 35_000;

  readonly baseUrl: string;

  readonly timeout: number;

  private readonly apiKey: string;

  private readonly fetchImpl: FetchLike;

  /**
   * @param options Your API key as a string, or a configuration object.
   */
  constructor(options: string | Html2imgOptions) {
    const config = typeof options === 'string' ? { apiKey: options } : options;

    if (typeof config?.apiKey !== 'string' || config.apiKey === '') {
      throw new TypeError('The apiKey must not be empty.');
    }

    const timeout = config.timeout ?? Html2img.DEFAULT_TIMEOUT;

    if (typeof timeout !== 'number' || !Number.isFinite(timeout) || timeout <= 0) {
      throw new RangeError('The timeout must be a positive number of milliseconds.');
    }

    const fetchImpl = config.fetch ?? (globalThis.fetch as FetchLike | undefined);

    if (typeof fetchImpl !== 'function') {
      throw new TypeError(
        'No fetch implementation is available. Node.js 18+ provides one globally; on older runtimes pass one via the fetch option.',
      );
    }

    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? Html2img.DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.timeout = timeout;
    this.fetchImpl = fetchImpl;
  }

  /** Render an HTML document to an image. */
  async html(options: HtmlOptions): Promise<RenderResponse> {
    return this.send('/api/html', htmlRequestBody(options));
  }

  /** Capture a screenshot of a live URL. */
  async screenshot(options: ScreenshotOptions): Promise<RenderResponse> {
    return this.send('/api/screenshot', screenshotRequestBody(options));
  }

  /**
   * Render a named template from a JSON data payload.
   *
   * @param slug The template slug, for example `invoice`.
   * @param data The template data, validated server-side per template.
   */
  async template(slug: string, data: Record<string, unknown> = {}): Promise<RenderResponse> {
    guardRequiredString('slug', slug);

    return this.send(`/api/v1/templates/${encodeURIComponent(slug)}`, data);
  }

  /** Send a request and map the outcome onto a response or a typed error. */
  private async send(path: string, body: Record<string, unknown>): Promise<RenderResponse> {
    const doFetch = this.fetchImpl;

    let response: Response;

    try {
      response = await doFetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeout),
      });
    } catch (error) {
      throw this.toConnectionError(error);
    }

    const payload = await decodePayload(response);

    if (!response.ok) {
      throw mapErrorResponse(response.status, payload);
    }

    return new RenderResponse(payload);
  }

  /** Wrap a transport-level failure, keeping the original as the cause. */
  private toConnectionError(error: unknown): ConnectionError {
    const name = error instanceof Object && 'name' in error ? error.name : null;

    if (name === 'TimeoutError' || name === 'AbortError') {
      return new ConnectionError(
        `The request to the html2img API timed out after ${this.timeout}ms.`,
        { cause: error },
      );
    }

    const message = error instanceof Error ? error.message : String(error);

    return new ConnectionError(`Could not reach the html2img API: ${message}`, { cause: error });
  }
}

/** Map an error response onto the matching error type. */
function mapErrorResponse(status: number, payload: ErrorPayload): Html2imgError {
  const options: Html2imgErrorOptions = {
    statusCode: status,
    payload,
    errorCode: typeof payload['code'] === 'string' ? payload['code'] : null,
  };
  const message = messageFrom(payload, status);

  if (status === 400 || status === 422) {
    return new ValidationError(message, detailsFrom(payload), options);
  }

  if (status === 401) {
    return new AuthenticationError(message, options);
  }

  if (status === 402) {
    return new InsufficientCreditsError(message, options);
  }

  if (status === 403) {
    return new NotSubscribedError(message, options);
  }

  if (status === 404) {
    return new NotFoundError(message, options);
  }

  if (status === 429) {
    return new RateLimitError(message, options);
  }

  if (status === 408 || status === 504) {
    return new TimeoutError(message, options);
  }

  if (status >= 500) {
    return new ServerError(message, options);
  }

  return new Html2imgError(message, options);
}

/** Derive a human-readable message from the response body. */
function messageFrom(payload: ErrorPayload, status: number): string {
  for (const key of ['error', 'message'] as const) {
    const value = payload[key];

    if (typeof value === 'string' && value !== '') {
      return value;
    }
  }

  return `The html2img API returned HTTP ${status}.`;
}

/** Extract the per-field validation messages from a validation response. */
function detailsFrom(payload: ErrorPayload): Record<string, string[]> {
  const details = payload['details'];

  if (typeof details !== 'object' || details === null || Array.isArray(details)) {
    return {};
  }

  const result: Record<string, string[]> = {};

  for (const [field, messages] of Object.entries(details)) {
    result[field] = (Array.isArray(messages) ? messages : [messages]).map(String);
  }

  return result;
}

/**
 * Decode a JSON response body into an object, tolerating empty or malformed
 * bodies.
 */
async function decodePayload(response: Response): Promise<Record<string, unknown>> {
  let text: string;

  try {
    text = await response.text();
  } catch {
    return {};
  }

  if (text === '') {
    return {};
  }

  try {
    const decoded: unknown = JSON.parse(text);

    return typeof decoded === 'object' && decoded !== null && !Array.isArray(decoded)
      ? (decoded as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}
