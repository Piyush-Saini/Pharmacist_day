import { describe, expect, it } from "vitest";

import {
  approximateBytes,
  measureBrightness,
  measureSharpness,
  MIN_BRIGHTNESS,
  MIN_SHARPNESS,
} from "./photo";

/** Builds an RGBA buffer from a per-pixel grey function. */
function greyImage(
  width: number,
  height: number,
  value: (x: number, y: number) => number,
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = value(x, y);
      const i = (y * width + x) * 4;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  return data;
}

describe("measureBrightness", () => {
  it("reads mid-grey as mid-grey", () => {
    const data = greyImage(32, 32, () => 128);
    expect(measureBrightness(data)).toBeCloseTo(128, 0);
  });

  it("flags a near-black frame as below the usable threshold", () => {
    const data = greyImage(32, 32, () => 12);
    expect(measureBrightness(data)).toBeLessThan(MIN_BRIGHTNESS);
  });

  it("passes a normally lit frame", () => {
    const data = greyImage(32, 32, () => 140);
    expect(measureBrightness(data)).toBeGreaterThan(MIN_BRIGHTNESS);
  });

  it("returns 0 for an empty buffer rather than NaN", () => {
    expect(measureBrightness(new Uint8ClampedArray(0))).toBe(0);
  });
});

describe("measureSharpness", () => {
  it("reports near-zero variance for a flat image", () => {
    const data = greyImage(48, 48, () => 128);
    expect(measureSharpness(data, 48, 48)).toBeLessThan(1);
  });

  it("reports high variance for a hard-edged checkerboard", () => {
    const data = greyImage(48, 48, (x, y) => ((x + y) % 2 === 0 ? 0 : 255));
    expect(measureSharpness(data, 48, 48)).toBeGreaterThan(MIN_SHARPNESS);
  });

  it("separates a sharp edge from a gradual ramp", () => {
    const sharp = greyImage(48, 48, (x) => (x < 24 ? 20 : 235));
    const blurred = greyImage(48, 48, (x) => 20 + (x / 47) * 215);
    expect(measureSharpness(sharp, 48, 48)).toBeGreaterThan(
      measureSharpness(blurred, 48, 48),
    );
  });

  it("does not divide by zero on a 1px image", () => {
    const data = greyImage(1, 1, () => 100);
    expect(measureSharpness(data, 1, 1)).toBe(0);
  });
});

describe("approximateBytes", () => {
  it("computes the decoded length of a data URL", () => {
    // "hello" -> aGVsbG8= : 5 bytes
    expect(approximateBytes("data:image/jpeg;base64,aGVsbG8=")).toBe(5);
  });

  it("handles double padding", () => {
    // "hi" -> aGk= is 2 bytes; "h" -> aA== is 1
    expect(approximateBytes("data:image/jpeg;base64,aA==")).toBe(1);
  });

  it("handles no padding", () => {
    // "abc" -> YWJj : 3 bytes
    expect(approximateBytes("data:image/jpeg;base64,YWJj")).toBe(3);
  });

  it("accepts a bare base64 string with no prefix", () => {
    expect(approximateBytes("YWJj")).toBe(3);
  });
});
