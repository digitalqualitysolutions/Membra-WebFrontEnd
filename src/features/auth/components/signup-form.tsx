"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState, useMemo, useState, startTransition } from "react";

import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupIcon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { PasswordInput } from "@/components/ui/password-input";
import { signUpAction } from "@/features/auth/services/signup";
import { initialSignupState } from "@/features/auth/services/state";
import { createSignupSchema } from "@/features/auth/schemas";
import type { SignupFormValues } from "@/features/auth/types";
import { errorId } from "@/lib/form";
import { useValidatedForm } from "@/lib/use-validated-form";

const initialValues: SignupFormValues = {
  email: "",
  password: "",
  confirmPassword: "",
};

export function SignupForm() {
  const t = useTranslations("auth");
  const tValidation = useTranslations("validation");
  const locale = useLocale();

  const schema = useMemo(() => createSignupSchema(tValidation), [tValidation]);

  const [state, submit, isPending] = useActionState(
    signUpAction,
    initialSignupState,
  );

  /**
   * What we sent last time. A server complaint ("that email is taken") stops
   * applying as soon as the user edits the field it named, so the message
   * clears while they fix it instead of hanging around until the next submit.
   */
  const [submitted, setSubmitted] = useState<SignupFormValues | null>(null);

  const { values, errors, setField, handleSubmit } = useValidatedForm(
    schema,
    initialValues,
    // The hook gives us the parsed values, so we send what the schema approved:
    // a trimmed email, not the raw keystrokes.
    (valid) => {
      setSubmitted(valid);
      startTransition(() => submit({ ...valid, locale }));
    },
  );

  /** Client-side error wins; the server's shows only while it still applies. */
  function errorFor(field: keyof SignupFormValues) {
    if (errors[field]) return errors[field];

    const fromServer = state.fieldErrors?.[field];
    if (!fromServer || !submitted) return undefined;

    return values[field] === submitted[field] ? fromServer : undefined;
  }

  const emailError = errorFor("email");
  const passwordError = errorFor("password");
  const confirmError = errorFor("confirmPassword");

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup className="gap-[clamp(0.375rem,1.25vh,1.25rem)]">
        <Field data-invalid={Boolean(emailError)}>
          <FieldLabel htmlFor="email">{t("emailLabel")}</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
              value={values.email}
              onChange={(event) => setField("email", event.target.value)}
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? errorId("email") : undefined}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupIcon>
                <Icon name="email" />
              </InputGroupIcon>
            </InputGroupAddon>
          </InputGroup>
          <FieldError id={errorId("email")}>{emailError}</FieldError>
        </Field>

        <Field data-invalid={Boolean(passwordError)}>
          <FieldLabel htmlFor="password">{t("signup.passwordLabel")}</FieldLabel>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder={t("signup.passwordPlaceholder")}
            showLabel={t("showPassword")}
            hideLabel={t("hidePassword")}
            value={values.password}
            onChange={(event) => setField("password", event.target.value)}
            aria-invalid={Boolean(passwordError)}
            aria-describedby={passwordError ? errorId("password") : undefined}
          />
          <FieldError id={errorId("password")}>{passwordError}</FieldError>
        </Field>

        <Field data-invalid={Boolean(confirmError)}>
          <FieldLabel htmlFor="confirmPassword">
            {t("signup.confirmLabel")}
          </FieldLabel>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder={t("signup.confirmPlaceholder")}
            showLabel={t("showPassword")}
            hideLabel={t("hidePassword")}
            value={values.confirmPassword}
            onChange={(event) => setField("confirmPassword", event.target.value)}
            aria-invalid={Boolean(confirmError)}
            aria-describedby={confirmError ? errorId("confirmPassword") : undefined}
          />
          <FieldError id={errorId("confirmPassword")}>{confirmError}</FieldError>
        </Field>

        <Button type="submit" size="form" className="mt-2" disabled={isPending}>
          {t("signup.submit")}
          <Icon name={isPending ? "pending" : "submitArrow"} className={isPending ? "animate-spin" : undefined} />
        </Button>

        {/* Under the button, which is where you're looking after pressing it. */}
        {state.formError && !isPending ? (
          <FormAlert>{state.formError}</FormAlert>
        ) : null}
      </FieldGroup>
    </form>
  );
}
