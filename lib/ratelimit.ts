/**
 * Submission rate limiting (PRD §6.2).
 *
 * With no OTP there is nothing proving a real person is on the other end, and
 * on a public URL each submission queues a ~4-minute render. One script could
 * wedge the queue for everybody.
 *
 * Two things shape the thresholds, and both push them *up*:
 *
 *  - Indian mobile carriers are heavily CGNAT'd, so thousands of unrelated
 *    pharmacists share an egress IP. A tight per-IP limit blocks real users.
 *  - MR-assisted mode (PRD §10) means one device legitimately submits many
 *    times in a sitting, so MR sessions get their own, higher allowance.
 *
 * In-process and therefore per-container. That is correct for one container and
 * wrong for a fleet — production needs this in Redis, alongside the invisible
 * bot check that is the actual primary defence.
 */

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the caller may try again. */
  retryAfter: number;
  remaining: number;
}

export const WINDOW_MS = 60 * 60 * 1000;

/** Generous, because a shared carrier IP is the normal case, not the abuse case. */
export const MAX_PER_IP = 40;

/** An MR filling forms with pharmacists all afternoon is expected behaviour. */
export const MAX_PER_MR = 150;

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Drops expired buckets so the map cannot grow without bound. */
function sweep(now: number): void {
  if (buckets.size < 5_000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function checkRateLimit(
  key: string,
  limit: number,
  now: number = Date.now(),
): RateLimitResult {
  sweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfter: 0, remaining: limit - 1 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      remaining: 0,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    retryAfter: 0,
    remaining: limit - existing.count,
  };
}

/**
 * Best-effort client IP.
 *
 * Behind a host's proxy the socket address is the proxy, so the forwarded
 * headers are all there is. They are trivially spoofable, which is another
 * reason these limits are a speed bump rather than the primary defence.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/** Exposed for tests; never call from request handling. */
export function resetRateLimits(): void {
  buckets.clear();
}
