import * as z from "zod";

export const VendorSchema = z.object({
  name: z.string().trim().min(1, { message: "Vendor name is required." }),
  company_name: z.string().trim().optional(),
  contact_person: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .refine((v) => v === "" || z.string().email().safeParse(v).success, {
      message: "Enter a valid email.",
    })
    .optional(),
  phone: z.string().trim().optional(),
  website: z.string().trim().optional(),
  country: z.string().trim().optional(),
  primary_training_areas: z.string().trim().optional(), // comma-separated in the form
  specialization: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type VendorFormValues = z.infer<typeof VendorSchema>;
