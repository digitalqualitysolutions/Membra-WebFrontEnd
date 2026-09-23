"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import type { FormEvent, ReactNode } from "react";

import { Icon } from "@/components/icons";
import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ClubActivity,
  ClubLanguageOption,
} from "@/features/club/api/club-wire";
import { ActivityPicker } from "@/features/club/components/activity-picker";
import {
  AddressFields,
  blankAddressValues,
  isAddressComplete,
} from "@/features/club/components/address-fields";
import {
  FormField as Field,
  Tagged,
} from "@/features/club/components/form-field";
import {
  Chip,
  ClubAvatarPicker,
  LanguageSelect,
  compactInput,
  compactTrigger,
} from "@/features/club/components/record-parts";
import { createClubAction } from "@/features/club/services/create-club";
import { usePhotoCropLabels } from "@/features/onboarding/components/crop-dialog";
import {
  initialCreateClubState,
  type NewAddressValues,
} from "@/features/club/services/state";
import type { ClubDetails } from "@/features/club/types";
import { dayMonthYearToIso } from "@/lib/date";
import { cn } from "@/lib/utils";

/** An address as it's being typed, with a key of its own for the list. */
type AddressDraft = NewAddressValues & { id: string };

const FIRST_ADDRESS = "address-0";

const blankAddress = (id: string): AddressDraft => ({
  id,
  ...blankAddressValues,
});

/**
 * The screen an admin meets before their club exists.
 *
 * A button first, then one card with everything the club needs to exist: its
 * details and the addresses it plays at. Addresses are asked for here because
 * locations can't be created without one to hang off.
 *
 * Creates the club for real through `POST /clubs`. A new club is always
 * active - there's nothing to switch off yet - so the switch isn't asked for;
 * it's on the club card afterwards.
 */
