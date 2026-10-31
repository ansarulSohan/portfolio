import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, Geist, Geist_Mono } from "next/font/google";
import { InlineScript } from "@/components/a11y/InlineScript";
import { PrefsProvider } from "@/components/a11y/PrefsProvider";
import { PREFS_SCRIPT } from "@/lib/prefs";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
// Only downloaded when a visitor turns on "Hyperlegible font".
const hyperlegible = Atkinson_Hyperlegible({
  variable: "--font-hyperlegible",
  subsets: ["latin"],
  weight: ["400", "700"],
  preload: false,
});

// Page-specific titles and descriptions come from the profile (see (site)/layout.tsx).
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfcfd" },
    { media: "(prefers-color-scheme: dark)", color: "#151821" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The prefs script edits <html> attributes before hydration.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${hyperlegible.variable} h-full antialiased`}
    >
      <head>
        <InlineScript html={PREFS_SCRIPT} />
      </head>
      <body className="flex min-h-full flex-col">
        <PrefsProvider>{children}</PrefsProvider>
      </body>
    </html>
  );
}
