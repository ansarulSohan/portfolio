import { Suspense } from "react";
import Link from "next/link";
import { AccessibilityMenu } from "@/components/a11y/AccessibilityMenu";
import { ThemeToggle } from "@/components/a11y/ThemeToggle";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_SETTINGS } from "@/lib/dto";
import { getProfile, getSettings } from "@/lib/queries";
import { MobileNav } from "./MobileNav";
import { visibleNavLinks, type NavLink } from "./nav";

// While settings load, show the default links (the blog is off by default).
const FALLBACK_LINKS = visibleNavLinks(DEFAULT_SETTINGS);

async function Brand() {
  const profile = await getProfile();
  return <>{profile?.name ?? "Portfolio"}</>;
}

function NavList({ links }: { links: NavLink[] }) {
  return (
    <ul className="flex items-center gap-1">
      {links.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-3 py-2 text-sm font-medium transition-colors"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Nav filtered by the admin's section settings. */
async function Nav() {
  const links = visibleNavLinks(await getSettings());
  return (
    <>
      <nav aria-label="Main" className="hidden lg:block">
        <NavList links={links} />
      </nav>
      <MobileNav links={links} />
    </>
  );
}

function NavFallback() {
  return (
    <>
      <nav aria-label="Main" className="hidden lg:block">
        <NavList links={FALLBACK_LINKS} />
      </nav>
      <MobileNav links={FALLBACK_LINKS} />
    </>
  );
}

export function Header() {
  return (
    <header className="bg-background/85 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-2 px-4 sm:px-6">
        <Link
          href="/"
          className="mr-auto rounded-md text-base font-semibold tracking-tight"
        >
          <Suspense fallback={<Skeleton className="h-5 w-40" aria-hidden />}>
            <Brand />
          </Suspense>
        </Link>
        <Suspense fallback={<NavFallback />}>
          <Nav />
        </Suspense>
        <div className="flex items-center gap-1 lg:ml-2 lg:border-l lg:pl-2">
          <ThemeToggle />
          <AccessibilityMenu />
        </div>
      </div>
    </header>
  );
}
