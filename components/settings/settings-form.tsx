"use client";

import { useActionState } from "react";
import { Field, TextInput, Select } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import type { Settings } from "@/lib/types";
import { updateSettings, type SettingsFormState } from "@/app/(app)/settings/actions";

const WEEKDAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 7, label: "Sun" },
];

const RULE_OPTIONS = [
  { value: "blocks", label: "Blocks availability" },
  { value: "tentative", label: "Marks as tentative" },
  { value: "historical", label: "Historical only" },
  { value: "none", label: "Does not block" },
];

const STATUS_LABELS: Record<string, string> = {
  planned: "Planned",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, formAction, pending] = useActionState<
    SettingsFormState,
    FormData
  >(updateSettings, undefined);

  const rules = settings.availability_rules;

  return (
    <form action={formAction} className="space-y-10">
      <section className="space-y-5">
        <h2 className="text-sm font-semibold text-slate-900">
          Organization & Branding
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Organization Name" htmlFor="org_name" required>
            <TextInput id="org_name" name="org_name" required defaultValue={settings.org_name} />
          </Field>
          <Field label="Accent Color" htmlFor="theme_accent">
            <input
              id="theme_accent"
              name="theme_accent"
              type="color"
              defaultValue={(settings.theme?.accent as string) ?? "#0f172a"}
              className="h-10 w-20 cursor-pointer rounded-lg border border-slate-300"
            />
          </Field>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-sm font-semibold text-slate-900">Working Rules</h2>
        <div>
          <div className="mb-2 text-sm font-medium text-slate-700">Working Days</div>
          <div className="flex flex-wrap gap-3">
            {WEEKDAYS.map((d) => (
              <label
                key={d.value}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
              >
                <input
                  type="checkbox"
                  name="working_weekdays"
                  value={d.value}
                  defaultChecked={settings.working_weekdays.includes(d.value)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                {d.label}
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Field label="Working Hours Start" htmlFor="working_hours_start" required>
            <TextInput
              id="working_hours_start"
              name="working_hours_start"
              type="time"
              required
              defaultValue={settings.working_hours?.start ?? "09:00"}
            />
          </Field>
          <Field label="Working Hours End" htmlFor="working_hours_end" required>
            <TextInput
              id="working_hours_end"
              name="working_hours_end"
              type="time"
              required
              defaultValue={settings.working_hours?.end ?? "17:00"}
            />
          </Field>
          <Field label="Default Break (minutes)" htmlFor="default_break_minutes">
            <TextInput
              id="default_break_minutes"
              name="default_break_minutes"
              type="number"
              min="0"
              defaultValue={settings.default_break_minutes}
            />
          </Field>
        </div>
        <Field label="Default Time Zone" htmlFor="default_timezone" required>
          <TextInput
            id="default_timezone"
            name="default_timezone"
            required
            defaultValue={settings.default_timezone}
          />
        </Field>
      </section>

      <section className="space-y-5">
        <h2 className="text-sm font-semibold text-slate-900">
          Statuses & Delivery Modes
        </h2>
        <Field label="Statuses (comma-separated)" htmlFor="statuses">
          <TextInput
            id="statuses"
            name="statuses"
            defaultValue={settings.statuses.join(", ")}
          />
        </Field>
        <Field label="Delivery Modes (comma-separated)" htmlFor="delivery_modes">
          <TextInput
            id="delivery_modes"
            name="delivery_modes"
            defaultValue={settings.delivery_modes.join(", ")}
          />
        </Field>
      </section>

      <section className="space-y-5">
        <h2 className="text-sm font-semibold text-slate-900">
          Availability Rules
        </h2>
        <p className="text-sm text-slate-500">
          Controls how each training status affects the availability checker.
        </p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {(Object.keys(STATUS_LABELS) as (keyof typeof STATUS_LABELS)[]).map(
            (status) => (
              <Field key={status} label={STATUS_LABELS[status]} htmlFor={`rule_${status}`}>
                <Select
                  id={`rule_${status}`}
                  name={`rule_${status}`}
                  defaultValue={rules?.[status as keyof typeof rules] ?? "blocks"}
                >
                  {RULE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
            ),
          )}
        </div>
      </section>

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.saved && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Settings saved.
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save Settings"}
      </Button>
    </form>
  );
}
