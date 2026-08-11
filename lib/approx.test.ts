import { describe, expect, it } from "vitest";

import {
  approxMillions,
  approxPlus,
  floorTo,
  moreThan,
  niceStep,
} from "./approx";

describe("floorTo", () => {
  it("rounds down to the given unit", () => {
    expect(floorTo(5_616, 100)).toBe(5_600);
    expect(floorTo(56_160, 1_000)).toBe(56_000);
    expect(floorTo(477_360, 10_000)).toBe(470_000);
  });

  it("returns the value unchanged for a non-positive unit", () => {
    expect(floorTo(123, 0)).toBe(123);
    expect(floorTo(123, -5)).toBe(123);
  });
});

describe("niceStep", () => {
  it("scales the rounding step with magnitude", () => {
    expect(niceStep(42)).toBe(1);
    expect(niceStep(936)).toBe(10);
    expect(niceStep(5_616)).toBe(100);
    expect(niceStep(56_160)).toBe(1_000);
    expect(niceStep(477_360)).toBe(10_000);
    expect(niceStep(4_773_600)).toBe(100_000);
    expect(niceStep(22_464_000)).toBe(1_000_000);
  });
});

describe("approxPlus", () => {
  it("matches the figures shown in the reference film", () => {
    // 18 years, 6 days/week → 5,616 working days
    expect(approxPlus(5_616)).toBe("5,600+");
    // × 10 hours → 56,160 hours
    expect(approxPlus(56_160)).toBe("56,000+");
    // × 85 people → 477,360 interactions, in Indian grouping
    expect(approxPlus(477_360)).toBe("4,70,000+");
  });

  it("uses Indian digit grouping, not Western", () => {
    expect(approxPlus(477_360)).toBe("4,70,000+");
    expect(approxPlus(477_360)).not.toContain("470,000");
  });

  it("never rounds a small real figure down to zero", () => {
    // A first-year pharmacist: rounding 52 weeks to the nearest 100 would be 0.
    expect(approxPlus(52)).toBe("52+");
    expect(approxPlus(7)).toBe("7+");
    expect(approxPlus(0)).toBe("0");
  });

  it("rounds down, so the claim stays true", () => {
    expect(approxPlus(5_699)).toBe("5,600+");
    expect(approxPlus(5_700)).toBe("5,700+");
  });
});

describe("approxMillions", () => {
  it("matches the reference film's steps figure", () => {
    // 4,000 steps/day × 5,616 days = 22,464,000
    expect(approxMillions(22_464_000)).toBe("22 MILLION+");
    expect(approxMillions(22_464_000, true)).toBe("22M+");
  });

  it("falls back to grouped digits below a million", () => {
    expect(approxMillions(477_360)).toBe("4,70,000+");
    expect(approxMillions(999_999)).toBe("9,90,000+");
  });

  it("handles exactly one million", () => {
    expect(approxMillions(1_000_000)).toBe("1 MILLION+");
  });
});

describe("moreThan", () => {
  it("floors, matching 'MORE THAN 9 TIMES' for 9.5 stadiums", () => {
    expect(moreThan(9.5)).toBe(9);
    expect(moreThan(6.4)).toBe(6);
  });

  it("never reads 'more than 0'", () => {
    expect(moreThan(0.2)).toBe(1);
    expect(moreThan(0)).toBe(1);
  });
});
