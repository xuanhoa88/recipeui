/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/ingest/:path*",
        destination: "https://app.posthog.com/:path*",
      },
    ];
  },
  experimental: {
    serverActions: true,
  },
  transpilePackages: ["types", "ui"],
};

module.exports = nextConfig;
