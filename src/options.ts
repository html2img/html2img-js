import { guardDimension, guardDpi, guardMsDelay, guardRequiredString } from './guard';

/**
 * Output format for a render.
 *
 * Defaults to PNG server-side when omitted from the request.
 */
export type Format = 'png' | 'pdf';

/**
 * Options shared by HTML renders and URL screenshots.
 *
 * Any option left undefined is omitted from the request, so the server
 * applies its own defaults.
 */
export interface CommonRenderOptions {
  /** Extra CSS injected after the page loads, on top of any existing styles. */
  css?: string;

  /** Viewport width in CSS pixels (1 to 5000). */
  width?: number;

  /** Viewport height in CSS pixels (1 to 5000). Ignored when `fullpage` is true. */
  height?: number;

  /** Capture the full rendered height of the document instead of the viewport. */
  fullpage?: boolean;

  /** Device pixel ratio multiplier (1 to 4). 1 is standard, 2 is retina. */
  dpi?: number;

  /** Switch to async mode and POST the final image URL here once rendering finishes. */
  webhookUrl?: string;

  /** Wait this many milliseconds after load before capturing (1 to 5000). */
  msDelay?: number;

  /** Wait until this CSS selector appears in the DOM before capturing. */
  waitForSelector?: string;

  /** Output format. Defaults to PNG server-side. */
  format?: Format;
}

/**
 * A request to render an HTML document to an image.
 *
 * Maps directly to the body of `POST /api/html`. Only `html` is required.
 */
export interface HtmlOptions extends CommonRenderOptions {
  /**
   * A complete HTML document to render. Inline CSS or reference fonts via
   * `<link>` tags in the head.
   */
  html: string;
}

/**
 * A request to capture a screenshot of a live, publicly reachable URL.
 *
 * Maps directly to the body of `POST /api/screenshot`. Only `url` is
 * required.
 */
export interface ScreenshotOptions extends CommonRenderOptions {
  /** The fully qualified, publicly reachable URL to capture. */
  url: string;

  /** CSS selector used to crop the capture to a single element. */
  selector?: string;
}

/**
 * Build the JSON body for `POST /api/html`, omitting unset options.
 *
 * @internal
 */
export function htmlRequestBody(options: HtmlOptions): Record<string, unknown> {
  guardRequiredString('html', options.html);
  guardCommonOptions(options);

  return compact({
    html: options.html,
    css: options.css,
    width: options.width,
    height: options.height,
    fullpage: options.fullpage,
    dpi: options.dpi,
    webhook_url: options.webhookUrl,
    ms_delay: options.msDelay,
    wait_for_selector: options.waitForSelector,
    format: options.format,
  });
}

/**
 * Build the JSON body for `POST /api/screenshot`, omitting unset options.
 *
 * @internal
 */
export function screenshotRequestBody(options: ScreenshotOptions): Record<string, unknown> {
  guardRequiredString('url', options.url);
  guardCommonOptions(options);

  return compact({
    url: options.url,
    css: options.css,
    width: options.width,
    height: options.height,
    fullpage: options.fullpage,
    selector: options.selector,
    dpi: options.dpi,
    webhook_url: options.webhookUrl,
    ms_delay: options.msDelay,
    wait_for_selector: options.waitForSelector,
    format: options.format,
  });
}

function guardCommonOptions(options: CommonRenderOptions): void {
  guardDimension('width', options.width);
  guardDimension('height', options.height);
  guardDpi(options.dpi);
  guardMsDelay(options.msDelay);
}

function compact(body: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(body).filter(([, value]) => value != null));
}
