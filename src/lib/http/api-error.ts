/**
 * One shape for every failure the API hands back.
 *
 * Non-2xx responses all use one envelope, `{ error: { code, message, details }}`,
 * with no per-field keys. Branch on `code`; `message` is English prose written
 * for developers. The UI translates from the code and only falls back to the
 * message for codes it doesn't recognise.
 */
export class ApiError extends Error {
  /** HTTP status, or `0` if the request never left this process. */
  readonly status: number;
  readonly code: string;
  /**
   * Server-side detail, JSON-encoded when the API sent an object. For logs -
   * the one exception is a 400, where it names the fields that were refused.
   */
  readonly details?: string;

  constructor(status: number, code: string, message: string, details?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** True when upstream was reached and refused, rather than never answering. */
  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }
}

/** Thrown when the API was unreachable, or didn't answer in time. */
export class NetworkError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "NetworkError";
  }
}
