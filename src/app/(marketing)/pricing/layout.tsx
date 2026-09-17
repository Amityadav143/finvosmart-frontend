/*
 * FINVOSMART — Finvosmart by Navgrow
 *
 * Copyright (c) 2025-2026 Navgrow Engineering Service Pvt. Ltd.
 * CIN: U29302WB2025PTC281015
 *
 * All rights reserved. This source code is proprietary and confidential.
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — Simple, Transparent, India-Priced',
  description: 'One subscription for everything — no per-module fees. FINVOSMART plans start at ₹3,999/mo. Compare Starter, Growth and Enterprise, or build a custom plan. 14-day free trial, no credit card.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'FINVOSMART Pricing — One Plan for Everything',
    description: 'Transparent, India-priced plans from ₹3,999/mo. No per-module fees. Start free for 14 days.',
    url: '/pricing',
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
