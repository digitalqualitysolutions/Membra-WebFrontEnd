"use client";

import { format, parseISO } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Icon } from "@/components/icons";
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
import { ClampedNames } from "@/features/club/components/clamped-names";
import { Tagged } from "@/features/club/components/form-field";
import {
  Cell,
  ClubAvatar,
  ClubAvatarPicker,
  LanguageSelect,
  PencilButton,
  SaveBar,
  Switch,
  Value,
  compactInput,
  compactTrigger,
} from "@/features/club/components/record-parts";
import type { ClubDetailsChange } from "@/features/club/services/state";
import { saveClubAction } from "@/features/club/services/update-club";
import type {
  ClubDetails,
  ClubField,
  ClubFormValues,
} from "@/features/club/types";
import { dayMonthYearToIso, fromIsoDate } from "@/lib/date";
import { cn } from "@/lib/utils";

/**
 * What the card is currently letting you change.
 *
 * Three states rather than a boolean, because the two ways in mean different
 * things: the section pencil opens everything at once, a single pencil opens
 * just what it sits next to and leaves the rest as text.
 */
type Mode =
  | { kind: "read" }
  | { kind: "section" }
  | { kind: "field"; field: ClubField };

function valuesOf(club: ClubDetails): ClubFormValues {
  return {
    name: club.name,
    short: club.short,
    // Edited day-first, stored ISO: the field has to hold half-typed dates,
    // which have no ISO form, so the conversion happens at the two ends.
    established: fromIsoDate(club.established),
    activityIds: club.activityIds,
    primaryLanguageId:
      club.languages.find((language) => language.rank === "primary")?.id ??
      null,
    secondaryLanguageId:
      club.languages.find((language) => language.rank === "secondary")?.id ??
      null,
    country: club.country.code,
    active: club.active,
    avatar: club.avatar,
  };
}

/** `2026-05-04` as `04-May-2026`, the way the club record reads it back. */
function formatEstablished(iso: string) {
  try {
    return format(parseISO(iso), "dd-MMM-yyyy");
  } catch {
    return iso;
  }
}

/**
 * The club record, and the place it's changed.
 *
 * Every change goes out on the one save bar, and Cancel throws all of it away.
 * The addresses have a card of their own: they're a table that grows, with its
 * own add-a-row and its own save, and none of that is a parameter you type into
 * a field here.
 */
