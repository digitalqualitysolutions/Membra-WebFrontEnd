"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState, useMemo, useState, startTransition } from "react";

import { Icon, type IconName } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Checkbox } from "@/components/ui/checkbox";
import { DateInput } from "@/components/ui/date-input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { defaultLocale, isLocale, type Locale } from "@/config/locales";
import type { ClubLanguageOption } from "@/features/club/api/club-wire";
import { toPreferredLang } from "@/features/onboarding/api/profile-wire";
import { completeProfileAction } from "@/features/onboarding/services/complete-profile";
import {
  initialProfileState,
  type ProfilePayload,
  type ProfileState,
} from "@/features/onboarding/services/state";
import {
  createProfileSchema,
  genderCategories,
  type GenderCategory,
} from "@/features/onboarding/schemas";
import type { ProfileFormValues } from "@/features/onboarding/types";
import { errorId } from "@/lib/form";
import { useValidatedForm } from "@/lib/use-validated-form";

/** Everything that doesn't depend on the locale. See `initialValuesFor`. */
const blankValues: Omit<ProfileFormValues, "preferredLanguage"> = {
  firstName: "",
  lastName: "",
  nickname: "",
  dateOfBirth: "",
  genderCategory: "",
  // Pre-ticked because the profile is pointless without it. A member who
  // disagrees unticks it, or skips the step.
  consentStorage: true,
};

/**
 * Whatever language they're reading the form in is probably the one they want
 * the club to write to them in, so start the field on the catalogue's row for
 * the active locale. Empty when the catalogue has none, which leaves it unset.
 */
function initialValuesFor(
  locale: Locale,
  languages: readonly ClubLanguageOption[],
): ProfileFormValues {
  return {
    ...blankValues,
    preferredLanguage: toPreferredLang(locale, languages) ?? "",
  };
}

/** Two fields on one row, stacked on narrow screens. */
const row = "grid gap-[clamp(0.375rem,1.25vh,1.25rem)] sm:grid-cols-2";

type ProfileFormProps = {
  /**
   * What happens on submit. Defaults to onboarding's step, which is where this
   * form started; the profile page hands in the one that saves an edit.
   */
  action?: (state: ProfileState, payload: ProfilePayload) => Promise<ProfileState>;
  /**
   * The genders to offer, from `availableGenders()` on the page that renders
   * this. A prop rather than a fetch, because the list comes from the API and
   * this is a client component; the built-in list stands in if it's left out.
   */
  genders?: readonly string[];
  /** The languages to offer, from `languageList()`. Empty means unreachable. */
  languages?: readonly ClubLanguageOption[];
  /**
   * The profile as it stands. Leave it out for a member who hasn't got one -
   * the fields start blank and the language follows the switcher.
   */
  defaults?: ProfileFormValues;
  /**
   * Whether to ask for storage consent.
   *
   * Onboarding has to: it's the lawful basis for keeping any of the fields
   * above, and nothing is stored until it's ticked. An edit must not. Consent
   * was given when the profile was created, so re-asking every visit both
   * misrepresents it as pending and invites a member to untick the one box that
   * would then refuse their own save - with no way back but ticking it again.
   *
   * Withdrawing consent is a real thing a member may want, but it means
   * deleting the profile rather than failing a form, so it belongs on its own
   * control rather than hidden in this one.
   */
  showConsent?: boolean;
  /**
   * The glyph after the label. `null` for a form that saves in place: the arrow
   * means "and on to the next step", which is onboarding's ending rather than
   * an edit's. The pending spinner still takes its place either way.
   */
  submitIcon?: IconName | null;
  /** Shown once the action reports a save. Required for a form that stays put. */
  savedLabel?: string;
  /**
   * Start out showing the saved message. For the save that switched languages:
   * it finished on the other locale's page, so the confirmation arrives as a
   * fresh render rather than as this form's own action state.
   */
  savedOnLoad?: boolean;
};

