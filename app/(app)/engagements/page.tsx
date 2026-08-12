import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { EntityTable, type Column } from "@/components/data/entity-table";
import { StatusBadge } from "@/components/data/status-badge";
import { Plus } from "lucide-react";

type EngagementRow = {
  id: string;
  program_name: string;
  overall_status: string;
  total_pax: number | null;
  clients: { name: string } | null;
  vendors: { name: string } | null;
};

export default async function EngagementsPage() {
  const supabase = await createClient();
  const { data: engagements } = await supabase
    .from("engagements")
    .select("id, program_name, overall_status, total_pax, clients(name), vendors(name)")
    .order("created_at", { ascending: false })
    .returns<EngagementRow[]>();

  const ids = (engagements ?? []).map((e) => e.id);
  const { data: batches } = ids.length
    ? await supabase
        .from("batches")
        .select("engagement_id, working_days, total_hours")
        .in("engagement_id", ids)
    : { data: [] };

  const statsByEngagement = new Map<string, { batches: number; days: number; hours: number }>();
  for (const b of batches ?? []) {
    const cur = statsByEngagement.get(b.engagement_id) ?? { batches: 0, days: 0, hours: 0 };
    cur.batches += 1;
    cur.days += b.working_days ?? 0;
    cur.hours += b.total_hours ?? 0;
    statsByEngagement.set(b.engagement_id, cur);
  }

  const columns: Column<EngagementRow>[] = [
    { header: "Program", cell: (e) => e.program_name },
    { header: "Client", cell: (e) => e.clients?.name || "—" },
    { header: "Vendor", cell: (e) => e.vendors?.name || "—" },
    {
      header: "Batches",
      cell: (e) => statsByEngagement.get(e.id)?.batches ?? 0,
    },
    {
      header: "Working Days",
      cell: (e) => statsByEngagement.get(e.id)?.days ?? 0,
    },
    {
      header: "Hours",
      cell: (e) => Math.round((statsByEngagement.get(e.id)?.hours ?? 0) * 100) / 100,
    },
    { header: "PAX", cell: (e) => e.total_pax ?? "—" },
    { header: "Status", cell: (e) => <StatusBadge status={e.overall_status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Training Engagements"
        description="One program, many training batches — the source of truth for the calendar, availability, and reports."
        action={
          <LinkButton href="/engagements/new">
            <Plus size={16} /> New Engagement
          </LinkButton>
        }
      />
      <EntityTable
        columns={columns}
        rows={engagements ?? []}
        rowHref={(e) => `/engagements/${e.id}`}
        emptyMessage="No training engagements yet. Create your first program to get started."
      />
    </>
  );
}
