"use client";

import { useState, type FormEvent } from "react";
import type { ZodType } from "zod";

import { fieldErrorsFrom } from "@/lib/form";

/**
 * Controlled form state validated by a Zod schema.
 *
 * Errors hold off until the first submit, then follow every keystroke, so a
 * field clears the moment it's fixed without nagging on the way in.
 */
export function useValidatedForm<
  Values extends Record<string, string | boolean>,
  Output,
>(
  schema: ZodType<Output, Values>,
  initialValues: Values,
  onValid: (values: Output) => void,
) {
  type Errors = Partial<Record<keyof Values, string>>;

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);

  function setField<Field extends keyof Values>(
    field: Field,
    value: Values[Field],
  ) {
    const next = { ...values, [field]: value };
    setValues(next);

    if (submitted) {
      const result = schema.safeParse(next);
      setErrors(result.success ? {} : (fieldErrorsFrom(result.error) as Errors));
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);

    const result = schema.safeParse(values);

    if (!result.success) {
      setErrors(fieldErrorsFrom(result.error) as Errors);
      return;
    }

    setErrors({});
    onValid(result.data);
  }

  return { values, errors, setField, handleSubmit };
}
