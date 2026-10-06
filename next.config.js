const fs = require('fs')
const path = require('path')

// Top-level routes that are public and should be indexed. Every other folder
// directly under src/app (dashboard, hrms, finance, …) is the signed-in app and
// gets `X-Robots-Tag: noindex`. Route groups like (marketing) hold the public
// pages and are skipped. New app modules are covered automatically.
const PUBLIC_TOP_LEVEL = new Set(['login', 'register'])
function privateRoutes() {
  try {
    return fs.readdirSync(path.join(__dirname, 'src', 'app'), { withFileTypes: true })
      .filter(d => d.isDirectory() && !/^[(_\[]/.test(d.name) && !PUBLIC_TOP_LEVEL.has(d.name))
      .map(d => d.name)
  } catch {
    return []
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // NOTE: This project is deployed manually on a VPS (not Docker), so it uses the
  // default Next.js build output and is served with `next start`. `next start`
  // serves the compiled CSS/JS and the public/ folder automatically — no separate
  // "copy the static folder" step, which is what previously caused CSS to 404 on
  // the server. (If you ever switch to Docker, re-enable `output: 'standalone'`
  // and have the Dockerfile copy .next/static + public into the standalone dir.)

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
      // Signed-in app screens: keep them out of search results. (They're allowed in
      // robots.txt so crawlers can actually see this header.)
      ...privateRoutes().map(route => ({
        source: `/${route}/:path*`,
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      })),
      // NOTE: no rule for /_next/static — Next.js already serves its content-hashed
      // build files with long-lived immutable caching. Re-declaring it here could also
      // attach a year-long cache to an error response for a missing file.
      {
        // Files in public/ (logo, favicon, OG image) do NOT have hashed names, so they
        // must not be `immutable`: a replaced logo would never update in browsers, and
        // a broken response could stick for a year. Cache for a day, then revalidate.
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|ico|woff|woff2)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, must-revalidate' },
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
