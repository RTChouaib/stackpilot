/**
 * Static reference data for the recommendation engine. This is the source
 * of truth for both:
 *  1. The deterministic fallback generator (lib/ai/rules-engine.ts), used
 *     when the LLM call fails, is rate-limited, or as a cheap pre-fill.
 *  2. The context injected into the AI's system prompt, so `generateObject`
 *     is choosing from — and staying consistent with — real, current tool
 *     names rather than inventing them.
 */

export type StackPool = "standard" | "privacy" | "openSource";
export type Tier = "lean" | "balanced" | "scale";

export interface TierStack {
  frontend: string;
  backend: string;
  database: string;
  auth: string;
  hosting: string;
  storage: string;
  payments: string;
  analytics: string;
  email: string;
}

export const STACKS: Record<StackPool, Record<Tier, TierStack>> = {
  standard: {
    lean: {
      frontend: "Plain HTML/CSS + a no-code builder (Webflow or Framer)",
      backend: "Serverless functions (Vercel Functions)",
      database: "Supabase (Postgres, free tier)",
      auth: "Supabase Auth",
      hosting: "Vercel",
      storage: "Supabase Storage",
      payments: "Lemon Squeezy (merchant of record, easy tax handling)",
      analytics: "Plausible (free tier)",
      email: "Resend (free tier)",
    },
    balanced: {
      frontend: "Next.js + React + Tailwind CSS",
      backend: "Next.js API routes",
      database: "Supabase (Postgres)",
      auth: "Supabase Auth",
      hosting: "Vercel",
      storage: "Cloudflare R2",
      payments: "Stripe",
      analytics: "PostHog",
      email: "Resend",
    },
    scale: {
      frontend: "Next.js + React + Tailwind CSS",
      backend: "Node.js (NestJS) microservices",
      database: "Managed Postgres (AWS RDS or Neon) with read replicas",
      auth: "Clerk or Auth0",
      hosting: "AWS (ECS/Fargate) or GCP Cloud Run",
      storage: "AWS S3 + CloudFront CDN",
      payments: "Stripe (with usage-based billing)",
      analytics: "PostHog (self-hosted) + data warehouse",
      email: "Resend (dedicated sending domain)",
    },
  },
  privacy: {
    lean: {
      frontend: "Plain HTML/CSS + a no-code builder (Framer, EU-hosted plan)",
      backend: "Serverless functions (Supabase Edge Functions, EU region)",
      database: "Supabase (Postgres, EU Frankfurt region, free tier)",
      auth: "Supabase Auth (EU region)",
      hosting: "Hetzner (EU)",
      storage: "Supabase Storage (EU region)",
      payments: "Lemon Squeezy (merchant of record, GDPR-aligned)",
      analytics: "Plausible (EU-hosted, cookieless)",
      email: "Resend (EU sending region)",
    },
    balanced: {
      frontend: "Next.js + React + Tailwind CSS",
      backend: "Next.js API routes, deployed to an EU region",
      database: "Supabase (Postgres, EU Frankfurt region)",
      auth: "Supabase Auth (EU region)",
      hosting: "Vercel (EU region) or Hetzner",
      storage: "Cloudflare R2 (EU jurisdiction)",
      payments: "Stripe (EU entity, SCA-ready)",
      analytics: "PostHog (EU Cloud)",
      email: "Resend (EU sending region)",
    },
    scale: {
      frontend: "Next.js + React + Tailwind CSS",
      backend: "Self-hosted Node.js (NestJS) on EU infrastructure",
      database: "Self-managed Postgres on Hetzner, EU-only, encrypted at rest",
      auth: "Self-hosted (Keycloak) or Clerk with EU data residency",
      hosting: "Hetzner (EU)",
      storage: "Hetzner Object Storage (EU)",
      payments: "Stripe (EU entity) with data minimization",
      analytics: "PostHog (self-hosted, EU)",
      email: "Self-hosted (Postal) or Resend EU region",
    },
  },
  openSource: {
    lean: {
      frontend: "Plain HTML/CSS + Astro (open source)",
      backend: "Supabase self-hosted (Docker)",
      database: "PostgreSQL (self-hosted)",
      auth: "Supabase Auth (self-hosted)",
      hosting: "A single VPS (Hetzner or DigitalOcean)",
      storage: "MinIO (self-hosted, S3-compatible)",
      payments: "Lemon Squeezy (proprietary, lowest-friction option)",
      analytics: "Plausible (self-hosted)",
      email: "Postal (self-hosted) or Resend free tier",
    },
    balanced: {
      frontend: "Next.js + React + Tailwind CSS (open source)",
      backend: "Next.js API routes on a self-managed server",
      database: "PostgreSQL (self-hosted via Coolify or Dokku)",
      auth: "Supabase Auth (self-hosted)",
      hosting: "A VPS cluster (Hetzner) managed with Coolify",
      storage: "MinIO (self-hosted)",
      payments: "Stripe (closed-source, hard to avoid for card payments)",
      analytics: "PostHog (self-hosted)",
      email: "Postal (self-hosted)",
    },
    scale: {
      frontend: "Next.js + React + Tailwind CSS",
      backend: "Node.js (NestJS), containerized",
      database: "PostgreSQL on Kubernetes (self-managed) with replicas",
      auth: "Keycloak (self-hosted)",
      hosting: "Self-managed Kubernetes on Hetzner or bare metal",
      storage: "MinIO cluster (self-hosted)",
      payments: "Stripe (closed-source, industry standard for compliance)",
      analytics: "PostHog (self-hosted) + Metabase",
      email: "Postal (self-hosted, clustered)",
    },
  },
};

