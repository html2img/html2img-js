/**
 * Internal range checks shared by the request builders.
 *
 * These mirror the server-side validation rules so obvious mistakes fail
 * fast with a clear message, before a request is sent. Type problems throw
 * a `TypeError`; out-of-range values throw a `RangeError`.
 *
 * @internal
 */

/** Validate a required, non-empty string field such as `html` or `url`. */
export function guardRequiredString(name: string, value: unknown): asserts value is string {
  if (typeof value !== 'string' || value === '') {
    throw new TypeError(`The ${name} field must not be empty.`);
  }
}

/** Validate a viewport dimension (width or height): 1 to 5000 pixels. */
export function guardDimension(name: 'width' | 'height', value: number | undefined): void {
  guardIntegerInRange(name, value, 1, 5000);
}

/** Validate the device pixel ratio: 1 to 4. */
export function guardDpi(value: number | undefined): void {
  guardIntegerInRange('dpi', value, 1, 4);
}

/** Validate the post-load delay: 1 to 5000 milliseconds. */
export function guardMsDelay(value: number | undefined): void {
  guardIntegerInRange('ms_delay', value, 1, 5000);
}

function guardIntegerInRange(
  name: string,
  value: number | undefined,
  min: number,
  max: number,
): void {
  if (value === undefined || value === null) {
    return;
  }

  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new TypeError(`The ${name} must be an integer.`);
  }

  if (value < min || value > max) {
    throw new RangeError(`The ${name} must be between ${min} and ${max}.`);
  }
}
