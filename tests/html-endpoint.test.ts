import { describe, expect, it } from 'vitest';
import {
  jsonResponse,
  lastRequest,
  lastRequestBody,
  lastRequestHeader,
  mockClient,
} from './helpers';

describe('the html endpoint', () => {
  it('posts to /api/html with the api key header', async () => {
    const { client, requests } = mockClient([
      jsonResponse(200, {
        success: true,
        id: '550e8400-e29b-41d4-a716-446655440000',
        credits_remaining: 4999,
        url: 'https://i.html2img.com/abc123def456.png',
      }),
    ]);

    await client.html({ html: '<h1>Hello</h1>' });

    const request = lastRequest(requests);

    expect(request.init.method).toBe('POST');
    expect(request.url).toBe('https://app.html2img.com/api/html');
    expect(lastRequestHeader(requests, 'X-API-Key')).toBe('test-key');
    expect(lastRequestHeader(requests, 'Accept')).toBe('application/json');
    expect(lastRequestHeader(requests, 'Content-Type')).toBe('application/json');
  });

  it('maps every html option into the json body in snake_case', async () => {
    const { client, requests } = mockClient([
      jsonResponse(200, { success: true, id: 'x', url: 'https://i.html2img.com/x.png' }),
    ]);

    await client.html({
      html: '<h1>Invoice</h1>',
      css: 'body { background: #fff; }',
      width: 794,
      height: 1123,
      fullpage: true,
      dpi: 2,
      webhookUrl: 'https://example.com/hook',
      msDelay: 500,
      waitForSelector: '.ready',
      format: 'pdf',
    });

    expect(lastRequestBody(requests)).toEqual({
      html: '<h1>Invoice</h1>',
      css: 'body { background: #fff; }',
      width: 794,
      height: 1123,
      fullpage: true,
      dpi: 2,
      webhook_url: 'https://example.com/hook',
      ms_delay: 500,
      wait_for_selector: '.ready',
      format: 'pdf',
    });
  });

  it('omits unset html options from the json body', async () => {
    const { client, requests } = mockClient([
      jsonResponse(200, { success: true, id: 'x', url: 'https://i.html2img.com/x.png' }),
    ]);

    await client.html({ html: '<h1>Hi</h1>' });

    expect(lastRequestBody(requests)).toEqual({ html: '<h1>Hi</h1>' });
  });
});
