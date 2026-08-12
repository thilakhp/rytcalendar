"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Field, TextInput, TextArea, Select } from "@/components/ui/form-field";
import { Button, LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgramSummary } from "@/components/engagements/program-summary";
import { calcBatch, type HolidayLite } from "@/lib/calc";
import type { Client, Vendor, Trainer, TrainingCourse, Engagement, Batch } from "@/lib/types";
import type { EngagementInput } from "@/lib/validation/engagements";

type BatchDraft = {
  key: string;
  id?: string;
  training_course_id: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  timezone: string;
  delivery_mode: string;
  status: string;
  pax: string;
  trainer_id: string;
  location: string;
  break_minutes: string;
  notes: string;
};

function newBatchKey() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `batch-${Date.now()}-${Math.random()}`;
}

function draftFromBatch(b: Batch): BatchDraft {
  return {
    key: b.id,
    id: b.id,
    training_course_id: b.training_course_id ?? "",
    start_date: b.start_date,
    end_date: b.end_date,
    start_time: b.start_time?.slice(0, 5) ?? "",
    end_time: b.end_time?.slice(0, 5) ?? "",
    timezone: b.timezone,
    delivery_mode: b.delivery_mode ?? "",
    status: b.status,
    pax: b.pax != null ? String(b.pax) : "",
    trainer_id: b.trainer_id ?? "",
    location: b.location ?? "",
    break_minutes: String(b.break_minutes ?? 0),
    notes: b.notes ?? "",
  };
}

