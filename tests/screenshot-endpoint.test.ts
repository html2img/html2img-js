import { describe, expect, it } from 'vitest';
import {
  jsonResponse,
  lastRequest,
  lastRequestBody,
  lastRequestHeader,
  mockClient,
} from './helpers';

describe('the screenshot endpoint', () => {
  it('posts to /api/screenshot with the api key header', async () => {
    const { client, requests } = mockClient([
      jsonResponse(200, {
        success: true,
        id: '550e8400-e29b-41d4-a716-446655440000',
        credits_remaining: 4998,
        url: 'https://i.html2img.com/snap.png',
      }),
    ]);

    await client.screenshot({ url: 'https://example.com' });

    const request = lastRequest(requests);

    expect(request.init.method).toBe('POST');
    expect(request.url).toBe('https://app.html2img.com/api/screenshot');
    expect(lastRequestHeader(requests, 'X-API-Key')).toBe('test-key');
  });

  it('maps every screenshot option into the json body, including selector', async () => {
    const { client, requests } = mockClient([
      jsonResponse(200, { success: true, id: 'x', url: 'https://i.html2img.com/x.png' }),
    ]);

    await client.screenshot({
      url: 'https://example.com',
      css: '.cookie-banner { display: none; }',
      width: 1200,
      height: 630,
      fullpage: false,
      selector: '#hero',
      dpi: 2,
      webhookUrl: 'https://example.com/hook',
      msDelay: 750,
      waitForSelector: '.chart-rendered',
      format: 'pdf',
    });

    expect(lastRequestBody(requests)).toEqual({
      url: 'https://example.com',
      css: '.cookie-banner { display: none; }',
      width: 1200,
      height: 630,
      fullpage: false,
      selector: '#hero',
      dpi: 2,
      webhook_url: 'https://example.com/hook',
      ms_delay: 750,
      wait_for_selector: '.chart-rendered',
      format: 'pdf',
    });
  });

  it('returns the .pdf url untouched for a pdf render', async () => {
    const { client, requests } = mockClient([
      jsonResponse(200, {
        success: true,
        id: 'x',
        credits_remaining: 499,
        url: 'https://i.html2img.com/image-1.pdf',
      }),
    ]);

    const response = await client.screenshot({ url: 'https://example.com', format: 'pdf' });

    expect(lastRequestBody(requests)).toEqual({ url: 'https://example.com', format: 'pdf' });
    expect(response.url).toBe('https://i.html2img.com/image-1.pdf');
  });
});
