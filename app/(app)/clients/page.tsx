import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { EntityTable, type Column } from "@/components/data/entity-table";
import { ActiveBadge } from "@/components/data/status-badge";
import type { Client } from "@/lib/types";
import { Plus } from "lucide-react";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status = "active" } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("clients").select("*").order("name");
  if (q) query = query.ilike("name", `%${q}%`);
  if (status === "active") query = query.eq("active", true);
  if (status === "inactive") query = query.eq("active", false);

  const { data: clients } = await query;

  const columns: Column<Client>[] = [
    { header: "Client", cell: (c) => c.name },
    { header: "Industry", cell: (c) => c.industry || "—" },
    { header: "Contact", cell: (c) => c.contact_person || "—" },
    { header: "Country", cell: (c) => c.country || "—" },
    { header: "Status", cell: (c) => <ActiveBadge active={c.active} /> },
  ];

  return (
    <>
      <PageHeader
        title="Clients"
        description="Client organizations — enter once, use everywhere."
        action={
          <LinkButton href="/clients/new">
            <Plus size={16} /> Add Client
          </LinkButton>
        }
      />
      <SearchFilterBar basePath="/clients" q={q} status={status} placeholder="Search clients…" />
      <EntityTable
        columns={columns}
        rows={clients ?? []}
        rowHref={(c) => `/clients/${c.id}`}
        emptyMessage="No clients yet. Add your first client to get started."
      />
    </>
  );
}
