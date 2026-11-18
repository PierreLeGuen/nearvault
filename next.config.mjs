/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.mjs");

const buildId = process.env.VERCEL_GIT_COMMIT_SHA ?? "dev";

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  generateBuildId: async () => buildId,
  // Inlined at build time so /api/version reports the same id the client
  // bundle was built with (replaces the removed publicRuntimeConfig).
  env: {
    NEXT_PUBLIC_BUILD_ID: buildId,
  },
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
  images: {
    // No protocol, so http and https both match, as `images.domains` did.
    remotePatterns: [{ hostname: "lh3.googleusercontent.com" }],
  },
};
export default config;
