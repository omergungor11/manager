import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@manager/shared', '@manager/ui'],
};

export default nextConfig;
