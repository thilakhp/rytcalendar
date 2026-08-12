import { cn } from "@/lib/utils";
import type { CalendarBatch } from "@/components/calendar/types";

const STATUS_DOT: Record<string, string> = {
  planned: "bg-amber-400",
  confirmed: "bg-blue-500",
  in_progress: "bg-violet-500",
  completed: "bg-emerald-500",
  cancelled: "bg-slate-300",
};

export function BatchChip({
  batch,
  onClick,
  dense = false,
}: {
  batch: CalendarBatch;
  onClick: () => void;
  dense?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-1.5 truncate rounded-md px-1.5 py-1 text-left text-xs transition hover:bg-slate-100",
        batch.status === "cancelled" && "line-through opacity-60",
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_DOT[batch.status] ?? "bg-slate-300")}
      />
      <span className="truncate font-medium text-slate-700">
        {batch.training_courses?.name ?? "Training"}
      </span>
      {!dense && (
        <span className="truncate text-slate-400">
          {batch.engagements?.clients?.name}
        </span>
      )}
    </button>
  );
}
