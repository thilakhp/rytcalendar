"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { RequestResetSchema } from "@/lib/validation/auth";

export type ResetState = { error?: string; sent?: boolean } | undefined;

export async function requestReset(
  _prevState: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const parsed = RequestResetSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const headerList = await headers();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    `${headerList.get("x-forwarded-proto") ?? "https"}://${headerList.get("host")}`;

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/confirm?next=/update-password`,
  });

  // Always report success, whether or not the email exists, to avoid
  // leaking which addresses have an account.
  return { sent: true };
}
