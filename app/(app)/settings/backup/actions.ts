"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ImportResult =
  | { error: string }
  | { success: true; counts: Record<string, number> };

type BackupPayload = {
  vendors?: Record<string, unknown>[];
  clients?: Record<string, unknown>[];
  trainers?: Record<string, unknown>[];
  training_courses?: Record<string, unknown>[];
  holidays?: Record<string, unknown>[];
  engagements?: Record<string, unknown>[];
  batches?: Record<string, unknown>[];
};

function withOwner<T extends Record<string, unknown>>(rows: T[], ownerId: string) {
  return rows.map((row) => ({ ...row, owner_id: ownerId }));
}

export async function importBackup(jsonText: string): Promise<ImportResult> {
  let payload: BackupPayload;
  try {
    payload = JSON.parse(jsonText);
  } catch {
    return { error: "That file isn't valid JSON." };
  }

  if (typeof payload !== "object" || payload === null) {
    return { error: "Unrecognized backup format." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  const ownerId = user.id;

  const counts: Record<string, number> = {};

  // Independent tables first, then engagements (needs clients/vendors),
  // then batches (needs engagements/training_courses/trainers).
  const independentTables = ["vendors", "clients", "trainers", "training_courses", "holidays"] as const;

  for (const table of independentTables) {
    const rows = payload[table];
    if (!rows || rows.length === 0) continue;
    const { error } = await supabase.from(table).upsert(withOwner(rows, ownerId), { onConflict: "id" });
    if (error) return { error: `Failed importing ${table}: ${error.message}` };
    counts[table] = rows.length;
  }

  if (payload.engagements && payload.engagements.length > 0) {
    const { error } = await supabase
      .from("engagements")
      .upsert(withOwner(payload.engagements, ownerId), { onConflict: "id" });
    if (error) return { error: `Failed importing engagements: ${error.message}` };
    counts.engagements = payload.engagements.length;
  }

  if (payload.batches && payload.batches.length > 0) {
    const { error } = await supabase
      .from("batches")
      .upsert(withOwner(payload.batches, ownerId), { onConflict: "id" });
    if (error) return { error: `Failed importing batches: ${error.message}` };
    counts.batches = payload.batches.length;
  }

  revalidatePath("/", "layout");
  return { success: true, counts };
}
