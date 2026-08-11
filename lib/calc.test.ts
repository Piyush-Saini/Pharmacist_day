import { describe, expect, it } from "vitest";

import {
  buildDisplayStats,
  calculateStats,
  isEarlyCareer,
  resolveStepsPerDay,
  STEPS_BUCKET_VALUES,
  STEPS_FROM_HOURS,
} from "./calc";
import type { RawInputs } from "./types";

const baseInputs: RawInputs = {
  years: 20,
  workingDaysPerWeek: 6,
  hoursPerDay: 10,
  peoplePerDay: 60,
  stepsBucket: "3000_4000",
  knownFor: "patient_guidance",
};

describe("resolveStepsPerDay", () => {
  it("maps each explicit bucket to its fixed value (PRD §7.2)", () => {
    expect(resolveStepsPerDay("under_2000", 8)).toBe(1_500);
    expect(resolveStepsPerDay("2000_3000", 8)).toBe(2_500);
    expect(resolveStepsPerDay("3000_4000", 8)).toBe(3_500);
    expect(resolveStepsPerDay("4000_5000", 8)).toBe(4_500);
    expect(resolveStepsPerDay("over_5000", 8)).toBe(6_000);
  });

  it("ignores hours/day when an explicit bucket was chosen", () => {
    for (const hours of [6, 8, 10, 12, 14] as const) {
      expect(resolveStepsPerDay("3000_4000", hours)).toBe(3_500);
    }
  });

  it("derives from hours/day for 'I don't know'", () => {
    expect(resolveStepsPerDay("unknown", 6)).toBe(2_500);
    expect(resolveStepsPerDay("unknown", 8)).toBe(3_500);
    expect(resolveStepsPerDay("unknown", 10)).toBe(4_500);
    expect(resolveStepsPerDay("unknown", 12)).toBe(5_500);
    expect(resolveStepsPerDay("unknown", 14)).toBe(6_500);
  });

  it("has a value for every bucket and every hours option", () => {
    expect(Object.keys(STEPS_BUCKET_VALUES)).toHaveLength(5);
    expect(Object.keys(STEPS_FROM_HOURS)).toHaveLength(5);
  });
});

describe("isEarlyCareer", () => {
  it("flags under 5 years and not 5 or above (PRD §7.3)", () => {
    expect(isEarlyCareer(0)).toBe(true);
    expect(isEarlyCareer(4)).toBe(true);
    expect(isEarlyCareer(4.9)).toBe(true);
    expect(isEarlyCareer(5)).toBe(false);
    expect(isEarlyCareer(30)).toBe(false);
  });
});

