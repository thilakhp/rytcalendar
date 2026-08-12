import { Field, TextInput } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";

export function AvailabilityForm({
  from,
  to,
  action = "/availability",
}: {
  from?: string;
  to?: string;
  action?: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <Field label="From" htmlFor="from" className="flex-1">
        <TextInput id="from" name="from" type="date" defaultValue={from} required />
      </Field>
      <Field label="To" htmlFor="to" className="flex-1">
        <TextInput id="to" name="to" type="date" defaultValue={to} required />
      </Field>
      <Button type="submit">Check Availability</Button>
    </form>
  );
}
