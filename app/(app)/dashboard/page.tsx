import { format, subDays, addDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { AvailabilityForm } from "@/components/availability/availability-form";
import { StatusBadge } from "@/components/data/status-badge";
import { VendorReportTable } from "@/components/reports/vendor-report-table";
import { TrainingReportTable } from "@/components/reports/training-report-table";
import { MonthlyWorkloadChart } from "@/components/dashboard/monthly-workload-chart";
import {
  buildVendorReport,
  buildTrainingReport,
  buildMonthlyReport,
  type ReportBatch,
} from "@/lib/analytics";
import { buildDayMap, dayAvailability } from "@/lib/schedule";
import { workingDatesBetween } from "@/lib/calc";
import { Plus, ClipboardList } from "lucide-react";
import Link from "next/link";
import type { Settings } from "@/lib/types";

const REPORT_SELECT =
  "id, engagement_id, training_course_id, trainer_id, start_date, end_date, status, pax, working_days, net_hours_per_day, total_hours, delivery_mode, training_courses(name), trainers(name), engagements(program_name, overall_status, total_pax, client_id, vendor_id, clients(name), vendors(name))";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: settings }, { data: holidays }, { data: batches }] = await Promise.all([
    supabase.from("settings").select("*").eq("owner_id", user?.id ?? "").maybeSingle(),
    supabase.from("holidays").select("date, is_working_day"),
    supabase.from("batches").select(REPORT_SELECT).returns<ReportBatch[]>(),
  ]);

  const rows = batches ?? [];
  const s = settings as Settings | null;
  const workingWeekdays = s?.working_weekdays ?? [1, 2, 3, 4, 5];
  const rules = s?.availability_rules ?? {
    planned: "tentative",
    confirmed: "blocks",
    in_progress: "blocks",
    completed: "historical",
    cancelled: "none",
  };

  const today = format(new Date(), "yyyy-MM-dd");
  const engagementIds = new Set(rows.map((b) => b.engagement_id));

  // KPI totals
  const totalDays = rows.reduce((s, r) => s + (r.working_days ?? 0), 0);
  const totalHours = Math.round(rows.reduce((s, r) => s + (r.total_hours ?? 0), 0) * 100) / 100;
  const countByStatus = (status: string) => rows.filter((r) => r.status === status).length;

  // Available days over the next 30 days
  const dayMap = buildDayMap(rows, workingWeekdays, holidays ?? []);
  const next30 = workingDatesBetween(today, format(addDays(new Date(), 30), "yyyy-MM-dd"), workingWeekdays, holidays ?? []);
  const availableNext30 = next30.filter(
    (d) => dayAvailability(dayMap.get(d) ?? [], rules) === "available",
  ).length;

  // Today's schedule
  const todayBatches = (dayMap.get(today) ?? []).slice().sort((a, b) => a.start_date.localeCompare(b.start_date));

  // Upcoming 10
  const upcoming = rows
    .filter((r) => r.start_date >= today && r.status !== "cancelled")
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .slice(0, 10);

  // Currently in progress
  const inProgress = rows.filter(
    (r) => r.start_date <= today && r.end_date >= today && r.status !== "cancelled",
  );

  // Vendor / Training analytics (top 8 by hours)
  const vendorRows = buildVendorReport(rows).sort((a, b) => b.hours - a.hours).slice(0, 8);
  const trainingRows = buildTrainingReport(rows).sort((a, b) => b.hours - a.hours).slice(0, 8);

  // Monthly workload for the current year
  const year = new Date().getFullYear();
  const monthly = buildMonthlyReport(year, rows, workingWeekdays, holidays ?? []);

  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <PageHeader title="Dashboard" description={todayLabel} />

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Engagements" value={engagementIds.size} />
        <StatCard label="Batches" value={rows.length} />
        <StatCard label="Training Days" value={totalDays} />
        <StatCard label="Training Hours" value={totalHours} />
        <StatCard label="Available (30d)" value={availableNext30} />
        <StatCard label="Confirmed" value={countByStatus("confirmed")} />
        <StatCard label="Planned" value={countByStatus("planned")} />
        <StatCard label="In Progress" value={countByStatus("in_progress")} />
        <StatCard label="Completed" value={countByStatus("completed")} />
        <StatCard label="Cancelled" value={countByStatus("cancelled")} />
      </div>

      {engagementIds.size === 0 ? (
        <Card className="mb-8 flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <ClipboardList size={28} className="text-slate-300" />
          <div>
            <p className="font-medium text-slate-900">No training engagements yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Create your first Training Engagement and this dashboard fills in
              automatically.
            </p>
          </div>
          <LinkButton href="/engagements/new">
            <Plus size={16} /> New Engagement
          </LinkButton>
        </Card>
      ) : (
        <>
          <div className="mb-8">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Today</h2>
            {todayBatches.length === 0 ? (
              <Card className="p-4 text-sm text-slate-500">No training scheduled today.</Card>
            ) : (
              <div className="space-y-2">
                {todayBatches.map((b) => (
                  <Card key={b.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                    <div>
                      <span className="font-medium text-slate-900">{b.training_courses?.name}</span>{" "}
                      <span className="text-slate-500">
                        · {b.engagements?.clients?.name} / {b.engagements?.vendors?.name} ·{" "}
                        {b.net_hours_per_day}h
                      </span>
                    </div>
                    <StatusBadge status={b.status} />
                  </Card>
                ))}
              </div>
            )}
          </div>

          {inProgress.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">Currently In Progress</h2>
              <div className="space-y-2">
                {inProgress.map((b) => {
                  const completed = workingDatesBetween(
                    b.start_date,
                    format(subDays(new Date(), 1), "yyyy-MM-dd"),
                    workingWeekdays,
                    holidays ?? [],
                  ).length;
                  const remaining = workingDatesBetween(
                    today,
                    b.end_date,
                    workingWeekdays,
                    holidays ?? [],
                  ).length;
                  return (
                    <Card key={b.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div>
                        <span className="font-medium text-slate-900">{b.training_courses?.name}</span>{" "}
                        <span className="text-slate-500">
                          · {b.engagements?.clients?.name} / {b.engagements?.vendors?.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>{completed} days done</span>
                        <span>{remaining} days left</span>
                        <StatusBadge status={b.status} />
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mb-8">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Upcoming</h2>
            {upcoming.length === 0 ? (
              <Card className="p-4 text-sm text-slate-500">Nothing upcoming.</Card>
            ) : (
              <Card className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/60">
                    <tr>
                      {["Date", "Training", "Client", "Vendor", "Days", "Hours", "PAX", "Status"].map((h) => (
                        <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {upcoming.map((b) => (
                      <tr key={b.id}>
                        <td className="px-4 py-3">{b.start_date}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{b.training_courses?.name}</td>
                        <td className="px-4 py-3">{b.engagements?.clients?.name}</td>
                        <td className="px-4 py-3">{b.engagements?.vendors?.name}</td>
                        <td className="px-4 py-3">{b.working_days}</td>
                        <td className="px-4 py-3">{b.total_hours}</td>
                        <td className="px-4 py-3">{b.pax ?? b.engagements?.total_pax ?? "—"}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={b.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>

          <div className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Vendor Analytics</h2>
              <Link href="/reports" className="text-xs font-medium text-slate-500 hover:text-slate-800">
                Full report →
              </Link>
            </div>
            <VendorReportTable rows={vendorRows} />
          </div>

          <div className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Training Analytics</h2>
              <Link href="/reports" className="text-xs font-medium text-slate-500 hover:text-slate-800">
                Full report →
              </Link>
            </div>
            <TrainingReportTable rows={trainingRows} />
          </div>

          <div className="mb-8">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">
              Monthly Workload — {year}
            </h2>
            <Card className="p-5">
              <MonthlyWorkloadChart rows={monthly} />
            </Card>
          </div>
        </>
      )}

      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Check Availability</h2>
        <Card className="p-5">
          <AvailabilityForm />
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Quick Start</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <LinkButton href="/vendors/new" variant="secondary">
            <Plus size={16} /> Add Vendor
          </LinkButton>
          <LinkButton href="/clients/new" variant="secondary">
            <Plus size={16} /> Add Client
          </LinkButton>
          <LinkButton href="/trainers/new" variant="secondary">
            <Plus size={16} /> Add Trainer
          </LinkButton>
          <LinkButton href="/catalog/new" variant="secondary">
            <Plus size={16} /> Add Training
          </LinkButton>
        </div>
      </div>
    </>
  );
}
