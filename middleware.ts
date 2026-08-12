import { NextResponse, type NextRequest } from "next/server";

/**
 * Protects the ops dashboard.
 *
 * `/admin` lists every pharmacist's name, pharmacy, city and years of service.
 * That was harmless on a laptop and is not harmless on a public URL, which is
 * what a container host gives you.
 *
 * Fails closed: with no ADMIN_PASSWORD set the dashboard is unreachable rather
 * than open. A misconfigured deploy should lose the dashboard, not the privacy
 * of everyone in it.
 *
 * Basic auth is the right weight for a prototype dashboard behind HTTPS. It is
 * not the right answer for the campaign — that needs real accounts and an audit
 * trail of who looked at what.
 */

const REALM = 'Basic realm="Pharmacist Wrapped admin", charset="UTF-8"';

function unauthorised(message: string) {
  return new NextResponse(message, {
    status: 401,
    headers: {
      "WWW-Authenticate": REALM,
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Compares in time proportional to the longer input rather than bailing at the
 * first differing byte, so the comparison does not leak the password's prefix.
 */
function safeEqual(a: string, b: string): boolean {
  const length = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < length; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export function middleware(request: NextRequest) {
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    return new NextResponse(
      "Admin dashboard is disabled. Set ADMIN_PASSWORD to enable it.",
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) {
    return unauthorised("Authentication required.");
  }

  let decoded: string;
  try {
    decoded = atob(header.slice(6));
  } catch {
    return unauthorised("Malformed credentials.");
  }

  // Everything after the first colon is the password; a colon in the password
  // must not truncate it.
  const separator = decoded.indexOf(":");
  const user = separator < 0 ? "" : decoded.slice(0, separator);
  const password = separator < 0 ? "" : decoded.slice(separator + 1);

  const expectedUser = process.env.ADMIN_USER || "admin";
  const ok = safeEqual(user, expectedUser) && safeEqual(password, expected);

  return ok ? NextResponse.next() : unauthorised("Invalid credentials.");
}

export const config = {
  matcher: ["/admin/:path*"],
};
