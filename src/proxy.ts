import { NextResponse, type NextRequest } from "next/server";
import { contentSecurityPolicy } from "@/lib/csp";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";

/**
 * Runs on every page request (not static assets):
 * - sets the Content-Security-Policy (built from runtime settings)
 * - for /admin: a fast first gate that checks the session cookie's signature
 *   and expiry only. The authoritative check (admin exists, session not
 *   revoked) is requireAdmin() in the admin layout and every server action.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  let response = NextResponse.next();
  if (isAdmin) {
    const isLogin = pathname === "/admin/login";
    const session = await verifySessionToken(
      request.cookies.get(SESSION_COOKIE)?.value,
    );
    // Note: no "already signed in → leave the login page" redirect. The proxy only
    // checks signatures, so a revoked-but-signed cookie would bounce between
    // /admin (requireAdmin → login) and /admin/login (proxy → admin) forever.
    if (!isLogin && !session) {
      response = NextResponse.redirect(loginUrl(request, pathname + search));
    }
    // Keep the admin out of search engines and never cached by shared caches.
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("Cache-Control", "private, no-store");
  }

  response.headers.set("Content-Security-Policy", contentSecurityPolicy());
  return response;
}

function loginUrl(request: NextRequest, next: string): URL {
  const login = new URL("/admin/login", request.url);
  if (next !== "/admin") login.searchParams.set("next", next);
  return login;
}

export const config = {
  matcher: [
    // Everything except Next's static files, optimized images and public assets.
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|woff2?)$).*)",
  ],
};
