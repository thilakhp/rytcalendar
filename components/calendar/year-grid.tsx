"use client";

import Link from "next/link";
import {
  startOfYear,
  addMonths,
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
import type { CalendarBatch } from "@/components/calendar/types";

function MiniMonth({
  monthStart,
  dayMap,
}: {
  monthStart: Date;
  dayMap: Map<string, CalendarBatch[]>;
}) {
  const gridStart = startOfWeek(startOfMonth(monthStart), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <Card className="p-3">
      <div className="mb-2 text-sm font-semibold text-slate-900">
        {format(monthStart, "MMMM")}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5 text-center text-[10px] text-slate-300">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const count = dayMap.get(key)?.length ?? 0;
          const inMonth = isSameMonth(day, monthStart);
          return (
            <Link
              key={key}
              href={`/calendar?view=day&date=${key}`}
              className={cn(
                "mx-auto flex h-6 w-6 items-center justify-center rounded-full text-[11px]",
                !inMonth && "text-slate-200",
                inMonth && count === 0 && "text-slate-500",
                inMonth && count > 0 && "bg-brand-500 font-medium text-white",
                inMonth && isToday(day) && count === 0 && "ring-1 ring-brand-400",
              )}
            >
              {format(day, "d")}
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

export function YearGrid({
  focus,
  dayMap,
}: {
  focus: Date;
  dayMap: Map<string, CalendarBatch[]>;
}) {
  const yearStart = startOfYear(focus);
  const months = Array.from({ length: 12 }, (_, i) => addMonths(yearStart, i));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {months.map((m) => (
        <MiniMonth key={format(m, "yyyy-MM")} monthStart={m} dayMap={dayMap} />
      ))}
    </div>
  );
}
