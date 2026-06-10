import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.app.github.dev", "localhost:3000", "127.0.0.1:3000"],
  experimental: {
    serverActions: {
      allowedOrigins: ["*.app.github.dev", "localhost:3000", "127.0.0.1:3000"],
    },
  },
};

export default nextConfig;
