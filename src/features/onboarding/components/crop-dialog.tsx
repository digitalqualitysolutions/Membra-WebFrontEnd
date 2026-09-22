"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import Cropper from "react-easy-crop";

import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import type { CropArea } from "@/features/onboarding/crop-image";

/** How far in the member may push it. Past 3x an 8MP photo is mush anyway. */
const MAX_ZOOM = 3;

/**
 * How far out you can go: exactly far enough to see all of the picture.
 *
 * At zoom 1 the picture fills the frame, so a tall photo can never have its
 * top and bottom inside at once - the only choice on offer is which part to
 * lose. Zooming out fixes that, but only to a point: past the zoom where the
 * whole picture sits inside the frame, there is nothing further to reveal and
 * the picture just becomes a stamp in a field of empty.
 *
 * That point is the ratio of the picture's short side to its long one, since
 * the frame is the largest square the picture will hold. A square picture
 * gives 1 - it already fits, and there is nothing to zoom out to.
 */
const fitZoom = (media: { width: number; height: number }) =>
  Math.min(media.width, media.height) / Math.max(media.width, media.height);

/**
 * Everything the dialog says.
 *
 * Passed in rather than read here, because the club picker is built the same
 * way - it does its own translating nowhere - and a dialog that reached for
 * `onboarding.photo` itself couldn't be reworded for a logo.
 */
export type CropLabels = {
  title: string;
  description: string;
  zoom: string;
  zoomOut: string;
  zoomIn: string;
  rotateLeft: string;
  rotateRight: string;
  reset: string;
  /** On the picker's own button, while a HEIC is being decoded. */
  preparing: string;
  cancel: string;
  confirm: string;
};

/**
 * The standard wording, for the four pickers that want it.
 *
 * Out of `onboarding.photo` even for the club logo, the same way the profile
 * editor borrows the rest of its copy from there: it's one vocabulary for one
 * picture, and "zoom until the circle holds what you want" is as true of a
 * crest as of a face.
 */
export function usePhotoCropLabels(): CropLabels {
  const t = useTranslations("onboarding.photo");

  return {
    title: t("cropTitle"),
    description: t("cropDescription"),
    zoom: t("zoom"),
    zoomOut: t("zoomOut"),
    zoomIn: t("zoomIn"),
    rotateLeft: t("rotateLeft"),
    rotateRight: t("rotateRight"),
    reset: t("cropReset"),
    preparing: t("preparing"),
    cancel: t("cropCancel"),
    confirm: t("cropConfirm"),
  };
}

/**
 * Choosing which part of a picture becomes the avatar.
 *
 * A round frame on a 1:1 box, because that's the truth of what happens to it:
 * the API cuts a square and every screen draws it in a circle. Any other shape
 * would promise framing the member isn't going to get.
 *
 * Owns the crop, zoom and rotation, and hands back only the result - the
 * picker behind it has no use for a half-finished gesture, and clearing this
 * state on close is one less thing for it to remember.
 */
export function CropDialog({
  /** Object URL of the picture being cropped. */
  source,
  labels,
  onCancel,
  onConfirm,
}: {
  source: string;
  labels: CropLabels;
  onCancel: () => void;
  onConfirm: (crop: CropArea, rotation: number) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  /** Set once the picture has loaded and its shape is known. 1 until then. */
  const [minZoom, setMinZoom] = useState(1);

  /** The last box the member settled on, in the source picture's own pixels. */
  const [area, setArea] = useState<CropArea | null>(null);

  /** Whether anything has been moved, which is when Reset earns its place. */
  const touched = zoom !== 1 || rotation !== 0 || crop.x !== 0 || crop.y !== 0;

  function reset() {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  }

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        // Escape and the scrim both land here. Nothing to save, so they mean
        // the same thing Cancel does.
        if (!next) onCancel();
      }}
    >
      {/* Wider than the default dialog, and the padding is put back on each
          row rather than on the whole thing: the picture is the content, so
          it gets the room. */}
      <DialogContent className="max-w-lg gap-0 p-0">
        <div className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription className="mt-1">
            {labels.description}
          </DialogDescription>
        </div>

        {/* `Cropper` is `position: absolute` and fills its parent, so the
            parent has to be positioned and have a size of its own. Ink, like
            every avatar circle on the site, so the picture sits on the colour
            it will sit on afterwards - and rounded, so the stage matches the
            card it's in rather than cutting a hard-edged block through it. */}
        <div className="mx-5 overflow-hidden rounded-xl border border-line bg-ink sm:mx-6">
          <div className="relative aspect-square w-full">
            <Cropper
              image={source}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              // Round, because every screen draws this picture in a circle -
              // the frame should show the member the shape they're actually
              // going to get. Zooming out is what answers the thing a circle
              // used to make impossible: keeping all of a picture that isn't
              // square.
              cropShape="round"
              showGrid={false}
              minZoom={minZoom}
              maxZoom={MAX_ZOOM}
              // The picture's shape decides how far out is worth going, so it
              // can't be known until the picture is here.
              onMediaLoaded={(media) => setMinZoom(fitZoom(media))}
              restrictPosition={true}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_area, pixels) => setArea(pixels)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 px-5 py-4 sm:px-6">
          {/* Zoom gets its own row and the full width: it's the control that
              actually gets used, and a slider squeezed beside four buttons is
              a slider nobody can land on. */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={labels.zoomOut}
              disabled={zoom <= minZoom}
              onClick={() => setZoom((value) => Math.max(minZoom, value - 0.1))}
              className="shrink-0 text-ink-muted transition-colors outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-40 disabled:hover:text-ink-muted"
            >
              <Icon name="zoomOut" size="xs" />
            </button>

            <Slider
              value={zoom}
              onChange={setZoom}
              label={labels.zoom}
              min={minZoom}
              max={MAX_ZOOM}
              step={0.01}
            />

            <button
              type="button"
              aria-label={labels.zoomIn}
              disabled={zoom >= MAX_ZOOM}
              onClick={() =>
                setZoom((value) => Math.min(MAX_ZOOM, value + 0.1))
              }
              className="shrink-0 text-ink-muted transition-colors outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-40 disabled:hover:text-ink-muted"
            >
              <Icon name="zoomIn" size="xs" />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* Quarter turns only. A phone photo arrives sideways or it
                  doesn't; a free angle is a way to get it slightly wrong. */}
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label={labels.rotateLeft}
                onClick={() => setRotation((value) => (value + 270) % 360)}
              >
                <Icon name="rotateLeft" size="xs" />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label={labels.rotateRight}
                onClick={() => setRotation((value) => (value + 90) % 360)}
              >
                <Icon name="rotateRight" size="xs" />
              </Button>

              {/* Only once there's something to undo. A member who hasn't
                  touched anything doesn't need a way back to where they are. */}
              {touched ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                  className="text-ink-muted"
                >
                  {labels.reset}
                </Button>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                {labels.cancel}
              </Button>

              <Button
                type="button"
                // Nothing to cut until the cropper has reported a box, which it
                // does on mount - so this is only ever off for a frame.
                disabled={!area}
                onClick={() => area && onConfirm(area, rotation)}
              >
                <Icon name="checked" size="xs" />
                {labels.confirm}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
