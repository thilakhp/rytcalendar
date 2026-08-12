import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const [vendors, clients, trainers, training_courses, holidays, engagements, batches, settings] =
    await Promise.all([
      supabase.from("vendors").select("*"),
      supabase.from("clients").select("*"),
      supabase.from("trainers").select("*"),
      supabase.from("training_courses").select("*"),
      supabase.from("holidays").select("*"),
      supabase.from("engagements").select("*"),
      supabase.from("batches").select("*"),
      supabase.from("settings").select("*").eq("owner_id", user.id).maybeSingle(),
    ]);

  const payload = {
    exported_at: new Date().toISOString(),
    version: 1,
    vendors: vendors.data ?? [],
    clients: clients.data ?? [],
    trainers: trainers.data ?? [],
    training_courses: training_courses.data ?? [],
    holidays: holidays.data ?? [],
    engagements: engagements.data ?? [],
    batches: batches.data ?? [],
    settings: settings.data ?? null,
  };

  const filename = `ryt-backup-${new Date().toISOString().slice(0, 10)}.json`;

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
