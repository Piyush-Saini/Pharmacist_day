/**
 * Calculation engine — PRD §7.
 *
 * Pure functions, no I/O. Every number the video displays originates here and
 * is persisted with the submission, so a re-render always reproduces the same
 * film.
 */

import type {
  CalculatedStats,
  DisplayStats,
  HoursPerDay,
  RawInputs,
  StepsBucket,
} from "./types";

/** Average stride length in metres, per PRD §7.1. */
export const STRIDE_METRES = 0.72;

/** Capacity used for the "stadiums full of people" comparison. */
export const STADIUM_CAPACITY = 50_000;

export const YEARS_MIN = 0;
export const YEARS_MAX = 60;
export const PEOPLE_MIN = 1;
export const PEOPLE_MAX = 500;

/** Years below this get the alternate caption set (PRD §7.3). */
export const EARLY_CAREER_YEARS = 5;

/** PRD §7.2 — fixed bucket → single value mapping. */
export const STEPS_BUCKET_VALUES: Record<
  Exclude<StepsBucket, "unknown">,
  number
> = {
  under_2000: 1_500,
  "2000_3000": 2_500,
  "3000_4000": 3_500,
  "4000_5000": 4_500,
  over_5000: 6_000,
};

/**
 * Fallback for "I don't know", derived from hours/day (PRD §7.2).
 *
 * NOTE: these values drive a visible on-screen number and are pending
 * sign-off from the creative team (PRD Open Question 1). They are isolated
 * here so that sign-off is a one-line change.
 */
export const STEPS_FROM_HOURS: Record<HoursPerDay, number> = {
  6: 2_500,
  8: 3_500,
  10: 4_500,
  12: 5_500,
  14: 6_500,
};

/** Resolve the steps question into the single number the formulas need. */
export function resolveStepsPerDay(
  stepsBucket: StepsBucket,
  hoursPerDay: HoursPerDay,
): number {
  if (stepsBucket === "unknown") {
    return STEPS_FROM_HOURS[hoursPerDay];
  }
  return STEPS_BUCKET_VALUES[stepsBucket];
}

export function isEarlyCareer(years: number): boolean {
  return years < EARLY_CAREER_YEARS;
}

/** Clamp helper — validation rejects out-of-range input, this is a backstop. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Compute the nine values in PRD §7.1.
 *
 * Values that are displayed as whole numbers are rounded here rather than at
 * the render layer, so the stored payload and the on-screen text always agree.
 */
export function calculateStats(inputs: RawInputs): CalculatedStats {
  const years = clamp(inputs.years, YEARS_MIN, YEARS_MAX);
  const peoplePerDay = clamp(inputs.peoplePerDay, PEOPLE_MIN, PEOPLE_MAX);
  const { workingDaysPerWeek, hoursPerDay } = inputs;

  const stepsPerDay = resolveStepsPerDay(inputs.stepsBucket, hoursPerDay);

  const weeksOfService = years * 52;
  const workingDays = weeksOfService * workingDaysPerWeek;
  const totalWorkingHours = workingDays * hoursPerDay;
  const continuousYearsEquivalent = totalWorkingHours / 24 / 365;
  const lifetimeInteractions = workingDays * peoplePerDay;
  const stadiumEquivalent = lifetimeInteractions / STADIUM_CAPACITY;
  const minutesPerPerson = (hoursPerDay * 60) / peoplePerDay;
  const lifetimeSteps = stepsPerDay * workingDays;
  const distanceWalkedKm = (lifetimeSteps * STRIDE_METRES) / 1_000;

  return {
    weeksOfService,
    workingDays,
    totalWorkingHours,
    continuousYearsEquivalent: round(continuousYearsEquivalent, 1),
    lifetimeInteractions,
    stadiumEquivalent: round(stadiumEquivalent, 1),
    // Kept at 2dp: the display layer converts sub-minute values into seconds,
    // and rounding to 1dp first would lose a second or two off that figure.
    minutesPerPerson: round(minutesPerPerson, 2),
    lifetimeSteps,
    distanceWalkedKm: Math.round(distanceWalkedKm),
  };
}

const inGrouping = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const inGrouping1dp = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Indian digit grouping: 1,23,456 rather than 123,456. */
export function formatIndian(value: number): string {
  return inGrouping.format(value);
}

export function formatIndian1dp(value: number): string {
  return inGrouping1dp.format(value);
}

/**
 * Build the display strings the renderer draws verbatim.
 *
 * `minutesPerPerson` is the one value that reads badly as a decimal for busy
 * pharmacists (0.7 minutes means nothing), so it converts to seconds below
 * one minute.
 */
export function buildDisplayStats(stats: CalculatedStats): DisplayStats {
  const minutes =
    stats.minutesPerPerson < 1
      ? `${Math.round(stats.minutesPerPerson * 60)} sec`
      : `${formatIndian1dp(stats.minutesPerPerson)} min`;

  return {
    weeksOfService: formatIndian(stats.weeksOfService),
    workingDays: formatIndian(stats.workingDays),
    totalWorkingHours: formatIndian(stats.totalWorkingHours),
    continuousYearsEquivalent: formatIndian1dp(stats.continuousYearsEquivalent),
    lifetimeInteractions: formatIndian(stats.lifetimeInteractions),
    stadiumEquivalent: formatIndian1dp(stats.stadiumEquivalent),
    minutesPerPerson: minutes,
    lifetimeSteps: formatIndian(stats.lifetimeSteps),
    distanceWalkedKm: formatIndian(stats.distanceWalkedKm),
  };
}
