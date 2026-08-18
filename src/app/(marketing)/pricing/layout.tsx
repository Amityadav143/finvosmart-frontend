/*
 * FINVOSMART — Finvosmart by Navgrow
 *
 * Copyright (c) 2025-2026 Navgrow Engineering Service Pvt. Ltd.
 * CIN: U29302WB2025PTC281015
 *
 * All rights reserved. This source code is proprietary and confidential.
 * Unauthorized copying, distribution, modification, or use of this file,
 * via any medium, is strictly prohibited without prior written permission.
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — Plans from ₹3,999/mo',
  description: 'Simple, transparent, India-priced ERP plans. Starter ₹3,999, Growth ₹10,399, Enterprise ₹23,999 per month. One subscription for HRMS, Finance, GST Invoicing, CRM and AI — no per-module fees. Start your free trial.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Finvosmart Pricing — Plans from ₹3,999/mo',
    description: 'Transparent, India-priced ERP plans. One subscription for everything — HRMS, Finance, GST Invoicing, CRM and AI.',
    url: 'https://finvosmart.com/pricing',
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
