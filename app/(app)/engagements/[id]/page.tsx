import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/data/status-badge";
import { Button, LinkButton } from "@/components/ui/button";
import { deleteEngagement } from "@/app/(app)/engagements/actions";
import { Pencil, AlertTriangle } from "lucide-react";
import type { Batch } from "@/lib/types";

type BatchRow = Batch & { training_courses: { name: string } | null; trainers: { name: string } | null };

export default async function EngagementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: engagement } = await supabase
    .from("engagements")
    .select("*, clients(name), vendors(name)")
    .eq("id", id)
    .maybeSingle();

  if (!engagement) notFound();

  const { data: batches } = await supabase
    .from("batches")
    .select("*, training_courses(name), trainers(name)")
    .eq("engagement_id", id)
    .order("start_date")
    .returns<BatchRow[]>();

  const rows = batches ?? [];
  const totalDays = rows.reduce((s, r) => s + (r.working_days ?? 0), 0);
  const totalHours = rows.reduce((s, r) => s + (r.total_hours ?? 0), 0);
  // PAX is a program-wide headcount (the same cohort attends every batch),
  // not a per-batch quantity to sum — fall back to the largest batch
  // override only if the program-level PAX was never set.
  const totalPax =
    engagement.total_pax ?? rows.reduce((max, r) => Math.max(max, r.pax ?? 0), 0);
  const courseCount = new Set(rows.map((r) => r.training_course_id).filter(Boolean)).size;

  const today = new Date().toISOString().slice(0, 10);
  const needsStatusUpdate =
    (engagement.overall_status === "planned" || engagement.overall_status === "confirmed") &&
    rows.length > 0 &&
    rows.every((r) => r.end_date < today);

  const removeEngagement = async () => {
    "use server";
    await deleteEngagement(id);
  };

  return (
    <>
      <PageHeader
        title={engagement.program_name}
        description={`${engagement.clients?.name ?? "—"} · ${engagement.vendors?.name ?? "No vendor"}`}
        action={
          <div className="flex items-center gap-3">
            <StatusBadge status={engagement.overall_status} />
            <LinkButton href={`/engagements/${id}/edit`} variant="secondary">
              <Pencil size={16} /> Edit
            </LinkButton>
          </div>
        }
      />

      {needsStatusUpdate && (
        <Card className="mb-6 flex items-center gap-3 border-amber-200 bg-amber-50 p-4">
          <AlertTriangle size={18} className="shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            All batches have finished but the program is still marked{" "}
            <strong>{engagement.overall_status}</strong>. Consider updating its
            status.
          </p>
        </Card>
      )}

      <Card className="mb-6 grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Client</div>
          <div className="mt-1 text-sm text-slate-700">{engagement.clients?.name ?? "—"}</div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Vendor</div>
          <div className="mt-1 text-sm text-slate-700">{engagement.vendors?.name ?? "—"}</div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Time Zone</div>
          <div className="mt-1 text-sm text-slate-700">{engagement.primary_timezone}</div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Program PAX</div>
          <div className="mt-1 text-sm text-slate-700">{engagement.total_pax ?? "—"}</div>
        </div>
        {engagement.notes && (
          <div className="sm:col-span-2 lg:col-span-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Notes</div>
            <div className="mt-1 text-sm text-slate-700">{engagement.notes}</div>
          </div>
        )}
      </Card>

      <h2 className="mb-3 text-sm font-semibold text-slate-900">Program Summary</h2>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Batches" value={rows.length} />
        <StatCard label="Training Courses" value={courseCount} />
        <StatCard label="Working Days" value={totalDays} />
        <StatCard label="Training Hours" value={Math.round(totalHours * 100) / 100} />
        <StatCard label="Total PAX" value={totalPax} />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-slate-900">Batches</h2>
      {rows.length === 0 ? (
        <Card className="p-6 text-sm text-slate-500">No batches in this program.</Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/60">
              <tr>
                {["Training", "Start", "End", "Time", "Delivery", "Trainer", "Days", "Hours", "PAX", "Status"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {r.training_courses?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">{r.start_date}</td>
                  <td className="px-4 py-3">{r.end_date}</td>
                  <td className="px-4 py-3">
                    {r.start_time?.slice(0, 5)}–{r.end_time?.slice(0, 5)}
                  </td>
                  <td className="px-4 py-3">{r.delivery_mode ?? "—"}</td>
                  <td className="px-4 py-3">{r.trainers?.name ?? "—"}</td>
                  <td className="px-4 py-3">{r.working_days ?? "—"}</td>
                  <td className="px-4 py-3">{r.total_hours ?? "—"}</td>
                  <td className="px-4 py-3">{r.pax ?? engagement.total_pax ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <form action={removeEngagement} className="mt-8 border-t border-slate-100 pt-6">
        <Button type="submit" variant="danger" size="sm">
          Delete Engagement
        </Button>
        <p className="mt-2 text-xs text-slate-400">
          This permanently deletes the program and all of its batches.
        </p>
      </form>
    </>
  );
}
