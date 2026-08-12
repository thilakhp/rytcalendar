import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { EngagementForm } from "@/components/engagements/engagement-form";
import { updateEngagement } from "@/app/(app)/engagements/actions";
import type { Settings, Batch } from "@/lib/types";

export default async function EditEngagementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: engagement },
    { data: batches },
    { data: clients },
    { data: vendors },
    { data: trainers },
    { data: courses },
    { data: holidays },
    { data: settings },
  ] = await Promise.all([
    supabase.from("engagements").select("*").eq("id", id).maybeSingle(),
    supabase.from("batches").select("*").eq("engagement_id", id).order("start_date"),
    supabase.from("clients").select("*").eq("active", true).order("name"),
    supabase.from("vendors").select("*").eq("active", true).order("name"),
    supabase.from("trainers").select("*").eq("active", true).order("name"),
    supabase.from("training_courses").select("*").eq("active", true).order("name"),
    supabase.from("holidays").select("date, is_working_day"),
    supabase.from("settings").select("*").eq("owner_id", user?.id ?? "").maybeSingle(),
  ]);

  if (!engagement) notFound();

  const s = settings as Settings | null;

  return (
    <>
      <PageHeader
        title={`Edit ${engagement.program_name}`}
        description="Add, edit, or remove batches — the calendar, availability, and reports update automatically."
      />
      <EngagementForm
        mode="edit"
        initialEngagement={engagement}
        initialBatches={(batches ?? []) as Batch[]}
        clients={clients ?? []}
        vendors={vendors ?? []}
        trainers={trainers ?? []}
        courses={courses ?? []}
        holidays={holidays ?? []}
        workingWeekdays={s?.working_weekdays ?? [1, 2, 3, 4, 5]}
        defaultTimezone={s?.default_timezone ?? "Asia/Kolkata"}
        defaultBreakMinutes={s?.default_break_minutes ?? 0}
        statuses={s?.statuses ?? ["planned", "confirmed", "in_progress", "completed", "cancelled"]}
        deliveryModes={s?.delivery_modes ?? ["VILT", "Classroom", "Self-Paced", "Hybrid"]}
        onSubmit={updateEngagement.bind(null, id)}
        cancelHref={`/engagements/${id}`}
      />
    </>
  );
}
