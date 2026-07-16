import { describe, expect, it } from 'vitest';
import { RenderResponse } from '../src';
import { jsonResponse, mockClient } from './helpers';

describe('response parsing', () => {
  it('parses a synchronous success envelope into a RenderResponse', async () => {
    const { client } = mockClient([
      jsonResponse(200, {
        success: true,
        id: '550e8400-e29b-41d4-a716-446655440000',
        credits_remaining: 4999,
        url: 'https://i.html2img.com/abc123def456.png',
      }),
    ]);

    const response = await client.html({ html: '<h1>Hi</h1>' });

    expect(response).toBeInstanceOf(RenderResponse);
    expect(response.success).toBe(true);
    expect(response.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(response.url).toBe('https://i.html2img.com/abc123def456.png');
    expect(response.creditsRemaining).toBe(4999);
    expect(response.isProcessing()).toBe(false);
    expect(response.status).toBeNull();
  });

  it('parses an async acceptance envelope', async () => {
    const { client } = mockClient([
      jsonResponse(200, {
        success: true,
        id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
        credits_remaining: 4998,
        status: 'processing',
        message: 'Image generation started',
        url: null,
      }),
    ]);

    const response = await client.screenshot({
      url: 'https://example.com',
      webhookUrl: 'https://example.com/hook',
    });

    expect(response.isProcessing()).toBe(true);
    expect(response.status).toBe('processing');
    expect(response.message).toBe('Image generation started');
    expect(response.url).toBeNull();
  });

  it('treats credits_remaining as null when the API omits it', async () => {
    const { client } = mockClient([
      jsonResponse(200, { success: true, id: 'abc', url: 'https://i.html2img.com/abc.png' }),
    ]);

    const response = await client.html({ html: '<h1>Hi</h1>' });

    expect(response.creditsRemaining).toBeNull();
  });

  it('coerces a numeric string credits_remaining to an integer', async () => {
    const { client } = mockClient([
      jsonResponse(200, { success: true, id: 'abc', credits_remaining: '4999' }),
    ]);

    const response = await client.html({ html: '<h1>Hi</h1>' });

    expect(response.creditsRemaining).toBe(4999);
  });

  it('exposes the raw payload', async () => {
    const payload = {
      success: true,
      id: 'abc',
      url: 'https://i.html2img.com/abc.png',
      undocumented_field: 'kept',
    };
    const { client } = mockClient([jsonResponse(200, payload)]);

    const response = await client.html({ html: '<h1>Hi</h1>' });

    expect(response.raw).toEqual(payload);
    expect(response.raw['undocumented_field']).toBe('kept');
  });
});
