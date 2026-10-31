import { SkipLink } from "@/components/a11y/SkipLink";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import SiteNotFound from "./(site)/not-found";

/** Unmatched URLs render outside the (site) layout, so add its chrome here. */
export default function NotFound() {
  return (
    <>
      <SkipLink />
      <Header />
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-5xl flex-1 px-4 outline-none sm:px-6"
      >
        <SiteNotFound />
      </main>
      <Footer />
    </>
  );
}
