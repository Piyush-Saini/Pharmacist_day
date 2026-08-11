/**
 * Submission storage.
 *
 * A file-backed store, deliberately: this prototype serves one or two
 * pharmacists at a time and a database would be scaffolding around nothing.
 * Production needs Postgres — PRD §12 wants completion-funnel drop-off and
 * registrations-by-MR leaderboards, which are relational queries.
 *
 * Everything here is server-only.
 */

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Consent, RenderStatus, SubmissionRecord, WrappedPayload } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const SUBMISSIONS_DIR = path.join(DATA_DIR, "submissions");
const PHOTOS_DIR = path.join(DATA_DIR, "photos");
export const VIDEOS_DIR = path.join(DATA_DIR, "videos");

async function ensureDirs(): Promise<void> {
  await mkdir(SUBMISSIONS_DIR, { recursive: true });
  await mkdir(PHOTOS_DIR, { recursive: true });
  await mkdir(VIDEOS_DIR, { recursive: true });
}

/**
 * Rejects anything that is not a plain UUID.
 *
 * The record path is built from this value, so without the check a crafted id
 * could read or write outside the data directory.
 */
export function isValidId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id,
  );
}

function recordPath(id: string): string {
  return path.join(SUBMISSIONS_DIR, `${id}.json`);
}

export function videoPath(id: string): string {
  return path.join(VIDEOS_DIR, `${id}.mp4`);
}

/** Writes the decoded photo alongside the record, for moderation and audit. */
export async function savePhoto(id: string, dataUrl: string): Promise<string> {
  await ensureDirs();
  const match = dataUrl.match(/^data:image\/(jpeg|png|webp);base64,(.+)$/);
  if (!match) throw new Error("unsupported photo format");
  const [, ext, b64] = match;
  const file = path.join(PHOTOS_DIR, `${id}.${ext === "jpeg" ? "jpg" : ext}`);
  await writeFile(file, Buffer.from(b64, "base64"));
  return file;
}

export async function createSubmission(
  payload: WrappedPayload,
  consent: Consent,
): Promise<SubmissionRecord> {
  await ensureDirs();
  const record: SubmissionRecord = {
    payload,
    consent,
    status: "queued",
    progress: 0,
    videoPath: null,
    error: null,
    updatedAt: new Date().toISOString(),
  };
  await writeFile(recordPath(payload.id), JSON.stringify(record, null, 2));
  return record;
}

export async function getSubmission(
  id: string,
): Promise<SubmissionRecord | null> {
  if (!isValidId(id)) return null;
  try {
    const raw = await readFile(recordPath(id), "utf8");
    return JSON.parse(raw) as SubmissionRecord;
  } catch {
    return null;
  }
}

export async function updateSubmission(
  id: string,
  patch: Partial<Pick<SubmissionRecord, "status" | "progress" | "videoPath" | "error">>,
): Promise<void> {
  const existing = await getSubmission(id);
  if (!existing) return;
  const next: SubmissionRecord = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await writeFile(recordPath(id), JSON.stringify(next, null, 2));
}

/** Admin view: every submission, newest first (PRD §12). */
export async function listSubmissions(): Promise<SubmissionRecord[]> {
  await ensureDirs();
  const files = await readdir(SUBMISSIONS_DIR);
  const records: SubmissionRecord[] = [];
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    try {
      records.push(
        JSON.parse(await readFile(path.join(SUBMISSIONS_DIR, file), "utf8")),
      );
    } catch {
      // A half-written record should not take down the dashboard.
    }
  }
  return records.sort((a, b) =>
    b.payload.createdAt.localeCompare(a.payload.createdAt),
  );
}

export type { RenderStatus };
