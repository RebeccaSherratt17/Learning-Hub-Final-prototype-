/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Load the server-side sanitizer (and its jsdom) from node_modules at
    // runtime rather than bundling it — jsdom reads its own files from disk.
    serverComponentsExternalPackages: ['isomorphic-dompurify'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.blob.vercel-storage.com',
      },
    ],
  },
}
export default nextConfig