"use client";

import Link from "next/link";
import { SortableTable, type SortableColumn } from "@/components/reports/sortable-table";
import type { VendorReportRow } from "@/lib/analytics";

const columns: SortableColumn<VendorReportRow>[] = [
  {
    key: "vendor",
    header: "Vendor",
    cell: (r) => (
      <Link href={`/vendors/${r.vendorId}`} className="font-medium text-slate-900 hover:underline">
        {r.vendorName}
      </Link>
    ),
    sortValue: (r) => r.vendorName,
  },
  { key: "engagements", header: "Engagements", cell: (r) => r.engagements, sortValue: (r) => r.engagements, align: "right" },
  { key: "batches", header: "Batches", cell: (r) => r.batches, sortValue: (r) => r.batches, align: "right" },
  { key: "days", header: "Days", cell: (r) => r.days, sortValue: (r) => r.days, align: "right" },
  { key: "hours", header: "Hours", cell: (r) => r.hours, sortValue: (r) => r.hours, align: "right" },
  { key: "pax", header: "PAX", cell: (r) => r.pax, sortValue: (r) => r.pax, align: "right" },
];

export function VendorReportTable({ rows }: { rows: VendorReportRow[] }) {
  return <SortableTable columns={columns} rows={rows} defaultSortKey="hours" />;
}
