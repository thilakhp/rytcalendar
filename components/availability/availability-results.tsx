import { format, parseISO } from "date-fns";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import type { CalendarBatch } from "@/components/calendar/types";
import type { DayAvailability } from "@/lib/schedule";

type Day = {
  date: string;
  status: DayAvailability;
  batches: CalendarBatch[];
  conflicts: [CalendarBatch, CalendarBatch][];
  engagementCount: number;
};

const STATUS_STYLES: Record<DayAvailability, string> = {
  available: "bg-emerald-50 text-emerald-700",
  tentative: "bg-amber-50 text-amber-700",
  occupied: "bg-red-50 text-red-700",
};

const STATUS_LABELS: Record<DayAvailability, string> = {
  available: "Available",
  tentative: "Tentative",
  occupied: "Occupied",
};

export function AvailabilityResults({
  days,
  available,
  tentative,
  occupied,
}: {
  days: Day[];
  available: number;
  tentative: number;
  occupied: number;
}) {
  return (
    <>
      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard label="Available Days" value={available} />
        <StatCard label="Tentative Days" value={tentative} />
        <StatCard label="Occupied Days" value={occupied} />
      </div>

      <div className="space-y-2">
        {days.map((day) => (
          <Card
            key={day.date}
            className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-sm font-medium text-slate-900">
                {format(parseISO(day.date), "EEE, d MMM yyyy")}
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  STATUS_STYLES[day.status],
                )}
              >
                {STATUS_LABELS[day.status]}
              </span>
              {day.engagementCount > 1 && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  Multiple Engagements
                </span>
              )}
              {day.conflicts.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                  <AlertTriangle size={12} /> Scheduling Conflict
                </span>
              )}
            </div>

            {day.batches.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 sm:text-right">
                {day.batches.map((b) => (
                  <Link
                    key={b.id}
                    href={`/engagements/${b.engagement_id}`}
                    className={cn(
                      "hover:text-slate-800 hover:underline",
                      b.status === "cancelled" && "line-through opacity-60",
                    )}
                  >
                    {b.training_courses?.name} · {b.engagements?.clients?.name} /{" "}
                    {b.engagements?.vendors?.name} · {b.start_time?.slice(0, 5)}–
                    {b.end_time?.slice(0, 5)}
                  </Link>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}
