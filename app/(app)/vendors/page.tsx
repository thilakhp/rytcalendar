import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { EntityTable, type Column } from "@/components/data/entity-table";
import { ActiveBadge } from "@/components/data/status-badge";
import type { Vendor } from "@/lib/types";
import { Plus } from "lucide-react";

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status = "active" } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("vendors").select("*").order("name");
  if (q) query = query.ilike("name", `%${q}%`);
  if (status === "active") query = query.eq("active", true);
  if (status === "inactive") query = query.eq("active", false);

  const { data: vendors } = await query;

  const columns: Column<Vendor>[] = [
    { header: "Vendor", cell: (v) => v.name },
    { header: "Company", cell: (v) => v.company_name || "—" },
    { header: "Contact", cell: (v) => v.contact_person || "—" },
    { header: "Country", cell: (v) => v.country || "—" },
    { header: "Status", cell: (v) => <ActiveBadge active={v.active} /> },
  ];

  return (
    <>
      <PageHeader
        title="Vendors"
        description="Training delivery partners — enter once, use everywhere."
        action={
          <LinkButton href="/vendors/new">
            <Plus size={16} /> Add Vendor
          </LinkButton>
        }
      />
      <SearchFilterBar basePath="/vendors" q={q} status={status} placeholder="Search vendors…" />
      <EntityTable
        columns={columns}
        rows={vendors ?? []}
        rowHref={(v) => `/vendors/${v.id}`}
        emptyMessage="No vendors yet. Add your first vendor to get started."
      />
    </>
  );
}
