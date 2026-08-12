"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ClientSchema } from "@/lib/validation/clients";

export type ClientFormState = { error?: string } | undefined;

export async function createClientRecord(
  _prevState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const parsed = ClientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { error } = await supabase
    .from("clients")
    .insert({ ...parsed.data, owner_id: userData.user.id });

  if (error) return { error: "Could not save client. Please try again." };

  revalidatePath("/clients");
  redirect("/clients");
}

export async function updateClientRecord(
  id: string,
  _prevState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const parsed = ClientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({ ...parsed.data, active: formData.get("active") === "on" })
    .eq("id", id);

  if (error) return { error: "Could not save client. Please try again." };

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  redirect(`/clients/${id}`);
}

export async function toggleClientActive(id: string, active: boolean) {
  const supabase = await createClient();
  await supabase.from("clients").update({ active }).eq("id", id);
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
}
