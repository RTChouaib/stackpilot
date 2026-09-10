// Sentry Edge runtime config (middleware.ts, app/api/og/route.tsx).
// No-op unless SENTRY_DSN is set — see README for setup.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({ dsn, tracesSampleRate: 0.1 });
}
