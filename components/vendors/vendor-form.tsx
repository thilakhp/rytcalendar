"use client";

import { useActionState } from "react";
import { Field, TextInput, TextArea } from "@/components/ui/form-field";
import { Button, LinkButton } from "@/components/ui/button";
import type { Vendor } from "@/lib/types";
import type { VendorFormState } from "@/app/(app)/vendors/actions";

export function VendorForm({
  vendor,
  action,
  cancelHref,
}: {
  vendor?: Vendor;
  action: (state: VendorFormState, formData: FormData) => Promise<VendorFormState>;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState<VendorFormState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Vendor Name" htmlFor="name" required>
          <TextInput
            id="name"
            name="name"
            required
            defaultValue={vendor?.name}
          />
        </Field>
        <Field label="Company Name" htmlFor="company_name">
          <TextInput
            id="company_name"
            name="company_name"
            defaultValue={vendor?.company_name ?? ""}
          />
        </Field>
        <Field label="Contact Person" htmlFor="contact_person">
          <TextInput
            id="contact_person"
            name="contact_person"
            defaultValue={vendor?.contact_person ?? ""}
          />
        </Field>
        <Field label="Email" htmlFor="email">
          <TextInput
            id="email"
            name="email"
            type="email"
            defaultValue={vendor?.email ?? ""}
          />
        </Field>
        <Field label="Phone" htmlFor="phone">
          <TextInput id="phone" name="phone" defaultValue={vendor?.phone ?? ""} />
        </Field>
        <Field label="Website" htmlFor="website">
          <TextInput
            id="website"
            name="website"
            defaultValue={vendor?.website ?? ""}
          />
        </Field>
        <Field label="Country" htmlFor="country">
          <TextInput
            id="country"
            name="country"
            defaultValue={vendor?.country ?? ""}
          />
        </Field>
        <Field label="Primary Training Areas" htmlFor="primary_training_areas">
          <TextInput
            id="primary_training_areas"
            name="primary_training_areas"
            placeholder="Comma-separated, e.g. SFMC, Braze"
            defaultValue={vendor?.primary_training_areas?.join(", ") ?? ""}
          />
        </Field>
      </div>

      <Field label="Specialization" htmlFor="specialization">
        <TextInput
          id="specialization"
          name="specialization"
          defaultValue={vendor?.specialization ?? ""}
        />
      </Field>

      <Field label="Notes" htmlFor="notes">
        <TextArea id="notes" name="notes" rows={3} defaultValue={vendor?.notes ?? ""} />
      </Field>

      {vendor && (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="active"
            defaultChecked={vendor.active}
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
          {pending ? "Saving…" : "Save Vendor"}
        </Button>
        <LinkButton href={cancelHref} variant="secondary">
          Cancel
        </LinkButton>
      </div>
    </form>
  );
}
