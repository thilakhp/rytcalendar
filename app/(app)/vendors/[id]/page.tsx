import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge, ActiveBadge } from "@/components/data/status-badge";
import { LinkButton } from "@/components/ui/button";
import { Pencil } from "lucide-react";

type BatchRow = {
  id: string;
  start_date: string;
  end_date: string;
  working_days: number | null;
  total_hours: number | null;
  pax: number | null;
  status: string;
  training_courses: { name: string } | null;
  engagements: {
    id: string;
    program_name: string;
    overall_status: string;
    total_pax: number | null;
    clients: { name: string } | null;
  } | null;
};

export default async function VendorOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: vendor } = await supabase
    .from("vendors")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!vendor) notFound();

  const { data: batches } = await supabase
    .from("batches")
    .select(
      "id, start_date, end_date, working_days, total_hours, pax, status, training_courses(name), engagements!inner(id, program_name, overall_status, vendor_id, total_pax, clients(name))",
    )
    .eq("engagements.vendor_id", id)
    .order("start_date", { ascending: false })
    .returns<BatchRow[]>();

  const rows = batches ?? [];
  const engagementCount = new Set(rows.map((r) => r.engagements?.id)).size;
  const totalDays = rows.reduce((s, r) => s + (r.working_days ?? 0), 0);
  const totalHours = rows.reduce((s, r) => s + (r.total_hours ?? 0), 0);
  // PAX is a per-engagement headcount (the same cohort across every batch in
  // a program), so sum each engagement's PAX once rather than per batch.
  const paxByEngagement = new Map<string, number>();
  for (const r of rows) {
    const engId = r.engagements?.id;
    if (!engId) continue;
    const pax = r.engagements?.total_pax ?? r.pax ?? 0;
    paxByEngagement.set(engId, Math.max(paxByEngagement.get(engId) ?? 0, pax));
  }
  const totalPax = Array.from(paxByEngagement.values()).reduce((s, v) => s + v, 0);
  const daysByStatus = (status: string) =>
    rows
      .filter((r) => r.status === status)
      .reduce((s, r) => s + (r.working_days ?? 0), 0);

  const topics = Array.from(
    new Set(rows.map((r) => r.training_courses?.name).filter(Boolean)),
  ) as string[];

  return (
    <>
      <PageHeader
        title={vendor.name}
        description={vendor.company_name ?? undefined}
        action={
          <div className="flex items-center gap-3">
            <ActiveBadge active={vendor.active} />
            <LinkButton href={`/vendors/${id}/edit`} variant="secondary">
              <Pencil size={16} /> Edit
            </LinkButton>
          </div>
        }
      />

      <Card className="mb-6 grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Contact
          </div>
          <div className="mt-1 text-sm text-slate-700">
            {vendor.contact_person ?? "—"}
            {vendor.email && <div>{vendor.email}</div>}
            {vendor.phone && <div>{vendor.phone}</div>}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Country
          </div>
          <div className="mt-1 text-sm text-slate-700">
            {vendor.country ?? "—"}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Specialization
          </div>
          <div className="mt-1 text-sm text-slate-700">
            {vendor.specialization ?? "—"}
          </div>
        </div>
      </Card>

      <h2 className="mb-3 text-sm font-semibold text-slate-900">Performance</h2>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Engagements" value={engagementCount} />
        <StatCard label="Batches" value={rows.length} />
        <StatCard label="Training Days" value={totalDays} />
        <StatCard label="Training Hours" value={totalHours} />
        <StatCard label="Total PAX" value={totalPax} />
        <StatCard label="Confirmed Days" value={daysByStatus("confirmed")} />
        <StatCard label="Planned Days" value={daysByStatus("planned")} />
        <StatCard label="Completed Days" value={daysByStatus("completed")} />
        <StatCard label="Cancelled Days" value={daysByStatus("cancelled")} />
      </div>

      {topics.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            Training Topics
          </h2>
          <div className="flex flex-wrap gap-2">
            {topics.map((t) => (
              <span
                key={t}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      <h2 className="mb-3 text-sm font-semibold text-slate-900">
        Training History
      </h2>
      {rows.length === 0 ? (
        <Card className="p-6 text-sm text-slate-500">
          No training batches recorded for this vendor yet. Once you create a
          Training Engagement with this vendor, it will show up here
          automatically.
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/60">
              <tr>
                {["Client", "Program", "Training", "Start", "End", "Days", "Hours", "PAX", "Status"].map(
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
                  <td className="px-4 py-3">{r.engagements?.clients?.name ?? "—"}</td>
                  <td className="px-4 py-3">{r.engagements?.program_name ?? "—"}</td>
                  <td className="px-4 py-3">{r.training_courses?.name ?? "—"}</td>
                  <td className="px-4 py-3">{r.start_date}</td>
                  <td className="px-4 py-3">{r.end_date}</td>
                  <td className="px-4 py-3">{r.working_days ?? "—"}</td>
                  <td className="px-4 py-3">{r.total_hours ?? "—"}</td>
                  <td className="px-4 py-3">{r.pax ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
