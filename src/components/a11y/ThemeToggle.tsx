"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrefs } from "./PrefsProvider";

/** One-click light/dark switch. "Follow system" lives in the accessibility menu. */
export function ThemeToggle() {
  const { isDark, update } = usePrefs();
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => update({ theme: isDark ? "light" : "dark" })}
      aria-label={label}
      title={label}
    >
      {/* Both icons render; CSS picks one so the server HTML is right before hydration. */}
      <SunIcon className="hidden dark:block" aria-hidden />
      <MoonIcon className="dark:hidden" aria-hidden />
    </Button>
  );
}
