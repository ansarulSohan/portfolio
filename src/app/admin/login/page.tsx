import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, LockKeyholeIcon } from "lucide-react";
import { LoginForm } from "@/components/admin/LoginForm";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main
      id="main"
      className="flex flex-1 items-center justify-center px-4 py-16"
    >
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-xl border p-6 shadow-sm sm:p-8">
          <div className="bg-primary/10 text-primary mb-5 flex size-10 items-center justify-center rounded-lg">
            <LockKeyholeIcon className="size-5" aria-hidden />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Sign in to admin
          </h1>
          <p className="text-muted-foreground mt-1 mb-6 text-sm">
            Manage your portfolio content.
          </p>
          {/* useSearchParams reads the request, so it needs a boundary. */}
          <Suspense fallback={<Skeleton className="h-56 w-full" />}>
            <LoginForm />
          </Suspense>
        </div>
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground mt-6 inline-flex items-center gap-1.5 rounded-sm text-sm"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          Back to site
        </Link>
      </div>
    </main>
  );
}
