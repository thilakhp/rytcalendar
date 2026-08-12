import * as z from "zod";

const optionalNumber = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : Number(v)))
  .refine((v) => v === undefined || !Number.isNaN(v), {
    message: "Must be a number.",
  })
  .optional();

export const TrainingCourseSchema = z.object({
  name: z.string().trim().min(1, { message: "Training name is required." }),
  product_platform: z.string().trim().optional(),
  category: z.string().trim().optional(),
  standard_duration_days: optionalNumber,
  standard_hours_per_day: optionalNumber,
  standard_total_hours: optionalNumber,
  default_delivery_mode: z.string().trim().optional(),
  description: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type TrainingCourseFormValues = z.infer<typeof TrainingCourseSchema>;
