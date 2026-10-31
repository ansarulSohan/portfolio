import { cn } from "@/lib/utils";

/** A home-page section: anchor target, labelled landmark, consistent heading. */
export function Section({
  id,
  title,
  description,
  children,
  className,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const headingId = `${id}-heading`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn("animate-fade-up border-t py-16 sm:py-20", className)}
    >
      <div className="mb-10 max-w-2xl">
        <span
          aria-hidden
          className="from-primary to-brand-2 mb-4 block h-1 w-12 rounded-full bg-gradient-to-r"
        />
        <h2
          id={headingId}
          className="text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          {title}
        </h2>
        {description && (
          <p className="text-muted-foreground mt-2 text-base">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}
