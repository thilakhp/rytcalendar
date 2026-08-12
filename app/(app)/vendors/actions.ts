"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { VendorSchema } from "@/lib/validation/vendors";

export type VendorFormState = { error?: string } | undefined;

function parseAreas(value?: string) {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function createVendor(
  _prevState: VendorFormState,
  formData: FormData,
): Promise<VendorFormState> {
  const parsed = VendorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { primary_training_areas, ...rest } = parsed.data;
  const { error } = await supabase.from("vendors").insert({
    ...rest,
    primary_training_areas: parseAreas(primary_training_areas),
    owner_id: userData.user.id,
  });

  if (error) {
    return { error: "Could not save vendor. Please try again." };
  }

  revalidatePath("/vendors");
  redirect("/vendors");
}

export async function updateVendor(
  id: string,
  _prevState: VendorFormState,
  formData: FormData,
): Promise<VendorFormState> {
  const parsed = VendorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { primary_training_areas, ...rest } = parsed.data;
  const { error } = await supabase
    .from("vendors")
    .update({
      ...rest,
      primary_training_areas: parseAreas(primary_training_areas),
      active: formData.get("active") === "on",
    })
    .eq("id", id);

  if (error) {
    return { error: "Could not save vendor. Please try again." };
  }

  revalidatePath("/vendors");
  revalidatePath(`/vendors/${id}`);
  redirect(`/vendors/${id}`);
}

export async function toggleVendorActive(id: string, active: boolean) {
  const supabase = await createClient();
  await supabase.from("vendors").update({ active }).eq("id", id);
  revalidatePath("/vendors");
  revalidatePath(`/vendors/${id}`);
}
