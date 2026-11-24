const fs = require('fs')
const path = require('path')

// ── Next.js version guard ────────────────────────────────────────────────────
// This project is built for Next.js 16, with webpack (`next build --webpack`: the webpack config below; Turbopack,
// Next 16's default, would refuse it). If a different major runs the build — e.g. "npx next build" without a local
// install, or a server still on the old node_modules — stop with a clear instruction instead of a confusing error.
// Checks the binary actually RUNNING.
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
  if (!String(version).startsWith('16.')) {
    throw new Error(
      `This project is built for Next.js 16, but Next.js ${version} is running.\n` +
      `  Fix:  cd frontend && rm -rf node_modules .next && npm ci && npm run build\n` +
      `  Avoid "npm audit fix --force" and "npx next build" without installing first: both can pull in another major.`)
  }
})()

// Files a release removed. A server updated by unzipping a release over its folder keeps them, so say which to delete:
// - src/middleware.ts: Next.js 16 calls it src/proxy.ts, and refuses to build with both;
// - src/app/loading.tsx: a loading screen around every page made React 19 send the public pages' content hidden until
//   a script shows it — blank without JavaScript, to the crawlers that don't run it, and on a slow phone.
;(function assertNoRemovedFiles() {
  const left = ['src/middleware.ts', 'src/app/loading.tsx'].filter(f => fs.existsSync(path.join(__dirname, f)))
  if (left.length) {
    throw new Error(`${left.join(' and ')} ${left.length > 1 ? 'are' : 'is'} left over from an earlier release (see RELEASE_NOTES.md).\n` +
      `  Fix:  rm ${left.join(' ')}   (in the frontend folder), then build again.`)
  }
})()

// Top-level routes that are public and should be indexed. Every other folder
// directly under src/app (dashboard, hrms, finance, …) is the signed-in app and
// gets `X-Robots-Tag: noindex`. Route groups like (marketing) hold the public
// pages and are skipped. New app modules are covered automatically.
const PUBLIC_TOP_LEVEL = new Set(['login', 'register', 'llms.txt', 'llms-full.txt', 'shop'])
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
  // Two ways to run it. On a VPS without Docker it uses the default build output and is served
  // with `next start`, which serves the compiled CSS/JS and the public/ folder itself — no
  // separate "copy the static folder" step (missing that step is what made CSS 404 on a server
  // once). The Docker image (frontend/Dockerfile) sets NEXT_OUTPUT=standalone for its build and
  // copies .next/static and public/ next to the standalone server.js.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,

  // Production builds should not be blocked by non-critical type notes (Next.js 16 no longer lints during the build).
  // CI runs `npm run lint` / `tsc --noEmit` separately as quality gates.
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
  // Image optimizer (/_next/image) switched OFF. No page uses next/image, and the optimizer is where Next.js's most
  // serious advisories have been (code run on the server through crafted AVIF and SVG images): nothing to gain from it.
  images: { unoptimized: true },

  env: {
    // Where the browser finds the API, baked in at build time. A production build defaults to /api/v1
    // on the same site (nginx sends /api/ to the backend), so a plain `npm run build` on the server is
    // right — an unset value used to bake in http://localhost:8080, i.e. each visitor's own computer.
    // `next dev` talks to a local backend directly. Set NEXT_PUBLIC_API_URL for anything else. A "/" at
    // the end is dropped: the app adds its own ("…/api/v1/" + "/auth/me" made "//", which the backend's
    // firewall refuses).
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
    const csp = contentSecurityPolicy()
    return [
      {
        // Sensible security headers on every route.
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          // HTTPS only, for two years, sub-domains too (browsers ignore it on plain http://, so local runs are unaffected)
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          // pop-ups (Google sign-in, Razorpay's checkout) may still answer the page that opened them; nothing else may
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
          // the camera only for our own pages: scanning barcodes at the counter and in the stock scanner; the rest off
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), usb=(), serial=(), hid=(), midi=(), display-capture=(), browsing-topics=()' },
        ],
      },
      {
        // Only our own pages may frame ours — except the embeddable tools under /embed/,
        // which other sites are invited to put in an iframe (nginx makes the same exception).
        source: '/:path((?!embed/).*)',
        headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }, { key: 'Content-Security-Policy', value: `${csp}; frame-ancestors 'self'` }],
      },
      {
        source: '/embed/:path*',
        headers: [{ key: 'Content-Security-Policy', value: `${csp}; frame-ancestors *` }],
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
    // pdf.js (the in-page PDF preview) only needs node-canvas when run under Node, which the app never does.
    config.resolve.alias = { ...config.resolve.alias, canvas: false }
    return config
  },
}
/**
 * The Content-Security-Policy: what the pages may load and from where, so an injected script, a planted image that
 * sends data away, a foreign <base>, a plugin or a framing site has nowhere to go. Only Finvosmart itself (and the API,
 * wherever NEXT_PUBLIC_API_URL puts it), Razorpay's checkout and Google's sign-in — the two services the pages load.
 * Scripts and styles keep 'unsafe-inline' (Next.js writes its own inline scripts and styles; nonces would make every
 * page dynamic) and 'wasm-unsafe-eval' (the bill reader's OCR runs as WebAssembly in a worker); images may come from any
 * https address (company logos, product photos, Google profile pictures). In development webpack needs 'unsafe-eval'.
 * No upgrade-insecure-requests: on a page opened over plain http (a server before its certificate, or its bare IP
 * address) it would ask for every script and style over https and leave the page broken; HTTPS is enforced by nginx's
 * redirect and HSTS instead, and browsers already refuse or upgrade mixed content on an https page.
 */
function contentSecurityPolicy() {
  const raw = process.env.NEXT_PUBLIC_API_URL || ''
  let api = ''
  try { if (/^https?:\/\//i.test(raw)) api = new URL(raw).origin } catch { api = '' }
  const dev = process.env.NODE_ENV !== 'production'
  const own = api ? ` ${api}` : ''
  // Razorpay's Checkout from another address (NEXT_PUBLIC_RAZORPAY_CHECKOUT_URL) must be allowed to load too
  let checkout = ''
  try {
    const c = process.env.NEXT_PUBLIC_RAZORPAY_CHECKOUT_URL || ''
    if (/^https?:\/\//i.test(c) && new URL(c).origin !== 'https://checkout.razorpay.com') checkout = ` ${new URL(c).origin}`
  } catch { checkout = '' }
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${dev ? " 'unsafe-eval'" : ''} https://checkout.razorpay.com https://accounts.google.com https://cdn.razorpay.com${checkout}`,
    "style-src 'self' 'unsafe-inline' https://accounts.google.com",
    `img-src 'self' data: blob: https:${own}`,
    "font-src 'self' data:",
    `connect-src 'self'${own} https://accounts.google.com https://api.razorpay.com https://lumberjack.razorpay.com`,
    "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://accounts.google.com",
    "worker-src 'self' blob:",
    "media-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}

module.exports = nextConfig
