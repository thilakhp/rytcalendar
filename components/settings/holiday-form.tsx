"use client";

import { useActionState } from "react";
import { Field, TextInput } from "@/components/ui/form-field";
import { Button, LinkButton } from "@/components/ui/button";
import type { Holiday } from "@/lib/types";
import type { HolidayFormState } from "@/app/(app)/settings/holidays/actions";

export function HolidayForm({
  holiday,
  action,
  cancelHref,
}: {
  holiday?: Holiday;
  action: (state: HolidayFormState, formData: FormData) => Promise<HolidayFormState>;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState<HolidayFormState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Date" htmlFor="date" required>
          <TextInput id="date" name="date" type="date" required defaultValue={holiday?.date} />
        </Field>
        <Field label="Holiday Name" htmlFor="name" required>
          <TextInput id="name" name="name" required defaultValue={holiday?.name} />
        </Field>
        <Field label="Country" htmlFor="country">
          <TextInput id="country" name="country" defaultValue={holiday?.country ?? ""} />
        </Field>
        <Field label="Region" htmlFor="region">
          <TextInput id="region" name="region" defaultValue={holiday?.region ?? ""} />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="is_working_day"
          defaultChecked={holiday?.is_working_day ?? false}
          className="h-4 w-4 rounded border-slate-300"
        />
        Treat as a working day (does not block availability)
      </label>

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save Holiday"}
        </Button>
        <LinkButton href={cancelHref} variant="secondary">
          Cancel
        </LinkButton>
      </div>
    </form>
  );
}
