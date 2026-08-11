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

/** One crore — the point at which grouped digits get unwieldy on screen. */
export const CRORE = 10_000_000;

/**
 * Large counts in the Indian numbering system.
 *
 * One convention runs through the whole film: Indian digit grouping below a
 * crore ("4,70,000+"), and the crore scale word above it ("2.2 CRORE+"). The
 * reference film mixed Indian grouping with the Western "22 MILLION+"; crore is
 * both shorter and how the audience actually reads a number that size.
 *
 * Rounds down, like every other figure here, so the "+" stays honest.
 */
export function approxLarge(
  value: number,
  opts: { short?: boolean; croreWord?: string } = {},
): string {
  const { short = false, croreWord } = opts;
  if (value < CRORE) return approxPlus(value);

  // Floor to one decimal so "2.2 CRORE+" is never an overstatement.
  const crores = Math.floor((value / CRORE) * 10) / 10;
  const digits = Number.isInteger(crores) ? String(crores) : crores.toFixed(1);
  const word = croreWord ?? (short ? "Cr" : "CRORE");
  return `${digits} ${word}+`;
}

/**
 * Whole-number "more than N" phrasing, floored, with a floor of 1 so the line
 * never reads "more than 0 times".
 */
export function moreThan(value: number): number {
  return Math.max(1, Math.floor(value));
}
