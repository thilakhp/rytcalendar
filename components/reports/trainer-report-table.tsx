"use client";

import { SortableTable, type SortableColumn } from "@/components/reports/sortable-table";
import type { TrainerReportRow } from "@/lib/analytics";

const columns: SortableColumn<TrainerReportRow>[] = [
  { key: "trainer", header: "Trainer", cell: (r) => r.trainerName, sortValue: (r) => r.trainerName },
  { key: "batches", header: "Batches", cell: (r) => r.batches, sortValue: (r) => r.batches, align: "right" },
  { key: "days", header: "Days", cell: (r) => r.days, sortValue: (r) => r.days, align: "right" },
  { key: "hours", header: "Hours", cell: (r) => r.hours, sortValue: (r) => r.hours, align: "right" },
  { key: "pax", header: "PAX", cell: (r) => r.pax, sortValue: (r) => r.pax, align: "right" },
];

export function TrainerReportTable({ rows }: { rows: TrainerReportRow[] }) {
  return (
    <SortableTable
      columns={columns}
      rows={rows}
      defaultSortKey="hours"
      emptyMessage="No batches with an assigned trainer for the current filters."
    />
  );
}
