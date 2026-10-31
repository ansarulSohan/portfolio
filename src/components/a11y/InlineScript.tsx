/**
 * A script that runs during HTML parsing, before first paint. On the client
 * it renders as text/plain so React never executes it again or warns about a
 * <script> in the tree; suppressHydrationWarning covers the type mismatch.
 * Pattern from the Next.js "preventing flash before hydration" guide.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
