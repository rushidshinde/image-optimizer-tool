import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ['@sparticuz/chromium', 'playwright-core'],
};

export default nextConfig;
