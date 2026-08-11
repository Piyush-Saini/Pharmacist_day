import { describe, expect, it } from "vitest";

import { asciiFallback, contentDisposition, sanitiseName } from "./filename";

/** Header values are Latin-1; anything above it throws when set on a Response. */
function isHeaderSafe(value: string): boolean {
  return /^[\x20-\x7E]*$/.test(value);
}

describe("sanitiseName", () => {
  it("keeps letters of any script", () => {
    expect(sanitiseName("अनिल वर्मा")).toBe("अनिल-वर्मा");
    expect(sanitiseName("Sunita Deshmukh")).toBe("Sunita-Deshmukh");
  });

  it("drops punctuation that would break a quoted header", () => {
    expect(sanitiseName('Raj "Tiny" O\'Brien')).toBe("Raj-Tiny-OBrien");
    expect(sanitiseName("A\\B")).toBe("AB");
  });

  it("collapses whitespace rather than leaving gaps", () => {
    expect(sanitiseName("  Ram   Kumar  ")).toBe("Ram-Kumar");
  });
});

describe("asciiFallback", () => {
  it("falls back to a generic stem for a name with no ASCII at all", () => {
    expect(asciiFallback("अनिल वर्मा")).toBe("pharmacist");
    expect(asciiFallback("")).toBe("pharmacist");
  });

  it("keeps a Latin name intact", () => {
    expect(asciiFallback("Sunita Deshmukh")).toBe("Sunita-Deshmukh");
  });

  it("does not leave dangling separators after stripping a mixed name", () => {
    expect(asciiFallback("Anil अनिल")).toBe("Anil");
    expect(asciiFallback("अनिल Verma")).toBe("Verma");
  });
});

describe("contentDisposition", () => {
  it("is header-safe for a Devanagari name — the case that returned 500", () => {
    const header = contentDisposition("अनिल वर्मा", true);
    expect(isHeaderSafe(header)).toBe(true);
  });

  it("is header-safe across a range of Indian scripts", () => {
    const names = [
      "अनिल वर्मा",
      "সুনীতা দেশমুখ",
      "சுனிதா",
      "ಸುನೀತಾ",
      "સુનિતા",
      "ਸੁਨੀਤਾ",
    ];
    for (const name of names) {
      expect(isHeaderSafe(contentDisposition(name, true)), name).toBe(true);
    }
  });

  it("still carries the real name, percent-encoded", () => {
    const header = contentDisposition("अनिल वर्मा", true);
    expect(header).toContain("filename*=UTF-8''");
    const encoded = header.split("filename*=UTF-8''")[1];
    expect(decodeURIComponent(encoded)).toBe("अनिल-वर्मा-wrapped-2026.mp4");
  });

  it("switches between attachment and inline", () => {
    expect(contentDisposition("Sunita", true)).toMatch(/^attachment;/);
    expect(contentDisposition("Sunita", false)).toMatch(/^inline;/);
  });

  it("produces a readable plain filename for a Latin name", () => {
    expect(contentDisposition("Sunita Deshmukh", true)).toContain(
      'filename="Sunita-Deshmukh-wrapped-2026.mp4"',
    );
  });

  it("survives a name that is nothing but punctuation", () => {
    const header = contentDisposition("!!!", true);
    expect(isHeaderSafe(header)).toBe(true);
    expect(header).toContain('filename="pharmacist-wrapped-2026.mp4"');
  });
});
