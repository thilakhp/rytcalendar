"use client";

import { X } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { StatusBadge } from "@/components/data/status-badge";
import type { CalendarBatch } from "@/components/calendar/types";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-0.5 text-sm text-slate-800">{value ?? "—"}</div>
    </div>
  );
}

export function BatchDetailPanel({
  batch,
  onClose,
}: {
  batch: CalendarBatch;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {batch.training_courses?.name ?? "Training"}
            </h3>
            <p className="text-sm text-slate-500">{batch.engagements?.program_name}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-4">
          <StatusBadge status={batch.status} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Row label="Client" value={batch.engagements?.clients?.name} />
          <Row label="Vendor" value={batch.engagements?.vendors?.name} />
          <Row label="Start" value={batch.start_date} />
          <Row label="End" value={batch.end_date} />
          <Row
            label="Time"
            value={`${batch.start_time?.slice(0, 5)}–${batch.end_time?.slice(0, 5)} (${batch.timezone})`}
          />
          <Row label="Working Days" value={batch.working_days} />
          <Row label="Total Hours" value={batch.total_hours} />
          <Row label="PAX" value={batch.pax ?? batch.engagements?.total_pax} />
          <Row label="Trainer" value={batch.trainers?.name ?? "Unassigned"} />
          <Row label="Delivery Mode" value={batch.delivery_mode} />
          <Row label="Location" value={batch.location} />
        </div>

        {batch.notes && (
          <div className="mt-4">
            <Row label="Notes" value={batch.notes} />
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <LinkButton href={`/engagements/${batch.engagement_id}/edit`} variant="secondary">
            Edit
          </LinkButton>
          <LinkButton href={`/engagements/${batch.engagement_id}`} variant="secondary">
            View Program
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
