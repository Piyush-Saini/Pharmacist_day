/**
 * Builds the Content-Disposition header for a downloaded film.
 *
 * This exists because of a real failure: HTTP header values are limited to
 * Latin-1, and putting a pharmacist's name straight into the header throws
 * "Invalid character in header content" for every Devanagari name — a 500 on
 * download for exactly the users this campaign is aimed at.
 *
 * The fix is RFC 5987: an ASCII-only `filename` that any client can read, plus
 * a percent-encoded `filename*` that modern browsers prefer and which preserves
 * the real name.
 */

const SUFFIX = "wrapped-2026.mp4";

/**
 * Strips punctuation and collapses whitespace, keeping letters of any script.
 *
 * `\p{M}` matters as much as `\p{L}` here: Devanagari vowel signs are combining
 * marks, not letters, so a letters-only filter turns "अनिल वर्मा" into
 * "अनल वरम" — a mangled name rather than a rejected one.
 */
export function sanitiseName(name: string): string {
  return name
    .replace(/[^\p{L}\p{M}\p{N} _-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

/**
 * Latin-1-safe fallback. A name written entirely in Devanagari leaves nothing
 * behind, so it falls back to a generic stem rather than an empty filename.
 */
export function asciiFallback(name: string): string {
  const stripped = sanitiseName(name)
    // Header values cannot carry anything above Latin-1, and quotes and
    // backslashes would break out of the quoted string.
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/["\\]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return stripped || "pharmacist";
}

export function contentDisposition(name: string, download: boolean): string {
  const disposition = download ? "attachment" : "inline";
  const ascii = `${asciiFallback(name)}-${SUFFIX}`;
  const utf8 = encodeURIComponent(`${sanitiseName(name) || "pharmacist"}-${SUFFIX}`);
  return `${disposition}; filename="${ascii}"; filename*=UTF-8''${utf8}`;
}
