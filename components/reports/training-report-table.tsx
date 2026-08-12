"use client";

import { SortableTable, type SortableColumn } from "@/components/reports/sortable-table";
import type { TrainingReportRow } from "@/lib/analytics";

const columns: SortableColumn<TrainingReportRow>[] = [
  { key: "course", header: "Training", cell: (r) => r.courseName, sortValue: (r) => r.courseName },
  { key: "batches", header: "Batches", cell: (r) => r.batches, sortValue: (r) => r.batches, align: "right" },
  { key: "days", header: "Days", cell: (r) => r.days, sortValue: (r) => r.days, align: "right" },
  { key: "hours", header: "Hours", cell: (r) => r.hours, sortValue: (r) => r.hours, align: "right" },
  { key: "vendors", header: "Vendors", cell: (r) => r.vendors, sortValue: (r) => r.vendors, align: "right" },
  { key: "clients", header: "Clients", cell: (r) => r.clients, sortValue: (r) => r.clients, align: "right" },
];

export function TrainingReportTable({ rows }: { rows: TrainingReportRow[] }) {
  return <SortableTable columns={columns} rows={rows} defaultSortKey="hours" />;
}
