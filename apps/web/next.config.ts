import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@wallet-connect/domain', '@wallet-connect/ui'],
};

export default nextConfig;
