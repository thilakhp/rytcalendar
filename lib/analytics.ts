import { workingDatesBetween, type HolidayLite } from "@/lib/calc";
import { buildDayMap, dayAvailability } from "@/lib/schedule";
import type { AvailabilityRule, EngagementStatus } from "@/lib/types";

export type ReportBatch = {
  id: string;
  engagement_id: string;
  training_course_id: string | null;
  trainer_id: string | null;
  start_date: string;
  end_date: string;
  status: string;
  pax: number | null;
  working_days: number | null;
  net_hours_per_day: number | null;
  total_hours: number | null;
  delivery_mode: string | null;
  training_courses: { name: string } | null;
  trainers: { name: string } | null;
  engagements: {
    program_name: string;
    overall_status: string;
    total_pax: number | null;
    client_id: string;
    vendor_id: string | null;
    clients: { name: string } | null;
    vendors: { name: string } | null;
  } | null;
};

// A headcount total across a set of batches, without double-counting
// batches that belong to the same engagement (multiple batches in one
// program are usually the same cohort of trainees attending each course).
export function sumEngagementPax(batches: ReportBatch[]): number {
  const byEngagement = new Map<string, number>();
  for (const b of batches) {
    const pax = b.engagements?.total_pax ?? b.pax ?? 0;
    byEngagement.set(b.engagement_id, Math.max(byEngagement.get(b.engagement_id) ?? 0, pax));
  }
  return Array.from(byEngagement.values()).reduce((s, v) => s + v, 0);
}

function sumWorkingDays(batches: ReportBatch[]): number {
  return batches.reduce((s, b) => s + (b.working_days ?? 0), 0);
}

function sumHours(batches: ReportBatch[]): number {
  return Math.round(batches.reduce((s, b) => s + (b.total_hours ?? 0), 0) * 100) / 100;
}

export type VendorReportRow = {
  vendorId: string;
  vendorName: string;
  engagements: number;
  batches: number;
  days: number;
  hours: number;
  pax: number;
};

export function buildVendorReport(batches: ReportBatch[]): VendorReportRow[] {
  const groups = new Map<string, ReportBatch[]>();
  for (const b of batches) {
    const id = b.engagements?.vendor_id;
    if (!id) continue;
    groups.set(id, [...(groups.get(id) ?? []), b]);
  }
  return Array.from(groups.entries()).map(([vendorId, rows]) => ({
    vendorId,
    vendorName: rows[0].engagements?.vendors?.name ?? "Unknown",
    engagements: new Set(rows.map((r) => r.engagement_id)).size,
    batches: rows.length,
    days: sumWorkingDays(rows),
    hours: sumHours(rows),
    pax: sumEngagementPax(rows),
  }));
}

export type ClientReportRow = {
  clientId: string;
  clientName: string;
  programs: number;
  batches: number;
  days: number;
  hours: number;
  pax: number;
  vendors: number;
};

export function buildClientReport(batches: ReportBatch[]): ClientReportRow[] {
  const groups = new Map<string, ReportBatch[]>();
  for (const b of batches) {
    const id = b.engagements?.client_id;
    if (!id) continue;
    groups.set(id, [...(groups.get(id) ?? []), b]);
  }
  return Array.from(groups.entries()).map(([clientId, rows]) => ({
    clientId,
    clientName: rows[0].engagements?.clients?.name ?? "Unknown",
    programs: new Set(rows.map((r) => r.engagement_id)).size,
    batches: rows.length,
    days: sumWorkingDays(rows),
    hours: sumHours(rows),
    pax: sumEngagementPax(rows),
    vendors: new Set(rows.map((r) => r.engagements?.vendor_id).filter(Boolean)).size,
  }));
}

export type TrainingReportRow = {
  courseId: string;
  courseName: string;
  batches: number;
  days: number;
  hours: number;
  vendors: number;
  clients: number;
};

export function buildTrainingReport(batches: ReportBatch[]): TrainingReportRow[] {
  const groups = new Map<string, ReportBatch[]>();
  for (const b of batches) {
    const id = b.training_course_id;
    if (!id) continue;
    groups.set(id, [...(groups.get(id) ?? []), b]);
  }
  return Array.from(groups.entries()).map(([courseId, rows]) => ({
    courseId,
    courseName: rows[0].training_courses?.name ?? "Unknown",
    batches: rows.length,
    days: sumWorkingDays(rows),
    hours: sumHours(rows),
    vendors: new Set(rows.map((r) => r.engagements?.vendor_id).filter(Boolean)).size,
    clients: new Set(rows.map((r) => r.engagements?.client_id).filter(Boolean)).size,
  }));
}

export type TrainerReportRow = {
  trainerId: string;
  trainerName: string;
  batches: number;
  days: number;
  hours: number;
  pax: number;
};

export function buildTrainerReport(batches: ReportBatch[]): TrainerReportRow[] {
  const groups = new Map<string, ReportBatch[]>();
  for (const b of batches) {
    const id = b.trainer_id;
    if (!id) continue;
    groups.set(id, [...(groups.get(id) ?? []), b]);
  }
  return Array.from(groups.entries()).map(([trainerId, rows]) => ({
    trainerId,
    trainerName: rows[0].trainers?.name ?? "Unknown",
    batches: rows.length,
    days: sumWorkingDays(rows),
    hours: sumHours(rows),
    pax: sumEngagementPax(rows),
  }));
}

export type StatusRow = {
  status: string;
  batches: number;
  days: number;
  hours: number;
};

const STATUS_ORDER: EngagementStatus[] = [
  "planned",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
];

