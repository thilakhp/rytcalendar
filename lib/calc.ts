import { differenceInCalendarDays, getISODay, parseISO, addDays, format } from "date-fns";

export type HolidayLite = { date: string; is_working_day: boolean };

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calendarDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate || endDate < startDate) return 0;
  return differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) + 1;
}

function holidayMapOf(holidays: HolidayLite[]) {
  return new Map(holidays.map((h) => [h.date, h.is_working_day]));
}

export function isWorkingDate(
  date: Date,
  workingWeekdays: number[],
  holidayMap: Map<string, boolean>,
): boolean {
  if (!workingWeekdays.includes(getISODay(date))) return false;
  const key = format(date, "yyyy-MM-dd");
  if (holidayMap.has(key)) return holidayMap.get(key) === true;
  return true;
}

export function workingDaysBetween(
  startDate: string,
  endDate: string,
  workingWeekdays: number[],
  holidays: HolidayLite[],
): number {
  if (!startDate || !endDate || endDate < startDate) return 0;
  const holidayMap = holidayMapOf(holidays);
  let cursor = parseISO(startDate);
  const end = parseISO(endDate);
  let count = 0;
  while (cursor <= end) {
    if (isWorkingDate(cursor, workingWeekdays, holidayMap)) count++;
    cursor = addDays(cursor, 1);
  }
  return count;
}

// Returns every actual working date (yyyy-MM-dd) between startDate and
// endDate inclusive — used to render a multi-day batch onto a calendar and
// to check per-day availability, since weekends/holidays inside the range
// are not real training days.
export function workingDatesBetween(
  startDate: string,
  endDate: string,
  workingWeekdays: number[],
  holidays: HolidayLite[],
): string[] {
  if (!startDate || !endDate || endDate < startDate) return [];
  const holidayMap = holidayMapOf(holidays);
  let cursor = parseISO(startDate);
  const end = parseISO(endDate);
  const dates: string[] = [];
  while (cursor <= end) {
    if (isWorkingDate(cursor, workingWeekdays, holidayMap)) {
      dates.push(format(cursor, "yyyy-MM-dd"));
    }
    cursor = addDays(cursor, 1);
  }
  return dates;
}

// Returns the date (yyyy-MM-dd) of the Nth working day on/after startDate,
// counting startDate's day as day 1 if it is itself a working day.
export function addWorkingDays(
  startDate: string,
  workingDaysToSpan: number,
  workingWeekdays: number[],
  holidays: HolidayLite[],
): string {
  const holidayMap = holidayMapOf(holidays);
  let cursor = parseISO(startDate);
  let remaining = Math.max(1, workingDaysToSpan);
  let last = cursor;
  // guard against pathological inputs (e.g. no working weekdays configured)
  let safety = 3650;
  while (remaining > 0 && safety > 0) {
    if (isWorkingDate(cursor, workingWeekdays, holidayMap)) {
      last = cursor;
      remaining--;
    }
    if (remaining > 0) cursor = addDays(cursor, 1);
    safety--;
  }
  return format(last, "yyyy-MM-dd");
}

// Same walk-forward as addWorkingDays, but also skips any date present in
// blockedDates (e.g. days already occupied by another commitment) — used by
// the "auto-schedule from total hours/days" batch helper.
export function addWorkingDaysExcluding(
  startDate: string,
  workingDaysToSpan: number,
  workingWeekdays: number[],
  holidays: HolidayLite[],
  blockedDates: Set<string>,
): string {
  const holidayMap = holidayMapOf(holidays);
  let cursor = parseISO(startDate);
  let remaining = Math.max(1, workingDaysToSpan);
  let last = cursor;
  let safety = 3650;
  while (remaining > 0 && safety > 0) {
    const key = format(cursor, "yyyy-MM-dd");
    if (isWorkingDate(cursor, workingWeekdays, holidayMap) && !blockedDates.has(key)) {
      last = cursor;
      remaining--;
    }
    if (remaining > 0) cursor = addDays(cursor, 1);
    safety--;
  }
  return format(last, "yyyy-MM-dd");
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function grossHoursPerDay(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  const diff = toMinutes(endTime) - toMinutes(startTime);
  return diff > 0 ? diff / 60 : 0;
}

export function netHoursPerDay(
  startTime: string,
  endTime: string,
  breakMinutes: number,
): number {
  const net = grossHoursPerDay(startTime, endTime) - (breakMinutes || 0) / 60;
  return net > 0 ? net : 0;
}

export type BatchCalc = {
  calendarDays: number;
  workingDays: number;
  hoursPerDay: number;
  netHoursPerDay: number;
  totalHours: number;
};

export function calcBatch(
  input: {
    start_date: string;
    end_date: string;
    start_time: string;
    end_time: string;
    break_minutes: number;
  },
  workingWeekdays: number[],
  holidays: HolidayLite[],
): BatchCalc {
  const cd = calendarDays(input.start_date, input.end_date);
  const wd = workingDaysBetween(input.start_date, input.end_date, workingWeekdays, holidays);
  const gross = round2(grossHoursPerDay(input.start_time, input.end_time));
  const net = round2(netHoursPerDay(input.start_time, input.end_time, input.break_minutes));
  return {
    calendarDays: cd,
    workingDays: wd,
    hoursPerDay: gross,
    netHoursPerDay: net,
    totalHours: round2(wd * net),
  };
}
