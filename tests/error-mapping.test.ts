import { describe, expect, it } from 'vitest';
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
} from '../src';
import { jsonResponse, mockClient, rejectionOf } from './helpers';

async function callHtml(status: number, body: unknown): Promise<unknown> {
  const { client } = mockClient([jsonResponse(status, body)]);

  return rejectionOf(client.html({ html: '<h1>Hi</h1>' }));
}

const errorMatrix: Array<[string, number, Record<string, unknown>, typeof Html2imgError]> = [
  [
    'validation 400',
    400,
    { error: 'Validation failed', code: 'validation_error', details: {} },
    ValidationError,
  ],
  [
    'validation 422',
    422,
    { error: 'Validation failed', code: 'validation_error', details: {} },
    ValidationError,
  ],
  ['auth 401', 401, { error: 'Invalid API key', code: 'invalid_api_key' }, AuthenticationError],
  [
    'credits 402',
    402,
    { error: 'Insufficient credits', code: 'insufficient_credits', credits_remaining: 0 },
    InsufficientCreditsError,
  ],
  [
    'forbidden 403',
    403,
    { error: 'You must be subscribed to use this service', code: 'not_subscribed' },
    NotSubscribedError,
  ],
  [
    'not found 404',
    404,
    { error: 'Template not found', code: 'template_not_found' },
    NotFoundError,
  ],
  ['rate limit 429', 429, { error: 'Too many requests' }, RateLimitError],
  ['timeout 504', 504, { error: 'Request timed out', code: 'timeout_error' }, TimeoutError],
  ['server 500', 500, { error: 'Service error', code: 'service_error' }, ServerError],
  ['server 502', 502, { error: 'Bad gateway' }, ServerError],
  ['unmapped 418', 418, { error: 'I am a teapot' }, Html2imgError],
];

describe('error mapping', () => {
  it.each(errorMatrix)(
    'maps %s to the precise error subclass',
    async (_label, status, body, expected) => {
      const error = await callHtml(status, body);

      expect(error).toBeInstanceOf(Html2imgError);
      expect(error).toBeInstanceOf(expected);
      expect((error as Html2imgError).statusCode).toBe(status);
    },
  );

  it('carries the error code and payload on the error', async () => {
    const error = (await callHtml(402, {
      error: 'Insufficient credits',
      code: 'insufficient_credits',
      credits_remaining: 0,
    })) as InsufficientCreditsError;

    expect(error.errorCode).toBe('insufficient_credits');
    expect(error.message).toBe('Insufficient credits');
    expect(error.payload).toHaveProperty('credits_remaining');
    expect(error.creditsRemaining).toBe(0);
  });

  it('exposes per-field validation details', async () => {
    const error = (await callHtml(400, {
      error: 'Validation failed',
      code: 'validation_error',
      details: {
        url: ['The url field is required.'],
        width: ['The width must be between 1 and 5000.'],
      },
    })) as ValidationError;

    expect(error.details).toEqual({
      url: ['The url field is required.'],
      width: ['The width must be between 1 and 5000.'],
    });
  });

  it('wraps a single validation message into a list', async () => {
    const error = (await callHtml(422, {
      error: 'Validation failed',
      details: { html: 'The html field is required.' },
    })) as ValidationError;

    expect(error.details).toEqual({ html: ['The html field is required.'] });
  });

  it('wraps a network failure as a ConnectionError', async () => {
    const { client } = mockClient([new TypeError('fetch failed')]);
    const error = await rejectionOf(client.html({ html: '<h1>Hi</h1>' }));

    expect(error).toBeInstanceOf(ConnectionError);
    expect((error as ConnectionError).message).toBe(
      'Could not reach the html2img API: fetch failed',
    );
  });

  it('wraps a client-side timeout as a ConnectionError', async () => {
    const abort = Object.assign(new Error('The operation was aborted due to timeout'), {
      name: 'TimeoutError',
    });
    const { client } = mockClient([abort]);
    const error = await rejectionOf(client.html({ html: '<h1>Hi</h1>' }));

    expect(error).toBeInstanceOf(ConnectionError);
    expect((error as ConnectionError).message).toBe(
      'The request to the html2img API timed out after 35000ms.',
    );
    expect((error as ConnectionError).cause).toBe(abort);
  });

  it('falls back to a status-based message when the body has no error text', async () => {
    const error = (await callHtml(500, {})) as Html2imgError;

    expect(error.message).toBe('The html2img API returned HTTP 500.');
  });

  it('tolerates an empty error body', async () => {
    const { client } = mockClient([new Response('', { status: 500 })]);
    const error = await rejectionOf(client.html({ html: '<h1>Hi</h1>' }));

    expect(error).toBeInstanceOf(ServerError);
    expect((error as ServerError).payload).toEqual({});
  });

  it('tolerates a malformed json error body', async () => {
    const { client } = mockClient([new Response('<html>Bad gateway</html>', { status: 502 })]);
    const error = await rejectionOf(client.html({ html: '<h1>Hi</h1>' }));

    expect(error).toBeInstanceOf(ServerError);
    expect((error as ServerError).message).toBe('The html2img API returned HTTP 502.');
  });
});
