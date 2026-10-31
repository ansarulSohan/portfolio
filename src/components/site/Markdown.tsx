import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/*
 * Renders admin-written Markdown. react-markdown doesn't render raw HTML
 * (no rehype-raw) and strips unsafe URLs such as javascript:, so this content
 * can't inject markup or scripts.
 */

const components: Components = {
  h1: ({ children }) => (
    <h2 className="mt-8 mb-3 text-2xl font-semibold tracking-tight">
      {children}
    </h2>
  ),
  h2: ({ children }) => (
    <h2 className="mt-8 mb-3 text-xl font-semibold tracking-tight">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-6 mb-2 text-lg font-semibold">{children}</h3>
  ),
  p: ({ children }) => <p className="mb-4 leading-7 last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="mb-4 list-disc space-y-1.5 pl-6">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-4 list-decimal space-y-1.5 pl-6">{children}</ol>
  ),
  a: ({ children, href }) => {
    const external = href?.startsWith("http");
    return (
      <a
        href={href}
        className="text-primary font-medium underline underline-offset-4"
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
        {external && <span className="sr-only"> (opens in a new tab)</span>}
      </a>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="text-muted-foreground mb-4 border-l-2 pl-4 italic">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-[0.9em]">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="bg-muted mb-4 overflow-x-auto rounded-lg p-4 text-sm [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
  hr: () => <hr className="my-8" />,
  // Images in Markdown need alt text like everywhere else; empty alt marks them decorative.
  img: ({ src, alt }) =>
    typeof src === "string" ? (
      // eslint-disable-next-line @next/next/no-img-element -- arbitrary admin URLs; not optimisable
      <img
        src={src}
        alt={alt ?? ""}
        className="my-6 rounded-lg border"
        loading="lazy"
      />
    ) : null,
  table: ({ children }) => (
    <div className="mb-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b px-3 py-2 text-left font-semibold">{children}</th>
  ),
  td: ({ children }) => <td className="border-b px-3 py-2">{children}</td>,
};

export function Markdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={cn("text-base", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
