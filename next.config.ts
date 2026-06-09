import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@react-pdf/renderer"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
