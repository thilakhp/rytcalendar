import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
  format,
  parseISO,
} from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { CalendarView } from "@/components/calendar/calendar-view";
import type { CalendarBatch } from "@/components/calendar/types";
import type { Settings } from "@/lib/types";

type CalendarViewMode = "month" | "week" | "day" | "year";

function resolveRange(view: CalendarViewMode, focus: Date) {
  switch (view) {
    case "week":
      return {
        start: startOfWeek(focus, { weekStartsOn: 1 }),
        end: endOfWeek(focus, { weekStartsOn: 1 }),
      };
    case "day":
      return { start: focus, end: focus };
    case "year":
      return { start: startOfYear(focus), end: endOfYear(focus) };
    case "month":
    default:
      return {
        start: startOfWeek(startOfMonth(focus), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(focus), { weekStartsOn: 1 }),
      };
  }
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const { view: rawView, date: rawDate } = await searchParams;
  const view: CalendarViewMode =
    rawView === "week" || rawView === "day" || rawView === "year" ? rawView : "month";
  const focus = rawDate ? parseISO(rawDate) : new Date();

  const { start, end } = resolveRange(view, focus);
  const startStr = format(start, "yyyy-MM-dd");
  const endStr = format(end, "yyyy-MM-dd");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: batches }, { data: holidays }, { data: settings }] = await Promise.all([
    supabase
      .from("batches")
      .select(
        "id, engagement_id, start_date, end_date, start_time, end_time, timezone, status, pax, delivery_mode, location, working_days, total_hours, notes, training_courses(name), trainers(name), engagements(program_name, total_pax, clients(name), vendors(name))",
      )
      .lte("start_date", endStr)
      .gte("end_date", startStr)
      .order("start_date")
      .returns<CalendarBatch[]>(),
    supabase.from("holidays").select("date, is_working_day"),
    supabase.from("settings").select("*").eq("owner_id", user?.id ?? "").maybeSingle(),
  ]);

  const s = settings as Settings | null;

  return (
    <>
      <PageHeader
        title="Calendar"
        description="Populated automatically from your training batches — nothing here is entered by hand."
      />
      <CalendarView
        view={view}
        focusDate={format(focus, "yyyy-MM-dd")}
        batches={batches ?? []}
        workingWeekdays={s?.working_weekdays ?? [1, 2, 3, 4, 5]}
        holidays={holidays ?? []}
      />
    </>
  );
}
