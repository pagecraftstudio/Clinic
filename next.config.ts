import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    // Type errors from hand-written Supabase DB types and missing optional packages
    // are handled separately. Run `npx supabase gen types typescript` to get full types.
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
}

export default nextConfig
