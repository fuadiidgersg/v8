import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  allowedDevOrigins: ["*.replit.dev", "*.replit.app", "*.spock.replit.dev", "*.janeway.replit.dev", "*.repl.co"],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
