export { Html2img, type FetchLike, type Html2imgOptions } from './client';
export type { CommonRenderOptions, Format, HtmlOptions, ScreenshotOptions } from './options';
export { RenderResponse } from './response';
export {
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
  type ErrorPayload,
  type Html2imgErrorOptions,
} from './errors';
