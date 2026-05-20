/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.mjs");

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  swcMinify: true,
  generateBuildId: async () => {
    return process.env.VERCEL_GIT_COMMIT_SHA ?? "dev";
  },
  publicRuntimeConfig: {
    buildId: process.env.VERCEL_GIT_COMMIT_SHA ?? "dev",
  },
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
};
export default config;
