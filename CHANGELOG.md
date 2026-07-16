# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-16

### Added

- Initial release.
- `Html2img` client with `html()`, `screenshot()` and `template()` methods,
  built on the global `fetch` with zero runtime dependencies.
- Typed request options (`HtmlOptions`, `ScreenshotOptions`) with client-side
  range checks that mirror the server-side validation rules.
- `format` option (`'png'` or `'pdf'`) on both render methods. `'pdf'` returns
  an A4 portrait vector PDF with selectable text; `width`, `height`, `dpi`,
  `fullpage` and `selector` are ignored by the API in PDF mode and the
  response `url` points at a `.pdf` file.
- `RenderResponse` exposing `success`, `id`, `url`, `creditsRemaining`, the
  async `status` and `message` fields, the optional `template` slug, and the
  raw payload.
- Error hierarchy mapping HTTP status codes to typed errors: authentication,
  validation, insufficient credits, not subscribed, not found, rate limit,
  timeout, server error and connection failure.
- Support for an injected custom `fetch` implementation.
- Dual ESM and CommonJS builds with bundled TypeScript declarations.
- Vitest test suite, strict TypeScript and Prettier configuration.

[1.0.0]: https://github.com/html2img/html2img-js/releases/tag/v1.0.0
