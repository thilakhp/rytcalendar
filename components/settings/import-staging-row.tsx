import { Field, TextInput, Select } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  approveStagingRow,
  ignoreStagingRow,
  restoreStagingRow,
  deleteStagingRow,
  reclassifyStagingRow,
} from "@/app/(app)/settings/import/actions";
import type { ImportStaging } from "@/lib/types";

type Option = { id: string; name: string };

export function ImportStagingRow({
  row,
  clients,
  vendors,
  courses,
  statuses,
}: {
  row: ImportStaging;
  clients: Option[];
  vendors: Option[];
  courses: Option[];
  statuses: string[];
}) {
  const needsReview = row.review_status === "needs_review";

  async function approve(formData: FormData) {
    "use server";
    await approveStagingRow(row.id, formData);
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                row.candidate_type === "holiday" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700",
              )}
            >
              {row.candidate_type === "holiday" ? "Holiday candidate" : "Batch candidate"}
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                row.review_status === "approved" && "bg-emerald-50 text-emerald-700",
                row.review_status === "ignored" && "bg-slate-100 text-slate-500",
                row.review_status === "needs_review" && "bg-slate-100 text-slate-600",
              )}
            >
              {row.review_status.replace("_", " ")}
            </span>
          </div>
          <p className="mt-1.5 text-sm font-medium text-slate-900">&quot;{row.raw_text}&quot;</p>
          <p className="text-xs text-slate-400">
            {row.source_sheet} · {row.start_date}
            {row.end_date !== row.start_date ? ` → ${row.end_date}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {needsReview && (
            <form
              action={reclassifyStagingRow.bind(
                null,
                row.id,
                row.candidate_type === "holiday" ? "batch" : "holiday",
              )}
            >
              <Button type="submit" variant="ghost" size="sm">
                Mark as {row.candidate_type === "holiday" ? "Batch" : "Holiday"}
              </Button>
            </form>
          )}
          {needsReview ? (
            <form action={ignoreStagingRow.bind(null, row.id)}>
              <Button type="submit" variant="ghost" size="sm">
                Ignore
              </Button>
            </form>
          ) : (
            <form action={restoreStagingRow.bind(null, row.id)}>
              <Button type="submit" variant="ghost" size="sm">
                Back to Needs Review
              </Button>
            </form>
          )}
          <form action={deleteStagingRow.bind(null, row.id)}>
            <Button type="submit" variant="ghost" size="sm">
              Delete
            </Button>
          </form>
        </div>
      </div>

      {needsReview && row.candidate_type === "batch" && (
        <form action={approve} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Program Name" htmlFor={`program_${row.id}`}>
              <TextInput id={`program_${row.id}`} name="program_name" defaultValue={row.program_name ?? row.raw_text} />
            </Field>
            <Field label="Client" htmlFor={`client_${row.id}`} required>
              <Select id={`client_${row.id}`} name="client_id" defaultValue={row.client_id ?? ""} required>
                <option value="">Select a client…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Vendor" htmlFor={`vendor_${row.id}`}>
              <Select id={`vendor_${row.id}`} name="vendor_id" defaultValue={row.vendor_id ?? ""}>
                <option value="">Select a vendor…</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Training Course" htmlFor={`course_${row.id}`}>
              <Select id={`course_${row.id}`} name="training_course_id" defaultValue={row.training_course_id ?? ""}>
                <option value="">Select a training course…</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Delivery Mode" htmlFor={`delivery_${row.id}`}>
              <TextInput id={`delivery_${row.id}`} name="delivery_mode" defaultValue={row.delivery_mode ?? ""} />
            </Field>
            <Field label="Status" htmlFor={`status_${row.id}`}>
              <Select id={`status_${row.id}`} name="status" defaultValue={row.status}>
                {statuses.map((s) => (
                  <option key={s} value={s}>{s.replace("_", " ")}</option>
                ))}
              </Select>
            </Field>
            <Field label="Start Date" htmlFor={`start_${row.id}`}>
              <TextInput id={`start_${row.id}`} name="start_date" type="date" defaultValue={row.start_date} />
            </Field>
            <Field label="End Date" htmlFor={`end_${row.id}`}>
              <TextInput id={`end_${row.id}`} name="end_date" type="date" defaultValue={row.end_date} />
            </Field>
            <Field label="Start Time" htmlFor={`start_time_${row.id}`}>
              <TextInput id={`start_time_${row.id}`} name="start_time" type="time" defaultValue="09:00" />
            </Field>
            <Field label="End Time" htmlFor={`end_time_${row.id}`}>
              <TextInput id={`end_time_${row.id}`} name="end_time" type="time" defaultValue="13:00" />
            </Field>
          </div>
          <Button type="submit" size="sm">Approve &amp; Create Batch</Button>
        </form>
      )}

      {needsReview && row.candidate_type === "holiday" && (
        <form action={approve} className="space-y-3">
          <input type="hidden" name="start_date" value={row.start_date} />
          <input type="hidden" name="end_date" value={row.end_date} />
          <p className="text-sm text-slate-500">
            Will be added to Holidays as <strong>{row.raw_text}</strong> on {row.start_date}.
          </p>
          <Button type="submit" size="sm">Approve &amp; Create Holiday</Button>
        </form>
      )}
    </Card>
  );
}
