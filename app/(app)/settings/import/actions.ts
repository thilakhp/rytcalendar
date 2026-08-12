"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseWorkbook } from "@/lib/xlsx-import";
import { calcBatch } from "@/lib/calc";
import type { Settings } from "@/lib/types";

export type UploadResult = { error?: string } | undefined;

function findMatch(text: string, options: { id: string; name: string }[]): string | null {
  const lower = text.toLowerCase();
  const hit = options.find((o) => o.name.length >= 3 && lower.includes(o.name.toLowerCase()));
  return hit?.id ?? null;
}

export async function uploadCalendarFile(
  _prevState: UploadResult,
  formData: FormData,
): Promise<UploadResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an .xlsx file to upload." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const buffer = await file.arrayBuffer();

  let candidates;
  try {
    candidates = parseWorkbook(buffer);
  } catch {
    return { error: "Could not read that file. Make sure it's a valid .xlsx spreadsheet." };
  }

  if (candidates.length === 0) {
    return {
      error:
        "No dated entries were recognized in that file. The importer looks for a wall-calendar layout (day number, day-of-week, event text repeating across the sheet).",
    };
  }

  const [{ data: vendors }, { data: clients }, { data: courses }] = await Promise.all([
    supabase.from("vendors").select("id, name"),
    supabase.from("clients").select("id, name"),
    supabase.from("training_courses").select("id, name"),
  ]);

  const rows = candidates.map((c) => ({
    owner_id: user.id,
    batch_key: c.batchKey,
    source_sheet: c.sourceSheet,
    source_cell_refs: c.sourceCellRefs,
    start_date: c.startDate,
    end_date: c.endDate,
    raw_text: c.rawText,
    candidate_type: c.candidateType,
    program_name: c.candidateType === "batch" ? c.rawText : null,
    delivery_mode: c.guessedDeliveryMode,
    training_course_id: c.candidateType === "batch" ? findMatch(c.rawText, courses ?? []) : null,
    vendor_id: c.candidateType === "batch" ? findMatch(c.rawText, vendors ?? []) : null,
    client_id: c.candidateType === "batch" ? findMatch(c.rawText, clients ?? []) : null,
    status: "planned",
    review_status: "needs_review",
  }));

  const { error } = await supabase.from("import_staging").insert(rows);
  if (error) {
    return { error: "Could not save the parsed rows. Please try again." };
  }

  revalidatePath("/settings/import");
  redirect("/settings/import");
}

export type ApproveResult = { error?: string } | undefined;

export async function updateStagingRow(id: string, formData: FormData): Promise<ApproveResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("import_staging")
    .update({
      program_name: formData.get("program_name") || null,
      client_id: formData.get("client_id") || null,
      vendor_id: formData.get("vendor_id") || null,
      training_course_id: formData.get("training_course_id") || null,
      delivery_mode: formData.get("delivery_mode") || null,
      status: formData.get("status") || "planned",
      start_date: formData.get("start_date"),
      end_date: formData.get("end_date"),
    })
    .eq("id", id);

  if (error) return { error: "Could not save changes." };
  revalidatePath("/settings/import");
  return undefined;
}

export async function ignoreStagingRow(id: string) {
  const supabase = await createClient();
  await supabase.from("import_staging").update({ review_status: "ignored" }).eq("id", id);
  revalidatePath("/settings/import");
}

export async function restoreStagingRow(id: string) {
  const supabase = await createClient();
  await supabase.from("import_staging").update({ review_status: "needs_review" }).eq("id", id);
  revalidatePath("/settings/import");
}

// The keyword heuristic (§53) doesn't catch everything — e.g. "New Year's
// Day" has no "holiday" substring — so the review screen lets the user
// reclassify a candidate by hand instead of trying to perfect the guess.
export async function reclassifyStagingRow(id: string, candidateType: "batch" | "holiday") {
  const supabase = await createClient();
  await supabase.from("import_staging").update({ candidate_type: candidateType }).eq("id", id);
  revalidatePath("/settings/import");
}

export async function deleteStagingRow(id: string) {
  const supabase = await createClient();
  await supabase.from("import_staging").delete().eq("id", id);
  revalidatePath("/settings/import");
}

