import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EducationEditor } from "@/components/admin/editors/EducationEditor";
import { getEducationItem } from "@/lib/admin-queries";

export const metadata: Metadata = { title: "Edit education" };

export default async function EditEducationPage({
  params,
}: PageProps<"/admin/education/[id]">) {
  const { id } = await params;
  const item = await getEducationItem(id);
  if (!item) notFound();
  return <EducationEditor key={item.id} item={item} />;
}
