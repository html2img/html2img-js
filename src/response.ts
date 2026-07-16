/**
 * The result of a successful render call.
 *
 * Covers both the synchronous envelope (`url` populated) and the
 * asynchronous acceptance envelope returned when a `webhookUrl` was
 * supplied (`status` is `processing` and `url` is null until the webhook
 * fires).
 */
export class RenderResponse {
  /** Whether the API reported success. */
  readonly success: boolean;

  /** The render id, when provided. */
  readonly id: string | null;

  /**
   * The CDN URL of the generated image or PDF. Null while an async job is
   * still processing.
   */
  readonly url: string | null;

  /** Credits left on the account after this call, when reported. */
  readonly creditsRemaining: number | null;

  /** The job status. `processing` for accepted async jobs. */
  readonly status: string | null;

  /** A human-readable message, when provided. */
  readonly message: string | null;

  /** The template slug, on template renders. */
  readonly template: string | null;

  /**
   * The full decoded JSON payload, for access to any field not surfaced as
   * a typed property.
   */
  readonly raw: Record<string, unknown>;

  /** Build a response from a decoded JSON payload. */
  constructor(payload: Record<string, unknown>) {
    this.success = Boolean(payload['success']);
    this.id = asString(payload['id']);
    this.url = asString(payload['url']);
    this.creditsRemaining = asInteger(payload['credits_remaining']);
    this.status = asString(payload['status']);
    this.message = asString(payload['message']);
    this.template = asString(payload['template']);
    this.raw = payload;
  }

  /**
   * Whether this is an async job still being rendered.
   *
   * When true, the final image URL is delivered to the request's
   * `webhookUrl` rather than being available on this response.
   */
  isProcessing(): boolean {
    return this.status === 'processing';
  }
}

function asString(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return null;
}

function asInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === 'string' && value !== '' && Number.isFinite(Number(value))) {
    return Math.trunc(Number(value));
  }

  return null;
}
