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
  title: 'Build Your Own Plan — Pick Only What You Need',
  description: 'Design a FINVOSMART plan tailored to your business. Choose only the modules you need and pay for nothing else — no locked-in bundles. Built for Indian SMEs.',
  alternates: { canonical: '/custom-plan' },
  openGraph: {
    title: 'Build a Custom FINVOSMART Plan',
    description: 'Pick only the modules you need. No locked-in bundles.',
    url: '/custom-plan',
  },
}

export default function CustomPlanLayout({ children }: { children: React.ReactNode }) {
  return children
}
