import type { Metadata } from "next";
import { deleteListItem, moveListItem } from "@/actions/admin/lists";
import { SortableList } from "@/components/admin/SortableList";
import { listSkillCategories } from "@/lib/admin-queries";

export const metadata: Metadata = { title: "Skills" };

export default async function AdminSkillCategoryListPage() {
  const items = await listSkillCategories();
  return (
    <SortableList
      title="Skills"
      description="Skill groups, in the order shown on the site."
      newLabel="Add skill group"
      basePath="/admin/skills"
      // Bound server actions: the list kind is fixed on the server side.
      onMove={moveListItem.bind(null, "skills")}
      onDelete={deleteListItem.bind(null, "skills")}
      emptyText="No skill groups yet."
      rows={items.map((item) => ({
        id: item.id,
        title: item.name,
        subtitle: item.items.map((skill) => skill.name).join(", "),
      }))}
    />
  );
}
