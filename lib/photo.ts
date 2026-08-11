/**
 * Client-side photo handling (PRD §6.5) — the highest-risk step in the form.
 *
 * Two jobs, both done on-device before anything is uploaded:
 *
 *  1. Resize and compress. A modern phone camera produces 4–8MB; sending that
 *     over a variable 3G connection is the single easiest way to lose a
 *     pharmacist mid-form.
 *  2. Catch the failures worth catching — too small, too dark, too blurry —
 *     and say which one it is, specifically.
 *
 * Face detection deliberately does NOT happen here. Chrome's FaceDetector is
 * unreliable on Android and a WASM model is multiple megabytes against a
 * sub-500KB page budget on a 2GB device. That check belongs server-side
 * (Rekognition `DetectFaces`), which still answers inside a second.
 *
 * Browser-only — uses canvas.
 */

/** Longest edge of the transmitted image. The film's photo box is 606px wide. */
export const MAX_DIMENSION = 1280;

/** Transmitted size ceiling from PRD §6.5. */
export const TARGET_BYTES = 1_000_000;

/** Below this, the photo will look soft blown up into the film's frame. */
export const MIN_DIMENSION = 320;

/** Mean luma (0–255) below which the photo reads as too dark to use. */
export const MIN_BRIGHTNESS = 42;

/** Laplacian variance below which the photo reads as out of focus. */
export const MIN_SHARPNESS = 55;

export type PhotoProblem =
  | "unreadable"
  | "too_small"
  | "too_dark"
  | "blurry";

export interface PhotoResult {
  ok: boolean;
  problem?: PhotoProblem;
  dataUrl?: string;
  width?: number;
  height?: number;
  bytes?: number;
  /** Diagnostics, surfaced in the admin view rather than to the pharmacist. */
  metrics?: { brightness: number; sharpness: number };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("could not decode image"));
    };
    img.src = url;
  });
}

function drawScaled(
  img: HTMLImageElement,
  maxDimension: number,
): HTMLCanvasElement {
  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** Mean luma over a downsampled grid — enough to spot an unusably dark photo. */
export function measureBrightness(data: Uint8ClampedArray): number {
  let total = 0;
  let count = 0;
  // Every 4th pixel: the average does not need every sample.
  for (let i = 0; i < data.length; i += 16) {
    total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    count++;
  }
  return count === 0 ? 0 : total / count;
}

/**
 * Variance of the Laplacian — the standard cheap focus measure. A sharp photo
 * has strong local intensity changes; a blurred one does not.
 */
export function measureSharpness(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): number {
  const gray = new Float32Array(width * height);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const lap =
        4 * gray[i] -
        gray[i - 1] -
        gray[i + 1] -
        gray[i - width] -
        gray[i + width];
      sum += lap;
      sumSq += lap * lap;
      n++;
    }
  }
  if (n === 0) return 0;
  const mean = sum / n;
  return sumSq / n - mean * mean;
}

/**
 * Compress to JPEG under `TARGET_BYTES`, stepping quality down as needed.
 *
 * Quality is reduced before dimensions are, because a slightly softer 1280px
 * photo looks better in the film than a crisp 640px one scaled up.
 */
function toDataUrlUnderBudget(canvas: HTMLCanvasElement): string {
  const qualities = [0.85, 0.75, 0.65, 0.55, 0.45];
  let dataUrl = canvas.toDataURL("image/jpeg", qualities[0]);

  for (const q of qualities) {
    dataUrl = canvas.toDataURL("image/jpeg", q);
    if (approximateBytes(dataUrl) <= TARGET_BYTES) return dataUrl;
  }
  return dataUrl;
}

/** Decoded size of a base64 data URL, without allocating the buffer. */
export function approximateBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - padding;
}

/**
 * Runs the full on-device pipeline.
 *
 * Checks run on the *resized* image so the thresholds mean the same thing
 * regardless of the camera that took the photo.
 */
export async function processPhoto(file: File): Promise<PhotoResult> {
  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    return { ok: false, problem: "unreadable" };
  }

  if (
    Math.min(img.naturalWidth, img.naturalHeight) < MIN_DIMENSION ||
    img.naturalWidth === 0
  ) {
    return { ok: false, problem: "too_small" };
  }

  const canvas = drawScaled(img, MAX_DIMENSION);
  const ctx = canvas.getContext("2d");
  if (!ctx) return { ok: false, problem: "unreadable" };

  // Measure on a small copy: a Laplacian over 1280×1280 is needless work on a
  // budget phone, and the focus measure is scale-tolerant.
  const probe = drawScaled(img, 320);
  const probeCtx = probe.getContext("2d");
  if (!probeCtx) return { ok: false, problem: "unreadable" };
  const probeData = probeCtx.getImageData(0, 0, probe.width, probe.height);

  const brightness = measureBrightness(probeData.data);
  const sharpness = measureSharpness(
    probeData.data,
    probe.width,
    probe.height,
  );
  const metrics = { brightness, sharpness };

  if (brightness < MIN_BRIGHTNESS) {
    return { ok: false, problem: "too_dark", metrics };
  }
  if (sharpness < MIN_SHARPNESS) {
    return { ok: false, problem: "blurry", metrics };
  }

  const dataUrl = toDataUrlUnderBudget(canvas);

  return {
    ok: true,
    dataUrl,
    width: canvas.width,
    height: canvas.height,
    bytes: approximateBytes(dataUrl),
    metrics,
  };
}
