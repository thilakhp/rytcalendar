"use client";

import Link from "next/link";
import { SortableTable, type SortableColumn } from "@/components/reports/sortable-table";
import type { ClientReportRow } from "@/lib/analytics";

const columns: SortableColumn<ClientReportRow>[] = [
  {
    key: "client",
    header: "Client",
    cell: (r) => (
      <Link href={`/clients/${r.clientId}`} className="font-medium text-slate-900 hover:underline">
        {r.clientName}
      </Link>
    ),
    sortValue: (r) => r.clientName,
  },
  { key: "programs", header: "Programs", cell: (r) => r.programs, sortValue: (r) => r.programs, align: "right" },
  { key: "batches", header: "Batches", cell: (r) => r.batches, sortValue: (r) => r.batches, align: "right" },
  { key: "days", header: "Days", cell: (r) => r.days, sortValue: (r) => r.days, align: "right" },
  { key: "hours", header: "Hours", cell: (r) => r.hours, sortValue: (r) => r.hours, align: "right" },
  { key: "pax", header: "PAX", cell: (r) => r.pax, sortValue: (r) => r.pax, align: "right" },
  { key: "vendors", header: "Vendors", cell: (r) => r.vendors, sortValue: (r) => r.vendors, align: "right" },
];

export function ClientReportTable({ rows }: { rows: ClientReportRow[] }) {
  return <SortableTable columns={columns} rows={rows} defaultSortKey="hours" />;
}
