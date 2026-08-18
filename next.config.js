/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // Production builds should not be blocked by lint warnings or non-critical type
  // notes. CI runs `npm run lint` / `tsc --noEmit` separately as quality gates.
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type-checking runs as a separate CI gate (`npm run type-check`). Keeping it out
    // of `next build` prevents a single type note from blocking a deployable image,
    // which is the standard pattern for containerised production builds.
    ignoreBuildErrors: true,
  },

  // ── Performance ──────────────────────────────────────────────────────────
  // Gzip/brotli compression for all responses.
  compress: true,
  // Tree-shake large icon/util libraries so only used exports ship to the client.
  // This meaningfully shrinks the JS bundle (lucide-react alone is ~1000 icons).
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts', 'lodash'],
  },
  // Modern image formats served automatically when the browser supports them.
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'demo.finvosmart.com' },
      { protocol: 'https', hostname: 'finvosmart.com' },
    ],
  },

  env: {
    NEXT_PUBLIC_API_URL:   process.env.NEXT_PUBLIC_API_URL   || 'http://localhost:8080/api/v1',
    NEXT_PUBLIC_APP_NAME:  'FINVOSMART',
    NEXT_PUBLIC_VERSION:   '1.0.0',
    NEXT_PUBLIC_APP_DESC:  "India's Business Operating System",
    NEXT_PUBLIC_COMPANY:   'Navgrow Engineering Service Pvt. Ltd.',
  },

  poweredByHeader: false,
  reactStrictMode: true,

  // ── Security & caching headers ───────────────────────────────────────────
  async headers() {
    return [
      {
        // Sensible security headers on every route.
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // Long-lived immutable caching for static assets and Next chunks.
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Cache public images/fonts aggressively.
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|ico|woff|woff2)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },

  // Suppress webpack warnings for browser-only fallbacks.
  webpack: (config, { isServer }) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false }
    return config
  },
}
module.exports = nextConfig
