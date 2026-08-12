import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { ReportFilters } from "@/components/reports/report-filters";
import { ReportTabs } from "@/components/reports/report-tabs";
import { VendorReportTable } from "@/components/reports/vendor-report-table";
import { TrainingReportTable } from "@/components/reports/training-report-table";
import { ClientReportTable } from "@/components/reports/client-report-table";
import { TrainerReportTable } from "@/components/reports/trainer-report-table";
import { VendorTrainingMatrix } from "@/components/reports/vendor-training-matrix";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/data/status-badge";
import {
  buildVendorReport,
  buildClientReport,
  buildTrainingReport,
  buildTrainerReport,
  buildStatusBreakdown,
  buildVendorTrainingMatrix,
  buildMonthlyReport,
  type ReportBatch,
} from "@/lib/analytics";
import type { Settings } from "@/lib/types";

const REPORT_SELECT =
  "id, engagement_id, training_course_id, trainer_id, start_date, end_date, status, pax, working_days, net_hours_per_day, total_hours, delivery_mode, training_courses(name), trainers(name), engagements(program_name, overall_status, total_pax, client_id, vendor_id, clients(name), vendors(name))";

type SearchParams = {
  tab?: string;
  year?: string;
  month?: string;
  vendor?: string;
  client?: string;
  training?: string;
  trainer?: string;
  status?: string;
  delivery?: string;
  metric?: "batches" | "days" | "hours";
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const tab = params.tab ?? "vendor";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: vendors },
    { data: clients },
    { data: courses },
    { data: trainers },
    { data: settings },
    { data: holidays },
    { data: batches },
  ] = await Promise.all([
    supabase.from("vendors").select("id, name").order("name"),
    supabase.from("clients").select("id, name").order("name"),
    supabase.from("training_courses").select("id, name").order("name"),
    supabase.from("trainers").select("id, name").order("name"),
    supabase.from("settings").select("*").eq("owner_id", user?.id ?? "").maybeSingle(),
    supabase.from("holidays").select("date, is_working_day"),
    supabase.from("batches").select(REPORT_SELECT).returns<ReportBatch[]>(),
  ]);

  const s = settings as Settings | null;
  const workingWeekdays = s?.working_weekdays ?? [1, 2, 3, 4, 5];
  const statuses = s?.statuses ?? ["planned", "confirmed", "in_progress", "completed", "cancelled"];
  const deliveryModes = s?.delivery_modes ?? ["VILT", "Classroom", "Self-Paced", "Hybrid"];

  const allBatches = batches ?? [];
  const years = Array.from(new Set(allBatches.map((b) => Number(b.start_date.slice(0, 4))))).sort(
    (a, b) => b - a,
  );
  if (years.length === 0) years.push(new Date().getFullYear());

  const filtered = allBatches.filter((b) => {
    if (params.year && b.start_date.slice(0, 4) !== params.year) return false;
    if (params.month && b.start_date.slice(5, 7) !== params.month.padStart(2, "0")) return false;
    if (params.vendor && b.engagements?.vendor_id !== params.vendor) return false;
    if (params.client && b.engagements?.client_id !== params.client) return false;
    if (params.training && b.training_course_id !== params.training) return false;
    if (params.trainer && b.trainer_id !== params.trainer) return false;
    if (params.status && b.status !== params.status) return false;
    if (params.delivery && b.delivery_mode !== params.delivery) return false;
    return true;
  });

  const queryString = (
    ["year", "month", "vendor", "client", "training", "trainer", "status", "delivery"] as const
  )
    .filter((k) => params[k])
    .map((k) => `&${k}=${params[k]}`)
    .join("");

  return (
    <>
      <PageHeader
        title="Reports"
        description="Filter and analyze training activity across vendors, clients, courses, and time."
      />

      <ReportFilters
        tab={tab}
        filters={params}
        years={years}
        vendors={vendors ?? []}
        clients={clients ?? []}
        courses={courses ?? []}
        trainers={trainers ?? []}
        statuses={statuses}
        deliveryModes={deliveryModes}
      />

      <ReportTabs active={tab} queryString={queryString} />

      {tab === "vendor" && (
        <VendorReportView batches={filtered} />
      )}
      {tab === "training" && <TrainingReportView batches={filtered} />}
      {tab === "client" && <ClientReportView batches={filtered} />}
      {tab === "trainer" && <TrainerReportView batches={filtered} />}
      {tab === "status" && <StatusReportView batches={filtered} />}
      {tab === "matrix" && (
        <MatrixReportView batches={filtered} metric={params.metric ?? "hours"} tab={tab} />
      )}
      {tab === "monthly" && (
        <MonthlyReportView
          batches={allBatches}
          year={params.year ? Number(params.year) : new Date().getFullYear()}
          workingWeekdays={workingWeekdays}
          holidays={holidays ?? []}
        />
      )}
    </>
  );
}

