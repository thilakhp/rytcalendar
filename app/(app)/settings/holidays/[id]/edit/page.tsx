import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { HolidayForm } from "@/components/settings/holiday-form";
import { updateHoliday, deleteHoliday } from "@/app/(app)/settings/holidays/actions";
import { Button } from "@/components/ui/button";

export default async function EditHolidayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: holiday } = await supabase
    .from("holidays")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!holiday) notFound();

  const removeHoliday = async () => {
    "use server";
    await deleteHoliday(id);
    const { redirect } = await import("next/navigation");
    redirect("/settings/holidays");
  };

  return (
    <>
      <PageHeader title={`Edit ${holiday.name}`} />
      <Card className="max-w-2xl p-6">
        <HolidayForm
          holiday={holiday}
          action={updateHoliday.bind(null, id)}
          cancelHref="/settings/holidays"
        />
        <form action={removeHoliday} className="mt-6 border-t border-slate-100 pt-6">
          <Button type="submit" variant="danger" size="sm">
            Delete Holiday
          </Button>
        </form>
      </Card>
    </>
  );
}
