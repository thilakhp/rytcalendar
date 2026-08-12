"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SettingsSchema } from "@/lib/validation/settings";

export type SettingsFormState = { error?: string; saved?: boolean } | undefined;

export async function updateSettings(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const weekdays = formData.getAll("working_weekdays").map(Number);

  const parsed = SettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Not signed in." };

  const {
    theme_accent,
    working_hours_start,
    working_hours_end,
    rule_planned,
    rule_confirmed,
    rule_in_progress,
    rule_completed,
    rule_cancelled,
    ...rest
  } = parsed.data;

  const { error } = await supabase
    .from("settings")
    .update({
      ...rest,
      theme: { accent: theme_accent || "#0f172a" },
      working_weekdays: weekdays.length > 0 ? weekdays : [1, 2, 3, 4, 5],
      working_hours: { start: working_hours_start, end: working_hours_end },
      availability_rules: {
        planned: rule_planned,
        confirmed: rule_confirmed,
        in_progress: rule_in_progress,
        completed: rule_completed,
        cancelled: rule_cancelled,
      },
    })
    .eq("owner_id", userData.user.id);

  if (error) return { error: "Could not save settings. Please try again." };

  revalidatePath("/settings");
  return { saved: true };
}
