import { z } from "zod";

/**
 * Single source of truth for required environment variables. Validated once
 * at import time (first module that imports `env` triggers it) instead of
 * each consumer using `process.env.X!` and discovering a missing var only
 * when a request happens to hit that code path — which is exactly how
 * `lib/security/rate-limit.ts` used to work (silently broken Redis client
 * if Upstash vars were unset, no error until the first rate-limit check).
 *
 * On the client bundle, only `NEXT_PUBLIC_*` vars are ever included — this
 * module is only meant to be imported from server-side code (route
 * handlers, Server Components, middleware).
 */

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  UPSTASH_REDIS_REST_URL: z.string().url("UPSTASH_REDIS_REST_URL must be a valid URL"),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, "UPSTASH_REDIS_REST_TOKEN is required"),
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
  ADMIN_ALERT_EMAIL: z.string().email("ADMIN_ALERT_EMAIL must be a valid email"),
  EMAIL_FROM: z.string().min(1).default("StackPilot <alerts@stackpilot.app>"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("https://stackpilot.app"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

/**
 * Returns the validated env config, parsing (and caching) on first call.
 * Throws a single, readable error listing every missing/invalid variable —
 * rather than a different unhelpful runtime error from whichever module
 * happens to touch a bad var first.
 */
export function getEnv(): Env {
  if (cached) return cached;

  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(
      `Invalid or missing environment variables:\n${issues}\n\nCopy .env.example to .env.local and fill in every value.`
    );
  }
  cached = parsed.data;
  return cached;
}

/**
 * Non-throwing variant for code paths that can legitimately run without full
 * config (e.g. a build step, or a health-check route that wants to report
 * *which* vars are missing rather than crash). Returns null instead of
 * throwing.
 */
export function tryGetEnv(): Env | null {
  try {
    return getEnv();
  } catch {
    return null;
  }
}
