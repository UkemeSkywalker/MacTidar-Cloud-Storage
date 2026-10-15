import { z } from "zod";

// Mirrors the Cognito password policy in infra/modules/auth.
export const passwordRules = [
  { label: "8+ characters", test: (p: string) => p.length >= 8 },
  { label: "At least one uppercase", test: (p: string) => /[A-Z]/.test(p) },
  { label: "At least one lowercase", test: (p: string) => /[a-z]/.test(p) },
  { label: "At least one number", test: (p: string) => /\d/.test(p) },
  { label: "At least one symbol", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export const passwordSchema = z
  .string()
  .max(256)
  .refine((p) => passwordRules.every((r) => r.test(p)), "Password doesn't meet the requirements.");
