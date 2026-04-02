import { z } from "zod";

export const postJobSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(20, "Please describe the job in more detail").max(2000),
  category: z.string().min(1, "Select a category"),
  subcategory: z.string().optional(),
  jobType: z.enum(["task", "project", "recurring"]),
  durationType: z.enum(["One-time", "Project", "Recurring", "Ongoing"]),
  pricingType: z.enum(["fixed", "range", "hourly", "open"]),
  price: z.number().optional(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  hourlyRate: z.number().optional(),
  estimatedHours: z.number().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2).max(2),
  zipCode: z.string().regex(/^\d{5}$/, "Invalid zip code"),
  neighborhood: z.string().optional(),
  address: z.string().optional(),
  isRemote: z.boolean().default(false),
  requiresLicense: z.boolean().default(false),
  requiresBackgroundCheck: z.boolean().default(false),
  isUrgent: z.boolean().default(false),
  teamSizeNeeded: z.number().int().min(1).default(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type PostJobInput = z.infer<typeof postJobSchema>;
