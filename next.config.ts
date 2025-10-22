import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Disable network interface detection to fix macOS error
  }
};

export default nextConfig;
