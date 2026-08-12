import * as z from "zod";

export const LoginSchema = z.object({
  email: z.string().email({ message: "Enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export const RequestResetSchema = z.object({
  email: z.string().email({ message: "Enter a valid email." }),
});

export const UpdatePasswordSchema = z
  .object({
    password: z.string().min(8, { message: "At least 8 characters." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
