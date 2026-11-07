import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  reactStrictMode: true,
  experimental: { optimizePackageImports: ['motion', 'three', '@react-three/drei'] },
};

export default nextConfig;
