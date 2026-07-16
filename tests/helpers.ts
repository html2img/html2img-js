import { Html2img } from '../src';

export interface RecordedRequest {
  url: string;
  init: RequestInit;
}

export interface MockedClient {
  client: Html2img;
  requests: RecordedRequest[];
}

/**
 * Build a client backed by a queue-driven fetch stub so no real network
 * call is made. Each outgoing request is recorded so tests can assert the
 * request that was sent. Queue entries that are errors are thrown instead
 * of returned, simulating a transport failure.
 */
export function mockClient(queue: Array<Response | Error>): MockedClient {
  const requests: RecordedRequest[] = [];

  const fetchImpl = async (url: string, init: RequestInit): Promise<Response> => {
    requests.push({ url, init });

    const next = queue.shift();

    if (next === undefined) {
      throw new Error('The mock response queue is empty.');
    }

    if (next instanceof Response) {
      return next;
    }

    throw next;
  };

  return { client: new Html2img({ apiKey: 'test-key', fetch: fetchImpl }), requests };
}

/** A JSON response with the given status and body. */
export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** The most recently recorded outgoing request. */
export function lastRequest(requests: RecordedRequest[]): RecordedRequest {
  const last = requests.at(-1);

  if (!last) {
    throw new Error('No request was recorded.');
  }

  return last;
}

/** A named header of the last recorded request. */
export function lastRequestHeader(requests: RecordedRequest[], name: string): string | undefined {
  const headers = lastRequest(requests).init.headers as Record<string, string> | undefined;

  return headers?.[name];
}

/** The decoded JSON body of the last recorded request. */
export function lastRequestBody(requests: RecordedRequest[]): Record<string, unknown> {
  return JSON.parse(String(lastRequest(requests).init.body)) as Record<string, unknown>;
}

/** Await a promise that is expected to reject, and return the rejection. */
export async function rejectionOf(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }

  throw new Error('Expected the promise to reject, but it resolved.');
}
