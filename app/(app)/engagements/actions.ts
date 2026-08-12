"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { EngagementInputSchema, type EngagementInput } from "@/lib/validation/engagements";
import { calcBatch, type HolidayLite } from "@/lib/calc";

export type EngagementActionResult = { error?: string } | undefined;

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function getWorkingRules(supabase: SupabaseServerClient, ownerId: string) {
  const [{ data: settings }, { data: holidays }] = await Promise.all([
    supabase
      .from("settings")
      .select("working_weekdays")
      .eq("owner_id", ownerId)
      .maybeSingle(),
    supabase.from("holidays").select("date, is_working_day"),
  ]);

  return {
    workingWeekdays: (settings?.working_weekdays as number[] | undefined) ?? [1, 2, 3, 4, 5],
    holidays: (holidays ?? []) as HolidayLite[],
  };
}

function buildBatchRow(
  b: EngagementInput["batches"][number],
  ownerId: string,
  engagementId: string,
  fallbackPax: number | null | undefined,
  workingWeekdays: number[],
  holidays: HolidayLite[],
) {
  const calc = calcBatch(b, workingWeekdays, holidays);
  return {
    owner_id: ownerId,
    engagement_id: engagementId,
    training_course_id: b.training_course_id,
    trainer_id: b.trainer_id || null,
    start_date: b.start_date,
    end_date: b.end_date,
    start_time: b.start_time,
    end_time: b.end_time,
    timezone: b.timezone,
    delivery_mode: b.delivery_mode || null,
    status: b.status,
    pax: b.pax ?? fallbackPax ?? null,
    location: b.location || null,
    break_minutes: b.break_minutes,
    notes: b.notes || null,
    calendar_days: calc.calendarDays,
    working_days: calc.workingDays,
    hours_per_day: calc.hoursPerDay,
    net_hours_per_day: calc.netHoursPerDay,
    total_hours: calc.totalHours,
  };
}

export async function createEngagement(
  input: EngagementInput,
): Promise<EngagementActionResult> {
  const parsed = EngagementInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");
  const ownerId = userData.user.id;

  const { client_id, vendor_id, program_name, total_pax, primary_timezone, overall_status, notes, batches } =
    parsed.data;

  const { data: engagement, error: engErr } = await supabase
    .from("engagements")
    .insert({
      owner_id: ownerId,
      client_id,
      vendor_id: vendor_id || null,
      program_name,
      total_pax: total_pax ?? null,
      primary_timezone,
      overall_status,
      notes: notes || null,
    })
    .select("id")
    .single();

  if (engErr || !engagement) {
    return { error: "Could not save engagement. Please try again." };
  }

  const { workingWeekdays, holidays } = await getWorkingRules(supabase, ownerId);
  const batchRows = batches.map((b) =>
    buildBatchRow(b, ownerId, engagement.id, total_pax, workingWeekdays, holidays),
  );

  const { error: batchErr } = await supabase.from("batches").insert(batchRows);
  if (batchErr) {
    await supabase.from("engagements").delete().eq("id", engagement.id);
    return { error: "Could not save training batches. Please try again." };
  }

  revalidatePath("/engagements");
  revalidatePath("/dashboard");
  redirect(`/engagements/${engagement.id}`);
}

export async function updateEngagement(
  id: string,
  input: EngagementInput,
): Promise<EngagementActionResult> {
  const parsed = EngagementInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");
  const ownerId = userData.user.id;

  const { client_id, vendor_id, program_name, total_pax, primary_timezone, overall_status, notes, batches } =
    parsed.data;

  const { error: engErr } = await supabase
    .from("engagements")
    .update({
      client_id,
      vendor_id: vendor_id || null,
      program_name,
      total_pax: total_pax ?? null,
      primary_timezone,
      overall_status,
      notes: notes || null,
    })
    .eq("id", id);

  if (engErr) {
    return { error: "Could not save engagement. Please try again." };
  }

  const { workingWeekdays, holidays } = await getWorkingRules(supabase, ownerId);

  const { data: existingBatches } = await supabase
    .from("batches")
    .select("id")
    .eq("engagement_id", id);
  const existingIds = new Set((existingBatches ?? []).map((b) => b.id as string));
  const submittedIds = new Set(batches.filter((b) => b.id).map((b) => b.id as string));

  const toDelete = [...existingIds].filter((eid) => !submittedIds.has(eid));
  if (toDelete.length > 0) {
    await supabase.from("batches").delete().in("id", toDelete);
  }

  const toInsert = batches
    .filter((b) => !b.id)
    .map((b) => buildBatchRow(b, ownerId, id, total_pax, workingWeekdays, holidays));
  if (toInsert.length > 0) {
    await supabase.from("batches").insert(toInsert);
  }

  const toUpdate = batches.filter((b) => b.id);
  await Promise.all(
    toUpdate.map((b) =>
      supabase
        .from("batches")
        .update(buildBatchRow(b, ownerId, id, total_pax, workingWeekdays, holidays))
        .eq("id", b.id as string),
    ),
  );

  revalidatePath("/engagements");
  revalidatePath(`/engagements/${id}`);
  revalidatePath("/dashboard");
  redirect(`/engagements/${id}`);
}

export async function deleteEngagement(id: string) {
  const supabase = await createClient();
  await supabase.from("engagements").delete().eq("id", id);
  revalidatePath("/engagements");
  revalidatePath("/dashboard");
  redirect("/engagements");
}
