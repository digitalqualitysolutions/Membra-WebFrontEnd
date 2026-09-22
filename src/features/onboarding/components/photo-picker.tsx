"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { startTransition, useActionState, useCallback, useRef } from "react";

import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  CropDialog,
  usePhotoCropLabels,
} from "@/features/onboarding/components/crop-dialog";
import { photoAccept } from "@/features/onboarding/schemas";
import { initialPhotoState } from "@/features/onboarding/services/state";
import { uploadPhotoAction } from "@/features/onboarding/services/upload-photo";
import { usePhotoPicker } from "@/features/onboarding/use-photo-picker";

export function PhotoPicker() {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const cropLabels = usePhotoCropLabels();

  /*
   * The action redirects home when the upload lands, so this state only ever
   * ends up holding a failure. `isPending` stays true across that redirect,
   * which is what keeps the spinner up until the next page takes over.
   */
  const [state, upload, isPending] = useActionState(
    uploadPhotoAction,
    initialPhotoState,
  );

  // Stable, because the hook holds it in a callback of its own.
  const send = useCallback(
    (photo: File) => startTransition(() => upload({ photo, locale })),
    [upload, locale],
  );

  const picker = usePhotoPicker({ onReady: send });
  const { preview, file, error } = picker;

  /*
   * Two inputs, because the two buttons want different things. `capture="user"`
   * sends a phone straight to its front camera, which is wrong for "find a
   * photo I already have". Desktop browsers ignore `capture` and open the
   * dialog either way.
   */
  const cameraInput = useRef<HTMLInputElement>(null);
  const libraryInput = useRef<HTMLInputElement>(null);

  /** Ours when the file never left, the action's when the API turned it down. */
  const message = error ?? (isPending ? null : state.error);

  return (
    <div className="flex flex-col items-center">
      <input
        ref={cameraInput}
        type="file"
        accept={photoAccept}
        capture="user"
        onChange={picker.pick}
        className="hidden"
      />
      <input
        ref={libraryInput}
        type="file"
        accept={photoAccept}
        onChange={picker.pick}
        className="hidden"
      />

      <div className="relative">
        <span className="flex size-[clamp(5.5rem,17vh,8.5rem)] items-center justify-center overflow-hidden rounded-full bg-ink text-on-ink">
          {preview ? (
            /*
             * Plain `img` on purpose. A blob URL only exists in this tab, so
             * the image optimizer can't do anything with it.
             */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt={t("photo.preview")}
              className="size-full object-cover"
            />
          ) : (
            <Icon
              name="avatarPlaceholder"
              className="size-[clamp(2.25rem,7vh,3.5rem)]"
            />
          )}
        </span>

        {/*
          * Over the picture rather than beside it. The picture is what's being
          * waited on, and this way the card doesn't move while it waits.
          */}
        {isPending || picker.converting ? (
          <span
            role="status"
            aria-label={
              picker.converting ? t("photo.preparing") : t("photo.uploading")
            }
            className="absolute inset-0 flex items-center justify-center rounded-full bg-ink/65 text-on-ink"
          >
            <Icon
              name="pending"
              className="size-[clamp(1.5rem,4.5vh,2rem)] animate-spin"
            />
          </span>
        ) : null}

        <button
          type="button"
          onClick={() => libraryInput.current?.click()}
          disabled={isPending || picker.converting}
          aria-label={t("photo.change")}
          className="absolute right-0 bottom-1 flex size-[clamp(1.75rem,4.5vh,2.25rem)] items-center justify-center rounded-full border-2 border-surface bg-ink text-on-ink transition-colors hover:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60"
        >
          <Icon name="camera" size="sm" />
        </button>
      </div>

      <p className="mt-[clamp(0.5rem,1.75vh,1rem)] text-[12px] text-subtle sm:text-[13px]">
        {picker.converting
          ? t("photo.preparing")
          : isPending
            ? t("photo.uploading")
            : t("photo.formats")}
      </p>

      {message ? (
        // Announced, since nothing else on screen moves when a file is rejected.
        <p role="alert" className="mt-1.5 text-[12px] text-danger">
          {message}
        </p>
      ) : null}

      <div className="mt-[clamp(0.75rem,2.5vh,1.75rem)] w-full space-y-[clamp(0.375rem,1.25vh,0.75rem)]">
        {/*
          * A failure after the file passed our own checks is usually the
          * network's doing, so offer the same file again rather than making
          * them go and find it a second time.
          */}
        {file && state.error && !error && !isPending ? (
          <Button type="button" size="form" onClick={picker.retry}>
            <Icon name="retry" />
            {t("photo.retry")}
          </Button>
        ) : null}

        <Button
          type="button"
          size="form"
          disabled={isPending || picker.converting}
          onClick={() => cameraInput.current?.click()}
        >
          <Icon name="camera" />
          {t("photo.takePhoto")}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="form"
          disabled={isPending || picker.converting}
          onClick={() => libraryInput.current?.click()}
        >
          <Icon name="photoLibrary" />
          {t("photo.findPhoto")}
        </Button>
      </div>

      {/*
        * Skipping finishes onboarding too: the picture is the last thing asked
        * for, and it's optional.
        */}
      <Button
        asChild
        variant="ghost"
        className="mt-[clamp(0.5rem,1.75vh,1.25rem)] h-9 px-3 text-[13px] font-medium text-ink-muted hover:text-foreground sm:text-[14px] aria-disabled:pointer-events-none aria-disabled:opacity-60"
      >
        <Link
          href={`/${locale}`}
          /*
           * A link has no `disabled`, and leaving mid-upload would strand a
           * picture the member already chose, so it's taken out of reach by
           * hand until the upload settles.
           */
          aria-disabled={isPending || undefined}
          tabIndex={isPending ? -1 : undefined}
        >
          {t("skip")}
        </Link>
      </Button>

      {picker.pending ? (
        <CropDialog
          source={picker.pending.source}
          labels={cropLabels}
          onCancel={picker.cancelCrop}
          onConfirm={picker.confirmCrop}
        />
      ) : null}
    </div>
  );
}
