import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { EntityTable, type Column } from "@/components/data/entity-table";
import type { Holiday } from "@/lib/types";
import { Plus } from "lucide-react";

export default async function HolidaysPage() {
  const supabase = await createClient();
  const { data: holidays } = await supabase
    .from("holidays")
    .select("*")
    .order("date");

  const columns: Column<Holiday>[] = [
    { header: "Date", cell: (h) => h.date },
    { header: "Holiday", cell: (h) => h.name },
    { header: "Country", cell: (h) => h.country || "—" },
    { header: "Region", cell: (h) => h.region || "—" },
    {
      header: "Blocks Availability",
      cell: (h) => (h.is_working_day ? "No" : "Yes"),
    },
  ];

  return (
    <>
      <PageHeader
        title="Holidays"
        description="Used to calculate working days across the calendar and availability checker."
        action={
          <LinkButton href="/settings/holidays/new">
            <Plus size={16} /> Add Holiday
          </LinkButton>
        }
      />
      <EntityTable
        columns={columns}
        rows={holidays ?? []}
        rowHref={(h) => `/settings/holidays/${h.id}/edit`}
        emptyMessage="No holidays configured yet."
      />
    </>
  );
}
