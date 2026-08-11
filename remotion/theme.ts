/**
 * Visual constants and font loading for the Wrapped film.
 *
 * The real campaign film composites over fixed Veo background plates (render
 * pipeline PRD). This prototype draws its own animated backdrops instead, so
 * the whole thing runs with no external assets. Swapping in the plates means
 * replacing `Backdrop` — no scene needs to change.
 */

import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export const VIDEO_WIDTH = 720;
export const VIDEO_HEIGHT = 1280;
export const FPS = 30;

const WEIGHTS = ["400", "500", "600", "700", "800"] as const;

/** Filenames written by scripts/fetch-fonts.mjs. */
const POPPINS_LATIN: Record<string, string> = {
  "400": "poppins-latin-400-1.woff2",
  "500": "poppins-latin-500-3.woff2",
  "600": "poppins-latin-600-5.woff2",
  "700": "poppins-latin-700-7.woff2",
  "800": "poppins-latin-800-9.woff2",
};

const NOTO_DEVANAGARI: Record<string, string> = {
  "400": "noto-sans-devanagari-devanagari-400-0.woff2",
  "500": "noto-sans-devanagari-devanagari-500-2.woff2",
  "600": "noto-sans-devanagari-devanagari-600-4.woff2",
  "700": "noto-sans-devanagari-devanagari-700-6.woff2",
  "800": "noto-sans-devanagari-devanagari-800-8.woff2",
};

/** Serif, used only on the certificate scene. */
const PLAYFAIR_LATIN: Record<string, string> = {
  "500": "playfair-display-latin-500-0.woff2",
  "700": "playfair-display-latin-700-1.woff2",
};

export const POPPINS = "PharmaPoppins";
export const DEVANAGARI = "PharmaDevanagari";
export const SERIF = "PharmaSerif";

/**
 * Certificate stack. Hindi has no serif counterpart loaded, so Devanagari
 * follows as the fallback and Hindi names render in Noto rather than tofu.
 */
export const serifStack = (lang: string): string =>
  lang === "hi"
    ? `"${DEVANAGARI}", "${SERIF}", serif`
    : `"${SERIF}", "${DEVANAGARI}", serif`;

let started = false;

/**
 * Register the self-hosted faces and hold the render until they are ready.
 *
 * Two things matter here and both have bitten this file already:
 *
 *  1. Fonts are read off local disk, not fetched from fonts.gstatic.com. A
 *     render that depends on the network can silently produce a film in the
 *     wrong typeface, and for Hindi produces tofu boxes instead of text.
 *
 *  2. This must be called *during render*, not at module scope. At module
 *     evaluation `staticFile()` has no base URL yet and returns a relative
 *     "/public/..." path, which `FontFace.load()` never resolves — the render
 *     then dies on a delayRender timeout 30 seconds later.
 */
export function ensureFontsLoaded(): void {
  if (started || typeof window === "undefined") return;
  started = true;

  for (const weight of WEIGHTS) {
    void loadFont({
      family: POPPINS,
      url: staticFile(`fonts/${POPPINS_LATIN[weight]}`),
      weight,
      format: "woff2",
    });
    void loadFont({
      family: DEVANAGARI,
      url: staticFile(`fonts/${NOTO_DEVANAGARI[weight]}`),
      weight,
      format: "woff2",
    });
  }

  for (const weight of ["500", "700"] as const) {
    void loadFont({
      family: SERIF,
      url: staticFile(`fonts/${PLAYFAIR_LATIN[weight]}`),
      weight,
      format: "woff2",
    });
  }
}

/**
 * Hindi needs the Devanagari face first. Latin digits inside Hindi copy fall
 * through to Poppins, which is why both are always in the stack.
 */
export const fontStack = (lang: string): string =>
  lang === "hi"
    ? `"${DEVANAGARI}", "${POPPINS}", sans-serif`
    : `"${POPPINS}", "${DEVANAGARI}", sans-serif`;

export const colors = {
  ink: "#04121F",
  deep: "#08325F",
  brand: "#0E4C92",
  brandLight: "#3B7DD8",
  accent: "#F5A524",
  accentLight: "#FFD08A",
  cream: "#FFF8ED",
  white: "#FFFFFF",
};

/** Per-scene backdrop tints, so the film moves through a palette. */
export const sceneTints: Record<string, [string, string]> = {
  intro: [colors.ink, colors.deep],
  identity: [colors.deep, colors.brand],
  years: [colors.brand, colors.deep],
  hours: ["#0A2A4A", colors.brand],
  people: [colors.brand, "#123E7C"],
  minutes: ["#0D3A6B", colors.deep],
  steps: ["#08325F", colors.brandLight],
  knownFor: ["#0B2E55", colors.brand],
  outro: [colors.deep, colors.ink],
};
