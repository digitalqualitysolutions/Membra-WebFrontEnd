import { flattenError, type ZodError } from "zod";

/**
 * Collapse a Zod error into one message per field. That's all a form row has
 * space for, and it's the shape the form components hold in state.
 */
export function fieldErrorsFrom(error: ZodError<unknown>): Record<string, string> {
  const { fieldErrors } = flattenError(error as ZodError<Record<string, unknown>>);
  const result: Record<string, string> = {};

  for (const [field, messages] of Object.entries(fieldErrors)) {
    const [first] = messages as string[];
    if (first) result[field] = first;
  }

  return result;
}

/** Id for a field's error message, so the control can point at it. */
export function errorId(htmlFor: string) {
  return `${htmlFor}-error`;
}
