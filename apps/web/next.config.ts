import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@nexus/ui",
    "@nexus/design-tokens",
    "@nexus/types",
    "@nexus/utils",
  ],
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
};

export default nextConfig;
