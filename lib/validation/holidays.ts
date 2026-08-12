import * as z from "zod";

export const HolidaySchema = z.object({
  date: z.string().trim().min(1, { message: "Date is required." }),
  name: z.string().trim().min(1, { message: "Holiday name is required." }),
  country: z.string().trim().optional(),
  region: z.string().trim().optional(),
});

export type HolidayFormValues = z.infer<typeof HolidaySchema>;
