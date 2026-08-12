import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { EngagementForm } from "@/components/engagements/engagement-form";
import { createEngagement } from "@/app/(app)/engagements/actions";
import type { Settings } from "@/lib/types";

export default async function NewEngagementPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: clients },
    { data: vendors },
    { data: trainers },
    { data: courses },
    { data: holidays },
    { data: settings },
    { data: otherBatches },
  ] = await Promise.all([
    supabase.from("clients").select("*").eq("active", true).order("name"),
    supabase.from("vendors").select("*").eq("active", true).order("name"),
    supabase.from("trainers").select("*").eq("active", true).order("name"),
    supabase.from("training_courses").select("*").eq("active", true).order("name"),
    supabase.from("holidays").select("date, is_working_day"),
    supabase.from("settings").select("*").eq("owner_id", user?.id ?? "").maybeSingle(),
    supabase.from("batches").select("engagement_id, start_date, end_date, status"),
  ]);

  const s = settings as Settings | null;
  const defaultRules: Settings["availability_rules"] = {
    planned: "tentative",
    confirmed: "blocks",
    in_progress: "blocks",
    completed: "historical",
    cancelled: "none",
  };

  return (
    <>
      <PageHeader
        title="New Training Engagement"
        description="One program, multiple training batches. Enter the client and vendor once — add every batch below."
      />
      <EngagementForm
        mode="create"
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
        otherBatches={otherBatches ?? []}
        availabilityRules={s?.availability_rules ?? defaultRules}
        onSubmit={createEngagement}
        cancelHref="/engagements"
      />
    </>
  );
}
