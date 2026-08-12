import { Card } from "@/components/ui/card";

export function ProgramSummary({
  batchCount,
  courseCount,
  totalWorkingDays,
  totalHours,
  totalPax,
}: {
  batchCount: number;
  courseCount: number;
  totalWorkingDays: number;
  totalHours: number;
  totalPax: number;
}) {
  const items: [string, number][] = [
    ["Batches", batchCount],
    ["Training Courses", courseCount],
    ["Working Days", totalWorkingDays],
    ["Training Hours", totalHours],
    ["Total PAX", totalPax],
    ["Clients", batchCount > 0 ? 1 : 0],
    ["Vendors", batchCount > 0 ? 1 : 0],
  ];

  return (
    <Card className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4 lg:grid-cols-7">
      {items.map(([label, value]) => (
        <div key={label}>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {label}
          </div>
          <div className="mt-1 text-xl font-semibold text-slate-900">{value}</div>
        </div>
      ))}
    </Card>
  );
}
