[![html2img - HTML to image API, rendered in real Chrome](https://html2img.com/og-image.png)](https://html2img.com)

# html2img JavaScript client

[![npm Version](https://img.shields.io/npm/v/%40html2img-api%2Fclient)](https://www.npmjs.com/package/@html2img-api/client)
[![Node Version](https://img.shields.io/node/v/%40html2img-api%2Fclient)](https://www.npmjs.com/package/@html2img-api/client)
[![Downloads](https://img.shields.io/npm/dm/%40html2img-api%2Fclient)](https://www.npmjs.com/package/@html2img-api/client)
[![License](https://img.shields.io/npm/l/%40html2img-api%2Fclient)](LICENSE)

The official JavaScript and TypeScript client for the [HTML to Image API](https://html2img.com) at html2img.com. Turn HTML and CSS into images, capture screenshots of live URLs, and render named templates, all returning a typed response object.

Every render runs in real Chrome, so flexbox, grid, custom properties, web fonts and inline JavaScript behave exactly as they do in the browser. The package has zero runtime dependencies, is built on the standard `fetch` API, and ships with full TypeScript types and dual ESM and CommonJS builds, so it works in Node.js, Bun, Deno and serverless or edge runtimes. The full API reference lives in the [documentation](https://html2img.com/docs).

## What you can build

- **Open Graph and social images**, generated per page or post. See the [Open Graph image template](https://html2img.com/templates/open-graph-image) and [Twitter/X post template](https://html2img.com/templates/twitter-post).
- **Business documents** such as [invoices](https://html2img.com/templates/invoice-image), [receipts](https://html2img.com/templates/receipt-image), [event tickets](https://html2img.com/templates/event-ticket) and [certificates](https://html2img.com/templates/certificate-of-completion).
- **Developer assets** such as [code screenshots](https://html2img.com/templates/code-screenshot) and [GitHub social previews](https://html2img.com/templates/github-social-preview).
- **URL screenshots**, full page or cropped to a single element, with CSS injection to hide cookie banners and chat widgets before capture.

Browse the [full template library](https://html2img.com/templates), or try the no-signup [browser tools](https://html2img.com/tools) to see the output before you write any code.

## Requirements

- Node.js 18 or newer (for the built-in global `fetch`). Bun, Deno and edge runtimes work too.
- An HTML to Image API key, issued per account from your [dashboard](https://app.html2img.com/register)

> **Keep your API key on the server.** This client is designed for server-side use: Node.js scripts, API routes, background jobs and serverless functions. Shipping your key in browser code would let anyone spend your credits.

## Installation

```bash
npm install @html2img-api/client
# or
pnpm add @html2img-api/client
# or
yarn add @html2img-api/client
# or
bun add @html2img-api/client
```

## Quick start

```js
import { Html2img } from '@html2img-api/client';

const client = new Html2img('your-api-key');

const response = await client.html({
  html: '<!doctype html><html><body><h1>Hello</h1></body></html>',
  width: 1200,
  height: 630,
});

console.log(response.url); // https://i.html2img.com/abc123def456.png
```

CommonJS works too:

```js
const { Html2img } = require('@html2img-api/client');
```

The API returns a JSON envelope containing the CDN URL of the generated image, not the raw bytes, so you can cache and re-serve it from your own infrastructure. New to the API? Start with the [getting started guide](https://html2img.com/docs/getting-started).

TypeScript declarations are bundled, so every option, response property and error class is fully typed with no extra `@types` package.

## Configuration

Pass your API key as a string, or an options object with optional overrides:

```js
import { Html2img } from '@html2img-api/client';

const client = new Html2img({
  apiKey: 'your-api-key',
  baseUrl: 'https://app.html2img.com', // default
  timeout: 35_000, // milliseconds, default
});
```

Authentication is sent on every request as the `X-API-Key` header. See the [authentication docs](https://html2img.com/docs/authentication) for issuing and rotating keys.

### Injecting your own fetch

Pass a custom `fetch` implementation to route requests through a proxy, add
your own retry or logging middleware, or support a runtime without a global
`fetch`. The SDK still sends the `X-API-Key`, `Accept` and `Content-Type`
headers on every request.

```js
import { Html2img } from '@html2img-api/client';

const client = new Html2img({
  apiKey: 'your-api-key',
  fetch: (url, init) => myInstrumentedFetch(url, init),
});
```

## Usage

### Render HTML

`POST /api/html`. Send a complete HTML document and get back an image of the
rendered result. Inline your CSS in a `<style>` block, or reference remote
stylesheets and web fonts via `<link>` tags in the document head. See the
[`html` parameter docs](https://html2img.com/docs/parameters/html) for the full input.

```js
const response = await client.html({
  html: document,
  css: 'body { background: #0f172a; color: #fff; }', // injected after load
  width: 794,
  fullpage: true,
  dpi: 2, // retina
  format: 'png',
});
```

### Capture a screenshot

`POST /api/screenshot`. Fetch a public URL in a real browser and capture it.
Use `selector` to crop to a single element, and `css` to hide cookie banners or
chat widgets before the capture. See the [`url` parameter docs](https://html2img.com/docs/parameters/url).

```js
const response = await client.screenshot({
  url: 'https://example.com',
  width: 1200,
  height: 630,
  selector: '#hero',
  css: '.cookie-banner, .intercom-launcher { display: none !important; }',
  dpi: 2,
});
```

### Generate a PDF

Set `format` to `'pdf'` on either request and the render comes back as an
A4 portrait vector PDF instead of a PNG: text stays selectable and searchable,
webfonts are embedded and long content paginates automatically. The API ignores
`width`, `height`, `dpi`, `fullpage` and `selector` in PDF mode, and the
response `url` points at a `.pdf` file. One credit, the same as an image. See
the [`format` parameter docs](https://html2img.com/docs/parameters/format/).

```js
const response = await client.html({
  html: '<h1>Invoice #1042</h1><p>Due within 30 days.</p>',
  format: 'pdf',
});

console.log(response.url); // https://i.html2img.com/....pdf
```

### Render a template

`POST /api/v1/templates/{slug}`. Render one of your named templates from a JSON
data payload. The data is validated server-side per template. [Browse the
templates](https://html2img.com/templates) to find a slug. Templates output PNG
only; `format` is not available on template renders.

```js
const response = await client.template('invoice', {
  number: 1042,
  amount: '$240.00',
  due_date: '2026-07-01',
});

console.log(response.template); // invoice
console.log(response.url);
```

## Options

`client.html()` and `client.screenshot()` both accept the following. Any option
left undefined is omitted from the request, so the server applies its own
default. Option names are camelCase in JavaScript and sent to the API in
snake_case. The complete reference is in the [parameter docs](https://html2img.com/docs/parameters).

| Option            | Type      | Notes                                                                                         |
| ----------------- | --------- | --------------------------------------------------------------------------------------------- |
| `css`             | `string`  | Extra CSS injected after the page loads.                                                      |
| `width`           | `number`  | Viewport width in CSS pixels (1 to 5000).                                                     |
| `height`          | `number`  | Viewport height in CSS pixels (1 to 5000). Ignored when `fullpage` is true.                   |
| `fullpage`        | `boolean` | Capture the full scroll length instead of the viewport.                                       |
| `dpi`             | `number`  | Device pixel ratio, 1 to 4. Use 2 for retina.                                                 |
| `webhookUrl`      | `string`  | Switch to async delivery (see below).                                                         |
| `msDelay`         | `number`  | Wait this many milliseconds after load before capturing (1 to 5000).                          |
| `waitForSelector` | `string`  | Wait until this CSS selector appears before capturing.                                        |
| `format`          | `string`  | `'png'` (default) or `'pdf'`. PDF output is A4 portrait and ignores the sizing options above. |

`client.screenshot()` also accepts `selector` (`string`) to crop the capture to
a single element. `client.html()` does not, since you control the markup.

Out-of-range values fail fast with a native `TypeError` or `RangeError` before
any request is sent, mirroring the server-side validation rules.

Custom fonts are loaded by referencing them with `<link>` tags in your HTML
document head, or by linking a web font from your captured page.

## The response

Every method resolves to a `RenderResponse`:

```js
response.success; // boolean
response.id; // string | null, the render id
response.url; // string | null, the CDN URL of the image
response.creditsRemaining; // number | null, credits left after this call
response.status; // string | null, "processing" for async jobs
response.message; // string | null
response.template; // string | null, the template slug, when applicable
response.isProcessing(); // boolean
response.raw; // object, the full decoded JSON payload
```

### Asynchronous delivery

Synchronous requests have a 30 second budget. For captures likely to exceed it,
pass a `webhookUrl`. The API responds immediately with `status: "processing"`
and `url: null`, then POSTs the final image URL to your endpoint once rendering
finishes. See the [`webhook_url` docs](https://html2img.com/docs/parameters/webhook-url).

```js
const response = await client.screenshot({
  url: 'https://example.com/long-report',
  fullpage: true,
  webhookUrl: 'https://your-app.example.com/hooks/html2img',
});

if (response.isProcessing()) {
  // The final URL will arrive at your webhook, not on this response.
}
```

## Error handling

Every failed request rejects with an `Html2imgError`. Catch that single type to
handle any error, or check for a specific subclass. No raw `fetch` error
escapes the client.

```js
import { Html2imgError, ValidationError, InsufficientCreditsError } from '@html2img-api/client';

try {
  const response = await client.html({ html: document });
} catch (error) {
  if (error instanceof ValidationError) {
    // 400 or 422: inspect the per-field messages
    for (const [field, messages] of Object.entries(error.details)) {
      // ...
    }
  } else if (error instanceof InsufficientCreditsError) {
    // 402: out of credits
    const left = error.creditsRemaining;
  } else if (error instanceof Html2imgError) {
    // anything else
    error.statusCode; // number | null
    error.errorCode; // string | null, the API "code" field
    error.payload; // object, the decoded body
  }
}
```

| Error                      | When                                             |
| -------------------------- | ------------------------------------------------ |
| `AuthenticationError`      | 401, missing or invalid API key.                 |
| `InsufficientCreditsError` | 402, no credits remaining.                       |
| `NotSubscribedError`       | 403, no active subscription.                     |
| `NotFoundError`            | 404, for example an unknown template slug.       |
| `ValidationError`          | 400 or 422, with `details` per field.            |
| `RateLimitError`           | 429, rate or quota exceeded.                     |
| `TimeoutError`             | 504, the synchronous render budget was exceeded. |
| `ServerError`              | 5xx, an unexpected renderer error.               |
| `ConnectionError`          | the request never reached a response.            |
| `Html2imgError`            | base type for all of the above.                  |

## Other languages

Anything that can make an HTTP request works with the API. There is an official
[PHP client](https://github.com/html2img/html2img-php) and a
[Laravel package](https://github.com/html2img/html2img-laravel), plus worked
guides for [Laravel](https://html2img.com/docs/usage/laravel),
[Ruby on Rails](https://html2img.com/docs/usage/rails),
[Python](https://html2img.com/docs/usage/python),
[JavaScript and Node.js](https://html2img.com/docs/usage/javascript),
[React](https://html2img.com/docs/usage/react) and
[Vue](https://html2img.com/docs/usage/vue).

## Development

```bash
npm install
npm test              # vitest
npm run typecheck     # tsc --noEmit
npm run lint          # prettier --check
npm run check         # all of the above
npm run build         # tsup, outputs dist/
```

## Links

[Website](https://html2img.com) · [Documentation](https://html2img.com/docs) · [Templates](https://html2img.com/templates) · [Tools](https://html2img.com/tools) · [Features](https://html2img.com/features) · [Comparisons](https://html2img.com/compare) · [Articles](https://html2img.com/articles) · [Pricing](https://html2img.com/pricing)

## Licence

MIT. See [LICENSE](LICENSE).
