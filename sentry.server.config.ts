// Sentry Node (server-side: Route Handlers, Server Components) config.
// No-op unless SENTRY_DSN is set — see README for setup.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    // Scrub obvious PII fields (email, password, token) from error
    // payloads before they leave the server — defense in depth on top of
    // whatever Sentry's default scrubbing already does, given this app's
    // routes routinely handle emails, session cookies, and share tokens.
    beforeSend(event) {
      if (event.request?.data && typeof event.request.data === "object") {
        for (const key of ["email", "password", "token", "passwordHash"]) {
          if (key in (event.request.data as Record<string, unknown>)) {
            (event.request.data as Record<string, unknown>)[key] = "[redacted]";
          }
        }
      }
      return event;
    },
  });
}