export function ClubSetup({
  activities,
  languages,
  countries,
  onCreate,
}: {
  activities: readonly ClubActivity[];
  languages: readonly ClubLanguageOption[];
  countries: readonly { code: string; name: string }[];
  /** Called with the club the API stored, to swap this screen for the card. */
  onCreate: (club: ClubDetails) => void;
}) {
  const t = useTranslations("club");
  const locale = useLocale();
  const cropLabels = usePhotoCropLabels();

  const [filling, setFilling] = useState(false);

  const [name, setName] = useState("");
  const [short, setShort] = useState("");
  const [country, setCountry] = useState(countries[0]?.code ?? "");
  const [established, setEstablished] = useState("");
  // None chosen to start. Optional: a club can be created without any.
  const [activityIds, setActivityIds] = useState<number[]>([]);
  const [primaryLanguage, setPrimaryLanguage] = useState<string | null>(null);
  const [secondaryLanguage, setSecondaryLanguage] = useState<string | null>(
    null,
  );
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [addresses, setAddresses] = useState<AddressDraft[]>(() => [
    blankAddress(FIRST_ADDRESS),
  ]);

  /** Ids for added rows. A counter, since reading a clock mid-render is impure. */
  const nextAddress = useRef(1);

  const [state, submit, isPending] = useActionState(
    createClubAction,
    initialCreateClubState,
  );

  // The club exists once the action says so; hand it up so the screen swaps
  // this form for the card.
  useEffect(() => {
    if (state.club) onCreate(state.club);
  }, [state.club, onCreate]);

  /** `null` until the field holds a whole, real date - empty included. */
  const establishedIso = dayMonthYearToIso(established);

  /**
   * Red only once something has been typed that isn't a date. An empty field
   * is merely unfinished, and flagging it before the admin has reached it
   * would shout about a field they haven't had a chance to fill in.
   */
  const establishedInvalid = established.length > 0 && establishedIso === null;

  /**
   * Every address complete, not just one.
   *
   * A half-typed second address is almost certainly a mistake in progress, and
   * quietly dropping it on save would lose something the admin meant to keep.
   * An unwanted one has a remove button instead.
   */
  const addressesComplete = addresses.every(isAddressComplete);

  const ready =
    name.trim().length > 0 &&
    short.trim().length > 0 &&
    country.length > 0 &&
    establishedIso !== null &&
    primaryLanguage !== null &&
    addresses.length > 0 &&
    addressesComplete;

  function updateAddress(id: string, patch: Partial<NewAddressValues>) {
    setAddresses((rows) =>
      rows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  function addAddress() {
    const id = `address-${(nextAddress.current += 1)}`;

    setAddresses((rows) => [...rows, blankAddress(id)]);
  }

  function removeAddress(id: string) {
    setAddresses((rows) => rows.filter((row) => row.id !== id));
  }

  function create(event: FormEvent<HTMLFormElement>) {
    // A real form, so Enter in any field creates the club.
    event.preventDefault();

    if (!ready || isPending) return;

    startTransition(() =>
      submit({
        locale,
        name,
        shortName: short,
        countryCode: country,
        establishedDate: established,
        activityIds,
        primaryLanguageId: primaryLanguage,
        secondaryLanguageId: secondaryLanguage,
        // In the order entered - the API makes the first one primary.
        addresses: addresses.map((row) => ({
          name: row.name,
          shortName: row.shortName,
          streetName: row.streetName,
          streetNumber: row.streetNumber,
          zip: row.zip,
          city: row.city,
          region: row.region,
          directions: row.directions,
        })),
        avatar: avatarFile,
      }),
    );
  }

  if (!filling) return <SetupIntro onStart={() => setFilling(true)} />;

  return (
    <form
      onSubmit={create}
      noValidate
      className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card"
    >
      <Section
        title={t("setup.detailsTitle")}
        description={t("setup.detailsDescription")}
      >
        {/* Dense, so at two columns the avatar tucks in beside the activity
            instead of leaving a hole where the two-wide language wouldn't fit.
            At four columns everything already fits in order. */}
        <div className="grid grid-flow-row-dense gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          <Field
            label={t("fields.name")}
            required
            requiredLabel={t("setup.required")}
          >
            <Input
              className={compactInput}
              value={name}
              maxLength={255}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("setup.namePlaceholder")}
              aria-label={t("fields.name")}
              aria-required
              autoFocus
            />
          </Field>

          <Field
            label={t("fields.short")}
            required
            requiredLabel={t("setup.required")}
          >
            {/* Ten characters is the API's limit for a club's short code. */}
            <Input
              className={compactInput}
              value={short}
              maxLength={10}
              onChange={(event) => setShort(event.target.value)}
              placeholder={t("setup.shortPlaceholder")}
              aria-label={t("fields.short")}
              aria-required
            />
          </Field>

          <Field
            label={t("fields.country")}
            required
            requiredLabel={t("setup.required")}
          >
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger
                className={cn("w-full", compactTrigger)}
                aria-label={t("fields.country")}
                aria-required
              >
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {countries.map((item) => (
                  <SelectItem key={item.code} value={item.code}>
                    {item.code} ({item.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field
            label={t("fields.established")}
            required
            requiredLabel={t("setup.required")}
          >
            <DateInput
              aria-required
              groupClassName="h-9"
              className="px-3 text-[13px]"
              value={established}
              onValueChange={setEstablished}
              placeholder={t("fields.datePlaceholder")}
              pickerLabel={t("fields.datePicker")}
              aria-label={t("fields.established")}
              autoComplete="off"
              aria-invalid={establishedInvalid}
            />
          </Field>

          <Field label={t("fields.activity")}>
            <ActivityPicker
              value={activityIds}
              onChange={setActivityIds}
              activities={activities}
              label={t("fields.activity")}
              unavailableLabel={t("fields.activitiesUnavailable")}
            />
          </Field>

          {/* Both slots under one label, the way the club record lists them:
              "Club language", then each tagged with its slot. The primary is
              required, the secondary isn't, and neither offers the language
              the other already holds. */}
          <Field
            label={t("fields.language")}
            required
            requiredLabel={t("setup.required")}
            className="sm:col-span-2"
          >
            {/* The same `gap-x-8` as the grid this field sits in, so the pair
                splits exactly where the two columns it spans do. */}
            <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
              <Tagged tag={t("fields.primary")}>
                <LanguageSelect
                  value={primaryLanguage}
                  onChange={setPrimaryLanguage}
                  languages={languages}
                  exclude={secondaryLanguage}
                  label={`${t("fields.language")} (${t("fields.primary")})`}
                  placeholder={t("setup.languagePlaceholder")}
                  unavailableLabel={t("fields.languagesUnavailable")}
                />
              </Tagged>

              <Tagged tag={t("fields.secondary")}>
                <LanguageSelect
                  value={secondaryLanguage}
                  onChange={setSecondaryLanguage}
                  languages={languages}
                  exclude={primaryLanguage}
                  label={`${t("fields.language")} (${t("fields.secondary")})`}
                  placeholder={t("setup.noLanguage")}
                  noneLabel={t("setup.noLanguage")}
                  unavailableLabel={t("fields.languagesUnavailable")}
                />
              </Tagged>
            </div>
          </Field>

          <Field label={t("fields.avatar")}>
            <ClubAvatarPicker
              value={avatar}
              onChange={(preview, file) => {
                setAvatar(preview);
                setAvatarFile(file);
              }}
              alt={t("fields.avatar")}
              uploadLabel={t("fields.upload")}
              replaceLabel={t("fields.replace")}
              removeLabel={t("fields.remove")}
              formatsLabel={t("fields.uploadFormats")}
              invalidLabel={t("fields.avatarInvalid")}
              cropLabels={cropLabels}
            />
          </Field>
        </div>
      </Section>

      <Section
        title={t("setup.address.title")}
        description={t("setup.address.intro")}
      >
        <div className="flex flex-col gap-4">
          {addresses.map((row, index) => (
            // A labelled group rather than a fieldset: a `<legend>` only names
            // its fieldset as the first child, and this heading shares a row
            // with the remove button.
            <div
              key={row.id}
              role="group"
              aria-labelledby={`${row.id}-heading`}
              className="rounded-xl border border-line px-4 py-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3
                    id={`${row.id}-heading`}
                    className="text-[13px] font-semibold text-ink"
                  >
                    {t("setup.address.heading", { number: index + 1 })}
                  </h3>

                  {/* Not a choice here: the API makes the first address on a
                      new club its primary one, so the label follows position.
                      Remove the first and the next one takes it. It can be
                      moved on the club card once the club exists. */}
                  <Chip tone={index === 0 ? "success" : "neutral"}>
                    {index === 0 ? t("fields.primary") : t("fields.secondary")}
                  </Chip>
                </div>

                {/* The last address can't go: the club needs at least one. */}
                {addresses.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeAddress(row.id)}
                    aria-label={t("setup.address.remove", {
                      number: index + 1,
                    })}
                    className="inline-flex size-7 items-center justify-center rounded-md text-body transition-colors outline-none hover:bg-badge hover:text-ink focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                    <Icon name="close" size="xs" />
                  </button>
                ) : null}
              </div>

              <div className="mt-4">
                <AddressFields
                  value={row}
                  onChange={(patch) => updateAddress(row.id, patch)}
                />
              </div>
            </div>
          ))}

          {/* Only once every address so far is filled in. Offering a second
              block beside an empty first one just leaves two empty blocks,
              and the admin has to work out which one they meant. */}
          {addressesComplete ? (
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAddress}
              >
                <Icon name="add" size="xs" />
                {t("setup.address.add")}
              </Button>
            </div>
          ) : null}
        </div>
      </Section>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line bg-page px-5 py-4 sm:px-6">
        {/* The API's refusal when there is one - it's what the admin needs to
            act on - and otherwise the key to the asterisks. */}
        {state.formError && !isPending ? (
          <p role="alert" className="text-[12px] font-medium text-danger">
            {state.formError}
          </p>
        ) : (
          <p className="text-[12px] text-body">
            <span aria-hidden className="font-semibold text-danger">
              *
            </span>{" "}
            {t("setup.requiredNote")}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => setFilling(false)}
          >
            {t("editing.cancel")}
          </Button>

          <Button type="submit" disabled={!ready || isPending}>
            {isPending ? (
              <Icon name="pending" size="xs" className="animate-spin" />
            ) : (
              <Icon name="save" size="xs" />
            )}
            {t("setup.create")}
          </Button>
        </div>
      </div>
    </form>
  );
}

/** The first thing a new admin sees: what this is, and one button. */
function SetupIntro({ onStart }: { onStart: () => void }) {
  const t = useTranslations("club.setup.intro");

  return (
    <EmptyState
      icon="club"
      title={t("title")}
      body={t("body")}
      action={
        <Button type="button" size="lg" onClick={onStart}>
          <Icon name="add" size="xs" />
          {t("start")}
        </Button>
      }
    />
  );
}

/** A titled block inside the setup card, ruled off from the one above. */
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-line px-5 py-6 last-of-type:border-b-0 sm:px-6">
      <h2 className="text-[15px] font-semibold tracking-tight text-ink">
        {title}
      </h2>
      <p className="mt-1 text-[13px] text-body">{description}</p>

      <div className="mt-5">{children}</div>
    </section>
  );
}
