import * as z from "zod";

export const TrainerSchema = z.object({
  name: z.string().trim().min(1, { message: "Trainer name is required." }),
  specialization: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .refine((v) => v === "" || z.string().email().safeParse(v).success, {
      message: "Enter a valid email.",
    })
    .optional(),
  phone: z.string().trim().optional(),
  location: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type TrainerFormValues = z.infer<typeof TrainerSchema>;
