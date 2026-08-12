import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { HolidayForm } from "@/components/settings/holiday-form";
import { createHoliday } from "@/app/(app)/settings/holidays/actions";

export default function NewHolidayPage() {
  return (
    <>
      <PageHeader title="Add Holiday" />
      <Card className="max-w-2xl p-6">
        <HolidayForm action={createHoliday} cancelHref="/settings/holidays" />
      </Card>
    </>
  );
}
