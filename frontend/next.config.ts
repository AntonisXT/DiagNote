import type { NextConfig } from "next";

const FASTAPI_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Tiptap ships ESM; Pages Router needs these compiled through webpack
  transpilePackages: [
    "@tiptap/core",
    "@tiptap/react",
    "@tiptap/pm",
    "@tiptap/starter-kit",
    "@tiptap/extension-placeholder",
  ],

  // Proxy /api/* and /health to the FastAPI server during development.
  // In production the Docker container runs FastAPI as the origin server,
  // so these rewrites are never reached.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${FASTAPI_URL}/api/:path*`,
      },
      {
        source: "/health",
        destination: `${FASTAPI_URL}/health`,
      },
    ];
  },
};

export default nextConfig;