export const TIER_META: Record<Tier, { name: string; tagline: string }> = {
  lean: { name: "Lean MVP", tagline: "Lowest cost, shortest path to a working product to validate." },
  balanced: {
    name: "Balanced Recommendation",
    tagline: "The default we'd pick: a solid balance of speed, reliability, cost, and room to grow.",
  },
  scale: { name: "Scale-ready", tagline: "Built for larger usage, bigger teams, and long-term growth." },
};

export const COST_TABLE: Record<Tier, [number, number, number]> = {
  lean: [0, 25, 180],
  balanced: [35, 140, 950],
  scale: [400, 1200, 6500],
};

export const AI_COST_ADD: Record<Tier, [number, number, number]> = {
  lean: [0, 10, 90],
  balanced: [15, 90, 700],
  scale: [150, 500, 3200],
};

export const LAUNCH_TIME: Record<Tier, Record<"week" | "month" | "quarter" | "long", string>> = {
  lean: { week: "3 – 5 days", month: "1 – 2 weeks", quarter: "2 – 3 weeks", long: "2 – 3 weeks" },
  balanced: {
    week: "Not realistic — see Lean MVP",
    month: "3 – 4 weeks",
    quarter: "5 – 7 weeks",
    long: "6 – 8 weeks",
  },
  scale: {
    week: "Not realistic — see Lean MVP",
    month: "Tight — 4 weeks with a team",
    quarter: "8 – 10 weeks",
    long: "10 – 14 weeks",
  },
};

export const DIFFICULTY: Record<Tier, string> = {
  lean: "Beginner-friendly",
  balanced: "Intermediate",
  scale: "Requires an experienced team",
};

export interface AiTask {
  id: string;
  task: string;
  model: string;
  bestFor: string;
  quality: number;
  speed: number;
  cost: number;
  privacy: string;
  cheaperAlternative: string;
  higherQualityAlternative: string;
  explanation: string;
}

