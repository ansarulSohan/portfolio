import { Suspense } from "react";
import { getProfile } from "@/lib/queries";
import { SocialLinks } from "./SocialLinks";

async function FooterContent() {
  const profile = await getProfile();
  // Safe here: getProfile() awaited io(), so this runs per request, not at build.
  const year = new Date().getFullYear();
  return (
    <>
      <p className="text-muted-foreground text-sm">
        © {year} {profile?.name ?? ""}
      </p>
      {profile && <SocialLinks profile={profile} />}
    </>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto flex min-h-20 max-w-5xl flex-col items-start justify-between gap-4 px-4 py-6 sm:flex-row sm:items-center sm:px-6">
        <Suspense fallback={<span className="h-5" />}>
          <FooterContent />
        </Suspense>
      </div>
    </footer>
  );
}
