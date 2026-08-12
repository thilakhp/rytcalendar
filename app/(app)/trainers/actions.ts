"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { TrainerSchema } from "@/lib/validation/trainers";

export type TrainerFormState = { error?: string } | undefined;

export async function createTrainer(
  _prevState: TrainerFormState,
  formData: FormData,
): Promise<TrainerFormState> {
  const parsed = TrainerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { error } = await supabase
    .from("trainers")
    .insert({ ...parsed.data, owner_id: userData.user.id });

  if (error) return { error: "Could not save trainer. Please try again." };

  revalidatePath("/trainers");
  redirect("/trainers");
}

export async function updateTrainer(
  id: string,
  _prevState: TrainerFormState,
  formData: FormData,
): Promise<TrainerFormState> {
  const parsed = TrainerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("trainers")
    .update({ ...parsed.data, active: formData.get("active") === "on" })
    .eq("id", id);

  if (error) return { error: "Could not save trainer. Please try again." };

  revalidatePath("/trainers");
  redirect("/trainers");
}

export async function toggleTrainerActive(id: string, active: boolean) {
  const supabase = await createClient();
  await supabase.from("trainers").update({ active }).eq("id", id);
  revalidatePath("/trainers");
}
