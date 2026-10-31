import type { Metadata } from "next";
import { SkipLink } from "@/components/a11y/SkipLink";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getProfile } from "@/lib/queries";

/** Site-wide title and description defaults, from the profile the admin edits. */
export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  if (!profile) return { title: "Portfolio" };
  const defaultTitle =
    profile.seo.title ?? `${profile.name} — ${profile.title}`;
  const description =
    profile.seo.description ??
    profile.tagline ??
    // First sentence of the bio, trimmed to a search-snippet length.
    profile.bio.split(/(?<=[.!?])\s/)[0]?.slice(0, 160);
  return {
    title: { default: defaultTitle, template: `%s · ${profile.name}` },
    description,
    authors: [{ name: profile.name }],
    openGraph: {
      type: "website",
      siteName: profile.name,
      title: defaultTitle,
      description,
    },
    twitter: { card: "summary_large_image", title: defaultTitle, description },
  };
}

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SkipLink />
      <Header />
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-5xl flex-1 px-4 outline-none sm:px-6"
      >
        {children}
      </main>
      <Footer />
    </>
  );
}
