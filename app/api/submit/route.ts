/**
 * POST /api/submit — the portal → render-pipeline boundary.
 *
 * Validates, calculates, persists an immutable payload, then queues the render.
 * The response carries only the id; the client polls /api/status/[id].
 */

import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import {
  buildDisplayStats,
  calculateStats,
  isEarlyCareer,
  resolveStepsPerDay,
} from "@/lib/calc";
import {
  checkRateLimit,
  clientIp,
  MAX_PER_IP,
  MAX_PER_MR,
} from "@/lib/ratelimit";
import { enqueueRender } from "@/lib/render";
import { createSubmission, savePhoto } from "@/lib/store";
import type { WrappedPayload } from "@/lib/types";
import { submitSchema } from "@/lib/validation";

export const runtime = "nodejs";
/** Renders are long-lived; this route only queues, but keep it off the edge. */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = submitSchema.safeParse(body);

  // Rate limiting runs after parsing so an MR-tagged submission can be given
  // the higher allowance, and before anything is persisted or queued.
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "validation_failed",
        // Field paths only — never echo the submitted values back.
        fields: parsed.error.issues.map((i) => i.path.join(".")),
      },
      { status: 400 },
    );
  }

  const { language, inputs, personalisation, consent, photo } = parsed.data;

  // An MR filling forms with pharmacists all afternoon is expected behaviour,
  // so those sessions are keyed and limited separately from the shared carrier
  // IP they arrive on.
  const mrCode = personalisation.mrCode?.trim();
  const limit = mrCode
    ? checkRateLimit(`mr:${mrCode}`, MAX_PER_MR)
    : checkRateLimit(`ip:${clientIp(request.headers)}`, MAX_PER_IP);

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "rate_limited", retryAfter: limit.retryAfter },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  // A UUID, not a sequence: the finished film is served from a URL keyed to
  // this id with no login, so it must not be guessable from another one
  // (PRD §8.1).
  const id = randomUUID();

  const stats = calculateStats(inputs);

  const payload: WrappedPayload = {
    id,
    createdAt: new Date().toISOString(),
    language,
    inputs,
    resolvedStepsPerDay: resolveStepsPerDay(inputs.stepsBucket, inputs.hoursPerDay),
    stats,
    display: buildDisplayStats(stats),
    earlyCareer: isEarlyCareer(inputs.years),
    knownFor: inputs.knownFor,
    personalisation,
    photoUrl: photo,
  };

  if (photo) {
    try {
      await savePhoto(id, photo);
    } catch {
      // The render uses the data URL in the payload, so a failure to archive
      // the file must not cost the pharmacist his film.
    }
  }

  await createSubmission(payload, consent);
  enqueueRender(payload);

  return NextResponse.json({ id }, { status: 201 });
}
