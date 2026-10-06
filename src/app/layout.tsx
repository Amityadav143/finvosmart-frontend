/*
 * FINVOSMART — India's Business Operating System
 *
 * Copyright (c) 2025-2026 Navgrow Engineering Service Pvt. Ltd.
 * CIN: U29302WB2025PTC281015
 *
 * All rights reserved. This source code is proprietary and confidential.
 * Unauthorized copying, distribution, modification, or use of this file,
 * via any medium, is strictly prohibited without prior written permission.
 */

import type { Metadata, Viewport } from 'next'
import { SITE, PAGES } from '@/lib/seo'
import './globals.css'
import { Providers } from './providers'
import { Inter, JetBrains_Mono, Instrument_Serif } from 'next/font/google'

// Self-hosted, optimised fonts (no render-blocking external CSS request).
// `display: swap` avoids invisible text while fonts load, improving LCP.
// Inter and JetBrains Mono are near-identical to Geist / Geist Mono and are
// available across all Next 14 versions (Geist requires Next 14.1+).
const geist = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-geist',
  display: 'swap',
})
const geistMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-geist-mono',
  display: 'swap',
})
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: 'normal',
  variable: '--font-instrument-serif',
  display: 'swap',
  // Instrument Serif ships without the fallback-metric data Next.js looks for,
  // which triggers a harmless "Failed to find font override values" warning at
  // build time. Providing an explicit fallback and disabling the automatic
  // fallback-metric adjustment silences the warning without changing the look.
  fallback: ['Georgia', 'serif'],
  adjustFontFallback: false,
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1A1B4B',
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: PAGES.home.title,
    template: '%s | Finvosmart',
  },
  description: PAGES.home.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.legalName, url: SITE.url }],
  creator: SITE.legalName,
  publisher: SITE.legalName,
  category: 'Business Software',
  // Ignored by Google, used lightly by Bing. The real signals are titles,
  // descriptions and on-page content — kept to terms Indian businesses search.
  keywords: [
    'Finvosmart', 'GST billing software', 'GST invoice software', 'e-invoicing software India',
    'e-way bill software', 'accounting software for small business India', 'Tally alternative',
    'payroll software India', 'HRMS software India', 'TDS software', 'billing software for MSME',
    'cloud ERP India', 'inventory management software India', 'CRM software India',
  ],
  // No canonical here on purpose: a root-level canonical is inherited by every page
  // that doesn't override it, making them all claim to be the homepage. Each public
  // page sets its own via pageMetadata() in src/lib/seo.ts.
  openGraph: {
    type: 'website',
    locale: SITE.locale,
    siteName: SITE.name,
    title: PAGES.home.title,
    description: PAGES.home.description,
    images: [{ ...SITE.ogImage }],
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGES.home.title,
    description: PAGES.home.description,
    images: [SITE.ogImage.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      // Google shows a site's favicon next to search results; it prefers a square
      // icon whose size is a multiple of 48px — 192px qualifies.
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  // Set these env vars at build time to verify ownership (or verify the domain
  // via a DNS TXT record in Search Console, which needs no code at all).
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } : {}),
    ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { other: { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } } : {}),
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" data-theme="dark" suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable}`}>
      <body suppressHydrationWarning className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
