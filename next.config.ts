import type { NextConfig } from 'next';

// Pin the workspace root so Next.js doesn't pick up the parent C:\Projects\ project's lockfile.
const root = process.cwd();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root,
  },
  outputFileTracingRoot: root,
  images: {
    qualities: [75, 90],
  },
};

export default nextConfig;
