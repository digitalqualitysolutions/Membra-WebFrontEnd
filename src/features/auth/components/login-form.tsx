"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState, useMemo, useState, startTransition } from "react";

import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Checkbox } from "@/components/ui/checkbox";
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
import { logInAction } from "@/features/auth/services/login";
import { initialLoginState } from "@/features/auth/services/state";
import { createLoginSchema } from "@/features/auth/schemas";
import type { LoginFormValues } from "@/features/auth/types";
import { errorId } from "@/lib/form";
import { useValidatedForm } from "@/lib/use-validated-form";

const initialValues: LoginFormValues = {
  email: "",
  password: "",
  rememberMe: false,
};

export function LoginForm({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const tValidation = useTranslations("validation");

  const schema = useMemo(() => createLoginSchema(tValidation), [tValidation]);

  const [state, submit, isPending] = useActionState(logInAction, initialLoginState);

  /**
   * What we sent last time, so a server complaint stops applying as soon as
   * the user edits the field it named.
   */
  const [submitted, setSubmitted] = useState<LoginFormValues | null>(null);

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
  function errorFor(field: keyof LoginFormValues) {
    if (errors[field]) return errors[field];

    const fromServer = state.fieldErrors?.[field];
    if (!fromServer || !submitted) return undefined;

    return values[field] === submitted[field] ? fromServer : undefined;
  }

  const emailError = errorFor("email");
  const passwordError = errorFor("password");

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
          <div className="flex items-center justify-between gap-3">
            <FieldLabel htmlFor="password">{t("login.passwordLabel")}</FieldLabel>
            {/* <Link
              href={`/${locale}/forgot-password`}
              className="text-[12px] text-ink-muted transition-colors hover:text-ink"
            >
              {t("login.forgotPassword")}
            </Link> */}
          </div>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder={t("login.passwordPlaceholder")}
            showLabel={t("showPassword")}
            hideLabel={t("hidePassword")}
            value={values.password}
            onChange={(event) => setField("password", event.target.value)}
            aria-invalid={Boolean(passwordError)}
            aria-describedby={passwordError ? errorId("password") : undefined}
          />
          <FieldError id={errorId("password")}>{passwordError}</FieldError>
        </Field>

        <Field orientation="horizontal">
          <Checkbox
            id="rememberMe"
            name="rememberMe"
            checked={values.rememberMe}
            onCheckedChange={(checked) => setField("rememberMe", checked === true)}
          />
          <FieldLabel
            htmlFor="rememberMe"
            className="text-[12px] font-normal tracking-normal text-body normal-case sm:text-[13px]"
          >
            {t("rememberMe")}
          </FieldLabel>
        </Field>

        <Button type="submit" size="form" className="mt-2" disabled={isPending}>
          {t("login.submit")}
          <Icon
            name={isPending ? "pending" : "submitArrow"}
            className={isPending ? "animate-spin" : undefined}
          />
        </Button>

        {/* Under the button, which is where you're looking after pressing it. */}
        {state.formError && !isPending ? (
          <FormAlert>{state.formError}</FormAlert>
        ) : null}
      </FieldGroup>
    </form>
  );
}
