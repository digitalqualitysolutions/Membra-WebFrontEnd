"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  startTransition,
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type RefObject,
} from "react";

import { Icon } from "@/components/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SessionUser } from "@/features/auth/api/auth-wire";
import { MemberAvatar } from "@/features/auth/components/member-avatar";
import { createPhotoSchema, photoAccept } from "@/features/onboarding/schemas";
import { initialPhotoState } from "@/features/onboarding/services/state";
import { updateAvatarAction } from "@/features/profile/services/update-avatar";

/**
 * The member's picture at the top of their profile, with a way to replace it.
 *
 * Display and edit in one control, because they're the same circle: the button
 * sits on the picture rather than beside it, so nothing on the card moves
 * between looking and changing.
 *
 * `MemberAvatar` does the showing - initials underneath, picture on top, and
 * the fallback when a signed URL won't load. This adds the file, the upload and
 * what to say while it's in flight. Wording comes from the onboarding photo
 * step, the same way the form below reuses onboarding's fields: one vocabulary
 * for one picture.
 */
export function AvatarEditor({
  user,
  photoUrl = null,
  savedLabel,
}: {
  user: SessionUser;
  /** The stored picture, from `memberAvatars()`. Null until they add one. */
  photoUrl?: string | null;
  /** Shown once the upload lands, in the profile page's own wording. */
  savedLabel: string;
}) {
  const t = useTranslations("onboarding");
  const tValidation = useTranslations("validation");
  const locale = useLocale();

  const schema = useMemo(() => createPhotoSchema(tValidation), [tValidation]);

  /** The file they just picked, shown straight away rather than after a round trip. */
  const [preview, setPreview] = useState<string | null>(null);
  /** Kept so a failed upload can go again without finding the file twice. */
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [state, upload, isPending] = useActionState(
    updateAvatarAction,
    initialPhotoState,
  );

  /*
   * Two inputs, because the two answers want different things. `capture="user"`
   * sends a phone straight to its front camera, which is wrong for "find a
   * picture I already have". Desktop browsers ignore `capture` and open the
   * file dialog either way, which is why the menu still reads sensibly there.
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

  /*
   * Deferred by a tick, on purpose. Choosing an item closes the menu, and Radix
   * moves focus back to the trigger on the way out; opening the file dialog in
   * the middle of that races the teardown and can end with no dialog at all.
   * A timeout puts the click after the close and still well inside the window
   * where the browser counts it as coming from the member's own gesture.
   */
  function openPicker(input: RefObject<HTMLInputElement | null>) {
    setTimeout(() => input.current?.click(), 0);
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

    // Sent straight away, no confirm step - same as onboarding. There's nothing
    // to decide between choosing a picture and keeping it, and a member who
    // dislikes what they see picks again, which replaces it.
    send(result.data);
  }

  /*
   * The picked file wins over the stored URL, and keeps winning after the save.
   * The action revalidates, so a fresh URL for this very picture arrives on the
   * next render; swapping to it would reload the same image and blink for no
   * reason.
   */
  const shownUrl = preview ?? photoUrl;

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
        <MemberAvatar
          user={user}
          photoUrl={shownUrl}
          // The ring the card's icon medallion used to wear, moved onto the
          // picture that replaced it: it keeps the circle reading as a framed
          // subject rather than a photo floating loose above the title.
          className="size-[clamp(3.25rem,8.5vh,4.5rem)] border border-line text-[15px]"
        />

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
            <Icon name="pending" className="size-5 animate-spin" />
          </span>
        ) : null}

        {/*
          * Asks first, rather than guessing. Onboarding has room for two
          * buttons under the circle; here the camera is a 22px badge on the
          * picture, so the same two choices open from it instead.
          */}
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={isPending}
            aria-label={t("photo.change")}
            className="absolute right-0 bottom-0 flex size-[clamp(1.375rem,3.5vh,1.625rem)] items-center justify-center rounded-full border-2 border-surface bg-ink text-on-ink transition-colors outline-none hover:bg-ink-soft focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-60"
          >
            {/* A step down from the picker's: this button is smaller, and a 16px
                glyph inside a 22px circle with a 2px ring reads as crammed. */}
            <Icon name="camera" size="xs" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="center">
            <DropdownMenuItem onSelect={() => openPicker(cameraInput)}>
              <Icon name="camera" />
              {t("photo.takePhoto")}
            </DropdownMenuItem>

            <DropdownMenuItem onSelect={() => openPicker(libraryInput)}>
              <Icon name="photoLibrary" />
              {t("photo.findPhoto")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/*
        * Only when there's something to report. The formats and the size limit
        * aren't news to someone who already has a picture - the file dialog
        * filters by them anyway, and the schema says so if a file misses.
        * Nothing here in the resting state keeps the title right under the
        * picture, where the card wants it.
        */}
      {message ? (
        // Announced, since nothing else on the card moves when a file is
        // rejected - the old picture is simply still there.
        <p role="alert" className="mt-2 text-center text-[12px] text-danger">
          {message}
        </p>
      ) : isPending || state.saved ? (
        <p className="mt-2 text-center text-[12px] text-subtle">
          {isPending ? t("photo.uploading") : savedLabel}
        </p>
      ) : null}

      {/*
        * A failure after the file passed our own checks is usually the
        * network's doing, so offer the same file again rather than making them
        * go and find it a second time.
        */}
      {file && state.error && !error && !isPending ? (
        <button
          type="button"
          onClick={() => send(file)}
          className="mt-1.5 inline-flex items-center gap-1.5 text-[12px] font-medium text-ink underline underline-offset-2 hover:text-ink-soft"
        >
          <Icon name="retry" size="sm" />
          {t("photo.retry")}
        </button>
      ) : null}
    </div>
  );
}
