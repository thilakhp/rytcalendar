"use client";

import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/data/status-badge";
import { findConflicts } from "@/lib/schedule";
import { AlertTriangle } from "lucide-react";
import type { CalendarBatch } from "@/components/calendar/types";

export function DayList({
  focus,
  dayMap,
  onSelectBatch,
}: {
  focus: Date;
  dayMap: Map<string, CalendarBatch[]>;
  onSelectBatch: (b: CalendarBatch) => void;
}) {
  const key = format(focus, "yyyy-MM-dd");
  const batches = (dayMap.get(key) ?? []).slice().sort((a, b) => a.start_time.localeCompare(b.start_time));
  const conflicts = findConflicts(batches);
  const conflictIds = new Set(conflicts.flatMap(([a, b]) => [a.id, b.id]));

  if (batches.length === 0) {
    return (
      <Card className="px-6 py-16 text-center text-sm text-slate-500">
        No training scheduled on {format(focus, "d MMMM yyyy")}.
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {conflicts.length > 0 && (
        <Card className="flex items-center gap-3 border-amber-200 bg-amber-50 p-4">
          <AlertTriangle size={18} className="shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            ⚠ Scheduling conflict — {conflicts.length} pair
            {conflicts.length > 1 ? "s" : ""} of batches overlap in time today.
          </p>
        </Card>
      )}
      {batches.map((b) => (
        <Card
          key={b.id}
          className="cursor-pointer p-4 hover:border-slate-300"
          onClick={() => onSelectBatch(b)}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-medium text-slate-900">
              {b.training_courses?.name ?? "Training"}
              {conflictIds.has(b.id) && (
                <span className="ml-2 text-xs font-medium text-amber-600">
                  ⚠ conflict
                </span>
              )}
            </div>
            <StatusBadge status={b.status} />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-600 sm:grid-cols-4">
            <div>
              {b.start_time?.slice(0, 5)}–{b.end_time?.slice(0, 5)} ({b.timezone})
            </div>
            <div>{b.engagements?.program_name}</div>
            <div>{b.engagements?.clients?.name}</div>
            <div>{b.engagements?.vendors?.name}</div>
            <div>{b.delivery_mode ?? "—"}</div>
            <div>{b.pax ?? b.engagements?.total_pax ?? "—"} PAX</div>
            <div>{b.trainers?.name ?? "Unassigned"}</div>
            <div>{b.location ?? "—"}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}
