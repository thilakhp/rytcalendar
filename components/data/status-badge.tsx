import { cn } from "@/lib/utils";

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500",
      )}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  planned: "bg-amber-50 text-amber-700",
  confirmed: "bg-blue-50 text-blue-700",
  in_progress: "bg-violet-50 text-violet-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-500 line-through",
};

const STATUS_LABELS: Record<string, string> = {
  planned: "Planned",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600",
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
