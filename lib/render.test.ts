import { describe, expect, it } from "vitest";

import { withFaststart } from "./render";

/**
 * These cover a real failure: the flags were originally prepended, which made
 * ffmpeg parse `-movflags` as an input option and abort the mux after the whole
 * film had already rendered.
 */
describe("withFaststart", () => {
  const args = ["-i", "/tmp/pre-encode.mp4", "-c:v", "libx264", "/out/film.mp4"];

  it("inserts the flags immediately before the output path, not at the front", () => {
    const result = withFaststart("stitcher", args);
    expect(result).toEqual([
      "-i",
      "/tmp/pre-encode.mp4",
      "-c:v",
      "libx264",
      "-movflags",
      "+faststart",
      "/out/film.mp4",
    ]);
  });

  it("never puts the flags before the input file", () => {
    const result = withFaststart("stitcher", args);
    expect(result.indexOf("-movflags")).toBeGreaterThan(result.indexOf("-i"));
  });

  it("leaves other ffmpeg invocations alone", () => {
    expect(withFaststart("pre-stitcher", args)).toEqual(args);
    expect(withFaststart("audio-extraction", args)).toEqual(args);
  });

  it("leaves the arguments alone when the output is not an mp4", () => {
    const webm = ["-i", "in.mp4", "/out/film.webm"];
    expect(withFaststart("stitcher", webm)).toEqual(webm);
  });

  it("leaves the arguments alone when the trailing argument is a flag", () => {
    const odd = ["-i", "in.mp4", "-y"];
    expect(withFaststart("stitcher", odd)).toEqual(odd);
  });

  it("handles an empty argument list without throwing", () => {
    expect(withFaststart("stitcher", [])).toEqual([]);
  });
});
