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
  title: 'Build a Custom Plan — Pay Only for What You Use',
  description: 'Design your own Finvosmart ERP plan. Pick only the modules your business needs — HRMS, Finance, Invoicing, CRM, Inventory, AI — and pay for nothing else. No locked-in bundles.',
  alternates: { canonical: '/custom-plan' },
  openGraph: {
    title: 'Build a Custom Finvosmart Plan',
    description: 'Pick only the modules you need and pay for nothing else. No locked-in bundles.',
    url: 'https://finvosmart.com/custom-plan',
  },
}

export default function CustomPlanLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
