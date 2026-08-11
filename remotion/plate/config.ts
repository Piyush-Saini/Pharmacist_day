/**
 * Geometry and timing of the reference plate video.
 *
 * The supplied film (public/plate/wrapped-plate.mp4) is 1920×1080, 30fps, 600
 * frames, with audio, and has one pharmacist's sample data burned into the
 * pixels. This file records where each burned-in element sits so the overlay
 * layer can cover it and redraw the real pharmacist's data on top.
 *
 * Coordinates were measured off the actual frames (scripts/measure-plate.mjs),
 * not eyeballed. Values marked ESTIMATED were read off downscaled frames and
 * are within roughly ±15px; the panels that cover them are padded accordingly.
 *
 * If the creative team can export a version of this film WITHOUT the sample
 * data burned in ("clean plates"), every `cover` box below becomes unnecessary
 * and the same overlay positions produce a cleaner result. See README.
 */

export const PLATE = {
  src: "plate/wrapped-plate.mp4",
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 600,
} as const;

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Scene ranges in frames, inset slightly so overlays never bleed over a cut. */
export interface Scene {
  id: string;
  from: number;
  durationInFrames: number;
}

export const SCENES: Record<string, Scene> = {
  title: { id: "title", from: 4, durationInFrames: 60 },
  tenure: { id: "tenure", from: 72, durationInFrames: 48 },
  hours: { id: "hours", from: 129, durationInFrames: 54 },
  people: { id: "people", from: 195, durationInFrames: 48 },
  stadium: { id: "stadium", from: 252, durationInFrames: 57 },
  minutes: { id: "minutes", from: 318, durationInFrames: 36 },
  steps: { id: "steps", from: 363, durationInFrames: 60 },
  knownFor: { id: "knownFor", from: 435, durationInFrames: 36 },
  summary: { id: "summary", from: 480, durationInFrames: 45 },
  certificate: { id: "certificate", from: 534, durationInFrames: 66 },
};

/**
 * Title card (MEASURED).
 *
 * The cyan photo frame is a rounded square centred at x=959. The three text
 * lines are all centred on the same axis.
 */
export const TITLE = {
  /** Outer edge of the cyan glow stroke. */
  frame: { x: 645, y: 127, width: 628, height: 611 } as Box,
  /** Stroke is ~11px, so the photo sits inside this. */
  photo: { x: 656, y: 138, width: 606, height: 589 } as Box,
  /** "PHARMACIST WRAPPED 2026" — white, caps. */
  kicker: { x: 558, y: 785, width: 798, height: 46 } as Box,
  /** "RAHUL SHARMA" — rgb(87,198,228). */
  name: { x: 761, y: 872, width: 392, height: 40 } as Box,
  /** "Sharma Medical Store • Jaipur, Rajasthan" — white, smaller. */
  meta: { x: 618, y: 943, width: 677, height: 29 } as Box,
  centreX: 959,
  nameColor: "#57C6E4",
} as const;

/**
 * Left-hand stat column, scene 2 (MEASURED at t=3.5s).
 * Burned text spans roughly x 165–640, y 180–910.
 */
export const TENURE = {
  cover: { x: 0, y: 120, width: 800, height: 860 } as Box,
  panel: { x: 96, y: 168, width: 580, height: 752 } as Box,
} as const;

/**
 * Neon hours block, scene 3 (MEASURED at t=5.5s).
 * Cyan number y 550–820 x 90–820; white footnote below to y ~930.
 */
export const HOURS = {
  cover: { x: 0, y: 490, width: 940, height: 490 } as Box,
  panel: { x: 60, y: 528, width: 810, height: 400 } as Box,
} as const;

/** Two pills, scene 4 (MEASURED at t=7.0s) — these matched first time. */
export const PEOPLE = {
  left: { x: 120, y: 420, width: 500, height: 220 } as Box,
  right: { x: 1100, y: 420, width: 680, height: 220 } as Box,
} as const;

/**
 * Centred three-line stadium block, scene 5 (MEASURED at t=9.8s).
 * Lines at y 454–487, 519–584, 637–703; x 522–1407.
 */
export const STADIUM = {
  cover: { x: 420, y: 410, width: 1080, height: 330 } as Box,
} as const;

/** Stopwatch pill, scene 6 (MEASURED at t=11.0s) — pill y 405–640, x 355–1030. */
export const MINUTES = {
  cover: { x: 300, y: 385, width: 780, height: 275 } as Box,
} as const;

