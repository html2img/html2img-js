/**
 * Error hierarchy for the html2img client.
 *
 * Every request-time failure surfaces as an {@link Html2imgError} or one of
 * its subclasses, so catching that single type is enough to handle anything
 * the SDK throws once a request is underway. Invalid arguments are reported
 * before any request is sent, as a native `TypeError` or `RangeError`.
 */

/** The decoded JSON body of an API response. */
export type ErrorPayload = Record<string, unknown>;

/** Context attached to an {@link Html2imgError} when it is constructed. */
export interface Html2imgErrorOptions {
  /** The HTTP status code, when the failure came from a response. */
  statusCode?: number | null;
  /** The decoded JSON response body, when available. */
  payload?: ErrorPayload;
  /** The machine-readable `code` field from the API body, when present. */
  errorCode?: string | null;
  /** The underlying error, when this error wraps one. */
  cause?: unknown;
}

/**
 * Base type for every error thrown by the client at request time.
 *
 * Catching this single type is enough to handle any failure originating
 * from the SDK. No raw fetch error is ever allowed to escape the public API.
 */
export class Html2imgError extends Error {
  /** The HTTP status code associated with this failure, if any. */
  readonly statusCode: number | null;

  /** The machine-readable `code` from the API response body, if any. */
  readonly errorCode: string | null;

  /** The decoded JSON response body, if any. */
  readonly payload: ErrorPayload;

  constructor(message: string, options: Html2imgErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'Html2imgError';
    this.statusCode = options.statusCode ?? null;
    this.errorCode = options.errorCode ?? null;
    this.payload = options.payload ?? {};
  }
}

/**
 * Thrown on a 401 response: the API key is missing or not recognised.
 *
 * The API `code` is `missing_api_key` or `invalid_api_key`.
 */
export class AuthenticationError extends Html2imgError {
  constructor(message: string, options: Html2imgErrorOptions = {}) {
    super(message, options);
    this.name = 'AuthenticationError';
  }
}

/**
 * Thrown on a 402 response: the account is authenticated but out of credits
 * for the current billing period. The API `code` is `insufficient_credits`.
 */
export class InsufficientCreditsError extends Html2imgError {
  constructor(message: string, options: Html2imgErrorOptions = {}) {
    super(message, options);
    this.name = 'InsufficientCreditsError';
  }

  /**
   * Credits remaining on the account, as reported by the API. Zero on a
   * 402 response.
   */
  get creditsRemaining(): number | null {
    const value = this.payload['credits_remaining'];

    return typeof value === 'number' && Number.isInteger(value) ? value : null;
  }
}

/**
 * Thrown on a 403 response: the key is valid but the account has no active
 * subscription. The API `code` is `not_subscribed`.
 */
export class NotSubscribedError extends Html2imgError {
  constructor(message: string, options: Html2imgErrorOptions = {}) {
    super(message, options);
    this.name = 'NotSubscribedError';
  }
}

/**
 * Thrown on a 404 response, for example when a template slug does not exist.
 * The API `code` is `template_not_found`.
 */
export class NotFoundError extends Html2imgError {
  constructor(message: string, options: Html2imgErrorOptions = {}) {
    super(message, options);
    this.name = 'NotFoundError';
  }
}

/**
 * Thrown on a 400 or 422 response when one or more request fields fail
 * validation. The API `code` is `validation_error`.
 */
export class ValidationError extends Html2imgError {
  /** Map of field name to its validation messages. */
  readonly details: Record<string, string[]>;

  constructor(
    message: string,
    details: Record<string, string[]> = {},
    options: Html2imgErrorOptions = {},
  ) {
    super(message, options);
    this.name = 'ValidationError';
    this.details = details;
  }
}

/**
 * Thrown on a 429 response when the account exceeds its request rate or
 * plan quota.
 */
export class RateLimitError extends Html2imgError {
  constructor(message: string, options: Html2imgErrorOptions = {}) {
    super(message, options);
    this.name = 'RateLimitError';
  }
}

/**
 * Thrown on a 504 response when a synchronous render exceeds the renderer
 * budget. The API `code` is `timeout_error` or `api_timeout_error`.
 *
 * For captures that routinely take this long, supply a `webhookUrl` on the
 * request to switch to asynchronous delivery.
 */
export class TimeoutError extends Html2imgError {
  constructor(message: string, options: Html2imgErrorOptions = {}) {
    super(message, options);
    this.name = 'TimeoutError';
  }
}

/**
 * Thrown on a 5xx response when the renderer returns an unexpected error.
 * The API `code` is `service_error`. Retry once; if it persists, contact
 * support with the `id` from the payload.
 */
export class ServerError extends Html2imgError {
  constructor(message: string, options: Html2imgErrorOptions = {}) {
    super(message, options);
    this.name = 'ServerError';
  }
}

/**
 * Thrown when the request never reaches a response: DNS failure, refused
 * connection, TLS error or a transport-level timeout, including the
 * client-side request timeout configured on the client.
 */
export class ConnectionError extends Html2imgError {
  constructor(message: string, options: Html2imgErrorOptions = {}) {
    super(message, options);
    this.name = 'ConnectionError';
  }
}
