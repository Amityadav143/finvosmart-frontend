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

import type { Metadata } from 'next'
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
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://finvosmart.com'),
  title: {
    default: "Finvosmart by Navgrow — India's Business Operating System",
    template: '%s | Finvosmart by Navgrow',
  },
  description: "Finvosmart by Navgrow is India's most complete cloud ERP — HRMS, Finance, GST Invoicing, CRM, AI Cash Flow and WhatsApp Billing in one platform. Replace Tally, Zoho and 5 more apps. Start free.",
  applicationName: 'Finvosmart by Navgrow',
  authors: [{ name: 'Navgrow Engineering Service Pvt. Ltd.', url: 'https://finvosmart.com' }],
  creator: 'Navgrow Engineering Service Pvt. Ltd.',
  publisher: 'Navgrow Engineering Service Pvt. Ltd.',
  category: 'Business Software',
  keywords: [
    'Finvosmart', 'Finvosmart by Navgrow', 'ERP software India', 'best ERP for Indian SME',
    'GST billing software', 'GST invoicing software', 'e-invoicing software', 'e-way bill software',
    'HRMS software India', 'payroll software India', 'TDS software', 'accounting software India',
    'Tally alternative', 'Zoho alternative', 'Busy alternative', 'cloud ERP India',
    'WhatsApp billing', 'AI cash flow forecasting', 'CRM software India', 'inventory management software',
    'business management software', 'invoicing app India',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'Finvosmart by Navgrow',
    title: "Finvosmart by Navgrow — India's Business Operating System",
    description: "One cloud platform for HRMS, Finance, GST Invoicing, CRM and AI. Built for Indian businesses. Replace Tally, Zoho and 5 more apps.",
    url: 'https://finvosmart.com',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Finvosmart by Navgrow — India\'s Business Operating System',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@finvosmart',
    creator: '@finvosmart',
    title: "Finvosmart by Navgrow — India's Business Operating System",
    description: "One cloud platform for HRMS, Finance, GST Invoicing, CRM and AI. Built for Indian businesses.",
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  verification: {
    // Add your Google Search Console verification token here when available:
    // google: 'your-google-site-verification-token',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable}`}>
      <body suppressHydrationWarning className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
