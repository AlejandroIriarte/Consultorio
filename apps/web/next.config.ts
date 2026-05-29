import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@consultorio/ui', '@consultorio/types', '@consultorio/validators'],
  experimental: {
    serverComponentsExternalPackages: [],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.s3.amazonaws.com' },
    ],
  },
};

export default nextConfig;
