"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";

import { cropToFile, type CropArea } from "@/features/onboarding/crop-image";
import { isHeic, toCroppable } from "@/features/onboarding/heic";
import { createPhotoSchema } from "@/features/onboarding/schemas";

/**
 * Picking a member picture: validate it, let them frame it, upload it.
 *
 * One hook because the onboarding step and the profile editor were the same
 * forty lines twice over - the same state, the same object-URL bookkeeping,
 * the same comments. They still look nothing alike, and shouldn't; what they
 * share is everything between the file input firing and the action being
 * called, which is all that's here.
 *
 * The crop dialog is the confirm step. Before it there wasn't one, on the
 * reasoning that there's nothing to decide between choosing a picture and
 * keeping it - which stopped being true the moment the member could change
 * what the picture *is*.
 */
export function usePhotoPicker({
  onReady,
}: {
  /** Called with the picture to upload, once it's been framed. */
  onReady: (photo: File) => void;
}) {
  const t = useTranslations("validation");
  const schema = createPhotoSchema(t);

  const [preview, setPreview] = useState<string | null>(null);
  /** Kept so a failed upload can go again without finding the file twice. */
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * The picture waiting to be framed, while the crop dialog is open.
   *
   * It carries its own `File` rather than parking it in `file`, which stays
   * the picture that was actually *sent*. Otherwise picking a second photo and
   * then cancelling the crop would leave Retry pointing at something the
   * member never confirmed and the API never saw.
   */
  const [pending, setPending] = useState<{ source: string; file: File } | null>(
    null,
  );

  /** A HEIC is being turned into something the cropper can draw. */
  const [converting, setConverting] = useState(false);

  /*
   * Object URLs stay alive until revoked, and two are in play: the one the
   * crop dialog is reading from, and the one the preview shows afterwards.
   * They're tracked apart because the first is dropped the moment the dialog
   * closes and the second has to outlive it.
   */
  const previewUrl = useRef<string | null>(null);
  const sourceUrl = useRef<string | null>(null);

  const dropSource = useCallback(() => {
    if (sourceUrl.current) URL.revokeObjectURL(sourceUrl.current);
    sourceUrl.current = null;
  }, []);

  useEffect(
    () => () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
      if (sourceUrl.current) URL.revokeObjectURL(sourceUrl.current);
    },
    [],
  );

  /** Show it, keep it, send it. The end of every path through this hook. */
  const accept = useCallback(
    (photo: File) => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = URL.createObjectURL(photo);

      setPreview(previewUrl.current);
      setFile(photo);
      setError(null);
      onReady(photo);
    },
    [onReady],
  );

  async function pick(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];

    // Reset the input, or picking the same file twice won't fire a change.
    event.target.value = "";
    if (!picked) return;

    const result = schema.safeParse(picked);

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? null);
      return;
    }

    setError(null);

    /*
     * A HEIC has to become a JPEG before anything can draw it, and on a big
     * phone picture that takes a second or two. `converting` is what the
     * picker shows meanwhile - without it the screen sits still after a tap,
     * which reads as nothing having happened.
     */
    let source = result.data;

    if (isHeic(source)) {
      setConverting(true);

      try {
        source = await toCroppable(source);
      } catch {
        // The API takes HEIC as it is, so a decoder that gave up costs the
        // crop, not the picture.
        setConverting(false);
        accept(result.data);
        return;
      }

      setConverting(false);
    }

    dropSource();
    sourceUrl.current = URL.createObjectURL(source);

    setPending({ source: sourceUrl.current, file: source });
  }

  async function confirmCrop(area: CropArea, rotation: number) {
    const current = pending;
    setPending(null);

    if (!current) return;

    try {
      accept(
        await cropToFile(current.source, area, rotation, current.file.name),
      );
    } catch {
      /*
       * Canvas couldn't read it - HEIC is the realistic case, since no browser
       * but Safari has a decoder for it. The picture itself is fine and the
       * API takes it, so it goes up as it came in: uncropped beats refused.
       */
      accept(current.file);
    } finally {
      dropSource();
    }
  }

  /** Backing out of the crop changes nothing: no upload, no new preview. */
  function cancelCrop() {
    setPending(null);
    dropSource();
  }

  return {
    /** Object URL of the picture as it will be uploaded, once framed. */
    preview,
    /** The framed picture, for a retry after a failed upload. */
    file,
    /** Why the file was turned down here, before it ever left. */
    error,
    /** Set while the member is framing; render the crop dialog off this. */
    pending,
    /** True while a HEIC is being decoded, which is slow enough to say so. */
    converting,
    /** Hand this to every `<input type="file">`. */
    pick,
    confirmCrop,
    cancelCrop,
    retry: () => file && onReady(file),
  };
}
