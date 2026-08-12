import * as z from "zod";

export const BatchInputSchema = z
  .object({
    id: z.string().uuid().optional(),
    training_course_id: z.string().uuid({ message: "Select a training course for every batch." }),
    start_date: z.string().min(1, { message: "Start date is required." }),
    end_date: z.string().min(1, { message: "End date is required." }),
    start_time: z.string().min(1, { message: "Start time is required." }),
    end_time: z.string().min(1, { message: "End time is required." }),
    timezone: z.string().min(1),
    delivery_mode: z.string().optional(),
    status: z.string().min(1),
    pax: z.number().int().positive().optional().nullable(),
    trainer_id: z.string().uuid().optional().nullable(),
    location: z.string().optional(),
    break_minutes: z.number().int().min(0).default(0),
    notes: z.string().optional(),
  })
  .refine((b) => b.end_date >= b.start_date, {
    message: "A batch's end date must be on or after its start date.",
    path: ["end_date"],
  });

export const EngagementInputSchema = z.object({
  client_id: z.string().uuid({ message: "Select a client." }),
  vendor_id: z.string().uuid().optional().nullable(),
  program_name: z.string().trim().min(1, { message: "Program / engagement name is required." }),
  total_pax: z.number().int().positive().optional().nullable(),
  primary_timezone: z.string().min(1),
  overall_status: z.string().min(1),
  notes: z.string().optional(),
  batches: z
    .array(BatchInputSchema)
    .min(1, { message: "Add at least one training batch." }),
});

export type EngagementInput = z.infer<typeof EngagementInputSchema>;
export type BatchInput = z.infer<typeof BatchInputSchema>;
