"use client";

import { useTranslations } from "next-intl";

import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import type { ClubLanguageOption } from "@/features/club/api/club-wire";
import { Chip, LanguageSelect } from "@/features/club/components/record-parts";

/** A club's languages in rank order. `null` is a slot added but not picked yet. */
export type LanguageSlots = readonly (string | null)[];

export const firstLanguageSlot: LanguageSlots = [null];

/** The ids the API takes, primary first, empty slots dropped. */
export function chosenLanguageIds(slots: LanguageSlots): string[] {
  return slots.filter((id): id is string => typeof id === "string");
}

/**
 * Every language a club speaks. The first is the primary one, so rank follows
 * position rather than a flag two rows could both claim.
 */
export function LanguageFields({
  slots,
  onChange,
  languages,
}: {
  slots: LanguageSlots;
  onChange: (slots: LanguageSlots) => void;
  languages: readonly ClubLanguageOption[];
}) {
  const t = useTranslations("club");

  const nameOf = (id: string | null) =>
    languages.find((language) => language.id === id)?.name ?? null;

  function choose(index: number, id: string | null) {
    onChange(slots.map((current, at) => (at === index ? id : current)));
  }

  /** Swaps with the top, so the language standing there keeps this row. */
  function makePrimary(index: number) {
    const promoted = slots[index] ?? null;
    const displaced = slots[0] ?? null;

    onChange(
      slots.map((id, at) =>
        at === 0 ? promoted : at === index ? displaced : id,
      ),
    );
  }

  // One at a time: an empty slot beside another empty one is two to tell apart.
  const complete = slots.length > 0 && slots.every((id) => id !== null);
  // One slot per language is the most there can be; another would pick from nothing.
  const room = slots.length < languages.length;

  return (
    <div className="flex flex-col gap-2">
      {slots.map((id, index) => {
        // The top row is the primary one, once something is in it.
        const primary = index === 0 && typeof id === "string";
        const rank = primary ? t("fields.primary") : t("fields.secondary");
        const which = nameOf(id) ?? String(index + 1);

        return (
          // Keyed by position: a slot holds nothing of its own.
          <div key={index} className="flex flex-wrap items-center gap-2">
            <div className="w-full min-w-0 sm:w-auto sm:min-w-48 sm:flex-1">
              <LanguageSelect
                value={id}
                onChange={(next) => choose(index, next)}
                languages={languages}
                exclude={chosenLanguageIds(
                  slots.filter((_, at) => at !== index),
                )}
                label={
                  typeof id === "string"
                    ? `${t("fields.language")} (${rank})`
                    : t("fields.language")
                }
                placeholder={t("setup.languagePlaceholder")}
                unavailableLabel={t("fields.languagesUnavailable")}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Holds its width with no button in it, so every row's remove
                  sits on the same edge - only where there's room for it. */}
              <div className="flex min-w-0 items-center gap-2 sm:min-w-40">
                {/* Nothing picked yet is nothing to rank. */}
                {typeof id === "string" ? (
                  <Chip tone={primary ? "success" : "neutral"}>{rank}</Chip>
                ) : null}

                {/* Only a filled slot can take the rank, and the one that
                    already holds it has nowhere to move. */}
                {!primary && typeof id === "string" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => makePrimary(index)}
                    aria-label={t("fields.makePrimaryLanguage", {
                      language: which,
                    })}
                  >
                    {t("fields.setPrimary")}
                  </Button>
                ) : null}
              </div>

              {/* The last one can't go: a club has to speak something. */}
              {slots.length > 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    onChange(slots.filter((_, at) => at !== index))
                  }
                  aria-label={t("fields.removeLanguage", { language: which })}
                  className="inline-flex size-7 items-center justify-center rounded-md text-body transition-colors outline-none hover:bg-badge hover:text-ink focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  <Icon name="close" size="xs" />
                </button>
              ) : null}
            </div>
          </div>
        );
      })}

      {complete && room ? (
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange([...slots, null])}
          >
            <Icon name="add" size="xs" />
            {t("fields.addLanguage")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