describe("calculateStats", () => {
  it("applies the PRD §7.1 formulas to a representative pharmacist", () => {
    const stats = calculateStats(baseInputs);

    // 20 years × 52 = 1040 weeks
    expect(stats.weeksOfService).toBe(1_040);
    // 1040 × 6 days = 6240 working days
    expect(stats.workingDays).toBe(6_240);
    // 6240 × 10 hrs = 62,400 hours
    expect(stats.totalWorkingHours).toBe(62_400);
    // 62,400 / 24 / 365 = 7.12... → 7.1 continuous years
    expect(stats.continuousYearsEquivalent).toBeCloseTo(7.1, 5);
    // 6240 × 60 people = 374,400 interactions
    expect(stats.lifetimeInteractions).toBe(374_400);
    // 374,400 / 50,000 = 7.488 → 7.5 stadiums
    expect(stats.stadiumEquivalent).toBeCloseTo(7.5, 5);
    // (10 × 60) / 60 = 10 minutes per person
    expect(stats.minutesPerPerson).toBe(10);
    // 3500 steps × 6240 days = 21,840,000 steps
    expect(stats.lifetimeSteps).toBe(21_840_000);
    // 21,840,000 × 0.72 / 1000 = 15,724.8 → 15,725 km
    expect(stats.distanceWalkedKm).toBe(15_725);
  });

  it("returns all zeros for a pharmacist in their first year", () => {
    const stats = calculateStats({ ...baseInputs, years: 0 });

    expect(stats.weeksOfService).toBe(0);
    expect(stats.workingDays).toBe(0);
    expect(stats.totalWorkingHours).toBe(0);
    expect(stats.continuousYearsEquivalent).toBe(0);
    expect(stats.lifetimeInteractions).toBe(0);
    expect(stats.stadiumEquivalent).toBe(0);
    expect(stats.lifetimeSteps).toBe(0);
    expect(stats.distanceWalkedKm).toBe(0);
  });

  it("keeps minutes-per-person meaningful at years=0 (it does not depend on tenure)", () => {
    const stats = calculateStats({ ...baseInputs, years: 0 });
    expect(stats.minutesPerPerson).toBe(10);
  });

  it("produces finite values at the top of every input range", () => {
    const stats = calculateStats({
      years: 60,
      workingDaysPerWeek: 7,
      hoursPerDay: 14,
      peoplePerDay: 500,
      stepsBucket: "over_5000",
      knownFor: "helping_emergencies",
    });

    for (const [key, value] of Object.entries(stats)) {
      expect(Number.isFinite(value), `${key} should be finite`).toBe(true);
      expect(value, `${key} should be non-negative`).toBeGreaterThanOrEqual(0);
    }
    // 60 × 52 × 7 = 21,840 working days
    expect(stats.workingDays).toBe(21_840);
    // 6000 × 21,840 × 0.72 / 1000 = 94,348.8 → 94,349 km (twice around Earth)
    expect(stats.distanceWalkedKm).toBe(94_349);
  });

  it("never divides by zero on people served, since the floor is 1", () => {
    const stats = calculateStats({ ...baseInputs, peoplePerDay: 1 });
    expect(Number.isFinite(stats.minutesPerPerson)).toBe(true);
    // (10 × 60) / 1 = 600 minutes
    expect(stats.minutesPerPerson).toBe(600);
  });

  it("clamps out-of-range input as a backstop rather than emitting NaN", () => {
    const tooHigh = calculateStats({
      ...baseInputs,
      years: 999,
      peoplePerDay: 10_000,
    });
    // Clamped to years=60, people=500
    expect(tooHigh.weeksOfService).toBe(60 * 52);
    expect(tooHigh.lifetimeInteractions).toBe(60 * 52 * 6 * 500);

    const tooLow = calculateStats({
      ...baseInputs,
      years: -5,
      peoplePerDay: 0,
    });
    expect(tooLow.weeksOfService).toBe(0);
    expect(Number.isFinite(tooLow.minutesPerPerson)).toBe(true);
  });
});

describe("buildDisplayStats", () => {
  it("uses Indian digit grouping, not Western", () => {
    const display = buildDisplayStats(calculateStats(baseInputs));
    // 21,840,000 renders as 2,18,40,000 in en-IN
    expect(display.lifetimeSteps).toBe("2,18,40,000");
    expect(display.lifetimeInteractions).toBe("3,74,400");
    expect(display.distanceWalkedKm).toBe("15,725");
  });

  it("converts sub-minute per-person time into seconds so it reads sensibly", () => {
    // 6 hours across 500 people = 0.72 min = 43 seconds
    const display = buildDisplayStats(
      calculateStats({ ...baseInputs, hoursPerDay: 6, peoplePerDay: 500 }),
    );
    expect(display.minutesPerPerson).toBe("43 sec");
  });

  it("keeps minutes for values at or above one minute", () => {
    const display = buildDisplayStats(calculateStats(baseInputs));
    expect(display.minutesPerPerson).toBe("10.0 min");
  });

  it("holds one decimal on the comparison figures", () => {
    const display = buildDisplayStats(calculateStats(baseInputs));
    expect(display.continuousYearsEquivalent).toBe("7.1");
    expect(display.stadiumEquivalent).toBe("7.5");
  });
});