export async function approveStagingRow(id: string, formData: FormData): Promise<ApproveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: row } = await supabase.from("import_staging").select("*").eq("id", id).maybeSingle();
  if (!row) return { error: "This row no longer exists." };

  // Persist any last-second edits from the review form first.
  const program_name = (formData.get("program_name") as string) || row.raw_text;
  const client_id = (formData.get("client_id") as string) || row.client_id;
  const vendor_id = (formData.get("vendor_id") as string) || row.vendor_id || null;
  const training_course_id = (formData.get("training_course_id") as string) || row.training_course_id;
  const delivery_mode = (formData.get("delivery_mode") as string) || row.delivery_mode;
  const status = (formData.get("status") as string) || row.status;
  const start_date = (formData.get("start_date") as string) || row.start_date;
  const end_date = (formData.get("end_date") as string) || row.end_date;
  const start_time = (formData.get("start_time") as string) || "09:00";
  const end_time = (formData.get("end_time") as string) || "13:00";

  if (row.candidate_type === "holiday") {
    const { data: holiday, error } = await supabase
      .from("holidays")
      .insert({
        owner_id: user.id,
        date: start_date,
        name: row.raw_text,
        is_working_day: false,
      })
      .select("id")
      .single();
    if (error) return { error: "Could not create the holiday." };

    await supabase
      .from("import_staging")
      .update({ review_status: "approved", linked_holiday_id: holiday.id })
      .eq("id", id);
    revalidatePath("/settings/import");
    revalidatePath("/settings/holidays");
    return undefined;
  }

  if (!client_id) return { error: "Select a client before approving this batch." };

  const { data: settings } = await supabase
    .from("settings")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();
  const s = settings as Settings | null;
  const { data: holidays } = await supabase.from("holidays").select("date, is_working_day");
  const workingWeekdays = s?.working_weekdays ?? [1, 2, 3, 4, 5];

  // Reuse an existing engagement for the same client + vendor + program
  // instead of creating a duplicate — the source calendar represents one
  // multi-week program as several date-broken blocks of identical text.
  let engagementId: string | null = null;
  let existingQuery = supabase
    .from("engagements")
    .select("id")
    .eq("owner_id", user.id)
    .eq("client_id", client_id)
    .ilike("program_name", program_name);
  existingQuery = vendor_id ? existingQuery.eq("vendor_id", vendor_id) : existingQuery.is("vendor_id", null);
  const { data: existing } = await existingQuery.maybeSingle();
  engagementId = existing?.id ?? null;

  if (!engagementId) {
    const { data: engagement, error: engErr } = await supabase
      .from("engagements")
      .insert({
        owner_id: user.id,
        client_id,
        vendor_id: vendor_id || null,
        program_name,
        primary_timezone: s?.default_timezone ?? "Asia/Kolkata",
        overall_status: status,
        notes: "Migrated from Excel import.",
      })
      .select("id")
      .single();
    if (engErr || !engagement) return { error: "Could not create the engagement." };
    engagementId = engagement.id;
  }

  const calc = calcBatch(
    { start_date, end_date, start_time, end_time, break_minutes: 0 },
    workingWeekdays,
    holidays ?? [],
  );

  const { error: batchErr } = await supabase.from("batches").insert({
    owner_id: user.id,
    engagement_id: engagementId,
    training_course_id: training_course_id || null,
    start_date,
    end_date,
    start_time,
    end_time,
    timezone: s?.default_timezone ?? "Asia/Kolkata",
    delivery_mode: delivery_mode || null,
    status,
    calendar_days: calc.calendarDays,
    working_days: calc.workingDays,
    hours_per_day: calc.hoursPerDay,
    net_hours_per_day: calc.netHoursPerDay,
    total_hours: calc.totalHours,
  });
  if (batchErr) {
    if (!existing) await supabase.from("engagements").delete().eq("id", engagementId);
    return { error: "Could not create the batch." };
  }

  await supabase
    .from("import_staging")
    .update({ review_status: "approved", linked_engagement_id: engagementId })
    .eq("id", id);

  revalidatePath("/settings/import");
  revalidatePath("/engagements");
  revalidatePath("/dashboard");
  return undefined;
}

export async function clearApprovedAndIgnored() {
  const supabase = await createClient();
  await supabase.from("import_staging").delete().in("review_status", ["approved", "ignored"]);
  revalidatePath("/settings/import");
}
