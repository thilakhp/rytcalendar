import * as z from "zod";

const csvList = z
  .string()
  .trim()
  .transform((v) =>
    v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );

const ruleEnum = z.enum(["blocks", "tentative", "historical", "none"]);

export const SettingsSchema = z.object({
  org_name: z.string().trim().min(1, { message: "Organization name is required." }),
  theme_accent: z.string().trim().optional(),
  working_hours_start: z.string().trim().min(1),
  working_hours_end: z.string().trim().min(1),
  default_timezone: z.string().trim().min(1),
  default_break_minutes: z
    .string()
    .trim()
    .transform((v) => (v === "" ? 0 : Number(v))),
  statuses: csvList,
  delivery_modes: csvList,
  rule_planned: ruleEnum,
  rule_confirmed: ruleEnum,
  rule_in_progress: ruleEnum,
  rule_completed: ruleEnum,
  rule_cancelled: ruleEnum,
});
