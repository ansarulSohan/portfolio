"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import {
  changePassword,
  saveSettings,
  signOutEverywhere,
} from "@/actions/admin/settings";
import { Button } from "@/components/ui/button";
import type { SettingsDTO } from "@/lib/dto";
import type { SectionKey } from "@/lib/validation";
import { EditorSection, EditorShell } from "./EditorShell";
import { SwitchField, TextField } from "./fields";
import { useAdminAction } from "./useAdminAction";

const SECTION_LABELS: Record<SectionKey, string> = {
  about: "About",
  projects: "Projects",
  experience: "Experience",
  skills: "Skills",
  education: "Education",
  contact: "Contact form",
};

export function SectionsForm({ settings }: { settings: SettingsDTO }) {
  const [sections, setSections] = useState(settings.sections);
  const { pending, errors, run } = useAdminAction();
  return (
    <EditorShell
      title="Settings"
      description="Choose which sections appear on the home page."
      onSubmit={() => run(() => saveSettings({ sections }))}
      pending={pending}
      submitLabel="Save sections"
      formError={errors._form}
    >
      <EditorSection
        title="Home page sections"
        description="Hidden sections also disappear from the navigation."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(SECTION_LABELS) as SectionKey[]).map((key) => (
            <SwitchField
              key={key}
              label={SECTION_LABELS[key]}
              checked={sections[key]}
              onChange={(value) =>
                setSections((current) => ({ ...current, [key]: value }))
              }
            />
          ))}
        </div>
      </EditorSection>
    </EditorShell>
  );
}

export function PasswordForm() {
  const empty = { current: "", next: "", confirm: "" };
  const [form, setForm] = useState(empty);
  const { pending, errors, run } = useAdminAction();
  const set = (key: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        run(() => changePassword(form), { onSuccess: () => setForm(empty) });
      }}
    >
      <EditorSection
        title="Change password"
        description="At least 12 characters. Changing it signs out every other device."
      >
        <TextField
          label="Current password"
          type="password"
          autoComplete="current-password"
          value={form.current}
          onChange={set("current")}
          error={errors.current}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="New password"
            type="password"
            autoComplete="new-password"
            value={form.next}
            onChange={set("next")}
            error={errors.next}
            minLength={12}
          />
          <TextField
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={form.confirm}
            onChange={set("confirm")}
            error={errors.confirm}
          />
        </div>
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "Changing…" : "Change password"}
        </Button>
      </EditorSection>
    </form>
  );
}

export function SessionsForm() {
  const { pending, run } = useAdminAction();
  const router = useRouter();
  return (
    <EditorSection
      title="Sessions"
      description="Lost a device or signed in somewhere public? Sign out of every browser, including this one."
    >
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        className="self-start"
        onClick={() =>
          run(() => signOutEverywhere(), {
            refresh: false,
            onSuccess: () => router.replace("/admin/login"),
          })
        }
      >
        <LogOutIcon aria-hidden data-icon="inline-start" />
        Sign out everywhere
      </Button>
    </EditorSection>
  );
}
