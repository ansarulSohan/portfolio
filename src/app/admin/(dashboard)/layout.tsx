import { Suspense } from "react";
import Link from "next/link";
import { ExternalLinkIcon, LogOutIcon } from "lucide-react";
import { logout } from "@/actions/auth";
import { AccessibilityMenu } from "@/components/a11y/AccessibilityMenu";
import { SkipLink } from "@/components/a11y/SkipLink";
import { ThemeToggle } from "@/components/a11y/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminNav } from "@/components/admin/AdminNav";
import { Toaster } from "@/components/ui/sonner";
import { countUnreadMessages } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth";

/** Reads the session, so it renders inside the layout's Suspense boundary. */
async function AdminGate({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const unread = await countUnreadMessages();
  return (
    <>
      <header className="bg-background sticky top-0 z-40 border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:px-6">
          <Link
            href="/admin"
            className="mr-auto rounded-sm font-semibold tracking-tight"
          >
            Portfolio admin
          </Link>
          <span className="text-muted-foreground hidden text-sm sm:inline">
            {admin.email}
          </span>
          <Button asChild variant="ghost" size="sm">
            <Link href="/" target="_blank">
              View site
              <ExternalLinkIcon aria-hidden data-icon="inline-end" />
              <span className="sr-only">(opens in a new tab)</span>
            </Link>
          </Button>
          <ThemeToggle />
          <AccessibilityMenu />
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm">
              <LogOutIcon aria-hidden data-icon="inline-start" />
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 py-6 sm:px-6 md:grid-cols-[13rem_minmax(0,1fr)] md:py-8">
        <aside className="md:sticky md:top-20 md:self-start">
          <AdminNav unread={unread} />
        </aside>
        <main id="main" tabIndex={-1} className="min-w-0 outline-none">
          {children}
        </main>
      </div>
      <Toaster position="bottom-right" />
    </>
  );
}

function AdminSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading admin"
      className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6"
    >
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-6 h-40 w-full" />
    </div>
  );
}

export default function DashboardLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <SkipLink />
      <Suspense fallback={<AdminSkeleton />}>
        <AdminGate>{children}</AdminGate>
      </Suspense>
    </>
  );
}
