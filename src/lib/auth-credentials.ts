import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .min(1)
  .max(254)
  .email({ message: "INVALID_EMAIL" })
  .transform((email) => email.toLowerCase())
  .superRefine((email, ctx) => {
    if (email.endsWith("@gmai.com") || email.endsWith("@gnail.com")) {
      ctx.addIssue({ code: "custom", message: "EMAIL_TYPO_GMAIL" });
    }
  });

const usernameSchema = z
  .string()
  .trim()
  .min(2)
  .max(64)
  .regex(/^[a-zA-Z0-9._-]+$/, { message: "INVALID_USERNAME" });

/** Shared login identifier: email or username. */
export const loginIdentifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(254)
  .superRefine((value, ctx) => {
    if (value.includes("@")) {
      const r = emailSchema.safeParse(value);
      if (!r.success) {
        ctx.addIssue({
          code: "custom",
          message: r.error.issues[0]?.message || "INVALID_EMAIL",
        });
      }
      return;
    }
    const r = usernameSchema.safeParse(value);
    if (!r.success) {
      ctx.addIssue({
        code: "custom",
        message: r.error.issues[0]?.message || "INVALID_USERNAME",
      });
    }
  })
  .transform((value) => (value.includes("@") ? value.toLowerCase() : value));

export const loginPasswordSchema = z.string().min(1).max(128);

export const loginBodySchema = z.object({
  email: loginIdentifierSchema,
  password: loginPasswordSchema,
});

export type LoginBody = z.infer<typeof loginBodySchema>;

export function firstZodCode(error: z.ZodError): string {
  for (const issue of error.issues) {
    if (issue.message && /^[A-Z0-9_]+$/.test(issue.message)) return issue.message;
  }
  return "INVALID_INPUT";
}
