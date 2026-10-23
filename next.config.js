const fs = require('fs')
const path = require('path')

// ── Next.js version guard ────────────────────────────────────────────────────
// This project is built for Next.js 14 (webpack). If a different major runs the build —
// e.g. after "npm audit fix --force" or "npx next build" without a local install pulled
// in Next 16, whose Turbopack default can't use the webpack config below — stop with a
// clear instruction instead of a confusing error. Checks the binary actually RUNNING.
;(function assertNextMajor() {
  const marker = `${path.sep}node_modules${path.sep}next${path.sep}`
  const bin = process.argv[1] || ''
  let pkgPath
  try {
    pkgPath = bin.includes(marker)
      ? path.join(bin.slice(0, bin.indexOf(marker) + marker.length), 'package.json')
      : require.resolve('next/package.json')
  } catch {
    return
  }
  let version
  try { version = require(pkgPath).version } catch { return }
  if (!String(version).startsWith('14.')) {
    throw new Error(
      `This project is built for Next.js 14, but Next.js ${version} is running.\n` +
      `  Fix:  cd frontend && rm -rf node_modules .next && npm ci && npm run build\n` +
      `  Avoid "npm audit fix --force" and "npx next build" without installing first: both can pull in a newer major.`)
  }
})()

// Top-level routes that are public and should be indexed. Every other folder
// directly under src/app (dashboard, hrms, finance, …) is the signed-in app and
// gets `X-Robots-Tag: noindex`. Route groups like (marketing) hold the public
// pages and are skipped. New app modules are covered automatically.
const PUBLIC_TOP_LEVEL = new Set(['login', 'register', 'llms.txt'])
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
  // Image optimizer (/_next/image) switched OFF. No page uses next/image, and on
  // Next.js 14 the optimizer has unpatched advisories — including a critical remote code
  // execution when AVIF is enabled. Re-enable only after upgrading to Next.js 15.5+.
  images: { unoptimized: true },

  env: {
    NEXT_PUBLIC_API_URL:   process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_NAME:  'FINVOSMART',
    NEXT_PUBLIC_VERSION:   '1.0.0',
    NEXT_PUBLIC_APP_DESC:  "India's Business Operating System",
    NEXT_PUBLIC_COMPANY:   'Navgrow Engineering Service Pvt. Ltd.',
  },

  poweredByHeader: false,
  reactStrictMode: true,

  // ── Security & caching headers ───────────────────────────────────────────
  // Index paths without a page of their own. Routing-level redirects are answered before
  // rendering, so they are real HTTP redirects. Fixed internal destinations only.
  async redirects() {
    return [{ source: '/inventory', destination: '/inventory/items', permanent: false }]
  },

  async headers() {
    return [
      {
        // Sensible security headers on every route.
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // Only our own pages may frame ours — except the embeddable tools under /embed/,
        // which other sites are invited to put in an iframe (nginx makes the same exception).
        source: '/:path((?!embed/).*)',
        headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }],
      },
      {
        source: '/embed/:path*',
        headers: [{ key: 'Content-Security-Policy', value: 'frame-ancestors *' }],
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
