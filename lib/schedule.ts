import { workingDatesBetween, type HolidayLite } from "@/lib/calc";
import type { AvailabilityRule } from "@/lib/types";

type DatedBatch = {
  start_date: string;
  end_date: string;
  status: string;
};

// Groups batches onto every working date they actually occupy (weekends and
// holidays inside a batch's date range are skipped).
export function buildDayMap<T extends DatedBatch>(
  batches: T[],
  workingWeekdays: number[],
  holidays: HolidayLite[],
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const batch of batches) {
    const dates = workingDatesBetween(batch.start_date, batch.end_date, workingWeekdays, holidays);
    for (const date of dates) {
      const list = map.get(date) ?? [];
      list.push(batch);
      map.set(date, list);
    }
  }
  return map;
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function timeRangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);
}

type TimedBatch = DatedBatch & { id: string; start_time: string; end_time: string };

// Returns pairs of same-day batches whose times overlap. Cancelled batches
// never conflict — they don't occupy real time.
export function findConflicts<T extends TimedBatch>(batchesOnDay: T[]): [T, T][] {
  const active = batchesOnDay.filter((b) => b.status !== "cancelled");
  const conflicts: [T, T][] = [];
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      if (
        timeRangesOverlap(
          active[i].start_time,
          active[i].end_time,
          active[j].start_time,
          active[j].end_time,
        )
      ) {
        conflicts.push([active[i], active[j]]);
      }
    }
  }
  return conflicts;
}

export type DayAvailability = "available" | "tentative" | "occupied";

const RULE_RANK: Record<AvailabilityRule, number> = {
  blocks: 3,
  tentative: 2,
  historical: 1,
  none: 0,
};

// Combines every batch active on a day into one availability verdict, using
// the strongest rule present (a single confirmed batch blocks the day even
// if a cancelled one also touches it).
export function dayAvailability(
  batches: { status: string }[],
  rules: Record<string, AvailabilityRule>,
): DayAvailability {
  let strongest: AvailabilityRule = "none";
  for (const b of batches) {
    const rule = rules[b.status] ?? "blocks";
    if (RULE_RANK[rule] > RULE_RANK[strongest]) strongest = rule;
  }
  if (strongest === "blocks") return "occupied";
  if (strongest === "tentative") return "tentative";
  return "available";
}
