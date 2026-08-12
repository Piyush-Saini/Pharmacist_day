/**
 * GET /api/health — liveness probe for the container host.
 *
 * Deliberately does not touch the render queue or the data directory: a health
 * check that fails while a film is rendering would have the host restart the
 * container mid-render.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
