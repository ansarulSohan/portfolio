import type { Metadata } from "next";
import { deleteListItem, moveListItem } from "@/actions/admin/lists";
import { SortableList } from "@/components/admin/SortableList";
import { listExperience } from "@/lib/admin-queries";
import { formatRange } from "@/lib/site";

export const metadata: Metadata = { title: "Experience" };

export default async function AdminExperienceListPage() {
  const items = await listExperience();
  return (
    <SortableList
      title="Experience"
      description="Your work history, in the order shown on the site."
      newLabel="Add experience"
      basePath="/admin/experience"
      // Bound server actions: the list kind is fixed on the server side.
      onMove={moveListItem.bind(null, "experience")}
      onDelete={deleteListItem.bind(null, "experience")}
      emptyText="No experience yet."
      rows={items.map((item) => ({
        id: item.id,
        title: `${item.role} · ${item.company}`,
        subtitle: formatRange(item.start, item.end),
      }))}
    />
  );
}
