/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "**",
        pathname: "/**",
      },
    ],
  },
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname,
  },
  output: "standalone",
  // jsdom (used for server-side HTML sanitization) has dynamic requires that
  // break webpack/turbopack bundling — load it from node_modules at runtime.
  serverExternalPackages: ["jsdom"],
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

module.exports = nextConfig;
