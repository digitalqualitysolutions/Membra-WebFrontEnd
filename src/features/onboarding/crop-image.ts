import type { Area } from "react-easy-crop";

/**
 * Cutting the chosen square out of a picture, in the browser.
 *
 * The API renders its own 384/96/32 AVIF variants from whatever it's sent, and
 * it cover-crops to a square to do it. So this isn't about resizing - it's
 * about deciding *which* square survives that, instead of leaving it to a
 * centre crop that puts half of someone's head outside the circle.
 *
 * Ported from react-easy-crop's own `cropImage` example, with two deliberate
 * departures noted at `cropToFile` and `toWebp`.
 */

/** What the dialog hands back: the crop box, in the source image's own pixels. */
export type CropArea = Area;

/** Quality of the re-encode. High enough that the server's AVIF pass has room. */
const WEBP_QUALITY = 0.92;

/**
 * The longest edge we'll write, in pixels.
 *
 * Two reasons, and the first is not an optimisation. The crop box is measured
 * in the source picture's own pixels, so zooming out multiplies it: a 4000px
 * photo at the minimum zoom asks for a canvas around 10000px square, which is
 * 400 MB and past what Safari will allocate at all - the crop would simply
 * fail. Clamping means the zoom control can't ask for a canvas that doesn't
 * exist.
 *
 * The second is that the API renders 384px at most, so anything above this is
 * upload time nobody gets anything for. 1024 leaves room for a retina variant
 * later without having to revisit this.
 */
const MAX_EDGE = 1024;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () =>
      reject(new Error("the browser could not decode this picture")),
    );

    // No `crossOrigin`: the only thing ever loaded here is a blob URL this tab
    // made itself, and setting it would break that on some browsers.
    image.src = src;
  });
}

const radians = (degrees: number) => (degrees * Math.PI) / 180;

/** How much room a rotated image needs - its bounding box, not its own size. */
function rotatedSize(width: number, height: number, rotation: number) {
  const angle = radians(rotation);

  return {
    width: Math.abs(Math.cos(angle) * width) + Math.abs(Math.sin(angle) * height),
    height: Math.abs(Math.sin(angle) * width) + Math.abs(Math.cos(angle) * height),
  };
}

/**
 * The picture as WebP.
 *
 * Not the source format, and not PNG: WebP is already in the accepted list,
 * keeps transparency - which club logos have and a JPEG would fill in black -
 * and is a fraction of a PNG's size. The server re-encodes to AVIF either way,
 * so this only has to survive one upload.
 */
function toWebp(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("the browser produced no image data")),
      "image/webp",
      WEBP_QUALITY,
    );
  });
}

/** `holiday.HEIC` → `holiday.webp`. The multipart filename comes from this. */
function webpName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "") || "avatar";

  return `${base}.webp`;
}

/**
 * The cropped square, as a `File`.
 *
 * A `File` rather than the object URL the upstream example returns, because
 * every action this feeds re-validates with `z.instanceof(File)` - a `Blob`
 * fails that - and because the multipart filename is read off `file.name`.
 *
 * Two canvases, as upstream: the first holds the whole image rotated inside a
 * box big enough for it, the second lifts the crop box out of that. Rotating
 * and cropping in one pass means working out where the box landed after the
 * rotation, which is the same arithmetic done less legibly.
 *
 * @throws when the browser can't decode the source. HEIC is the realistic case
 *   - canvas has no decoder for it outside Safari - and the caller is expected
 *   to fall back to uploading the original rather than refusing the picture.
 */
export async function cropToFile(
  source: string,
  crop: CropArea,
  rotation: number,
  name: string,
): Promise<File> {
  const image = await loadImage(source);

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) throw new Error("this browser has no 2d canvas");

  const box = rotatedSize(image.width, image.height, rotation);

  canvas.width = box.width;
  canvas.height = box.height;

  // Spin about the middle of the box, then draw the image centred on it.
  context.translate(box.width / 2, box.height / 2);
  context.rotate(radians(rotation));
  context.translate(-image.width / 2, -image.height / 2);
  context.drawImage(image, 0, 0);

  const cropped = document.createElement("canvas");
  const croppedContext = cropped.getContext("2d");

  if (!croppedContext) throw new Error("this browser has no 2d canvas");

  const scale = Math.min(1, MAX_EDGE / Math.max(crop.width, crop.height));

  cropped.width = Math.max(1, Math.round(crop.width * scale));
  cropped.height = Math.max(1, Math.round(crop.height * scale));

  /*
   * The crop box can reach past the edges of the picture - that's what zooming
   * out is for. `drawImage` clips a source rectangle that falls outside to the
   * image and clips the destination in the same proportion, so the picture
   * lands where it should with nothing drawn around it. Nothing drawn means
   * transparent, and WebP keeps that, so "keep the whole picture" comes back
   * as the picture on a clear ground rather than on a black square.
   */
  croppedContext.drawImage(
    canvas,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    cropped.width,
    cropped.height,
  );

  const blob = await toWebp(cropped);

  return new File([blob], webpName(name), { type: "image/webp" });
}
