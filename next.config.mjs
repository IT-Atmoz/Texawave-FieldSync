import nextPwa from 'next-pwa';

/** @type {import('next').NextConfig} */
const baseConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

// Only enable PWA in production
const isDev = process.env.NODE_ENV === 'development';

const pwaConfig = {
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: isDev, // ❗️Disable PWA during dev to avoid SW issues
};

const nextConfig = nextPwa(pwaConfig)(baseConfig);

export default nextConfig;