export function EngagementForm({
  mode,
  initialEngagement,
  initialBatches,
  clients,
  vendors,
  trainers,
  courses,
  workingWeekdays,
  holidays,
  defaultTimezone,
  defaultBreakMinutes,
  statuses,
  deliveryModes,
  onSubmit,
  cancelHref,
}: {
  mode: "create" | "edit";
  initialEngagement?: Engagement;
  initialBatches?: Batch[];
  clients: Client[];
  vendors: Vendor[];
  trainers: Trainer[];
  courses: TrainingCourse[];
  workingWeekdays: number[];
  holidays: HolidayLite[];
  defaultTimezone: string;
  defaultBreakMinutes: number;
  statuses: string[];
  deliveryModes: string[];
  onSubmit: (input: EngagementInput) => Promise<{ error?: string } | undefined>;
  cancelHref: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const [clientId, setClientId] = useState(initialEngagement?.client_id ?? "");
  const [vendorId, setVendorId] = useState(initialEngagement?.vendor_id ?? "");
  const [programName, setProgramName] = useState(initialEngagement?.program_name ?? "");
  const [totalPax, setTotalPax] = useState(
    initialEngagement?.total_pax != null ? String(initialEngagement.total_pax) : "",
  );
  const [timezone, setTimezone] = useState(initialEngagement?.primary_timezone ?? defaultTimezone);
  const [overallStatus, setOverallStatus] = useState(
    initialEngagement?.overall_status ?? statuses[0] ?? "planned",
  );
  const [notes, setNotes] = useState(initialEngagement?.notes ?? "");

  const [batches, setBatches] = useState<BatchDraft[]>(() =>
    initialBatches && initialBatches.length > 0
      ? initialBatches.map(draftFromBatch)
      : [],
  );

  function addBatch() {
    setBatches((prev) => [
      ...prev,
      {
        key: newBatchKey(),
        training_course_id: "",
        start_date: "",
        end_date: "",
        start_time: "09:00",
        end_time: "13:00",
        timezone,
        delivery_mode: deliveryModes[0] ?? "",
        status: statuses[0] ?? "planned",
        pax: totalPax,
        trainer_id: "",
        location: "",
        break_minutes: String(defaultBreakMinutes ?? 0),
        notes: "",
      },
    ]);
  }

  function updateBatch(key: string, patch: Partial<BatchDraft>) {
    setBatches((prev) =>
      prev.map((b) => (b.key === key ? { ...b, ...patch } : b)),
    );
  }

  function removeBatch(key: string) {
    setBatches((prev) => prev.filter((b) => b.key !== key));
  }

  function handleCourseChange(key: string, courseId: string) {
    const course = courses.find((c) => c.id === courseId);
    updateBatch(key, {
      training_course_id: courseId,
      delivery_mode:
        course?.default_delivery_mode && !batches.find((b) => b.key === key)?.delivery_mode
          ? course.default_delivery_mode
          : batches.find((b) => b.key === key)?.delivery_mode ?? "",
    });
  }

  const calcs = batches.map((b) =>
    calcBatch(
      {
        start_date: b.start_date,
        end_date: b.end_date,
        start_time: b.start_time,
        end_time: b.end_time,
        break_minutes: Number(b.break_minutes) || 0,
      },
      workingWeekdays,
      holidays,
    ),
  );

  const totalWorkingDays = calcs.reduce((s, c) => s + c.workingDays, 0);
  const totalHours = calcs.reduce((s, c) => s + c.totalHours, 0);
  // PAX is a headcount for the program (the same cohort moves through every
  // batch), not a per-batch quantity to sum — so this is the program total,
  // falling back to the largest individual batch override if it's unset.
  const programPax = totalPax
    ? Number(totalPax)
    : batches.reduce((max, b) => Math.max(max, b.pax ? Number(b.pax) : 0), 0);
  const courseCount = new Set(
    batches.map((b) => b.training_course_id).filter(Boolean),
  ).size;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);

    if (batches.length === 0) {
      setError("Add at least one training batch.");
      return;
    }

    const input: EngagementInput = {
      client_id: clientId,
      vendor_id: vendorId || null,
      program_name: programName,
      total_pax: totalPax ? Number(totalPax) : null,
      primary_timezone: timezone,
      overall_status: overallStatus,
      notes: notes || undefined,
      batches: batches.map((b) => ({
        id: b.id,
        training_course_id: b.training_course_id,
        start_date: b.start_date,
        end_date: b.end_date,
        start_time: b.start_time,
        end_time: b.end_time,
        timezone: b.timezone || timezone,
        delivery_mode: b.delivery_mode || undefined,
        status: b.status,
        pax: b.pax ? Number(b.pax) : undefined,
        trainer_id: b.trainer_id || undefined,
        location: b.location || undefined,
        break_minutes: Number(b.break_minutes) || 0,
        notes: b.notes || undefined,
      })),
    };

    startTransition(async () => {
      const result = await onSubmit(input);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card className="p-6">
        <h2 className="mb-5 text-sm font-semibold text-slate-900">
          Engagement Details
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Client" htmlFor="client_id" required>
            <Select
              id="client_id"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
            >
              <option value="">Select a client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Program / Engagement Name" htmlFor="program_name" required>
            <TextInput
              id="program_name"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              required
              placeholder="e.g. Marketing Automation Training Program"
            />
          </Field>
          <Field label="Vendor" htmlFor="vendor_id">
            <Select
              id="vendor_id"
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
            >
              <option value="">Select a vendor…</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Total PAX" htmlFor="total_pax">
            <TextInput
              id="total_pax"
              type="number"
              min="1"
              value={totalPax}
              onChange={(e) => setTotalPax(e.target.value)}
            />
          </Field>
          <Field label="Primary Time Zone" htmlFor="primary_timezone" required>
            <TextInput
              id="primary_timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              required
            />
          </Field>
          <Field label="Overall Status" htmlFor="overall_status" required>
            <Select
              id="overall_status"
              value={overallStatus}
              onChange={(e) => setOverallStatus(e.target.value)}
              required
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="mt-5">
          <Field label="Notes" htmlFor="engagement_notes">
            <TextArea
              id="engagement_notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </div>
      </Card>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Training Batches</h2>
          <Button type="button" variant="secondary" size="sm" onClick={addBatch}>
            <Plus size={14} /> Add Batch
          </Button>
        </div>

        {batches.length === 0 && (
          <Card className="px-6 py-10 text-center text-sm text-slate-500">
            No batches yet. Click &quot;Add Batch&quot; to add the first training
            course for this program.
          </Card>
        )}

        <div className="space-y-4">
          {batches.map((b, i) => {
            const course = courses.find((c) => c.id === b.training_course_id);
            const calc = calcs[i];
            return (
              <Card key={b.key} className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-700">
                    Batch {i + 1}
                  </h3>
                  <button
                    type="button"
                    onClick={() => removeBatch(b.key)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Remove batch"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Training" htmlFor={`course_${b.key}`} required>
                    <Select
                      id={`course_${b.key}`}
                      value={b.training_course_id}
                      onChange={(e) => handleCourseChange(b.key, e.target.value)}
                      required
                    >
                      <option value="">Select training…</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                    {course && (
                      <p className="text-xs text-slate-400">
                        Standard: {course.standard_duration_days ?? "—"} days,{" "}
                        {course.standard_hours_per_day ?? "—"} hrs/day,{" "}
                        {course.standard_total_hours ?? "—"} hrs total
                      </p>
                    )}
                  </Field>

                  <Field label="Start Date" htmlFor={`start_date_${b.key}`} required>
                    <TextInput
                      id={`start_date_${b.key}`}
                      type="date"
                      value={b.start_date}
                      onChange={(e) => updateBatch(b.key, { start_date: e.target.value })}
                      required
                    />
                  </Field>
                  <Field label="End Date" htmlFor={`end_date_${b.key}`} required>
                    <TextInput
                      id={`end_date_${b.key}`}
                      type="date"
                      value={b.end_date}
                      onChange={(e) => updateBatch(b.key, { end_date: e.target.value })}
                      required
                    />
                  </Field>
                  <Field label="Delivery Mode" htmlFor={`delivery_${b.key}`}>
                    <TextInput
                      id={`delivery_${b.key}`}
                      list="delivery-modes"
                      value={b.delivery_mode}
                      onChange={(e) => updateBatch(b.key, { delivery_mode: e.target.value })}
                    />
                  </Field>

                  <Field label="Start Time" htmlFor={`start_time_${b.key}`} required>
                    <TextInput
                      id={`start_time_${b.key}`}
                      type="time"
                      value={b.start_time}
                      onChange={(e) => updateBatch(b.key, { start_time: e.target.value })}
                      required
                    />
                  </Field>
                  <Field label="End Time" htmlFor={`end_time_${b.key}`} required>
                    <TextInput
                      id={`end_time_${b.key}`}
                      type="time"
                      value={b.end_time}
                      onChange={(e) => updateBatch(b.key, { end_time: e.target.value })}
                      required
                    />
                  </Field>
                  <Field label="Break (minutes)" htmlFor={`break_${b.key}`}>
                    <TextInput
                      id={`break_${b.key}`}
                      type="number"
                      min="0"
                      value={b.break_minutes}
                      onChange={(e) => updateBatch(b.key, { break_minutes: e.target.value })}
                    />
                  </Field>
                  <Field label="Status" htmlFor={`status_${b.key}`} required>
                    <Select
                      id={`status_${b.key}`}
                      value={b.status}
                      onChange={(e) => updateBatch(b.key, { status: e.target.value })}
                      required
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s.replace("_", " ")}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="PAX" htmlFor={`pax_${b.key}`}>
                    <TextInput
                      id={`pax_${b.key}`}
                      type="number"
                      min="1"
                      placeholder={totalPax || "—"}
                      value={b.pax}
                      onChange={(e) => updateBatch(b.key, { pax: e.target.value })}
                    />
                  </Field>
                  <Field label="Trainer" htmlFor={`trainer_${b.key}`}>
                    <Select
                      id={`trainer_${b.key}`}
                      value={b.trainer_id}
                      onChange={(e) => updateBatch(b.key, { trainer_id: e.target.value })}
                    >
                      <option value="">Unassigned</option>
                      {trainers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Location" htmlFor={`location_${b.key}`}>
                    <TextInput
                      id={`location_${b.key}`}
                      value={b.location}
                      onChange={(e) => updateBatch(b.key, { location: e.target.value })}
                    />
                  </Field>
                  <Field label="Time Zone" htmlFor={`tz_${b.key}`}>
                    <TextInput
                      id={`tz_${b.key}`}
                      value={b.timezone}
                      onChange={(e) => updateBatch(b.key, { timezone: e.target.value })}
                    />
                  </Field>
                </div>

                <div className="mt-4">
                  <Field label="Batch Notes" htmlFor={`notes_${b.key}`}>
                    <TextInput
                      id={`notes_${b.key}`}
                      value={b.notes}
                      onChange={(e) => updateBatch(b.key, { notes: e.target.value })}
                    />
                  </Field>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-4">
                  {[
                    ["Calendar Days", calc.calendarDays],
                    ["Working Days", calc.workingDays],
                    ["Hours / Day", calc.netHoursPerDay],
                    ["Total Hours", calc.totalHours],
                  ].map(([label, value]) => (
                    <div key={label as string}>
                      <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                        {label}
                      </div>
                      <div className="text-sm font-semibold text-slate-800">{value}</div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <datalist id="delivery-modes">
        {deliveryModes.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>

      {batches.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Program Summary</h2>
          <ProgramSummary
            batchCount={batches.length}
            courseCount={courseCount}
            totalWorkingDays={totalWorkingDays}
            totalHours={Math.round(totalHours * 100) / 100}
            totalPax={programPax}
          />
        </div>
      )}

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : mode === "create" ? "Save Engagement" : "Save Changes"}
        </Button>
        <LinkButton href={cancelHref} variant="secondary">
          Cancel
        </LinkButton>
        {mode === "create" && (
          <button
            type="button"
            className="text-sm text-slate-400 hover:text-slate-600"
            onClick={() => router.back()}
          >
            or go back
          </button>
        )}
      </div>
    </form>
  );
}
