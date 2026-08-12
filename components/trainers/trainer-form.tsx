"use client";

import { useActionState } from "react";
import { Field, TextInput, TextArea } from "@/components/ui/form-field";
import { Button, LinkButton } from "@/components/ui/button";
import type { Trainer } from "@/lib/types";
import type { TrainerFormState } from "@/app/(app)/trainers/actions";

export function TrainerForm({
  trainer,
  action,
  cancelHref,
}: {
  trainer?: Trainer;
  action: (state: TrainerFormState, formData: FormData) => Promise<TrainerFormState>;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState<TrainerFormState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Trainer Name" htmlFor="name" required>
          <TextInput id="name" name="name" required defaultValue={trainer?.name} />
        </Field>
        <Field label="Specialization" htmlFor="specialization">
          <TextInput
            id="specialization"
            name="specialization"
            defaultValue={trainer?.specialization ?? ""}
          />
        </Field>
        <Field label="Email" htmlFor="email">
          <TextInput id="email" name="email" type="email" defaultValue={trainer?.email ?? ""} />
        </Field>
        <Field label="Phone" htmlFor="phone">
          <TextInput id="phone" name="phone" defaultValue={trainer?.phone ?? ""} />
        </Field>
        <Field label="Location" htmlFor="location">
          <TextInput id="location" name="location" defaultValue={trainer?.location ?? ""} />
        </Field>
      </div>

      <Field label="Notes" htmlFor="notes">
        <TextArea id="notes" name="notes" rows={3} defaultValue={trainer?.notes ?? ""} />
      </Field>

      {trainer && (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="active"
            defaultChecked={trainer.active}
            className="h-4 w-4 rounded border-slate-300"
          />
          Active
        </label>
      )}

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save Trainer"}
        </Button>
        <LinkButton href={cancelHref} variant="secondary">
          Cancel
        </LinkButton>
      </div>
    </form>
  );
}