export function ProfileForm({
  action = completeProfileAction,
  genders = genderCategories,
  languages = [],
  defaults,
  showConsent = true,
  submitIcon = "submitArrow",
  savedLabel,
  savedOnLoad = false,
}: ProfileFormProps = {}) {
  const t = useTranslations("onboarding");
  const tValidation = useTranslations("validation");
  const locale = useLocale();

  // `useLocale` is typed as a plain string. The route guard means it's always a
  // real locale by the time we render, but the field needs a narrowed one.
  const activeLocale = isLocale(locale) ? locale : defaultLocale;

  const languageIds = useMemo(
    () => languages.map((language) => language.id),
    [languages],
  );

  const schema = useMemo(
    () => createProfileSchema(tValidation, genders, languageIds),
    [tValidation, genders, languageIds],
  );

  /*
   * Seeded rather than rendered alongside the action's state, so the next
   * submit replaces it. Read the flag off the URL on every render instead and a
   * failed save would show "saved" and "failed" at once.
   */
  const [state, submit, isPending] = useActionState(
    action,
    savedOnLoad ? { saved: true } : initialProfileState,
  );

  /**
   * What we sent last time, so a server complaint stops applying as soon as
   * the user edits the field it named.
   */
  const [submitted, setSubmitted] = useState<ProfileFormValues | null>(null);

  /**
   * Has the member picked a language themselves? Until they do, the field
   * follows the switcher. After that their choice wins, so flipping the site
   * language twice can't undo it.
   */
  const [languageChosen, setLanguageChosen] = useState(false);

  const { values, errors, setField, handleSubmit } = useValidatedForm(
    schema,
    defaults ?? initialValuesFor(activeLocale, languages),
    (valid) => {
      setSubmitted(valid);
      startTransition(() => submit({ ...valid, locale }));
    },
  );

  /**
   * Switching the site language navigates, but nothing says this form gets
   * rebuilt when it does, so move the untouched field here instead of leaving
   * it to `initialValuesFor`. Done during render rather than in an effect, so
   * the select never flashes the old language for a frame.
   */
  const [shownLocale, setShownLocale] = useState(activeLocale);

  if (shownLocale !== activeLocale) {
    setShownLocale(activeLocale);
    // Not when editing: the member has a saved preference, and switching the
    // site language for a moment shouldn't quietly rewrite it.
    if (!languageChosen && !defaults) {
      setField("preferredLanguage", toPreferredLang(activeLocale, languages) ?? "");
    }
  }

  /** Client-side error wins; the server's shows only while it still applies. */
  function errorFor(field: keyof ProfileFormValues) {
    if (errors[field]) return errors[field];

    const fromServer = state.fieldErrors?.[field];
    if (!fromServer || !submitted) return undefined;

    return values[field] === submitted[field] ? fromServer : undefined;
  }

  /*
   * Both lists come from their source of truth: the genders the API offers, and
   * the locales the portal actually speaks. Neither can offer an option we
   * can't honour.
   *
   * The label falls back to the API's own word. Gender keys are typed off the
   * built-in list, and the real one is fetched, so a gender added upstream has
   * no translation yet - showing `others` beats crashing on a missing key, and
   * it's visible enough that someone adds the translation.
   */
  const genderOptions = genders.map((value) => {
    const key = `profile.genderOptions.${value}` as `profile.genderOptions.${GenderCategory}`;

    return { value, label: t.has(key) ? t(key) : value };
  });

  // The catalogue names each language itself, so there's nothing to translate.
  const languageOptions = languages.map((language) => ({
    value: language.id,
    label: language.name,
  }));

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup className="gap-[clamp(0.375rem,1.25vh,1.25rem)]">
        <div className={row}>
          <Field data-invalid={Boolean(errorFor("firstName"))}>
            <FieldLabel htmlFor="firstName">
              {t("profile.firstNameLabel")}
            </FieldLabel>
            <Input
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              placeholder={t("profile.firstNamePlaceholder")}
              value={values.firstName}
              onChange={(event) => setField("firstName", event.target.value)}
              aria-invalid={Boolean(errorFor("firstName"))}
              aria-describedby={
                errorFor("firstName") ? errorId("firstName") : undefined
              }
            />
            <FieldError id={errorId("firstName")}>{errorFor("firstName")}</FieldError>
          </Field>

          <Field data-invalid={Boolean(errorFor("lastName"))}>
            <FieldLabel htmlFor="lastName">
              {t("profile.lastNameLabel")}
            </FieldLabel>
            <Input
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              placeholder={t("profile.lastNamePlaceholder")}
              value={values.lastName}
              onChange={(event) => setField("lastName", event.target.value)}
              aria-invalid={Boolean(errorFor("lastName"))}
              aria-describedby={errorFor("lastName") ? errorId("lastName") : undefined}
            />
            <FieldError id={errorId("lastName")}>{errorFor("lastName")}</FieldError>
          </Field>
        </div>

        <Field data-invalid={Boolean(errorFor("nickname"))}>
          <FieldLabel htmlFor="nickname">
            {t("profile.nicknameLabel")}
            <span className="font-normal tracking-normal text-subtle normal-case">
              {t("profile.nicknameHint")}
            </span>
          </FieldLabel>
          <Input
            id="nickname"
            name="nickname"
            autoComplete="nickname"
            placeholder={t("profile.nicknamePlaceholder")}
            value={values.nickname}
            onChange={(event) => setField("nickname", event.target.value)}
            aria-invalid={Boolean(errorFor("nickname"))}
            aria-describedby={errorFor("nickname") ? errorId("nickname") : undefined}
          />
          <FieldError id={errorId("nickname")}>{errorFor("nickname")}</FieldError>
        </Field>

        <div className={row}>
          <Field data-invalid={Boolean(errorFor("dateOfBirth"))}>
            <FieldLabel htmlFor="dateOfBirth">
              {t("profile.dateOfBirthLabel")}
            </FieldLabel>
            <DateInput
              id="dateOfBirth"
              name="dateOfBirth"
              placeholder={t("profile.dateOfBirthPlaceholder")}
              pickerLabel={t("profile.dateOfBirthPicker")}
              value={values.dateOfBirth}
              onValueChange={(value) => setField("dateOfBirth", value)}
              aria-invalid={Boolean(errorFor("dateOfBirth"))}
              aria-describedby={
                errorFor("dateOfBirth") ? errorId("dateOfBirth") : undefined
              }
            />
            <FieldError id={errorId("dateOfBirth")}>
              {errorFor("dateOfBirth")}
            </FieldError>
          </Field>

          <Field data-invalid={Boolean(errorFor("genderCategory"))}>
            <FieldLabel htmlFor="genderCategory">
              {t("profile.genderLabel")}
            </FieldLabel>
            <Select
              value={values.genderCategory}
              onValueChange={(value) => setField("genderCategory", value)}
            >
              <SelectTrigger
                id="genderCategory"
                className="w-full"
                aria-invalid={Boolean(errorFor("genderCategory"))}
                aria-describedby={
                  errorFor("genderCategory") ? errorId("genderCategory") : undefined
                }
              >
                <SelectValue placeholder={t("profile.genderPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {genderOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError id={errorId("genderCategory")}>
              {errorFor("genderCategory")}
            </FieldError>
          </Field>
        </div>

        <Field data-invalid={Boolean(errorFor("preferredLanguage"))}>
          <FieldLabel htmlFor="preferredLanguage">
            {t("profile.languageLabel")}
          </FieldLabel>
          <Select
            value={values.preferredLanguage}
            disabled={languageOptions.length === 0}
            onValueChange={(value) => {
              setLanguageChosen(true);
              setField("preferredLanguage", value);
            }}
          >
            <SelectTrigger
              id="preferredLanguage"
              className="w-full"
              aria-invalid={Boolean(errorFor("preferredLanguage"))}
              aria-describedby={
                errors.preferredLanguage
                  ? errorId("preferredLanguage")
                  : undefined
              }
            >
              <SelectValue
                placeholder={
                  languageOptions.length === 0
                    ? t("profile.languagesUnavailable")
                    : t("profile.languagePlaceholder")
                }
              />
            </SelectTrigger>
            <SelectContent>
              {languageOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError id={errorId("preferredLanguage")}>
            {errorFor("preferredLanguage")}
          </FieldError>
        </Field>

        {/*
          * Asked once, at onboarding. The value still travels on an edit - it
          * sits in the form's defaults as the `true` it was given as - so the
          * schema is satisfied without the member being asked to re-consent to
          * something they already consented to.
          */}
        {showConsent ? (
          <Field
            orientation="horizontal"
            className="items-start"
            data-invalid={Boolean(errorFor("consentStorage"))}
          >
            <Checkbox
              id="consentStorage"
              name="consentStorage"
              checked={values.consentStorage}
              onCheckedChange={(checked) =>
                setField("consentStorage", checked === true)
              }
              className="mt-0.5"
              aria-invalid={Boolean(errorFor("consentStorage"))}
            />
            <div className="flex flex-col gap-1">
              <FieldLabel
                htmlFor="consentStorage"
                className="text-[12px] font-normal tracking-normal text-body normal-case sm:text-[13px]"
              >
                {t("profile.consentStorage")}
              </FieldLabel>
              <FieldError>{errorFor("consentStorage")}</FieldError>
            </div>
          </Field>
        ) : null}

        <div className="mt-1 space-y-[clamp(0.375rem,1.25vh,0.75rem)]">
          <Button type="submit" size="form" disabled={isPending}>
            {/* One button, one word, both places it renders. Onboarding and an
                edit are the same save, so they say the same thing. */}
            {t("profile.submit")}
            {/* The spinner outranks the choice below: whatever the button ends
                with at rest, in flight it says "working". */}
            {isPending ? (
              <Icon name="pending" className="animate-spin" />
            ) : submitIcon ? (
              <Icon name={submitIcon} />
            ) : null}
          </Button>

          {/* Under the button, which is where you're looking after pressing it. */}
          {state.formError && !isPending ? (
            <FormAlert>{state.formError}</FormAlert>
          ) : null}

          {state.saved && savedLabel && !isPending ? (
            <FormAlert tone="success">{savedLabel}</FormAlert>
          ) : null}
        </div>
      </FieldGroup>
    </form>
  );
}
