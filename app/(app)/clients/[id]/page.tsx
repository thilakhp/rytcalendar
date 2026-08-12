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
    vendors: { name: string } | null;
  } | null;
};

export default async function ClientOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!client) notFound();

  const { data: batches } = await supabase
    .from("batches")
    .select(
      "id, start_date, end_date, working_days, total_hours, pax, status, training_courses(name), engagements!inner(id, program_name, overall_status, client_id, total_pax, vendors(name))",
    )
    .eq("engagements.client_id", id)
    .order("start_date", { ascending: false })
    .returns<BatchRow[]>();

  const rows = batches ?? [];
  const programCount = new Set(rows.map((r) => r.engagements?.id)).size;
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

  const topics = Array.from(
    new Set(rows.map((r) => r.training_courses?.name).filter(Boolean)),
  ) as string[];
  const vendorsUsed = Array.from(
    new Set(rows.map((r) => r.engagements?.vendors?.name).filter(Boolean)),
  ) as string[];

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = rows.filter(
    (r) => r.start_date >= today && r.status !== "cancelled",
  );
  const completed = rows.filter((r) => r.status === "completed");
  const cancelled = rows.filter((r) => r.status === "cancelled");

  return (
    <>
      <PageHeader
        title={client.name}
        description={client.industry ?? undefined}
        action={
          <div className="flex items-center gap-3">
            <ActiveBadge active={client.active} />
            <LinkButton href={`/clients/${id}/edit`} variant="secondary">
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
            {client.contact_person ?? "—"}
            {client.email && <div>{client.email}</div>}
            {client.phone && <div>{client.phone}</div>}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Country
          </div>
          <div className="mt-1 text-sm text-slate-700">{client.country ?? "—"}</div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Vendors Used
          </div>
          <div className="mt-1 text-sm text-slate-700">
            {vendorsUsed.length > 0 ? vendorsUsed.join(", ") : "—"}
          </div>
        </div>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Programs" value={programCount} />
        <StatCard label="Batches" value={rows.length} />
        <StatCard label="Training Days" value={totalDays} />
        <StatCard label="Training Hours" value={totalHours} />
        <StatCard label="Total PAX" value={totalPax} />
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

      {(
        [
          ["Upcoming Training", upcoming],
          ["Completed Training", completed],
          ["Cancelled Training", cancelled],
        ] as const
      ).map(([title, list]) => (
        <div key={title} className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">{title}</h2>
          {list.length === 0 ? (
            <Card className="p-4 text-sm text-slate-500">Nothing here.</Card>
          ) : (
            <Card className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/60">
                  <tr>
                    {["Program", "Training", "Vendor", "Start", "End", "Days", "PAX", "Status"].map(
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
                  {list.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-3">{r.engagements?.program_name ?? "—"}</td>
                      <td className="px-4 py-3">{r.training_courses?.name ?? "—"}</td>
                      <td className="px-4 py-3">{r.engagements?.vendors?.name ?? "—"}</td>
                      <td className="px-4 py-3">{r.start_date}</td>
                      <td className="px-4 py-3">{r.end_date}</td>
                      <td className="px-4 py-3">{r.working_days ?? "—"}</td>
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
        </div>
      ))}
    </>
  );
}
