/**
 * GET /api/video/[id] — serves the finished film.
 *
 * This URL *is* the access model in place of a login (PRD §8.1): unguessable
 * rather than authenticated. Two things follow from that and are enforced here:
 * the id must be a real UUID (never a path fragment), and the response is
 * marked no-index so a shared link cannot end up in a search engine.
 *
 * `?download=1` forces a save rather than inline playback.
 */

import { createReadStream, statSync } from "node:fs";
import { NextResponse } from "next/server";
import type { ReadableOptions } from "node:stream";

import { contentDisposition } from "@/lib/filename";
import { getSubmission, isValidId, videoPath } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Bridges a Node read stream into a web ReadableStream. */
function toWebStream(
  filePath: string,
  options: ReadableOptions & { start?: number; end?: number } = {},
): ReadableStream<Uint8Array> {
  const nodeStream = createReadStream(filePath, options);
  return new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk) => {
        controller.enqueue(
          typeof chunk === "string" ? Buffer.from(chunk) : new Uint8Array(chunk),
        );
      });
      nodeStream.on("end", () => controller.close());
      nodeStream.on("error", (err) => controller.error(err));
    },
    cancel() {
      nodeStream.destroy();
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const record = await getSubmission(id);
  if (!record || record.status !== "ready") {
    return NextResponse.json({ error: "not_ready" }, { status: 404 });
  }

  const file = videoPath(id);
  let size: number;
  try {
    size = statSync(file).size;
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const download = new URL(request.url).searchParams.get("download") === "1";

  const headers = new Headers({
    "Content-Type": "video/mp4",
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=3600",
    // Keeps a shared link out of search results (PRD §13 IT-security review).
    "X-Robots-Tag": "noindex, nofollow",
    // RFC 5987 — a Devanagari name cannot go into a header value raw.
    "Content-Disposition": contentDisposition(
      record.payload.personalisation.fullName,
      download,
    ),
  });

  // Range support, so mobile browsers can seek without pulling the whole file.
  const range = request.headers.get("range");
  const match = range?.match(/^bytes=(\d*)-(\d*)$/);
  if (match) {
    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Number(match[2]) : size - 1;

    if (
      Number.isNaN(start) ||
      Number.isNaN(end) ||
      start > end ||
      start >= size
    ) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${size}` },
      });
    }

    const clampedEnd = Math.min(end, size - 1);
    headers.set("Content-Range", `bytes ${start}-${clampedEnd}/${size}`);
    headers.set("Content-Length", String(clampedEnd - start + 1));

    return new NextResponse(toWebStream(file, { start, end: clampedEnd }), {
      status: 206,
      headers,
    });
  }

  headers.set("Content-Length", String(size));
  return new NextResponse(toWebStream(file), { status: 200, headers });
}
