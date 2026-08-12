import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { EntityTable, type Column } from "@/components/data/entity-table";
import { ActiveBadge } from "@/components/data/status-badge";
import type { TrainingCourse } from "@/lib/types";
import { Plus } from "lucide-react";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status = "active" } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("training_courses").select("*").order("name");
  if (q) query = query.ilike("name", `%${q}%`);
  if (status === "active") query = query.eq("active", true);
  if (status === "inactive") query = query.eq("active", false);

  const { data: courses } = await query;

  const columns: Column<TrainingCourse>[] = [
    { header: "Training", cell: (c) => c.name },
    { header: "Product / Platform", cell: (c) => c.product_platform || "—" },
    { header: "Category", cell: (c) => c.category || "—" },
    {
      header: "Standard Duration",
      cell: (c) =>
        c.standard_duration_days ? `${c.standard_duration_days} days` : "—",
    },
    {
      header: "Standard Hours",
      cell: (c) => c.standard_total_hours ?? "—",
    },
    { header: "Status", cell: (c) => <ActiveBadge active={c.active} /> },
  ];

  return (
    <>
      <PageHeader
        title="Training Catalog"
        description="Master list of training courses — enter once, use everywhere."
        action={
          <LinkButton href="/catalog/new">
            <Plus size={16} /> Add Training
          </LinkButton>
        }
      />
      <SearchFilterBar basePath="/catalog" q={q} status={status} placeholder="Search training courses…" />
      <EntityTable
        columns={columns}
        rows={courses ?? []}
        rowHref={(c) => `/catalog/${c.id}/edit`}
        emptyMessage="No training courses yet. Add your first course to get started."
      />
    </>
  );
}