export const AI_TASKS: AiTask[] = [
  { id: "chat", task: "Customer support", model: "Claude Haiku 4.5", bestFor: "Fast, on-brand replies to common questions", quality: 4, speed: 5, cost: 5, privacy: "Standard provider data handling; avoid sending raw PII where possible.", cheaperAlternative: "Open-source Llama 3 (self-hosted)", higherQualityAlternative: "Claude Sonnet 5", explanation: "Support chat needs to feel instant more than it needs deep reasoning, so a fast, inexpensive model is usually the right fit." },
  { id: "coding", task: "Coding", model: "Claude Sonnet 5", bestFor: "Generating and reviewing application code", quality: 5, speed: 3, cost: 3, privacy: "Avoid sending proprietary source code to providers without a data-processing agreement.", cheaperAlternative: "Claude Haiku 4.5", higherQualityAlternative: "Claude Opus 5", explanation: "Coding rewards careful reasoning over raw speed, so a stronger model tends to save time overall by needing fewer corrections." },
  { id: "docs", task: "Document extraction", model: "Gemini 2.5 Flash", bestFor: "Pulling structured data out of PDFs and forms", quality: 4, speed: 5, cost: 5, privacy: "Confirm the provider's document-retention policy for regulated data.", cheaperAlternative: "Open-source OCR + Llama 3", higherQualityAlternative: "Claude Sonnet 5", explanation: "Document tasks are high-volume and repetitive, so a fast, cheap model with good accuracy usually beats a slower premium one." },
  { id: "reasoning", task: "Complex reasoning", model: "Claude Sonnet 5", bestFor: "Multi-step planning, analysis, and decision support", quality: 5, speed: 3, cost: 3, privacy: "Standard provider handling; use enterprise terms for sensitive analysis.", cheaperAlternative: "Gemini 2.5 Flash", higherQualityAlternative: "Claude Opus 5", explanation: "Reasoning-heavy tasks benefit most from a top-tier model, since mistakes compound across steps." },
  { id: "image", task: "Image generation", model: "Gemini 2.5 (image)", bestFor: "Product mockups, marketing visuals, illustrations", quality: 4, speed: 4, cost: 3, privacy: "Generated images may be used for provider model improvement unless opted out.", cheaperAlternative: "Open-source Stable Diffusion (self-hosted)", higherQualityAlternative: "Midjourney (via API partner)", explanation: "Most founders need serviceable visuals quickly rather than gallery-quality art, so a fast general model is usually enough." },
  { id: "voice", task: "Voice", model: "OpenAI Realtime (gpt-4o family)", bestFor: "Low-latency voice assistants and IVR", quality: 4, speed: 5, cost: 2, privacy: "Voice data is sensitive by default — confirm retention and consent handling.", cheaperAlternative: "Open-source Whisper + local TTS", higherQualityAlternative: "OpenAI Realtime with a custom voice", explanation: "Voice interactions live or die on latency, so providers optimized for real-time streaming matter more than raw model quality." },
  { id: "automation", task: "Automation", model: "Claude Haiku 4.5", bestFor: "Structured, repeatable workflow steps", quality: 4, speed: 5, cost: 5, privacy: "Log actions taken by automations for auditability.", cheaperAlternative: "Open-source Llama 3 (self-hosted)", higherQualityAlternative: "Claude Sonnet 5", explanation: "Automation tasks are usually narrow and repeated often, so cost and speed typically matter more than peak quality." },
  { id: "translation", task: "Translation", model: "Gemini 2.5 Flash", bestFor: "Fast, accurate multi-language translation", quality: 4, speed: 5, cost: 5, privacy: "Standard provider handling; fine for most non-sensitive content.", cheaperAlternative: "Open-source NLLB (self-hosted)", higherQualityAlternative: "Claude Sonnet 5", explanation: "Translation is well-served by fast, affordable models; reserve premium models for nuanced or legal text." },
  { id: "fast", task: "Fast / low-cost tasks", model: "Claude Haiku 4.5", bestFor: "Classification, tagging, short summaries", quality: 3, speed: 5, cost: 5, privacy: "Low-risk for most use cases; confirm for regulated data.", cheaperAlternative: "Open-source Llama 3 (self-hosted)", higherQualityAlternative: "Gemini 2.5 Flash", explanation: "For simple, high-volume tasks, the cheapest model that clears your quality bar is almost always the right choice." },
];

export const AI_FEATURE_TASK_MAP: Record<string, string[]> = {
  chat: ["chat", "fast"],
  docs: ["docs", "fast"],
  image: ["image"],
  voice: ["voice", "fast"],
  automation: ["automation", "fast"],
  coding: ["coding", "reasoning"],
  multiple: AI_TASKS.map((t) => t.id),
};

export function aiLabelForTier(aiFeature: string, tier: Tier, pool: StackPool): string {
  if (!aiFeature || aiFeature === "no") return "Not needed";
  const isEU = pool === "privacy";
  const isOSS = pool === "openSource";
  const byTier: Record<Tier, string> = {
    lean: isOSS
      ? "Open-source Llama 3 (via Groq, low cost)"
      : isEU
      ? "Mistral Small (EU-hosted)"
      : "Claude Haiku 4.5",
    balanced: isOSS
      ? "Llama 3 70B (self-hosted or Groq)"
      : isEU
      ? "Mistral Large (EU-hosted)"
      : "Claude Sonnet 5 + Haiku 4.5 for simple tasks",
    scale: isOSS
      ? "Self-hosted Llama 3 405B cluster"
      : isEU
      ? "Mistral Large + self-hosted fallback"
      : "Claude Sonnet 5 / Opus 5, routed by task",
  };
  return byTier[tier];
}
