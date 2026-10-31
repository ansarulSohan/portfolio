import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Dashboard" };

// Placeholder until phase 6 builds the dashboard and content editors.
export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground mt-2">
        Signed in as {admin.email}. Content editors arrive in the next phase.
      </p>
    </div>
  );
}
