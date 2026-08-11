/**
 * Approximate number formatting for the film's on-screen figures.
 *
 * The reference plate shows rounded, "+"-suffixed values ("5,600+ WORKING
 * DAYS", "56,000+ HOURS", "22 MILLION+ STEPS") rather than exact ones. That is
 * the right call for a celebratory film — an exact 5,616 invites the pharmacist
 * to argue with it, and every input was an estimate anyway.
 *
 * These round DOWN so the claim is always defensible: "5,600+" is true when the
 * real figure is 5,616.
 */

import { formatIndian } from "./calc";

/** Round down to a multiple of `unit`. */
export function floorTo(value: number, unit: number): number {
  if (unit <= 0) return value;
  return Math.floor(value / unit) * unit;
}

/**
 * Pick a rounding step that keeps 2–3 significant digits, so the figure reads
 * as a headline rather than a measurement.
 */
export function niceStep(value: number): number {
  if (value < 100) return 1;
  if (value < 1_000) return 10;
  if (value < 10_000) return 100;
  if (value < 100_000) return 1_000;
  if (value < 1_000_000) return 10_000;
  if (value < 10_000_000) return 100_000;
  return 1_000_000;
}

/**
 * "4,70,000+" — Indian grouping with a plus.
 *
 * Returns the exact value with no plus when rounding would take it to zero,
 * which matters for a first-year pharmacist whose totals are genuinely small.
 */
export function approxPlus(value: number): string {
  const rounded = floorTo(value, niceStep(value));
  if (rounded <= 0) return formatIndian(Math.max(0, Math.round(value)));
  return `${formatIndian(rounded)}+`;
}

/** Exact Indian-grouped value with a plus, no rounding. */
export function exactPlus(value: number): string {
  return `${formatIndian(Math.round(value))}+`;
}

/**
 * "22 MILLION+" / "22M+" for very large counts.
 *
 * Falls back to `approxPlus` below a million, because "0.4 MILLION" reads worse
 * than "4,00,000+". Note this uses the Western million rather than the Indian
 * lakh/crore — matching the reference film, but see the README: mixing
 * "4,70,000+" (Indian grouping) with "22 MILLION+" (Western scale) in one film
 * is a consistency decision the creative team should confirm.
 */
export function approxMillions(value: number, short = false): string {
  if (value < 1_000_000) return approxPlus(value);
  const millions = Math.floor(value / 1_000_000);
  return short ? `${millions}M+` : `${millions} MILLION+`;
}

/**
 * Whole-number "more than N" phrasing, floored, with a floor of 1 so the line
 * never reads "more than 0 times".
 */
export function moreThan(value: number): number {
  return Math.max(1, Math.floor(value));
}
