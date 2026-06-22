/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@consultorio/ui', '@consultorio/types', '@consultorio/validators'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.s3.amazonaws.com' },
    ],
  },
};

export default nextConfig;
