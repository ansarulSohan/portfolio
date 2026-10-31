import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExperienceEditor } from "@/components/admin/editors/ExperienceEditor";
import { getExperienceItem } from "@/lib/admin-queries";

export const metadata: Metadata = { title: "Edit experience" };

export default async function EditExperiencePage({
  params,
}: PageProps<"/admin/experience/[id]">) {
  const { id } = await params;
  const item = await getExperienceItem(id);
  if (!item) notFound();
  return <ExperienceEditor key={item.id} item={item} />;
}
