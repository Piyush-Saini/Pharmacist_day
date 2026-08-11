/**
 * Measures burned-in elements of the reference plate video so the overlay
 * layer can be positioned against real pixel coordinates instead of guesses.
 *
 * Usage: node scripts/measure-plate.mjs <video> <seconds> <mode>
 *   cyan   → bounding box of the cyan photo frame on the title card
 *   bright → horizontal bands of near-white pixels (burned-in text)
 *
 * Extracts a PNG via the bundled ffmpeg and decodes it locally; that build has
 * no rawvideo muxer, so PNG is the only way out.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { decodePng, pixelAt } from "./lib/png.mjs";

const FFMPEG = "node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg";

function grabFrame(video, seconds) {
  const dir = mkdtempSync(path.join(tmpdir(), "plate-"));
  const out = path.join(dir, "f.png");
  try {
    execFileSync(FFMPEG, [
      "-y", "-v", "error",
      "-ss", String(seconds),
      "-i", video,
      "-frames:v", "1",
      out,
    ]);
    return decodePng(readFileSync(out));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** The photo frame's glow is strongly cyan: high G and B, much lower R. */
function isCyanGlow(r, g, b) {
  return b > 150 && g > 140 && r < g - 45 && b > r + 60;
}

function boundingBox(img, test) {
  let minX = img.width, minY = img.height, maxX = -1, maxY = -1, count = 0;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const [r, g, b] = pixelAt(img, x, y);
      if (test(r, g, b)) {
        count++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY, count };
}

function brightBands(img, threshold = 225, minRun = 30, gap = 8) {
  const rows = [];
  for (let y = 0; y < img.height; y++) {
    let run = 0, best = 0, firstX = -1, lastX = -1;
    for (let x = 0; x < img.width; x++) {
      const [r, g, b] = pixelAt(img, x, y);
      if (r > threshold && g > threshold && b > threshold) {
        run++;
        if (firstX === -1) firstX = x;
        lastX = x;
      } else {
        if (run > best) best = run;
        run = 0;
      }
    }
    if (run > best) best = run;
    if (best >= minRun) rows.push({ y, firstX, lastX });
  }

  const out = [];
  for (const row of rows) {
    const last = out[out.length - 1];
    if (last && row.y - last.y1 <= gap) {
      last.y1 = row.y;
      last.x0 = Math.min(last.x0, row.firstX);
      last.x1 = Math.max(last.x1, row.lastX);
    } else {
      out.push({ y0: row.y, y1: row.y, x0: row.firstX, x1: row.lastX });
    }
  }
  return out.filter((b) => b.y1 - b.y0 >= 8);
}

function pct(value, total) {
  return `${((value / total) * 100).toFixed(2)}%`;
}

function main() {
  const [video, seconds, mode = "cyan"] = process.argv.slice(2);
  if (!video || !seconds) {
    console.error("usage: measure-plate.mjs <video> <seconds> [cyan|bright]");
    process.exit(1);
  }

  const img = grabFrame(video, seconds);

  if (mode === "cyan") {
    const box = boundingBox(img, isCyanGlow);
    if (box.maxX < 0) {
      console.log(`t=${seconds}s: no cyan glow found`);
      return;
    }
    const w = box.maxX - box.minX;
    const h = box.maxY - box.minY;
    console.log(`t=${seconds}s cyan frame (${box.count} px):`);
    console.log(`  px:  x ${box.minX}-${box.maxX}  y ${box.minY}-${box.maxY}  ${w}x${h}`);
    console.log(
      `  pct: left ${pct(box.minX, img.width)} top ${pct(box.minY, img.height)} w ${pct(w, img.width)} h ${pct(h, img.height)}`,
    );
    console.log(`  aspect: ${(w / h).toFixed(3)}`);
  } else {
    const b = brightBands(img);
    console.log(`t=${seconds}s bright bands (${b.length}) on ${img.width}x${img.height}:`);
    for (const band of b) {
      console.log(
        `  y ${band.y0}-${band.y1} (h ${band.y1 - band.y0})  x ${band.x0}-${band.x1}  |  top ${pct(band.y0, img.height)} left ${pct(band.x0, img.width)}`,
      );
    }
  }
}

main();
