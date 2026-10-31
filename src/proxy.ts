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

  let response: NextResponse;
  if (isLogin && session) {
    response = NextResponse.redirect(new URL("/admin", request.url));
  } else if (!isLogin && !session) {
    const login = new URL("/admin/login", request.url);
    if (pathname !== "/admin")
      login.searchParams.set("next", pathname + search);
    response = NextResponse.redirect(login);
  } else {
    response = NextResponse.next();
  }

  // Keep the admin out of search engines and never cached by shared caches.
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