function VendorReportView({ batches }: { batches: ReportBatch[] }) {
  return <VendorReportTable rows={buildVendorReport(batches)} />;
}

function TrainingReportView({ batches }: { batches: ReportBatch[] }) {
  return <TrainingReportTable rows={buildTrainingReport(batches)} />;
}

function ClientReportView({ batches }: { batches: ReportBatch[] }) {
  return <ClientReportTable rows={buildClientReport(batches)} />;
}

function TrainerReportView({ batches }: { batches: ReportBatch[] }) {
  return <TrainerReportTable rows={buildTrainerReport(batches)} />;
}

function StatusReportView({ batches }: { batches: ReportBatch[] }) {
  const rows = buildStatusBreakdown(batches);
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {rows.map((r) => (
        <Card key={r.status} className="p-4">
          <StatusBadge status={r.status} />
          <div className="mt-2 text-2xl font-semibold text-slate-900">{r.batches}</div>
          <div className="text-xs text-slate-400">batches</div>
          <div className="mt-2 text-sm text-slate-600">
            {r.days} days · {r.hours} hrs
          </div>
        </Card>
      ))}
    </div>
  );
}

function MatrixReportView({
  batches,
  metric,
  tab,
}: {
  batches: ReportBatch[];
  metric: "batches" | "days" | "hours";
  tab: string;
}) {
  const matrix = buildVendorTrainingMatrix(batches);
  return (
    <VendorTrainingMatrix
      vendors={matrix.vendors}
      courses={matrix.courses}
      cell={matrix.cell}
      metric={metric}
      tab={tab}
    />
  );
}

function MonthlyReportView({
  batches,
  year,
  workingWeekdays,
  holidays,
}: {
  batches: ReportBatch[];
  year: number;
  workingWeekdays: number[];
  holidays: { date: string; is_working_day: boolean }[];
}) {
  const rows = buildMonthlyReport(year, batches, workingWeekdays, holidays);
  const totalHours = Math.round(rows.reduce((s, r) => s + r.trainingHours, 0) * 100) / 100;
  const totalDays = rows.reduce((s, r) => s + r.trainingDays, 0);
  const avgUtilization =
    rows.length > 0
      ? Math.round((rows.reduce((s, r) => s + r.utilization, 0) / rows.length) * 10) / 10
      : 0;

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label={`${year} Training Days`} value={totalDays} />
        <StatCard label={`${year} Training Hours`} value={totalHours} />
        <StatCard label="Avg Utilization" value={`${avgUtilization}%`} />
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/60">
            <tr>
              {[
                "Month", "Working Days", "Training Days", "Available Days", "Tentative", "Occupied",
                "Hours", "PAX", "Confirmed", "Planned", "In Progress", "Completed", "Cancelled", "Utilization",
              ].map((h) => (
                <th key={h} className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.month}>
                <td className="px-4 py-3 font-medium text-slate-900">{r.label}</td>
                <td className="px-4 py-3">{r.workingDays}</td>
                <td className="px-4 py-3">{r.trainingDays}</td>
                <td className="px-4 py-3">{r.availableDays}</td>
                <td className="px-4 py-3">{r.tentativeDays}</td>
                <td className="px-4 py-3">{r.occupiedDays}</td>
                <td className="px-4 py-3">{r.trainingHours}</td>
                <td className="px-4 py-3">{r.pax}</td>
                <td className="px-4 py-3">{r.confirmedDays}</td>
                <td className="px-4 py-3">{r.plannedDays}</td>
                <td className="px-4 py-3">{r.inProgressDays}</td>
                <td className="px-4 py-3">{r.completedDays}</td>
                <td className="px-4 py-3">{r.cancelledDays}</td>
                <td className="px-4 py-3">{r.utilization}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
