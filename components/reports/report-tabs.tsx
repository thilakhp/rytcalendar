import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "vendor", label: "By Vendor" },
  { key: "training", label: "By Training" },
  { key: "client", label: "By Client" },
  { key: "trainer", label: "By Trainer" },
  { key: "monthly", label: "Monthly" },
  { key: "matrix", label: "Vendor × Training" },
  { key: "status", label: "Status Breakdown" },
];

export function ReportTabs({ active, queryString }: { active: string; queryString: string }) {
  return (
    <div className="mb-5 flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={`/reports?tab=${t.key}${queryString}`}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition",
            active === t.key ? "bg-brand-500 text-white" : "text-slate-600 hover:bg-slate-100",
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
