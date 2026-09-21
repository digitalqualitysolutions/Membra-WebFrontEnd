"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";

import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClubLanguageOption } from "@/features/club/api/club-wire";
import {
  isAcceptedPhoto,
  maxPhotoBytes,
  photoAccept,
} from "@/features/onboarding/schemas";
import { cn } from "@/lib/utils";

/**
 * The pieces every card on the club screen is built from.
 *
 * Three cards now show the same record-with-a-pencil pattern, so the pencil,
 * the labelled cell, the switch and the save bar live here rather than three
 * times over. Anything specific to one card - its fields, its table - stays
 * with that card.
 */

/**
 * The shared `Input` is sized for an auth form, where one field is the whole
 * screen. A record is denser than that, so everything typed into one of these
 * cards takes the smaller size.
 */
export const compactInput = "h-9 px-3 text-[13px]";
export const compactTrigger = "h-9 px-3 text-[13px] data-[size=default]:h-9";

/** Turns a field, or a whole card, into something you can type in. */
export function PencilButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex size-6 items-center justify-center rounded-md text-ink-muted transition-colors outline-none hover:bg-badge hover:text-ink focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <Icon name="edit" size="xs" />
    </button>
  );
}

/** A labelled slot in a card's grid, with the pencil that opens it if it has one. */
export function Cell({
  label,
  editLabel,
  onEdit,
  children,
}: {
  label: string;
  editLabel?: string;
  onEdit?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      {/* Holds the pencil's own height whether or not this cell has one, so a
          field without one doesn't pull its value up a few pixels and break
          the row's baseline. */}
      <div className="flex min-h-6 items-center gap-1.5">
        <span className="text-[13px] font-medium text-ink">{label}</span>

        {onEdit && editLabel ? (
          <PencilButton label={editLabel} onClick={onEdit} />
        ) : null}
      </div>

      <div className="mt-2">{children}</div>
    </div>
  );
}

export function Value({ children }: { children: ReactNode }) {
  return <span className="text-[14px] text-body">{children}</span>;
}

/** A small count or kind, in a pill: "8 nodes", "Zone", "Court". */
export function Chip({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        tone === "neutral" && "border-line-strong bg-track text-ink-muted",
        tone === "success" && "border-success/30 bg-success/10 text-success",
        tone === "warning" && "border-lock/40 bg-lock/10 text-lock",
      )}
    >
      {children}
    </span>
  );
}

/**
 * The switch moved to `components/ui` once a second feature needed one, and is
 * re-exported here so the cards that already reach for it through this file
 * keep working. New code should import it from `@/components/ui/switch`.
 */
export { Switch } from "@/components/ui/switch";

/**
 * The bar an edit ends on.
 *
 * One per card, whichever pencil opened it, and one word on the button. A
 * whole-card edit and a single-field edit are the same save; naming them
 * differently would make them look like different commitments.
 */
export function SaveBar({
  message,
  onCancel,
  onSave,
  cancelLabel,
  saveLabel,
  pending = false,
  error,
  saveDisabled = false,
}: {
  message: string;
  onCancel: () => void;
  onSave: () => void;
  cancelLabel: string;
  saveLabel: string;
  /** A save is on its way to the API: both buttons wait for it. */
  pending?: boolean;
  /** Why the last save didn't go through, shown in place of the message. */
  error?: string;
  /** Something required is missing, so there's nothing valid to send yet. */
  saveDisabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line bg-page px-5 py-4 sm:px-6">
      {error && !pending ? (
        <p role="alert" className="text-[12px] font-medium text-danger">
          {error}
        </p>
      ) : (
        <p className="text-[12px] text-body">{message}</p>
      )}

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onCancel}
        >
          {cancelLabel}
        </Button>

        <Button
          type="button"
          disabled={pending || saveDisabled}
          onClick={onSave}
        >
          {pending ? (
            <Icon name="pending" size="xs" className="animate-spin" />
          ) : (
            <Icon name="save" size="xs" />
          )}
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}

/** The chevron that folds a card away, and the card's own heading beside it. */
export function CardHeader({
  open,
  onToggle,
  collapseLabel,
  title,
  description,
  editLabel,
  onEdit,
  aside,
}: {
  open: boolean;
  onToggle: () => void;
  collapseLabel: string;
  title: string;
  description?: string;
  editLabel?: string;
  /** Left out to leave the pencil off - a card with nothing to edit yet. */
  onEdit?: () => void;
  /** The right-hand end of the header: a summary, a search, an action. */
  aside?: ReactNode;
}) {
  return (
    /*
     * A card with a description is two lines deep, so the chevron lines up
     * with the title and lets the description hang below it. With no
     * description there's one line to line up with, and topping the chevron
     * against it leaves it sitting low - so it centres instead.
     */
    <header
      className={cn(
        "flex flex-wrap justify-between gap-4 px-5 py-5 sm:px-6",
        description ? "items-start" : "items-center",
      )}
    >
      <div className={cn("flex min-w-0 gap-3", !description && "items-center")}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={collapseLabel}
          className={cn(
            "inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-badge text-ink transition-colors outline-none hover:bg-track focus-visible:ring-2 focus-visible:ring-ring/40",
            description && "mt-0.5",
          )}
        >
          <Icon
            name="selectArrow"
            size="sm"
            className={cn("transition-transform", !open && "-rotate-90")}
          />
        </button>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[17px] font-semibold tracking-tight text-ink">
              {title}
            </h2>

            {/* A card with nothing in it yet has nothing to edit: it offers
                to fill itself in instead, and the pencil arrives with the
                first detail that's saved. */}
            {onEdit ? (
              <PencilButton label={editLabel ?? title} onClick={onEdit} />
            ) : null}
          </div>

          {description ? (
            <p className="mt-1 text-[13px] text-subtle">{description}</p>
          ) : null}
        </div>
      </div>

      {aside}
    </header>
  );
}

