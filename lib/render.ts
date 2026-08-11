/**
 * Server-side render orchestration.
 *
 * Renders locally, one film at a time, with a queue in front so two
 * submissions arriving together do not fight over four CPU cores. That queue is
 * also what makes a real position number available to the processing screen
 * (PRD §8.3).
 *
 * Production replaces this whole file with Remotion Lambda. Note what that
 * changes: Lambda fans a single film across ~20 workers, so 500 concurrent
 * renders is ~10,000 concurrent Lambda executions against a default account
 * quota of 1,000. The quota increase is the long-lead item (PRD §8.2).
 */

import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "node:path";

import { updateSubmission, videoPath } from "./store";
import type { WrappedPayload } from "./types";

const COMPOSITION_ID = "PlateFilm";

/** Bundling costs ~40s, so it happens once per process and is reused. */
let bundlePromise: Promise<string> | null = null;

function getBundle(): Promise<string> {
  if (!bundlePromise) {
    bundlePromise = bundle({
      entryPoint: path.join(process.cwd(), "remotion", "index.ts"),
      onProgress: () => {
        // Intentionally quiet — bundling happens once, before any user waits.
      },
    }).catch((err) => {
      // Don't cache a failed bundle, or every later render inherits it.
      bundlePromise = null;
      throw err;
    });
  }
  return bundlePromise;
}

/**
 * Adds `-movflags +faststart` so the browser can start playing before the whole
 * file has arrived — it moves the MP4 index to the front of the file.
 *
 * `movflags` is an *output* option, so it has to sit immediately before the
 * output path. Prepending it to the argument list instead makes ffmpeg read it
 * as an input option and fail with "Option movflags not found", which is a
 * mistake this file has already made once.
 *
 * If the argument list is not the expected shape, it is returned untouched: a
 * film without faststart still plays, a film that failed to mux does not exist.
 */
export function withFaststart(type: string, args: string[]): string[] {
  if (type !== "stitcher" || args.length === 0) return args;

  const output = args[args.length - 1];
  // The output path is the trailing argument and is never a flag.
  if (typeof output !== "string" || output.startsWith("-")) return args;
  if (!/\.mp4$/i.test(output)) return args;

  return [...args.slice(0, -1), "-movflags", "+faststart", output];
}

interface QueueItem {
  id: string;
  payload: WrappedPayload;
}

const queue: QueueItem[] = [];
let active: string | null = null;

/**
 * 1-based position in line, or 0 when this submission is already rendering.
 * Used by the processing screen instead of an indefinite spinner.
 */
export function queuePosition(id: string): number {
  if (active === id) return 0;
  const index = queue.findIndex((item) => item.id === id);
  return index < 0 ? 0 : index + 1;
}

export function isRendering(id: string): boolean {
  return active === id;
}

/** Adds a submission to the render queue and starts the worker if idle. */
export function enqueueRender(payload: WrappedPayload): void {
  queue.push({ id: payload.id, payload });
  void drain();
}

async function drain(): Promise<void> {
  if (active) return;

  const item = queue.shift();
  if (!item) return;

  active = item.id;
  try {
    await renderOne(item.payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await updateSubmission(item.id, {
      status: "failed",
      error: message,
      progress: 0,
    });
  } finally {
    active = null;
    // Keep going even if that one failed.
    void drain();
  }
}

async function renderOne(payload: WrappedPayload): Promise<void> {
  await updateSubmission(payload.id, { status: "rendering", progress: 1 });

  const serveUrl = await getBundle();
  const inputProps = { payload };

  const composition = await selectComposition({
    serveUrl,
    id: COMPOSITION_ID,
    inputProps,
  });

  const outputLocation = videoPath(payload.id);
  let lastReported = 0;

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation,
    inputProps,
    // 4 cores locally; Lambda parallelises across workers instead.
    concurrency: 4,
    imageFormat: "jpeg",
    jpegQuality: 82,
    ffmpegOverride: ({ type, args }) => withFaststart(type, args),
    onProgress: ({ progress }) => {
      const percent = Math.round(progress * 100);
      // Writing on every frame would be hundreds of disk writes per film.
      if (percent >= lastReported + 2) {
        lastReported = percent;
        void updateSubmission(payload.id, {
          status: "rendering",
          progress: percent,
        });
      }
    },
  });

  await updateSubmission(payload.id, {
    status: "ready",
    progress: 100,
    videoPath: outputLocation,
    error: null,
  });
}

/** Re-run a failed render without losing the registration (PRD §12). */
export async function retryRender(payload: WrappedPayload): Promise<void> {
  await updateSubmission(payload.id, {
    status: "queued",
    progress: 0,
    error: null,
  });
  enqueueRender(payload);
}
