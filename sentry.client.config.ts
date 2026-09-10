// Sentry browser (client-side) config.
// No-op unless NEXT_PUBLIC_SENTRY_DSN is set — see README for setup.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    // Session replay is off by default — it captures user interactions,
    // which given this app's lead-capture forms could include names/emails
    // typed into fields. Enable deliberately (with PII masking configured)
    // rather than by default.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}
