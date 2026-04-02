import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name too long"),
  lastInitial: z
    .string()
    .min(1, "Last initial is required")
    .max(1, "Just the first letter of your last name"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required").max(2, "Use state abbreviation"),
  zipCode: z
    .string()
    .min(5, "Zip code must be 5 digits")
    .max(5, "Zip code must be 5 digits")
    .regex(/^\d{5}$/, "Invalid zip code"),
  accountType: z.enum(["gigger", "poster"]),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
