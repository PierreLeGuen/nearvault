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
  webpack: (config, { isServer, webpack }) => {
    // Seed-phrase derivation (near-seed-phrase -> bip39-light / near-hd-key)
    // relies on a global `Buffer`, which webpack 5 does not provide in the
    // browser bundle. Provide it, and stub out the Node-only crypto/stream
    // modules those packages reference behind browser-safe code paths.
    if (!isServer) {
      config.plugins.push(
        new webpack.ProvidePlugin({ Buffer: ["buffer", "Buffer"] }),
      );
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        stream: false,
      };
    }
    return config;
  },
};
export default config;
