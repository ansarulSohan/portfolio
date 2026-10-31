import type { Metadata } from "next";
import { ProfileEditor } from "@/components/admin/editors/ProfileEditor";
import { getAdminProfile } from "@/lib/admin-queries";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const profile = await getAdminProfile();
  return <ProfileEditor profile={profile} />;
}
