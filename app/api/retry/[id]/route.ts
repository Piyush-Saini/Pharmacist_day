/**
 * POST /api/retry/[id] — re-runs a failed render.
 *
 * The registration is never rebuilt, only the film: the stored payload is
 * replayed unchanged, so a retry cannot produce different numbers than the
 * first attempt (PRD §12).
 */

import { NextResponse } from "next/server";

import { retryRender } from "@/lib/render";
import { getSubmission } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const record = await getSubmission(id);

  if (!record) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (record.status === "rendering" || record.status === "queued") {
    return NextResponse.json({ ok: true, status: record.status });
  }

  await retryRender(record.payload);
  return NextResponse.json({ ok: true, status: "queued" });
}
