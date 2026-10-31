/**
 * Content-Security-Policy, built at request time in proxy.ts so it can use
 * runtime settings (the bucket's address) instead of values baked in at build.
 *
 * Scripts need 'unsafe-inline': nonces are incompatible with partial
 * prerendering (the static shell is built before any request exists), and
 * Next's streaming plus our prefs <head> script are inline. Everything else
 * is restricted: no plugins, no framing, no foreign form targets or <base>,
 * and network requests only to this site and the upload bucket.
 */

/** Origins the browser may PUT uploads to: the R2/S3 endpoint and its bucket subdomains. */
function bucketOrigins(): string[] {
  try {
    const { protocol, host } = new URL(process.env.S3_ENDPOINT ?? "");
    return [`${protocol}//${host}`, `${protocol}//*.${host}`];
  } catch {
    return [];
  }
}

export function contentSecurityPolicy(): string {
  const dev = process.env.NODE_ENV !== "production";
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // 'unsafe-eval' only in dev: React uses eval for error overlays and stacks.
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      ...(dev ? ["'unsafe-eval'"] : []),
    ],
    // next/font and React's style attributes are inline.
    "style-src": ["'self'", "'unsafe-inline'"],
    // https: allows images written into Markdown; blob: is for upload previews.
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "font-src": ["'self'"],
    "connect-src": ["'self'", ...bucketOrigins(), ...(dev ? ["ws:"] : [])],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "frame-src": ["'none'"],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
  };
  const policy = Object.entries(directives).map(
    ([name, values]) => `${name} ${values.join(" ")}`,
  );
  if (!dev) policy.push("upgrade-insecure-requests");
  return policy.join("; ");
}
