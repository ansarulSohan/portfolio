"use client";

import { useId } from "react";
import { AccessibilityIcon, RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Prefs, SystemToggle, TextSize, ThemePref } from "@/lib/prefs";
import { usePrefs } from "./PrefsProvider";

function matches(query: string): boolean {
  return typeof window !== "undefined" && window.matchMedia(query).matches;
}

/** A labelled single-choice group (radio semantics come from Radix ToggleGroup). */
function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <span id={id} className="text-sm font-medium">
        {label}
      </span>
      <ToggleGroup
        type="single"
        variant="outline"
        aria-labelledby={id}
        value={value}
        // Radix sends "" when the active item is clicked again; keep the current value.
        onValueChange={(next) => next && onChange(next as T)}
        className="w-full"
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            className="data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90 flex-1"
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <Label htmlFor={id}>{label}</Label>
        {description && (
          <p id={`${id}-desc`} className="text-muted-foreground text-xs">
            {description}
          </p>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        aria-describedby={description ? `${id}-desc` : undefined}
        className="mt-0.5"
      />
    </div>
  );
}

/** Switch state for a "system"-able setting: shows what's in effect right now. */
function resolved(value: SystemToggle, query: string): boolean {
  return value === "on" || (value === "system" && matches(query));
}

export function AccessibilityMenu() {
  const { prefs, update, reset } = usePrefs();
  const set =
    <K extends keyof Prefs>(key: K) =>
    (value: Prefs[K]) =>
      update({ [key]: value });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Accessibility and display settings"
          title="Accessibility and display settings"
        >
          <AccessibilityIcon aria-hidden />
        </Button>
      </PopoverTrigger>
      {/* Scrolls inside itself when large text or spacing makes it taller than the window. */}
      <PopoverContent
        align="end"
        className="max-h-[var(--radix-popover-content-available-height)] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto"
      >
        <PopoverHeader>
          <PopoverTitle>Display &amp; accessibility</PopoverTitle>
          <PopoverDescription>Saved on this device.</PopoverDescription>
        </PopoverHeader>

        <div className="flex flex-col gap-4">
          <Choice<ThemePref>
            label="Theme"
            value={prefs.theme}
            onChange={set("theme")}
            options={[
              { value: "system", label: "System" },
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
          />
          <Choice<TextSize>
            label="Text size"
            value={prefs.text}
            onChange={set("text")}
            options={[
              { value: "base", label: "Default" },
              { value: "lg", label: "Large" },
              { value: "xl", label: "Larger" },
            ]}
          />

          <Separator />

          <Toggle
            label="High contrast"
            description="Stronger colours and borders."
            checked={resolved(prefs.contrast, "(prefers-contrast: more)")}
            onChange={(on) => update({ contrast: on ? "on" : "off" })}
          />
          <Toggle
            label="Reduce motion"
            description="Turn off animations and smooth scrolling."
            checked={resolved(prefs.motion, "(prefers-reduced-motion: reduce)")}
            onChange={(on) => update({ motion: on ? "on" : "off" })}
          />
          <Toggle
            label="Hyperlegible font"
            description="Atkinson Hyperlegible, designed for low vision."
            checked={prefs.hyperlegible}
            onChange={set("hyperlegible")}
          />
          <Toggle
            label="Underline links"
            checked={prefs.underlineLinks}
            onChange={set("underlineLinks")}
          />
          <Toggle
            label="Wider text spacing"
            description="More space between letters, words and lines."
            checked={prefs.wideSpacing}
            onChange={set("wideSpacing")}
          />

          <Separator />

          <Button variant="outline" onClick={reset} className="self-start">
            <RotateCcwIcon aria-hidden data-icon="inline-start" />
            Reset to defaults
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
