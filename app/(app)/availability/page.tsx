import { eachDayOfInterval, format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { buildDayMap, dayAvailability, findConflicts } from "@/lib/schedule";
import { AvailabilityForm } from "@/components/availability/availability-form";
import { AvailabilityResults } from "@/components/availability/availability-results";
import type { CalendarBatch } from "@/components/calendar/types";
import type { Settings } from "@/lib/types";

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: settings } = await supabase
    .from("settings")
    .select("*")
    .eq("owner_id", user?.id ?? "")
    .maybeSingle();
  const s = settings as Settings | null;
  const workingWeekdays = s?.working_weekdays ?? [1, 2, 3, 4, 5];
  const rules = s?.availability_rules ?? {
    planned: "tentative",
    confirmed: "blocks",
    in_progress: "blocks",
    completed: "historical",
    cancelled: "none",
  };

  let results: React.ReactNode = null;

  if (from && to && to >= from) {
    const [{ data: batches }, { data: holidays }] = await Promise.all([
      supabase
        .from("batches")
        .select(
          "id, engagement_id, start_date, end_date, start_time, end_time, timezone, status, pax, delivery_mode, location, working_days, total_hours, notes, training_courses(name), trainers(name), engagements(program_name, total_pax, clients(name), vendors(name))",
        )
        .lte("start_date", to)
        .gte("end_date", from)
        .returns<CalendarBatch[]>(),
      supabase.from("holidays").select("date, is_working_day"),
    ]);

    const dayMap = buildDayMap(batches ?? [], workingWeekdays, holidays ?? []);
    const dates = eachDayOfInterval({ start: parseISO(from), end: parseISO(to) }).map((d) =>
      format(d, "yyyy-MM-dd"),
    );

    const days = dates.map((date) => {
      const dayBatches = dayMap.get(date) ?? [];
      return {
        date,
        status: dayAvailability(dayBatches, rules),
        batches: dayBatches,
        conflicts: findConflicts(dayBatches),
        engagementCount: new Set(dayBatches.map((b) => b.engagement_id)).size,
      };
    });

    const available = days.filter((d) => d.status === "available").length;
    const tentative = days.filter((d) => d.status === "tentative").length;
    const occupied = days.filter((d) => d.status === "occupied").length;

    results = (
      <AvailabilityResults
        days={days}
        available={available}
        tentative={tentative}
        occupied={occupied}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Availability"
        description="Check a date range against your training schedule to see open days."
      />
      <Card className="mb-6 p-5">
        <AvailabilityForm from={from} to={to} />
      </Card>
      {results ?? (
        <Card className="px-6 py-16 text-center text-sm text-slate-500">
          Choose a date range above to check availability.
        </Card>
      )}
    </>
  );
}