export function ClubDetailsCard({
  club,
  activities,
  languages,
  countries,
  onSaved,
}: {
  club: ClubDetails;
  activities: readonly ClubActivity[];
  languages: readonly ClubLanguageOption[];
  countries: readonly { code: string; name: string }[];
  /** The club as the API now holds it, for the cards that share the record. */
  onSaved: (club: ClubDetails) => void;
}) {
  const t = useTranslations("club");
  const locale = useLocale();

  const [mode, setMode] = useState<Mode>({ kind: "read" });
  const [values, setValues] = useState(() => valuesOf(club));
  /** A logo picked in this edit, sent with the next Save. */
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saveError, setSaveError] = useState<string>();
  const [saving, startSave] = useTransition();

  const editingAll = mode.kind === "section";
  const editing = (target: ClubField) =>
    editingAll || (mode.kind === "field" && mode.field === target);

  /** Everything back to what's saved, so a cancelled edit leaves no trace. */
  function reset(from: ClubDetails) {
    setValues(valuesOf(from));
    setAvatarFile(null);
    setSaveError(undefined);
  }

  function open(next: Mode) {
    reset(club);
    setMode(next);
  }

  function cancel() {
    reset(club);
    setMode({ kind: "read" });
  }

  /** Whether two modes are the same edit, which for a field means the same field. */
  function sameEdit(a: Mode, b: Mode) {
    if (a.kind !== b.kind) return false;
    if (a.kind === "field" && b.kind === "field") return a.field === b.field;

    return true;
  }

  /**
   * The pencil that opened an edit closes it again.
   *
   * Clicking in and clicking out is one gesture, and a pencil that only ever
   * opened left Cancel as the single way back. Closing discards, exactly as
   * Cancel does, so the two ways out agree.
   *
   * Only the *same* edit toggles: a field pencil pressed while the whole
   * section is open still narrows to that field, the way it did before.
   */
  function toggle(next: Mode) {
    if (saving) return;
    if (sameEdit(mode, next)) cancel();
    else open(next);
  }

  const setField = <Key extends keyof ClubFormValues>(
    field: Key,
    value: ClubFormValues[Key],
  ) => setValues((current) => ({ ...current, [field]: value }));

  /* ---------------------------------------------------------------------- */
  /* Save                                                                    */
  /* ---------------------------------------------------------------------- */

  /** Whether each editable detail holds something the API will take. */
  const fieldValid: Record<ClubField, boolean> = {
    name: values.name.trim().length > 0,
    short: values.short.trim().length > 0,
    established: dayMonthYearToIso(values.established) !== null,
    activityIds: true,
    primaryLanguageId: values.primaryLanguageId !== null,
    secondaryLanguageId: true,
    country: values.country.length > 0,
    avatar: true,
  };

  /**
   * Only what's being saved has to be valid. A club with an old gap in one
   * field - no date, say - can still have its name changed from the name's
   * own pencil.
   */
  const ready =
    mode.kind === "section"
      ? Object.values(fieldValid).every(Boolean)
      : mode.kind === "field"
        ? fieldValid[mode.field]
        : true;

  const details = detailsChange();

  /**
   * The details this Save sends.
   *
   * "Edit all" sends the whole record. A field pencil sends only its own
   * field, so nothing else on the club is written - a change another admin
   * made to a different field in the meantime is left alone. The logo pencil
   * sends no details at all, just the file, if one was picked.
   */
  function detailsChange(): ClubDetailsChange | null {
    const languages = {
      primaryLanguageId: values.primaryLanguageId,
      secondaryLanguageId: values.secondaryLanguageId,
    };

    if (mode.kind === "section") {
      return {
        name: values.name,
        shortName: values.short,
        countryCode: values.country,
        establishedDate: values.established,
        active: values.active,
        activityIds: values.activityIds,
        languages,
        avatar: avatarFile,
      };
    }

    if (mode.kind !== "field") return null;

    switch (mode.field) {
      case "name":
        return { name: values.name, avatar: null };
      case "short":
        return { shortName: values.short, avatar: null };
      case "established":
        return { establishedDate: values.established, avatar: null };
      case "activityIds":
        return { activityIds: values.activityIds, avatar: null };
      case "primaryLanguageId":
      case "secondaryLanguageId":
        return { languages, avatar: null };
      case "country":
        return { countryCode: values.country, avatar: null };
      case "avatar":
        return avatarFile ? { avatar: avatarFile } : null;
    }
  }

  function save() {
    if (!ready || saving) return;

    // Nothing to send - the logo pencil opened and closed, say.
    if (!details) {
      cancel();
      return;
    }

    setSaveError(undefined);

    startSave(async () => {
      const result = await saveClubAction({
        locale,
        clubId: club.id,
        details,
        // The addresses card sends its own; this one only sends details.
        addresses: [],
        primaryKey: null,
      });

      if (result.club) onSaved(result.club);

      if (result.formError) {
        setSaveError(result.formError);
        return;
      }

      reset(result.club ?? club);
      setMode({ kind: "read" });
    });
  }

  /**
   * The countries to offer, the club's own included. The list is ours and
   * short; a club registered somewhere it doesn't cover would otherwise open
   * its dropdown on nothing.
   */
  const countryOptions = countries.some((c) => c.code === club.country.code)
    ? countries
    : [club.country, ...countries];

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <header className="flex flex-wrap items-start justify-between gap-4 px-5 py-5 sm:px-6">
        {/* No chevron here. The one this card had folded the addresses table
            away, and that table is its own card now; folding a record down to
            its own title would hide the thing you opened the screen to read. */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[17px] font-semibold tracking-tight text-ink">
              {t("details.title")}
            </h2>

            <PencilButton
              label={t("details.editAll")}
              onClick={() => toggle({ kind: "section" })}
            />
          </div>

          <p className="mt-1 text-[13px] text-body">
            {t("details.description")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[13px] text-body">
            {t("details.activeStatus")}
          </span>

          <Switch
            checked={values.active}
            disabled={!editingAll || saving}
            onChange={(next) => setField("active", next)}
            label={t("fields.active")}
          />

          <span
            className={cn(
              "rounded-full border px-3 py-0.5 text-[12px] font-medium",
              club.active
                ? "border-success/30 bg-success/10 text-success"
                : "border-line-strong bg-track text-body",
            )}
          >
            {club.active ? t("fields.active") : t("fields.inactive")}
          </span>
        </div>
      </header>

      <div className="grid gap-x-8 gap-y-6 border-t border-line px-5 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-5">
        <Cell
          label={t("fields.name")}
          editLabel={t("details.editField", { field: t("fields.name") })}
          onEdit={() => toggle({ kind: "field", field: "name" })}
        >
          {editing("name") ? (
            <Input
              className={compactInput}
              value={values.name}
              maxLength={255}
              onChange={(event) => setField("name", event.target.value)}
              aria-label={t("fields.name")}
              aria-required
              aria-invalid={values.name.trim().length === 0}
            />
          ) : (
            <Value>{club.name}</Value>
          )}
        </Cell>

        <Cell
          label={t("fields.short")}
          editLabel={t("details.editField", { field: t("fields.short") })}
          onEdit={() => toggle({ kind: "field", field: "short" })}
        >
          {editing("short") ? (
            <Input
              className={compactInput}
              value={values.short}
              maxLength={10}
              onChange={(event) => setField("short", event.target.value)}
              aria-label={t("fields.short")}
              aria-required
              aria-invalid={values.short.trim().length === 0}
            />
          ) : (
            <Value>{club.short}</Value>
          )}
        </Cell>

        <Cell
          label={t("fields.established")}
          editLabel={t("details.editField", {
            field: t("fields.established"),
          })}
          onEdit={() => toggle({ kind: "field", field: "established" })}
        >
          {editing("established") ? (
            // The same day-first field and calendar as the rest of the app,
            // not the browser's own date control.
            <DateInput
              groupClassName="h-9"
              className="px-3 text-[13px]"
              value={values.established}
              onValueChange={(value) => setField("established", value)}
              placeholder={t("fields.datePlaceholder")}
              pickerLabel={t("fields.datePicker")}
              aria-label={t("fields.established")}
              autoComplete="off"
              aria-required
              aria-invalid={!dayMonthYearToIso(values.established)}
            />
          ) : (
            <Value>
              {club.established
                ? formatEstablished(club.established)
                : t("addresses.none")}
            </Value>
          )}
        </Cell>

        {/* No pencil on these two: one is a count of the people with
            access and the other follows the switch above. Neither is a
            club parameter you type. */}
        <Cell label={t("fields.admins")}>
          <div className="flex items-center gap-2">
            <Value>{club.admins}</Value>

            {club.admins < club.recommendedAdmins ? (
              <span className="inline-flex items-center gap-0.5 rounded-full border border-lock/40 bg-lock/10 px-2 py-0.5 text-[11px] font-medium text-lock">
                <Icon name="countHint" size="xs" />
                {t("fields.recommended", {
                  recommended: club.recommendedAdmins,
                })}
              </span>
            ) : null}
          </div>
        </Cell>

        <Cell label={t("fields.active")}>
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className={cn(
                "size-2 rounded-full",
                club.active ? "bg-success" : "bg-subtle",
              )}
            />
            <Value>{club.active ? t("fields.yes") : t("fields.no")}</Value>
          </div>
        </Cell>
      </div>

      <div className="grid gap-x-8 gap-y-6 border-t border-line px-5 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <Cell
          label={t("fields.activity")}
          editLabel={t("details.editField", { field: t("fields.activity") })}
          onEdit={() => toggle({ kind: "field", field: "activityIds" })}
        >
          {editing("activityIds") ? (
            <ActivityPicker
              value={values.activityIds}
              onChange={(value) => setField("activityIds", value)}
              activities={activities}
              label={t("fields.activity")}
              unavailableLabel={t("fields.activitiesUnavailable")}
            />
          ) : club.activity ? (
            // Back into names from the string the wire joined them into: a
            // club can hold every activity there is, and twenty of them read
            // as a paragraph unless the cell folds them.
            <ClampedNames
              names={club.activity.split(", ")}
              moreLabel={(count) => t("fields.activityMore", { count })}
              lessLabel={t("fields.activityLess")}
            />
          ) : (
            <Value>{t("addresses.none")}</Value>
          )}
        </Cell>

        <Cell
          label={t("fields.language")}
          editLabel={t("details.editField", { field: t("fields.language") })}
          onEdit={() => toggle({ kind: "field", field: "primaryLanguageId" })}
        >
          {editing("primaryLanguageId") || editing("secondaryLanguageId") ? (
            // The API's own list, as in setup. Stacked here: the cell is one
            // column wide, too narrow for the pair side by side.
            <div className="flex flex-col gap-2">
              <Tagged tag={t("fields.primary")}>
                <LanguageSelect
                  value={values.primaryLanguageId}
                  onChange={(value) => setField("primaryLanguageId", value)}
                  languages={languages}
                  exclude={values.secondaryLanguageId}
                  label={`${t("fields.language")} (${t("fields.primary")})`}
                  placeholder={t("setup.languagePlaceholder")}
                  unavailableLabel={t("fields.languagesUnavailable")}
                />
              </Tagged>

              <Tagged tag={t("fields.secondary")}>
                <LanguageSelect
                  value={values.secondaryLanguageId}
                  onChange={(value) => setField("secondaryLanguageId", value)}
                  languages={languages}
                  exclude={values.primaryLanguageId}
                  label={`${t("fields.language")} (${t("fields.secondary")})`}
                  placeholder={t("setup.noLanguage")}
                  noneLabel={t("setup.noLanguage")}
                  unavailableLabel={t("fields.languagesUnavailable")}
                />
              </Tagged>
            </div>
          ) : club.languages.length > 0 ? (
            <div className="flex flex-col gap-1">
              {club.languages.map((language) => (
                <div key={language.rank} className="flex items-baseline gap-2">
                  <Value>{language.name}</Value>
                  <span className="text-[12px] text-body italic">
                    {t(`fields.${language.rank}`)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <Value>{t("addresses.none")}</Value>
          )}
        </Cell>

        <Cell
          label={t("fields.country")}
          editLabel={t("details.editField", { field: t("fields.country") })}
          onEdit={() => toggle({ kind: "field", field: "country" })}
        >
          {editing("country") ? (
            <Select
              value={values.country}
              onValueChange={(value) => setField("country", value)}
            >
              <SelectTrigger
                className={cn("w-full", compactTrigger)}
                aria-label={t("fields.country")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countryOptions.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.code} ({country.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex items-baseline gap-2">
              <Value>{club.country.code}</Value>
              <span className="text-[13px] text-body">
                ({club.country.name})
              </span>
            </div>
          )}
        </Cell>

        <Cell
          label={t("fields.avatar")}
          editLabel={t("details.editField", { field: t("fields.avatar") })}
          onEdit={() => toggle({ kind: "field", field: "avatar" })}
        >
          {editing("avatar") ? (
            <ClubAvatarPicker
              value={values.avatar}
              onChange={(preview, file) => {
                setField("avatar", preview);
                setAvatarFile(file);
              }}
              alt={t("fields.avatar")}
              uploadLabel={t("fields.upload")}
              replaceLabel={t("fields.replace")}
              removeLabel={t("fields.remove")}
              formatsLabel={t("fields.uploadFormats")}
              invalidLabel={t("fields.avatarInvalid")}
              // The API can replace a club's logo but not delete one.
              allowRemove={false}
            />
          ) : (
            <ClubAvatar src={club.avatar} alt={t("fields.avatar")} />
          )}
        </Cell>
      </div>

      {/*
       * One bar, whichever pencil opened it, and one word on the button. A
       * whole-card edit and a single-field edit are the same save; naming them
       * differently would make them look like different commitments.
       */}
      {mode.kind === "read" ? null : (
        <SaveBar
          message={
            // A disabled button has to say what would undo it, so what's
            // stopping the save comes ahead of what's being edited.
            !ready
              ? t("editing.incomplete")
              : mode.kind === "section"
                ? t("editing.section")
                : t("editing.field")
          }
          cancelLabel={t("editing.cancel")}
          saveLabel={t("editing.save")}
          onCancel={cancel}
          onSave={save}
          pending={saving}
          error={saveError}
          saveDisabled={!ready}
        />
      )}
    </section>
  );
}
