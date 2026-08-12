import * as XLSX from "xlsx";

export type ParsedCandidate = {
  batchKey: string;
  sourceSheet: string;
  sourceCellRefs: string[];
  startDate: string; // yyyy-MM-dd
  endDate: string;
  rawText: string;
  candidateType: "batch" | "holiday";
  guessedDeliveryMode: string | null;
};

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

const DOW_TOKENS = new Set([
  "mo", "tu", "we", "th", "fr", "sa", "su",
  "mon", "tue", "wed", "thu", "fri", "sat", "sun",
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
]);

const HOLIDAY_KEYWORDS = ["holiday", "pto", "leave", "vacation"];

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function cellRef(row: number, col: number) {
  return XLSX.utils.encode_cell({ r: row, c: col });
}

function findYearInSheetName(name: string): number | null {
  const match = name.match(/20\d{2}/);
  return match ? Number(match[0]) : null;
}

function findMonthNear(sheet: XLSX.WorkSheet, row: number, col: number): number | null {
  // Month headers sit a row or two above the first day number in the block.
  for (let r = Math.max(0, row - 3); r <= row; r++) {
    const cell = sheet[cellRef(r, col)];
    const value = cell?.v;
    if (typeof value === "string") {
      const idx = MONTHS.findIndex((m) => value.trim().toLowerCase().startsWith(m.slice(0, 3)));
      if (idx >= 0) return idx; // 0-indexed
    }
  }
  return null;
}

function looksLikeDow(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return DOW_TOKENS.has(value.trim().toLowerCase());
}

type RawEntry = {
  date: string;
  text: string;
  sheet: string;
  ref: string;
};

// Scans a worksheet for repeating 3-column "day number / day-of-week / event
// text" blocks — the wall-calendar layout used by the source spreadsheet —
// and returns every non-empty event-text cell as a dated entry.
function extractRawEntries(sheetName: string, sheet: XLSX.WorkSheet): RawEntry[] {
  const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1");
  const year = findYearInSheetName(sheetName);
  const entries: RawEntry[] = [];

  for (let col = range.s.c; col <= range.e.c; col++) {
    // Count how many cells in this column look like day-of-month numbers.
    let dayLikeCount = 0;
    for (let row = range.s.r; row <= range.e.r; row++) {
      const value = sheet[cellRef(row, col)]?.v;
      if (typeof value === "number" && value >= 1 && value <= 31 && Number.isInteger(value)) {
        dayLikeCount++;
      }
    }
    if (dayLikeCount < 15) continue; // not a day-number column

    const dowCol = col + 1;
    const textCol = col + 2;
    if (textCol > range.e.c) continue;

    // Confirm the next column actually looks like day-of-week labels.
    let dowLikeCount = 0;
    let checked = 0;
    for (let row = range.s.r; row <= range.e.r; row++) {
      const dayVal = sheet[cellRef(row, col)]?.v;
      if (typeof dayVal !== "number") continue;
      checked++;
      if (looksLikeDow(sheet[cellRef(row, dowCol)]?.v)) dowLikeCount++;
    }
    if (checked === 0 || dowLikeCount / checked < 0.5) continue;

    let month: number | null = null;
    for (let row = range.s.r; row <= range.e.r; row++) {
      const dayVal = sheet[cellRef(row, col)]?.v;
      if (typeof dayVal === "number") {
        month = findMonthNear(sheet, row, col);
        break;
      }
    }
    if (month === null || year === null) continue;

    for (let row = range.s.r; row <= range.e.r; row++) {
      const dayVal = sheet[cellRef(row, col)]?.v;
      if (typeof dayVal !== "number" || !Number.isInteger(dayVal)) continue;
      const textCell = sheet[cellRef(row, textCol)];
      const text = typeof textCell?.v === "string" ? textCell.v.trim() : "";
      if (!text || text === " ") continue;

      const date = `${year}-${pad2(month + 1)}-${pad2(dayVal)}`;
      entries.push({ date, text, sheet: sheetName, ref: cellRef(row, textCol) });
    }
  }

  return entries;
}

function isHolidayText(text: string): boolean {
  const lower = text.toLowerCase();
  return HOLIDAY_KEYWORDS.some((kw) => lower.includes(kw));
}

function guessDeliveryMode(text: string): string | null {
  return /vilt/i.test(text) ? "VILT" : null;
}

// Merges consecutive dates that share identical event text into one
// candidate — this is how the source file represents a multi-day batch (the
// same text repeated on each day it spans).
function groupEntries(entries: RawEntry[]): ParsedCandidate[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date) || a.sheet.localeCompare(b.sheet));
  const groups: ParsedCandidate[] = [];

  for (const entry of sorted) {
    const last = groups[groups.length - 1];
    const prevDate = last ? new Date(last.endDate) : null;
    const isConsecutive =
      last &&
      last.rawText === entry.text &&
      last.sourceSheet === entry.sheet &&
      prevDate &&
      (new Date(entry.date).getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24) <= 3; // tolerate weekend gaps

    if (isConsecutive && last) {
      last.endDate = entry.date;
      last.sourceCellRefs.push(entry.ref);
      continue;
    }

    groups.push({
      batchKey: `${entry.sheet}:${entry.date}:${entry.text}`,
      sourceSheet: entry.sheet,
      sourceCellRefs: [entry.ref],
      startDate: entry.date,
      endDate: entry.date,
      rawText: entry.text,
      candidateType: isHolidayText(entry.text) ? "holiday" : "batch",
      guessedDeliveryMode: guessDeliveryMode(entry.text),
    });
  }

  return groups;
}

export function parseWorkbook(buffer: ArrayBuffer): ParsedCandidate[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const allEntries: RawEntry[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    allEntries.push(...extractRawEntries(sheetName, sheet));
  }

  return groupEntries(allEntries);
}
