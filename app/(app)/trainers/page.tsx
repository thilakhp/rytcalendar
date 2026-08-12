import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { EntityTable, type Column } from "@/components/data/entity-table";
import { ActiveBadge } from "@/components/data/status-badge";
import type { Trainer } from "@/lib/types";
import { Plus } from "lucide-react";

export default async function TrainersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status = "active" } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("trainers").select("*").order("name");
  if (q) query = query.ilike("name", `%${q}%`);
  if (status === "active") query = query.eq("active", true);
  if (status === "inactive") query = query.eq("active", false);

  const { data: trainers } = await query;

  const columns: Column<Trainer>[] = [
    { header: "Trainer", cell: (t) => t.name },
    { header: "Specialization", cell: (t) => t.specialization || "—" },
    { header: "Location", cell: (t) => t.location || "—" },
    { header: "Email", cell: (t) => t.email || "—" },
    { header: "Status", cell: (t) => <ActiveBadge active={t.active} /> },
  ];

  return (
    <>
      <PageHeader
        title="Trainers"
        description="Trainers available for assignment to training batches."
        action={
          <LinkButton href="/trainers/new">
            <Plus size={16} /> Add Trainer
          </LinkButton>
        }
      />
      <SearchFilterBar basePath="/trainers" q={q} status={status} placeholder="Search trainers…" />
      <EntityTable
        columns={columns}
        rows={trainers ?? []}
        rowHref={(t) => `/trainers/${t.id}/edit`}
        emptyMessage="No trainers yet. Add your first trainer to get started."
      />
    </>
  );
}
