"use client";

import { useActionState } from "react";
import { Field, TextInput, TextArea } from "@/components/ui/form-field";
import { Button, LinkButton } from "@/components/ui/button";
import type { Client } from "@/lib/types";
import type { ClientFormState } from "@/app/(app)/clients/actions";

export function ClientForm({
  client,
  action,
  cancelHref,
}: {
  client?: Client;
  action: (state: ClientFormState, formData: FormData) => Promise<ClientFormState>;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState<ClientFormState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Client Name" htmlFor="name" required>
          <TextInput id="name" name="name" required defaultValue={client?.name} />
        </Field>
        <Field label="Industry" htmlFor="industry">
          <TextInput id="industry" name="industry" defaultValue={client?.industry ?? ""} />
        </Field>
        <Field label="Country" htmlFor="country">
          <TextInput id="country" name="country" defaultValue={client?.country ?? ""} />
        </Field>
        <Field label="Contact Person" htmlFor="contact_person">
          <TextInput
            id="contact_person"
            name="contact_person"
            defaultValue={client?.contact_person ?? ""}
          />
        </Field>
        <Field label="Email" htmlFor="email">
          <TextInput id="email" name="email" type="email" defaultValue={client?.email ?? ""} />
        </Field>
        <Field label="Phone" htmlFor="phone">
          <TextInput id="phone" name="phone" defaultValue={client?.phone ?? ""} />
        </Field>
      </div>

      <Field label="Notes" htmlFor="notes">
        <TextArea id="notes" name="notes" rows={3} defaultValue={client?.notes ?? ""} />
      </Field>

      {client && (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="active"
            defaultChecked={client.active}
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
          {pending ? "Saving…" : "Save Client"}
        </Button>
        <LinkButton href={cancelHref} variant="secondary">
          Cancel
        </LinkButton>
      </div>
    </form>
  );
}
