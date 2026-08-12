import * as z from "zod";

export const ClientSchema = z.object({
  name: z.string().trim().min(1, { message: "Client name is required." }),
  industry: z.string().trim().optional(),
  country: z.string().trim().optional(),
  contact_person: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .refine((v) => v === "" || z.string().email().safeParse(v).success, {
      message: "Enter a valid email.",
    })
    .optional(),
  phone: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type ClientFormValues = z.infer<typeof ClientSchema>;
