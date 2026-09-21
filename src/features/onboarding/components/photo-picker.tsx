"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import {
  startTransition,
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { createPhotoSchema, photoAccept } from "@/features/onboarding/schemas";
import { initialPhotoState } from "@/features/onboarding/services/state";
import { uploadPhotoAction } from "@/features/onboarding/services/upload-photo";

export function PhotoPicker() {
  const t = useTranslations("onboarding");
  const tValidation = useTranslations("validation");
  const locale = useLocale();

  const schema = useMemo(() => createPhotoSchema(tValidation), [tValidation]);

  const [preview, setPreview] = useState<string | null>(null);
  /** Kept so a failed upload can go again without finding the file twice. */
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  /*
   * The action redirects home when the upload lands, so this state only ever
   * ends up holding a failure. `isPending` stays true across that redirect,
   * which is what keeps the spinner up until the next page takes over.
   */
  const [state, upload, isPending] = useActionState(
    uploadPhotoAction,
    initialPhotoState,
  );

  /*
   * Two inputs, because the two buttons want different things. `capture="user"`
   * sends a phone straight to its front camera, which is wrong for "find a
   * photo I already have". Desktop browsers ignore `capture` and open the
   * dialog either way.
   */
  const cameraInput = useRef<HTMLInputElement>(null);
  const libraryInput = useRef<HTMLInputElement>(null);

  // Object URLs stay alive until revoked. Drop the previous one as soon as it's
  // replaced, and the last one when the screen goes.
  const objectUrl = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    },
    [],
  );

  function send(photo: File) {
    startTransition(() => upload({ photo, locale }));
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];

    // Reset the input, or picking the same file twice won't fire a change.
    event.target.value = "";
    if (!picked) return;

    const result = schema.safeParse(picked);

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? null);
      return;
    }

    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = URL.createObjectURL(result.data);

    setPreview(objectUrl.current);
    setFile(result.data);
    setError(null);

    /*
     * Sent straight away, no confirm step. There is nothing to decide between
     * choosing a picture and keeping it: the preview appears with the upload
     * already running under it, and a member who dislikes what they see picks
     * again, which replaces it.
     */
    send(result.data);
  }

  /** Ours when the file never left, the action's when the API turned it down. */
  const message = error ?? (isPending ? null : state.error);

  return (
    <div className="flex flex-col items-center">
      <input
        ref={cameraInput}
        type="file"
        accept={photoAccept}
        capture="user"
        onChange={handleFile}
        className="hidden"
      />
      <input
        ref={libraryInput}
        type="file"
        accept={photoAccept}
        onChange={handleFile}
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
        {isPending ? (
          <span
            role="status"
            aria-label={t("photo.uploading")}
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
          disabled={isPending}
          aria-label={t("photo.change")}
          className="absolute right-0 bottom-1 flex size-[clamp(1.75rem,4.5vh,2.25rem)] items-center justify-center rounded-full border-2 border-surface bg-ink text-on-ink transition-colors hover:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60"
        >
          <Icon name="camera" size="sm" />
        </button>
      </div>

      <p className="mt-[clamp(0.5rem,1.75vh,1rem)] text-[12px] text-subtle sm:text-[13px]">
        {isPending ? t("photo.uploading") : t("photo.formats")}
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
          <Button type="button" size="form" onClick={() => send(file)}>
            <Icon name="retry" />
            {t("photo.retry")}
          </Button>
        ) : null}

        <Button
          type="button"
          size="form"
          disabled={isPending}
          onClick={() => cameraInput.current?.click()}
        >
          <Icon name="camera" />
          {t("photo.takePhoto")}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="form"
          disabled={isPending}
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
    </div>
  );
}
