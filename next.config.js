/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pdfkit"],
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
  outputFileTracingIncludes: {
    "/api/pdf/[shareToken]": [
      "./node_modules/pdfkit/js/**/*",
      "./node_modules/@react-pdf/**/*",
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      // Belt-and-braces for private/utility areas (the pages also carry a noindex meta tag).
      ...["/api/:path*", "/admin/:path*", "/agency/:path*", "/w/:path*", "/blueprint/:path*", "/privacy/delete-my-data/:path*"].map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      })),
    ];
  },
};

// Sentry source-map upload needs org/project/authToken at BUILD time, so
// wrapping unconditionally would break `next build` for anyone who hasn't
// set up Sentry yet (including CI, which intentionally runs without it —
// see .github/workflows/ci.yml). Only wrap when a build-time auth token is
// actually present; runtime error reporting itself is separately gated by
// the DSN checks in sentry.*.config.ts regardless of this.
const hasSentryBuildConfig = Boolean(process.env.SENTRY_AUTH_TOKEN);

if (hasSentryBuildConfig) {
  const { withSentryConfig } = require("@sentry/nextjs");
  module.exports = withSentryConfig(nextConfig, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    silent: true,
    widenClientFileUpload: true,
    hideSourceMaps: true,
    disableLogger: true,
  });
} else {
  module.exports = nextConfig;
}
