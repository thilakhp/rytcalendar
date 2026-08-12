"use client";

import { useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
} from "date-fns";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { BatchChip } from "@/components/calendar/batch-chip";
import type { CalendarBatch } from "@/components/calendar/types";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_VISIBLE = 3;

export function MonthGrid({
  focus,
  dayMap,
  onSelectBatch,
}: {
  focus: Date;
  dayMap: Map<string, CalendarBatch[]>;
  onSelectBatch: (b: CalendarBatch) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const gridStart = startOfWeek(startOfMonth(focus), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(focus), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/60">
        {WEEKDAY_LABELS.map((d) => (
          <div
            key={d}
            className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const batches = dayMap.get(key) ?? [];
          const inMonth = isSameMonth(day, focus);
          const isExpanded = expanded === key;
          const visible = isExpanded ? batches : batches.slice(0, MAX_VISIBLE);
          const hidden = batches.length - visible.length;

          return (
            <div
              key={key}
              className={cn(
                "min-h-[96px] border-b border-r border-slate-100 p-1.5 last:border-r-0",
                !inMonth && "bg-slate-50/40",
              )}
            >
              <div
                className={cn(
                  "mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs",
                  isToday(day)
                    ? "bg-slate-900 font-semibold text-white"
                    : inMonth
                      ? "text-slate-700"
                      : "text-slate-300",
                )}
              >
                {format(day, "d")}
              </div>
              <div className="space-y-0.5">
                {visible.map((b) => (
                  <BatchChip key={b.id} batch={b} onClick={() => onSelectBatch(b)} dense />
                ))}
                {hidden > 0 && (
                  <button
                    type="button"
                    onClick={() => setExpanded(key)}
                    className="px-1.5 text-[11px] font-medium text-slate-400 hover:text-slate-600"
                  >
                    +{hidden} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
