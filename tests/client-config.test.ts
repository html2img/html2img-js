import { describe, expect, it } from 'vitest';
import { Html2img } from '../src';
import {
  jsonResponse,
  lastRequest,
  lastRequestBody,
  lastRequestHeader,
  mockClient,
} from './helpers';

describe('client configuration', () => {
  it('constructs with only an api key string', () => {
    expect(new Html2img('my-key')).toBeInstanceOf(Html2img);
  });

  it('constructs with an options object', () => {
    expect(new Html2img({ apiKey: 'my-key' })).toBeInstanceOf(Html2img);
  });

  it('rejects an empty api key', () => {
    expect(() => new Html2img('')).toThrow(TypeError);
    expect(() => new Html2img({ apiKey: '' })).toThrow('The apiKey must not be empty.');
  });

  it('rejects a non-positive timeout', () => {
    expect(() => new Html2img({ apiKey: 'my-key', timeout: 0 })).toThrow(RangeError);
    expect(() => new Html2img({ apiKey: 'my-key', timeout: -5 })).toThrow(
      'The timeout must be a positive number of milliseconds.',
    );
  });

  it('sends the api key header on every request', async () => {
    const { client, requests } = mockClient([
      jsonResponse(200, { success: true, id: 'x', url: 'https://i.html2img.com/x.png' }),
    ]);

    await client.html({ html: '<h1>Hi</h1>' });

    expect(lastRequestHeader(requests, 'X-API-Key')).toBe('test-key');
  });

  it('uses the default base url', async () => {
    const { client, requests } = mockClient([
      jsonResponse(200, { success: true, id: 'x', url: 'https://i.html2img.com/x.png' }),
    ]);

    await client.html({ html: '<h1>Hi</h1>' });

    expect(lastRequest(requests).url).toBe('https://app.html2img.com/api/html');
  });

  it('normalises a custom base url with a trailing slash', async () => {
    const requests: Array<{ url: string }> = [];
    const client = new Html2img({
      apiKey: 'test-key',
      baseUrl: 'https://example.test/',
      fetch: async (url) => {
        requests.push({ url });

        return jsonResponse(200, { success: true });
      },
    });

    await client.html({ html: '<h1>Hi</h1>' });

    expect(requests[0]?.url).toBe('https://example.test/api/html');
  });

  it('attaches a timeout signal to every request', async () => {
    const { client, requests } = mockClient([jsonResponse(200, { success: true })]);

    await client.html({ html: '<h1>Hi</h1>' });

    expect(lastRequest(requests).init.signal).toBeInstanceOf(AbortSignal);
  });

  it('rejects an out-of-range dpi', async () => {
    const { client } = mockClient([]);

    await expect(client.html({ html: '<h1>Hi</h1>', dpi: 5 })).rejects.toThrow(
      'The dpi must be between 1 and 4.',
    );
  });

  it('rejects an out-of-range width', async () => {
    const { client } = mockClient([]);

    await expect(client.screenshot({ url: 'https://example.com', width: 99999 })).rejects.toThrow(
      'The width must be between 1 and 5000.',
    );
  });

  it('rejects an out-of-range ms delay', async () => {
    const { client } = mockClient([]);

    await expect(client.html({ html: '<h1>Hi</h1>', msDelay: 0 })).rejects.toThrow(
      'The ms_delay must be between 1 and 5000.',
    );
  });

  it('rejects a non-integer dimension', async () => {
    const { client } = mockClient([]);

    await expect(client.html({ html: '<h1>Hi</h1>', width: 100.5 })).rejects.toThrow(
      'The width must be an integer.',
    );
  });

  it('rejects empty required fields', async () => {
    const { client } = mockClient([]);

    await expect(client.html({ html: '' })).rejects.toThrow('The html field must not be empty.');
    await expect(client.screenshot({ url: '' })).rejects.toThrow(
      'The url field must not be empty.',
    );
    await expect(client.template('')).rejects.toThrow('The slug field must not be empty.');
  });

  it('accepts boundary values', async () => {
    const { client, requests } = mockClient([jsonResponse(200, { success: true })]);

    await client.html({
      html: '<h1>Hi</h1>',
      width: 1,
      height: 5000,
      dpi: 4,
      msDelay: 5000,
      format: 'png',
    });

    expect(lastRequestBody(requests)).toEqual({
      html: '<h1>Hi</h1>',
      width: 1,
      height: 5000,
      dpi: 4,
      ms_delay: 5000,
      format: 'png',
    });
  });
});