/** What a `Select` holds for "no language": Radix won't take an empty value. */
const NO_LANGUAGE = "none";

/**
 * One of the club's language slots, picked from the API's list.
 *
 * Holds the language's id - that's what the API takes. The optional slot
 * offers "none" first, so a secondary language can be left out or taken back.
 * `exclude` keeps the other slot's choice out of the list: a club can't list
 * the same language twice.
 */
export function LanguageSelect({
  value,
  onChange,
  languages,
  label,
  placeholder,
  unavailableLabel,
  noneLabel,
  exclude = null,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  languages: readonly ClubLanguageOption[];
  label: string;
  placeholder: string;
  unavailableLabel: string;
  /** Given for an optional slot, which can then be set back to nothing. */
  noneLabel?: string;
  exclude?: number | null;
}) {
  const unavailable = languages.length === 0;
  const offered = languages.filter((language) => language.id !== exclude);

  return (
    <Select
      value={value === null ? (noneLabel ? NO_LANGUAGE : "") : String(value)}
      onValueChange={(next) =>
        onChange(next === NO_LANGUAGE ? null : Number(next))
      }
      disabled={unavailable}
    >
      <SelectTrigger
        className={cn("w-full", compactTrigger)}
        aria-label={label}
      >
        <SelectValue
          placeholder={unavailable ? unavailableLabel : placeholder}
        />
      </SelectTrigger>

      <SelectContent>
        {noneLabel ? (
          <SelectItem value={NO_LANGUAGE}>{noneLabel}</SelectItem>
        ) : null}

        {offered.map((language) => (
          <SelectItem key={language.id} value={String(language.id)}>
            {language.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * The club's logo, or its mark while there isn't one.
 *
 * Falls back to the mark if the picture won't draw, too - a HEIC preview in a
 * browser that can't decode it, or a signed URL that has expired.
 */
export function ClubAvatar({ src, alt }: { src: string | null; alt: string }) {
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);
  const showImage = Boolean(src) && src !== brokenSrc;

  return (
    <span className="inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line-strong bg-badge text-ink">
      {showImage ? (
        // Plain `img` on purpose: the host is the object store the API signs
        // URLs on, or a `data:` preview that only exists in this tab.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src ?? undefined}
          alt={alt}
          onError={() => setBrokenSrc(src)}
          className="size-full object-cover"
        />
      ) : (
        <Icon name="club" size="lg" />
      )}
    </span>
  );
}

/**
 * Pick, replace or clear the club's logo.
 *
 * Hands back the file for uploading, and a preview to show meanwhile. The
 * preview is a `data:` URL rather than a blob one. A blob URL has to be revoked,
 * and this one is handed on - into the club record, through a Cancel, back out
 * - so there's no single place where it's safe to throw away. A `data:` URL
 * has nothing to clean up. It's the right trade while this is a placeholder
 * with nowhere to upload to; the endpoint will return a real URL instead.
 */
export function ClubAvatarPicker({
  value,
  onChange,
  alt,
  uploadLabel,
  replaceLabel,
  removeLabel,
  formatsLabel,
  invalidLabel,
  allowRemove = true,
}: {
  value: string | null;
  /**
   * The preview to show, and the file itself for whatever uploads it. Both
   * `null` when the logo is removed.
   */
  onChange: (value: string | null, file: File | null) => void;
  alt: string;
  uploadLabel: string;
  replaceLabel: string;
  removeLabel: string;
  formatsLabel: string;
  invalidLabel: string;
  /**
   * Off where there's nothing to remove it with: the API can replace a saved
   * club's logo but has no call to delete one.
   */
  allowRemove?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [invalid, setInvalid] = useState(false);

  function pick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    // Cleared so picking the same file again still fires a change.
    event.target.value = "";

    if (!file) return;

    // The API's rules, shared with the member photo: the same formats and the
    // same 8 MB. `accept` only filters the dialog; a drag or "All files" gets
    // past it, so the file is checked here as well.
    if (file.size > maxPhotoBytes || !isAcceptedPhoto(file)) {
      setInvalid(true);
      return;
    }

    setInvalid(false);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onChange(reader.result, file);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <ClubAvatar src={value} alt={alt} />

        <input
          ref={input}
          type="file"
          accept={photoAccept}
          onChange={pick}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => input.current?.click()}
        >
          <Icon name="upload" size="xs" />
          {value ? replaceLabel : uploadLabel}
        </Button>

        {value && allowRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setInvalid(false);
              onChange(null, null);
            }}
          >
            {removeLabel}
          </Button>
        ) : (
          <span className="text-[12px] text-body">{formatsLabel}</span>
        )}
      </div>

      {invalid ? (
        <p role="alert" className="mt-2 text-[12px] text-danger">
          {invalidLabel}
        </p>
      ) : null}
    </div>
  );
}

export function Th({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn("pb-2 text-[13px] font-medium text-ink-muted", className)}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td className={cn("py-3 pr-4 align-middle", className)}>{children}</td>
  );
}
