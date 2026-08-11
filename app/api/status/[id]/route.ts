/**
 * GET /api/status/[id] — polled by the processing screen.
 *
 * Returns only what the screen needs. In particular it never returns
 * `payload.photoUrl`, which is a ~1MB data URL and would make every poll
 * expensive on a 3G connection.
 */

import { NextResponse } from "next/server";

import { queuePosition } from "@/lib/render";
import { getSubmission } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const record = await getSubmission(id);

  if (!record) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      id,
      status: record.status,
      progress: record.progress,
      queuePosition: record.status === "queued" ? queuePosition(id) : 0,
      language: record.payload.language,
      fullName: record.payload.personalisation.fullName,
      error: record.error,
    },
    // The film takes minutes to render locally; never serve a stale status.
    { headers: { "Cache-Control": "no-store" } },
  );
}
