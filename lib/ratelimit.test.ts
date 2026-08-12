import { beforeEach, describe, expect, it } from "vitest";

import {
  checkRateLimit,
  clientIp,
  MAX_PER_IP,
  MAX_PER_MR,
  resetRateLimits,
  WINDOW_MS,
} from "./ratelimit";

beforeEach(() => resetRateLimits());

describe("checkRateLimit", () => {
  it("allows exactly `limit` calls, then blocks", () => {
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit("k", 5).allowed, `call ${i + 1}`).toBe(true);
    }
    expect(checkRateLimit("k", 5).allowed).toBe(false);
  });

  it("counts down the remaining allowance", () => {
    expect(checkRateLimit("k", 3).remaining).toBe(2);
    expect(checkRateLimit("k", 3).remaining).toBe(1);
    expect(checkRateLimit("k", 3).remaining).toBe(0);
  });

  it("keeps separate keys independent, so one MR cannot exhaust another", () => {
    for (let i = 0; i < 5; i++) checkRateLimit("mr:A", 5);
    expect(checkRateLimit("mr:A", 5).allowed).toBe(false);
    expect(checkRateLimit("mr:B", 5).allowed).toBe(true);
  });

  it("reports a positive retry-after when blocked", () => {
    const now = Date.now();
    for (let i = 0; i < 2; i++) checkRateLimit("k", 2, now);
    const blocked = checkRateLimit("k", 2, now);
    expect(blocked.retryAfter).toBeGreaterThan(0);
    expect(blocked.retryAfter).toBeLessThanOrEqual(WINDOW_MS / 1000);
  });

  it("lets the caller back in once the window has passed", () => {
    const now = Date.now();
    for (let i = 0; i < 2; i++) checkRateLimit("k", 2, now);
    expect(checkRateLimit("k", 2, now).allowed).toBe(false);
    expect(checkRateLimit("k", 2, now + WINDOW_MS + 1).allowed).toBe(true);
  });

  it("gives MR sessions a materially higher allowance than a shared IP", () => {
    // Carrier CGNAT means many unrelated pharmacists share one IP, and an MR
    // legitimately submits many times — neither should hit the other's ceiling.
    expect(MAX_PER_MR).toBeGreaterThan(MAX_PER_IP);
    expect(MAX_PER_IP).toBeGreaterThanOrEqual(20);
  });
});

describe("clientIp", () => {
  it("takes the first entry of x-forwarded-for", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.9, 70.41.3.18, 150.172.238.178",
    });
    expect(clientIp(headers)).toBe("203.0.113.9");
  });

  it("falls back to x-real-ip", () => {
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.7" }))).toBe(
      "198.51.100.7",
    );
  });

  it("returns a stable key when no forwarding header is present", () => {
    expect(clientIp(new Headers())).toBe("unknown");
  });

  it("ignores an empty x-forwarded-for rather than keying on empty string", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "" }))).toBe("unknown");
  });
});
