"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { TrainingCourseSchema } from "@/lib/validation/catalog";

export type CourseFormState = { error?: string } | undefined;

export async function createCourse(
  _prevState: CourseFormState,
  formData: FormData,
): Promise<CourseFormState> {
  const parsed = TrainingCourseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { error } = await supabase
    .from("training_courses")
    .insert({ ...parsed.data, owner_id: userData.user.id });

  if (error) return { error: "Could not save training. Please try again." };

  revalidatePath("/catalog");
  redirect("/catalog");
}

export async function updateCourse(
  id: string,
  _prevState: CourseFormState,
  formData: FormData,
): Promise<CourseFormState> {
  const parsed = TrainingCourseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("training_courses")
    .update({ ...parsed.data, active: formData.get("active") === "on" })
    .eq("id", id);

  if (error) return { error: "Could not save training. Please try again." };

  revalidatePath("/catalog");
  redirect("/catalog");
}

export async function toggleCourseActive(id: string, active: boolean) {
  const supabase = await createClient();
  await supabase.from("training_courses").update({ active }).eq("id", id);
  revalidatePath("/catalog");
}
