/**
 * Visitor display preferences (theme + accessibility). They're stored in
 * localStorage and applied as attributes on <html>, which globals.css styles:
 *
 *   class="dark"            theme
 *   data-contrast="more"    high contrast
 *   data-text="lg|xl"       text size
 *   data-motion="reduce|full"
 *   data-font="hyperlegible"
 *   data-links="underline"
 *   data-spacing="wide"
 *
 * PREFS_SCRIPT applies them before first paint (no flash); the React menu
 * calls applyPrefs() whenever a preference changes.
 */

export type ThemePref = "system" | "light" | "dark";
export type TextSize = "base" | "lg" | "xl";
/** "system" follows the OS setting (prefers-reduced-motion / prefers-contrast). */
export type SystemToggle = "system" | "on" | "off";

export interface Prefs {
  theme: ThemePref;
  contrast: SystemToggle;
  motion: SystemToggle;
  text: TextSize;
  hyperlegible: boolean;
  underlineLinks: boolean;
  wideSpacing: boolean;
}

export const DEFAULT_PREFS: Prefs = {
  theme: "system",
  contrast: "system",
  motion: "system",
  text: "base",
  hyperlegible: false,
  underlineLinks: false,
  wideSpacing: false,
};

export const PREFS_STORAGE_KEY = "prefs:v1";

/** Fill in defaults and drop unknown values from whatever is in storage. */
export function normalizePrefs(raw: unknown): Prefs {
  const value = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const pick = <T extends string>(
    key: string,
    allowed: readonly T[],
    fallback: T,
  ): T => (allowed.includes(value[key] as T) ? (value[key] as T) : fallback);
  const flag = (key: string, fallback: boolean) =>
    typeof value[key] === "boolean" ? (value[key] as boolean) : fallback;
  const toggles = ["system", "on", "off"] as const;
  return {
    theme: pick(
      "theme",
      ["system", "light", "dark"] as const,
      DEFAULT_PREFS.theme,
    ),
    contrast: pick("contrast", toggles, DEFAULT_PREFS.contrast),
    motion: pick("motion", toggles, DEFAULT_PREFS.motion),
    text: pick("text", ["base", "lg", "xl"] as const, DEFAULT_PREFS.text),
    hyperlegible: flag("hyperlegible", DEFAULT_PREFS.hyperlegible),
    underlineLinks: flag("underlineLinks", DEFAULT_PREFS.underlineLinks),
    wideSpacing: flag("wideSpacing", DEFAULT_PREFS.wideSpacing),
  };
}

export function readPrefs(): Prefs {
  try {
    return normalizePrefs(
      JSON.parse(localStorage.getItem(PREFS_STORAGE_KEY) ?? "null"),
    );
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: Prefs): void {
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Storage blocked (private mode, disabled cookies): prefs last for this page only.
  }
}

export function systemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Set the <html> attributes for `prefs`. Must match PREFS_SCRIPT below. */
export function applyPrefs(
  prefs: Prefs,
  root: HTMLElement = document.documentElement,
): void {
  const dark =
    prefs.theme === "dark" || (prefs.theme === "system" && systemPrefersDark());
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
  const set = (name: string, value: string | null) =>
    value === null
      ? root.removeAttribute(name)
      : root.setAttribute(name, value);
  // "system" contrast/motion leave the attribute off so CSS media queries decide.
  set(
    "data-contrast",
    prefs.contrast === "on"
      ? "more"
      : prefs.contrast === "system" &&
          window.matchMedia("(prefers-contrast: more)").matches
        ? "more"
        : null,
  );
  set(
    "data-motion",
    prefs.motion === "on" ? "reduce" : prefs.motion === "off" ? "full" : null,
  );
  set("data-text", prefs.text === "base" ? null : prefs.text);
  set("data-font", prefs.hyperlegible ? "hyperlegible" : null);
  set("data-links", prefs.underlineLinks ? "underline" : null);
  set("data-spacing", prefs.wideSpacing ? "wide" : null);
}

/**
 * Inline <head> script: the same logic as normalizePrefs + applyPrefs, as
 * plain ES5 so it runs before the bundle loads. Keep the two in sync.
 */
export const PREFS_SCRIPT = `(function(){try{
var d=document.documentElement,p={};
try{p=JSON.parse(localStorage.getItem(${JSON.stringify(PREFS_STORAGE_KEY)})||"{}")||{}}catch(e){}
var mm=function(q){return window.matchMedia(q).matches};
var dark=p.theme==="dark"||(p.theme!=="light"&&mm("(prefers-color-scheme: dark)"));
d.classList.toggle("dark",dark);d.style.colorScheme=dark?"dark":"light";
if(p.contrast==="on"||(p.contrast!=="off"&&mm("(prefers-contrast: more)")))d.setAttribute("data-contrast","more");
if(p.motion==="on")d.setAttribute("data-motion","reduce");else if(p.motion==="off")d.setAttribute("data-motion","full");
if(p.text==="lg"||p.text==="xl")d.setAttribute("data-text",p.text);
if(p.hyperlegible===true)d.setAttribute("data-font","hyperlegible");
if(p.underlineLinks===true)d.setAttribute("data-links","underline");
if(p.wideSpacing===true)d.setAttribute("data-spacing","wide");
}catch(e){}})();`;
