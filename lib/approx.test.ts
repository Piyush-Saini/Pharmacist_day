import { describe, expect, it } from "vitest";

import {
  approxLarge,
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

describe("approxLarge", () => {
  it("uses crore, not the Western million, for the steps figure", () => {
    // 4,000 steps/day x 5,616 days = 22,464,000 = 2.2464 crore
    expect(approxLarge(22_464_000)).toBe("2.2 CRORE+");
    expect(approxLarge(22_464_000, { short: true })).toBe("2.2 Cr+");
  });

  it("keeps Indian-grouped digits below one crore", () => {
    expect(approxLarge(477_360)).toBe("4,70,000+");
    expect(approxLarge(9_999_999)).toBe("99,00,000+");
  });

  it("switches to crore exactly at one crore", () => {
    expect(approxLarge(10_000_000)).toBe("1 CRORE+");
  });

  it("drops a trailing .0 rather than printing '2.0 CRORE+'", () => {
    expect(approxLarge(20_000_000)).toBe("2 CRORE+");
  });

  it("rounds down, so the claim stays true", () => {
    // 2.99 crore must not round up to 3
    expect(approxLarge(29_900_000)).toBe("2.9 CRORE+");
  });

  it("accepts a localised scale word", () => {
    expect(approxLarge(22_464_000, { croreWord: "करोड़" })).toBe("2.2 करोड़+");
  });

  it("never emits the word MILLION", () => {
    for (const v of [1e6, 1e7, 5e7, 9.9e7]) {
      expect(approxLarge(v)).not.toContain("MILLION");
    }
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
