import type { Metadata } from "next";
import { deleteListItem, moveListItem } from "@/actions/admin/lists";
import { SortableList } from "@/components/admin/SortableList";
import { listEducation } from "@/lib/admin-queries";
import { formatRange } from "@/lib/site";

export const metadata: Metadata = { title: "Education" };

export default async function AdminEducationListPage() {
  const items = await listEducation();
  return (
    <SortableList
      title="Education"
      description="Degrees and courses, in the order shown on the site."
      newLabel="Add education"
      basePath="/admin/education"
      // Bound server actions: the list kind is fixed on the server side.
      onMove={moveListItem.bind(null, "education")}
      onDelete={deleteListItem.bind(null, "education")}
      emptyText="No education yet."
      rows={items.map((item) => ({
        id: item.id,
        title: item.degree,
        subtitle: `${item.institution} · ${formatRange(item.start, item.end)}`,
      }))}
    />
  );
}
