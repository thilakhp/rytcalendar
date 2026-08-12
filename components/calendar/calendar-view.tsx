"use client";

import { useState } from "react";
import Link from "next/link";
import {
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  addYears,
  subYears,
  parseISO,
  format,
} from "date-fns";
import { cn } from "@/lib/utils";
import { buildDayMap } from "@/lib/schedule";
import type { HolidayLite } from "@/lib/calc";
import type { CalendarBatch } from "@/components/calendar/types";
import { MonthGrid } from "@/components/calendar/month-grid";
import { WeekGrid } from "@/components/calendar/week-grid";
import { DayList } from "@/components/calendar/day-list";
import { YearGrid } from "@/components/calendar/year-grid";
import { BatchDetailPanel } from "@/components/calendar/batch-detail-panel";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ViewMode = "month" | "week" | "day" | "year";

const VIEWS: { mode: ViewMode; label: string }[] = [
  { mode: "month", label: "Month" },
  { mode: "week", label: "Week" },
  { mode: "day", label: "Day" },
  { mode: "year", label: "Year" },
];

function shift(view: ViewMode, focus: Date, dir: 1 | -1) {
  switch (view) {
    case "week":
      return dir === 1 ? addWeeks(focus, 1) : subWeeks(focus, 1);
    case "day":
      return dir === 1 ? addDays(focus, 1) : subDays(focus, 1);
    case "year":
      return dir === 1 ? addYears(focus, 1) : subYears(focus, 1);
    case "month":
    default:
      return dir === 1 ? addMonths(focus, 1) : subMonths(focus, 1);
  }
}

function headerLabel(view: ViewMode, focus: Date) {
  switch (view) {
    case "week":
      return `Week of ${format(focus, "d MMM yyyy")}`;
    case "day":
      return format(focus, "EEEE, d MMMM yyyy");
    case "year":
      return format(focus, "yyyy");
    case "month":
    default:
      return format(focus, "MMMM yyyy");
  }
}

export function CalendarView({
  view,
  focusDate,
  batches,
  workingWeekdays,
  holidays,
}: {
  view: ViewMode;
  focusDate: string;
  batches: CalendarBatch[];
  workingWeekdays: number[];
  holidays: HolidayLite[];
}) {
  const [selectedBatch, setSelectedBatch] = useState<CalendarBatch | null>(null);
  const focus = parseISO(focusDate);
  const dayMap = buildDayMap(batches, workingWeekdays, holidays);

  const prevHref = `/calendar?view=${view}&date=${format(shift(view, focus, -1), "yyyy-MM-dd")}`;
  const nextHref = `/calendar?view=${view}&date=${format(shift(view, focus, 1), "yyyy-MM-dd")}`;
  const todayHref = `/calendar?view=${view}&date=${format(new Date(), "yyyy-MM-dd")}`;

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Link
            href={prevHref}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Previous"
          >
            <ChevronLeft size={18} />
          </Link>
          <h2 className="min-w-[180px] text-sm font-semibold text-slate-900">
            {headerLabel(view, focus)}
          </h2>
          <Link
            href={nextHref}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Next"
          >
            <ChevronRight size={18} />
          </Link>
          <Link
            href={todayHref}
            className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Today
          </Link>
        </div>

        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {VIEWS.map((v) => (
            <Link
              key={v.mode}
              href={`/calendar?view=${v.mode}&date=${focusDate}`}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition",
                view === v.mode
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {v.label}
            </Link>
          ))}
        </div>
      </div>

      {view === "month" && (
        <MonthGrid focus={focus} dayMap={dayMap} onSelectBatch={setSelectedBatch} />
      )}
      {view === "week" && (
        <WeekGrid focus={focus} dayMap={dayMap} onSelectBatch={setSelectedBatch} />
      )}
      {view === "day" && (
        <DayList focus={focus} dayMap={dayMap} onSelectBatch={setSelectedBatch} />
      )}
      {view === "year" && <YearGrid focus={focus} dayMap={dayMap} />}

      {selectedBatch && (
        <BatchDetailPanel batch={selectedBatch} onClose={() => setSelectedBatch(null)} />
      )}
    </div>
  );
}
