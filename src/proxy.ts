import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";

/**
 * Fast first gate for /admin: checks the session cookie's signature and
 * expiry only. The authoritative check (admin exists, session not revoked) is
 * requireAdmin() in the admin layout and in every server action.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isLogin = pathname === "/admin/login";
  const session = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
  );

  // Note: no "already signed in → leave the login page" redirect. The proxy only
  // checks signatures, so a revoked-but-signed cookie would bounce between
  // /admin (requireAdmin → login) and /admin/login (proxy → admin) forever.
  const response =
    !isLogin && !session
      ? NextResponse.redirect(loginUrl(request, pathname + search))
      : NextResponse.next();

  // Keep the admin out of search engines and never cached by shared caches.
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

function loginUrl(request: NextRequest, next: string): URL {
  const login = new URL("/admin/login", request.url);
  if (next !== "/admin") login.searchParams.set("next", next);
  return login;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
