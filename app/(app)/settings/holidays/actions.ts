"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { HolidaySchema } from "@/lib/validation/holidays";

export type HolidayFormState = { error?: string } | undefined;

export async function createHoliday(
  _prevState: HolidayFormState,
  formData: FormData,
): Promise<HolidayFormState> {
  const parsed = HolidaySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { error } = await supabase.from("holidays").insert({
    ...parsed.data,
    is_working_day: formData.get("is_working_day") === "on",
    owner_id: userData.user.id,
  });

  if (error) return { error: "Could not save holiday. Please try again." };

  revalidatePath("/settings/holidays");
  redirect("/settings/holidays");
}

export async function updateHoliday(
  id: string,
  _prevState: HolidayFormState,
  formData: FormData,
): Promise<HolidayFormState> {
  const parsed = HolidaySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("holidays")
    .update({
      ...parsed.data,
      is_working_day: formData.get("is_working_day") === "on",
    })
    .eq("id", id);

  if (error) return { error: "Could not save holiday. Please try again." };

  revalidatePath("/settings/holidays");
  redirect("/settings/holidays");
}

export async function deleteHoliday(id: string) {
  const supabase = await createClient();
  await supabase.from("holidays").delete().eq("id", id);
  revalidatePath("/settings/holidays");
}
