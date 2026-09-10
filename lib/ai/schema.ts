import { z } from "zod";

/* ============================================================
   QUESTIONNAIRE INPUT (validated at the API boundary)
   ============================================================ */

export const QuestionnaireSchema = z.object({
  projectType: z.enum([
    "saas", "marketplace", "mobile", "ai-agent", "ecommerce",
    "internal", "content", "community", "other",
  ]),
  idea: z.string().min(1).max(500),
  audience: z.string().min(1).max(300),
  mainFeature: z.string().min(1).max(300),
  expectedUsers: z.enum(["u100", "u1000", "u10000", "u10000plus"]),
  techLevel: z.enum(["non-technical", "beginner", "developer", "team"]),
  budget: z.enum(["b500", "b2000", "b10000", "b10000plus"]),
  timeline: z.enum(["week", "month", "quarter", "long"]),
  priorities: z.array(
    z.enum(["cost", "speed", "ai-quality", "privacy", "scale", "open-source", "maintenance"])
  ).max(7),
  aiFeature: z.enum([
    "no", "chat", "docs", "image", "voice", "automation", "coding", "multiple",
  ]),
  sensitiveData: z.enum(["no", "personal", "financial", "health", "business"]),
  payments: z.boolean(),
  signIn: z.boolean(),
  mobile: z.enum(["no", "later", "now"]),
  email: z.string().email().optional(),
  // Set only when the questionnaire was submitted through an agency's
  // branded wizard (/w/[slug]) — tags the resulting blueprint so it shows
  // up in that agency's dashboard. Never trusted for authorization; it only
  // controls attribution. Validated against a real agency row server-side.
  agencySlug: z.string().min(1).max(80).optional(),
});

export type QuestionnaireInput = z.infer<typeof QuestionnaireSchema>;

/* ============================================================
   AI OUTPUT SCHEMA (passed to generateObject)
   ============================================================ */

const TierStackSchema = z.object({
  frontend: z.string(),
  backend: z.string(),
  database: z.string(),
  auth: z.string(),
  hosting: z.string(),
  storage: z.string(),
  payments: z.string(),
  analytics: z.string(),
  email: z.string(),
  aiProvider: z.string(),
  monthlyCostAt100Users: z.string().describe("e.g. '€35/mo' or '€0'"),
  monthlyCostAt1000Users: z.string(),
  monthlyCostAt10000Users: z.string(),
  estimatedLaunchTime: z.string(),
  difficultyLevel: z.enum(["Beginner-friendly", "Intermediate", "Requires an experienced team"]),
  whyItFits: z.string().describe("2-3 sentences explaining why this tier fits the founder's specific answers"),
  mainTradeoffs: z.array(z.string()).min(2).max(4),
});

const AiTaskRecommendationSchema = z.object({
  task: z.string(),
  recommendedModel: z.string(),
  bestFor: z.string(),
  qualityRating: z.number().int().min(1).max(5),
  speedRating: z.number().int().min(1).max(5),
  costRating: z.number().int().min(1).max(5),
  privacyConsiderations: z.string(),
  lowerCostAlternative: z.string(),
  higherQualityAlternative: z.string(),
  plainLanguageExplanation: z.string(),
});

export const BlueprintSchema = z.object({
  projectName: z.string().describe("A short, punchy name for the product based on the founder's description"),
  lean: TierStackSchema,
  balanced: TierStackSchema,
  scaleReady: TierStackSchema,
  aiSetup: z.array(AiTaskRecommendationSchema).describe(
    "Only include tasks relevant to the founder's selected AI feature(s). Empty array if no AI is needed."
  ),
  architectureNotes: z.string().describe("1-2 sentences describing how the recommended (balanced) stack's pieces connect"),
});

export type BlueprintOutput = z.infer<typeof BlueprintSchema>;
