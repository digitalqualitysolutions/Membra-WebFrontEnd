/**
 * Making an iPhone picture something a canvas can read.
 *
 * HEIC is Apple's default, and no browser but Safari will decode one - which
 * means `<img>` won't paint it and the cropper has nothing to show. Converting
 * it here is what lets a member frame their own photo instead of being handed
 * whatever square the server picked.
 *
 * `heic2any` is loaded on demand, never at startup: it carries a whole
 * JPEG/HEIF decoder and is about 1.3 MB, which is not something every visitor
 * to the login page should pay for. The import only runs for someone who has
 * actually chosen a HEIC.
 */

/** What the browser calls a HEIC, when it manages to call it anything. */
const heicTypes = ["image/heic", "image/heif"];

/**
 * Whether this needs converting before anything can draw it.
 *
 * Extension as well as type, deliberately: a browser that has never heard of
 * HEIC reports an empty `type` for one, which is exactly the case that matters
 * here. The same fallback `isAcceptedPhoto` makes, for the same reason.
 */
export function isHeic(file: File): boolean {
  return file.type
    ? heicTypes.includes(file.type.toLowerCase())
    : /\.hei[cf]$/i.test(file.name);
}

/** `holiday.HEIC` → `holiday.jpg`. */
function jpegName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "") || "photo";

  return `${base}.jpg`;
}

/**
 * The same picture as a JPEG, or the original if it was never a HEIC.
 *
 * JPEG rather than PNG because a photo is what this always is - a lossless
 * re-encode of a 12MP camera picture would be tens of megabytes, and it's
 * about to be cropped and re-encoded to WebP anyway.
 *
 * @throws when the decoder can't read the file. The caller is expected to fall
 *   back to uploading the original: the API accepts HEIC perfectly well, so a
 *   failure here costs the crop, not the picture.
 */
export async function toCroppable(file: File): Promise<File> {
  if (!isHeic(file)) return file;

  const { default: heic2any } = await import("heic2any");

  const converted = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.94,
  });

  /*
   * A multi-image HEIC - a burst, or a Live Photo - comes back as an array.
   * The first frame is the one the phone shows as the picture, so it's the one
   * anybody choosing this file meant.
   */
  const blob = Array.isArray(converted) ? converted[0] : converted;

  if (!blob) throw new Error("the converter returned no image");

  return new File([blob], jpegName(file.name), { type: "image/jpeg" });
}
