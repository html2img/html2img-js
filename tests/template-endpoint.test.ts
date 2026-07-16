import { describe, expect, it } from 'vitest';
import {
  jsonResponse,
  lastRequest,
  lastRequestBody,
  lastRequestHeader,
  mockClient,
} from './helpers';

describe('the template endpoint', () => {
  it('posts the data payload to /api/v1/templates/{slug}', async () => {
    const { client, requests } = mockClient([
      jsonResponse(200, {
        success: true,
        id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
        template: 'invoice',
        credits_remaining: 4997,
        url: 'https://i.html2img.com/invoice.png',
      }),
    ]);

    const response = await client.template('invoice', { number: 1042, amount: '$240.00' });

    const request = lastRequest(requests);

    expect(request.init.method).toBe('POST');
    expect(request.url).toBe('https://app.html2img.com/api/v1/templates/invoice');
    expect(lastRequestHeader(requests, 'X-API-Key')).toBe('test-key');
    expect(lastRequestBody(requests)).toEqual({ number: 1042, amount: '$240.00' });
    expect(response.template).toBe('invoice');
  });

  it('defaults to an empty data payload', async () => {
    const { client, requests } = mockClient([
      jsonResponse(200, { success: true, id: 'x', template: 'invoice' }),
    ]);

    await client.template('invoice');

    expect(lastRequestBody(requests)).toEqual({});
  });

  it('url-encodes the template slug', async () => {
    const { client, requests } = mockClient([
      jsonResponse(200, { success: true, id: 'x', template: 'a b' }),
    ]);

    await client.template('a b', {});

    expect(lastRequest(requests).url).toBe('https://app.html2img.com/api/v1/templates/a%20b');
  });
});
