"use client";

import type { ReactNode } from "react";

import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Asks before something that can't be taken back.
 *
 * Shared rather than written per screen, so every "are you sure" in the app
 * asks the same way round: the cancel is the quiet button, the action names
 * itself ("Delete location", not "OK"), and the destructive one is the only
 * thing in red.
 *
 * Copy is passed in, all of it. This component owns the shape of the question,
 * not the words - a dialog that built its own sentences would need a
 * translation key per caller living somewhere it doesn't belong.
 *
 * Render it only when it should be on screen: it has no trigger and no closed
 * state. Whoever owns the row being acted on owns whether this exists.
 */
export function ConfirmDialog({
  title,
  description,
  children,
  confirmLabel,
  cancelLabel,
  tone = "danger",
  busy = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  /** Anything worth seeing before deciding - the rows that go too, say. */
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  /** `danger` for anything destructive, which is what the red is reserved for. */
  tone?: "danger" | "neutral";
  /** While the action is out. Holds the dialog open and both buttons still. */
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const danger = tone === "danger";

  return (
    <Dialog
      open
      // Scrim and Escape both mean cancel - but not once the call is out, or
      // the screen would move on from a question it had already answered.
      onOpenChange={(next) => {
        if (!next && !busy) onCancel();
      }}
    >
      <DialogContent>
        {/*
          Stacked rather than side by side: the mark is what the dialog leads
          with, and beside a two-line question it sat against neither line.

          The mark and the question centre; the explanation underneath doesn't.
          It runs to two or three lines, and centred prose is read a line at a
          time with the eye hunting for each new start.
        */}
        <div className="flex flex-col gap-3">
          <span
            className={
              danger
                ? "flex justify-center text-destructive"
                : "flex justify-center text-body"
            }
          >
            <Icon name="warning" size="xl" />
          </span>

          <div className="min-w-0">
            <DialogTitle className="text-center">{title}</DialogTitle>

            <DialogDescription className="mt-2">
              {description}
            </DialogDescription>
          </div>
        </div>

        {children}

        {/* Reversed on a phone, so the confirm sits under the thumb and the
            cancel is the one you reach for deliberately. */}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={busy}>
              {cancelLabel}
            </Button>
          </DialogClose>

          <Button
            type="button"
            variant={danger ? "destructive" : "default"}
            disabled={busy}
            onClick={onConfirm}
          >
            {confirmLabel}
            {busy ? (
              <Icon name="pending" className="animate-spin" size="xs" />
            ) : null}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
