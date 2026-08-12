"use client";

import { startOfWeek, endOfWeek, eachDayOfInterval, format, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/data/status-badge";
import type { CalendarBatch } from "@/components/calendar/types";

export function WeekGrid({
  focus,
  dayMap,
  onSelectBatch,
}: {
  focus: Date;
  dayMap: Map<string, CalendarBatch[]>;
  onSelectBatch: (b: CalendarBatch) => void;
}) {
  const start = startOfWeek(focus, { weekStartsOn: 1 });
  const end = endOfWeek(focus, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
      {days.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        const batches = dayMap.get(key) ?? [];
        return (
          <Card key={key} className="flex flex-col p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {format(day, "EEE")}
              </div>
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                  isToday(day) ? "bg-brand-500 text-white" : "text-slate-700",
                )}
              >
                {format(day, "d")}
              </div>
            </div>
            <div className="space-y-2">
              {batches.length === 0 && (
                <p className="text-xs text-slate-300">No training</p>
              )}
              {batches.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onSelectBatch(b)}
                  className={cn(
                    "w-full rounded-lg border border-slate-200 p-2 text-left text-xs hover:border-slate-300 hover:bg-slate-50",
                    b.status === "cancelled" && "opacity-60",
                  )}
                >
                  <div className="font-medium text-slate-800">
                    {b.training_courses?.name ?? "Training"}
                  </div>
                  <div className="mt-0.5 text-slate-500">
                    {b.start_time?.slice(0, 5)}–{b.end_time?.slice(0, 5)}
                  </div>
                  <div className="text-slate-400">
                    {b.engagements?.clients?.name} · {b.engagements?.vendors?.name}
                  </div>
                  <div className="mt-1">
                    <StatusBadge status={b.status} />
                  </div>
                </button>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
