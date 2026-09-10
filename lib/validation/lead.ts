import { z } from "zod";

export const LeadSubmissionSchema = z.object({
  blueprintId: z.string().uuid(),
  leadType: z.enum(["mvp_quote", "builder_match", "newsletter"]),
  fullName: z.string().min(1).max(120).optional(),
  email: z.string().email(),
  notes: z.string().max(1000).optional(),
  targetBudget: z.string().max(60).optional(),
  targetTimeline: z.string().max(60).optional(),
  // Required and must be explicitly true — there is no default that grants
  // consent. Zod's z.literal(true) rejects `false`, `undefined`, and any
  // other value, so an unchecked consent box fails validation outright.
  privacyConsent: z.literal(true, {
    errorMap: () => ({ message: "You must consent to being contacted to submit this form." }),
  }),
});

export type LeadSubmission = z.infer<typeof LeadSubmissionSchema>;
