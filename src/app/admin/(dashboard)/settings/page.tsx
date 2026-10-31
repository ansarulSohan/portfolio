import type { Metadata } from "next";
import {
  PasswordForm,
  SectionsForm,
  SessionsForm,
} from "@/components/admin/SettingsForms";
import { getAdminSettings } from "@/lib/admin-queries";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const settings = await getAdminSettings();
  return (
    <div className="flex flex-col gap-8">
      <SectionsForm settings={settings} />
      <h2 className="sr-only">Account</h2>
      <PasswordForm />
      <SessionsForm />
    </div>
  );
}