export function buildStatusBreakdown(batches: ReportBatch[]): StatusRow[] {
  return STATUS_ORDER.map((status) => {
    const rows = batches.filter((b) => b.status === status);
    return { status, batches: rows.length, days: sumWorkingDays(rows), hours: sumHours(rows) };
  });
}

export type MatrixCell = { batches: number; days: number; hours: number };

export function buildVendorTrainingMatrix(batches: ReportBatch[]) {
  const vendors = new Map<string, string>();
  const courses = new Map<string, string>();
  const cells = new Map<string, MatrixCell>();

  for (const b of batches) {
    const vendorId = b.engagements?.vendor_id;
    const courseId = b.training_course_id;
    if (!vendorId || !courseId) continue;
    vendors.set(vendorId, b.engagements?.vendors?.name ?? "Unknown");
    courses.set(courseId, b.training_courses?.name ?? "Unknown");
    const key = `${vendorId}::${courseId}`;
    const cell = cells.get(key) ?? { batches: 0, days: 0, hours: 0 };
    cell.batches += 1;
    cell.days += b.working_days ?? 0;
    cell.hours += b.total_hours ?? 0;
    cells.set(key, cell);
  }

  return {
    vendors: Array.from(vendors.entries()).map(([id, name]) => ({ id, name })),
    courses: Array.from(courses.entries()).map(([id, name]) => ({ id, name })),
    cell: (vendorId: string, courseId: string) => cells.get(`${vendorId}::${courseId}`),
  };
}

export type MonthlyRow = {
  month: string; // yyyy-MM
  label: string; // "Jan 2026"
  workingDays: number;
  trainingDays: number;
  availableDays: number;
  tentativeDays: number;
  occupiedDays: number;
  trainingHours: number;
  pax: number;
  confirmedDays: number;
  plannedDays: number;
  inProgressDays: number;
  completedDays: number;
  cancelledDays: number;
  utilization: number;
};

// Builds a Jan-Dec workload table for `year`. `batches` should include every
// batch that could touch this year (the caller is responsible for fetching
// a wide-enough range, since a batch can start in December and run into
// January).
export function buildMonthlyReport(
  year: number,
  batches: ReportBatch[],
  workingWeekdays: number[],
  holidays: HolidayLite[],
): MonthlyRow[] {
  const dayMap = buildDayMap(batches, workingWeekdays, holidays);
  const rules: Record<string, AvailabilityRule> = {
    planned: "tentative",
    confirmed: "blocks",
    in_progress: "blocks",
    completed: "historical",
    cancelled: "none",
  };

  // Per-engagement pax attribution, bucketed by month, to avoid double
  // counting a program's cohort across its own batches within one month.
  const paxByMonthEngagement = new Map<string, Map<string, number>>();

  const rows: MonthlyRow[] = [];
  for (let m = 0; m < 12; m++) {
    const monthStart = new Date(Date.UTC(year, m, 1));
    const monthEnd = new Date(Date.UTC(year, m + 1, 0));
    const startStr = monthStart.toISOString().slice(0, 10);
    const endStr = monthEnd.toISOString().slice(0, 10);
    const monthKey = startStr.slice(0, 7);

    const capacityDates = workingDatesBetween(startStr, endStr, workingWeekdays, holidays);

    let trainingDays = 0;
    let availableDays = 0;
    let tentativeDays = 0;
    let occupiedDays = 0;

    for (const date of capacityDates) {
      const dayBatches = dayMap.get(date) ?? [];
      if (dayBatches.length > 0) trainingDays++;
      const status = dayAvailability(dayBatches, rules);
      if (status === "available") availableDays++;
      else if (status === "tentative") tentativeDays++;
      else occupiedDays++;
    }

    rows.push({
      month: monthKey,
      label: monthStart.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" }),
      workingDays: capacityDates.length,
      trainingDays,
      availableDays,
      tentativeDays,
      occupiedDays,
      trainingHours: 0,
      pax: 0,
      confirmedDays: 0,
      plannedDays: 0,
      inProgressDays: 0,
      completedDays: 0,
      cancelledDays: 0,
      utilization: capacityDates.length > 0 ? Math.round((trainingDays / capacityDates.length) * 1000) / 10 : 0,
    });
    paxByMonthEngagement.set(monthKey, new Map());
  }

  const rowByMonth = new Map(rows.map((r) => [r.month, r]));

  for (const b of batches) {
    const dates = workingDatesBetween(b.start_date, b.end_date, workingWeekdays, holidays);
    for (const date of dates) {
      const monthKey = date.slice(0, 7);
      const row = rowByMonth.get(monthKey);
      if (!row) continue; // outside the requested year
      row.trainingHours += b.net_hours_per_day ?? 0;
      if (b.status === "confirmed") row.confirmedDays++;
      else if (b.status === "planned") row.plannedDays++;
      else if (b.status === "in_progress") row.inProgressDays++;
      else if (b.status === "completed") row.completedDays++;
      else if (b.status === "cancelled") row.cancelledDays++;

      const paxMap = paxByMonthEngagement.get(monthKey)!;
      const pax = b.engagements?.total_pax ?? b.pax ?? 0;
      paxMap.set(b.engagement_id, Math.max(paxMap.get(b.engagement_id) ?? 0, pax));
    }
  }

  for (const row of rows) {
    row.trainingHours = Math.round(row.trainingHours * 100) / 100;
    row.pax = Array.from(paxByMonthEngagement.get(row.month)?.values() ?? []).reduce(
      (s, v) => s + v,
      0,
    );
  }

  return rows;
}
