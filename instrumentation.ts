/**
 * Next.js instrumentation hook — runs once when the server starts, before
 * any request is handled.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * Two responsibilities:
 *  1. Validate all required environment variables eagerly, so a
 *     misconfigured deployment fails at boot with one clear, complete error
 *     message instead of failing unpredictably on whichever request happens
 *     to be the first to touch a missing var.
 *  2. Load the runtime-appropriate Sentry config (client/server/edge configs
 *     are separate files because each runtime has a different available API
 *     surface). Both are no-ops if their respective DSN env var is unset —
 *     see sentry.*.config.ts.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getEnv } = await import("@/lib/env");
    try {
      getEnv();
      console.log("[instrumentation] Environment variables validated OK.");
    } catch (error) {
      // Re-throw so the server actually fails to start — a silently
      // half-configured production deployment is worse than a crash with a
      // clear message in the deploy logs.
      console.error("[instrumentation] Environment validation failed:");
      throw error;
    }
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge" && process.env.SENTRY_DSN) {
    // NOTE: this env check does NOT reduce edge bundle size — verified by
    // building both with and without it. Next's edge bundler includes any
    // statically-reachable import in the compiled middleware bundle
    // regardless of a runtime env-var condition (only NEXT_PUBLIC_* vars
    // get build-time inlining/dead-code elimination; plain server vars like
    // SENTRY_DSN are evaluated at runtime, so the bundler can't prove this
    // branch is unreachable and keeps the import). Measured cost: importing
    // this module at all — gated or not — took middleware.ts from ~40KB to
    // ~96KB compiled. The env check here only skips calling Sentry.init()
    // at runtime; it's not a bundle-size optimization.
    //
    // If edge bundle size matters more than edge-runtime error tracking,
    // delete this whole block (and app/api/og/route.tsx's `export const
    // runtime = "edge"` won't be covered by Sentry, but nothing else
    // changes) rather than relying on this env check to help — it won't.
    await import("./sentry.edge.config");
  }
}

// Captures errors from nested React Server Components that Next.js's normal
// error boundaries can't reach (e.g. errors thrown deep in a streamed
// server-rendered tree). No-op when Sentry isn't configured, same as the
// rest of the Sentry wiring.
export async function onRequestError(...args: Parameters<NonNullable<typeof import("@sentry/nextjs").captureRequestError>>) {
  if (process.env.SENTRY_DSN) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureRequestError(...args);
  }
}
