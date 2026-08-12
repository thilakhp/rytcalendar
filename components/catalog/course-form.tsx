"use client";

import { useActionState } from "react";
import { Field, TextInput, TextArea } from "@/components/ui/form-field";
import { Button, LinkButton } from "@/components/ui/button";
import type { TrainingCourse } from "@/lib/types";
import type { CourseFormState } from "@/app/(app)/catalog/actions";

export function CourseForm({
  course,
  action,
  cancelHref,
}: {
  course?: TrainingCourse;
  action: (state: CourseFormState, formData: FormData) => Promise<CourseFormState>;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState<CourseFormState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Training Name" htmlFor="name" required>
          <TextInput id="name" name="name" required defaultValue={course?.name} />
        </Field>
        <Field label="Product / Platform" htmlFor="product_platform">
          <TextInput
            id="product_platform"
            name="product_platform"
            defaultValue={course?.product_platform ?? ""}
          />
        </Field>
        <Field label="Category" htmlFor="category">
          <TextInput id="category" name="category" defaultValue={course?.category ?? ""} />
        </Field>
        <Field label="Default Delivery Mode" htmlFor="default_delivery_mode">
          <TextInput
            id="default_delivery_mode"
            name="default_delivery_mode"
            placeholder="e.g. VILT"
            defaultValue={course?.default_delivery_mode ?? ""}
          />
        </Field>
        <Field label="Standard Duration (days)" htmlFor="standard_duration_days">
          <TextInput
            id="standard_duration_days"
            name="standard_duration_days"
            type="number"
            step="0.5"
            min="0"
            defaultValue={course?.standard_duration_days ?? ""}
          />
        </Field>
        <Field label="Standard Hours / Day" htmlFor="standard_hours_per_day">
          <TextInput
            id="standard_hours_per_day"
            name="standard_hours_per_day"
            type="number"
            step="0.5"
            min="0"
            defaultValue={course?.standard_hours_per_day ?? ""}
          />
        </Field>
        <Field label="Standard Total Hours" htmlFor="standard_total_hours">
          <TextInput
            id="standard_total_hours"
            name="standard_total_hours"
            type="number"
            step="0.5"
            min="0"
            defaultValue={course?.standard_total_hours ?? ""}
          />
        </Field>
      </div>

      <Field label="Description" htmlFor="description">
        <TextArea
          id="description"
          name="description"
          rows={3}
          defaultValue={course?.description ?? ""}
        />
      </Field>

      <Field label="Notes" htmlFor="notes">
        <TextArea id="notes" name="notes" rows={3} defaultValue={course?.notes ?? ""} />
      </Field>

      {course && (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="active"
            defaultChecked={course.active}
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
          {pending ? "Saving…" : "Save Training"}
        </Button>
        <LinkButton href={cancelHref} variant="secondary">
          Cancel
        </LinkButton>
      </div>
    </form>
  );
}