/**
 * Steps + distance, scene 7 (MEASURED at t=13.5s).
 * "22 MILLION+ STEPS" y 329–443 x 178–1458; "16,000+ KM" y 513–647 x 193–1223.
 */
export const STEPS = {
  cover: { x: 100, y: 300, width: 1450, height: 390 } as Box,
} as const;

/**
 * "We couldn't calculate TRUST" + "Known for", scene 8 (MEASURED at t=15.2s).
 *
 * The first estimate for this scene was well off — the headline runs much
 * further right and lower (to x 1769, y 437) and the label block sits lower
 * (y 785–931) than the downscaled frames suggested.
 */
export const KNOWN_FOR = {
  headlineCover: { x: 630, y: 112, width: 1200, height: 352 } as Box,
  labelCover: { x: 132, y: 758, width: 716, height: 202 } as Box,
} as const;

/**
 * Summary scene bubbles (MEASURED via bright-pixel clustering at t=16.8s).
 *
 * The plate has six bubbles but two of them both read "5,600+ DAYS" — a bug in
 * the reference film. `slot` names what each position should show instead; the
 * duplicate becomes the stadium figure.
 */
export type SummarySlot =
  | "years"
  | "workingDays"
  | "interactions"
  | "steps"
  | "hours"
  | "stadium";

export interface Bubble {
  slot: SummarySlot;
  /** Centre of the burned-in text, measured. */
  cx: number;
  cy: number;
  /** Radius of the drawn ring. */
  r: number;
  /**
   * Radius of the covering disc. Larger than `r` where the plate's own value
   * is wider than the replacement — "4,700,000+" is a longer string than the
   * corrected "4,70,000+", so its cover has to reach further out.
   */
  coverR: number;
}

export const SUMMARY = {
  bubbles: [
    { slot: "years", cx: 588, cy: 226, r: 108, coverR: 118 },
    // This position duplicated "5,600+ DAYS" in the plate; repurposed.
    { slot: "stadium", cx: 1306, cy: 224, r: 118, coverR: 138 },
    { slot: "workingDays", cx: 361, cy: 495, r: 118, coverR: 130 },
    { slot: "interactions", cx: 1576, cy: 405, r: 140, coverR: 178 },
    { slot: "steps", cx: 1443, cy: 684, r: 112, coverR: 128 },
    { slot: "hours", cx: 539, cy: 787, r: 118, coverR: 130 },
  ] as Bubble[],
  /** "RAHUL SHARMA" plate, measured. */
  namePlate: { x: 741, y: 816, width: 406, height: 56 } as Box,
  /** Garbled "Pharmict Oribama" subtitle under the name plate. */
  subtitle: { x: 741, y: 880, width: 406, height: 56 } as Box,
} as const;

/**
 * Certificate (MEASURED at t=19.0s).
 *
 * Everything except the title and the Mankind bar is garbled AI text and has
 * to be covered. Paper colour sampled at rgb(231,226,221).
 */
export const CERTIFICATE = {
  /**
   * Paper is not one flat tone — it carries a watermark pattern and shades
   * slightly down the page, so each patch uses a colour sampled at its own
   * band rather than one global average.
   */
  paperUpper: "#E4DED7",
  paperBody: "#E4DFD9",
  paperLower: "#E6E0D7",
  ink: "#1B2A6B",
  /** Gold of the seal, sampled at its centre. */
  sealGold: "#CDA356",

  /** "Resendated by" → "Presented to". Widened: burned text starts at y 358. */
  presentedTo: { x: 745, y: 356, width: 430, height: 46 } as Box,
  /** The pharmacist's name. Burned text y 425–480, x 765–1140. */
  name: { x: 655, y: 416, width: 610, height: 74 } as Box,
  /** Two lines of garbled body copy. Burned text y 525–583, x 604–1316. */
  body: { x: 560, y: 516, width: 800, height: 78 } as Box,
  /**
   * Signature captions. Inset well inside the certificate's inner gold border
   * (which sits near x 390 / x 1530) so the patches never spill onto the
   * background and show as rectangles.
   */
  signLeft: { x: 432, y: 698, width: 312, height: 78 } as Box,
  signRight: { x: 1176, y: 698, width: 312, height: 78 } as Box,
  /**
   * The seal has a hard-coded "18" in it. Measured: the gold disc spans
   * x 898–1017 with the number knocked out around x 935–976, so the disc
   * centre is (959, 672).
   */
  badge: { cx: 959, cy: 672, r: 33 } as { cx: number; cy: number; r: number },
} as const;
