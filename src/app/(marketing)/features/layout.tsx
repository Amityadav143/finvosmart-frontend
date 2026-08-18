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
  title: 'Features — 14 Modules in One Platform',
  description: 'Explore all 14 Finvosmart modules: HRMS, Finance, GST Invoicing, CRM, Procurement, Inventory, Projects, Analytics, plus AI Cash Flow, WhatsApp Billing, Bill Scanner and more — fully integrated.',
  alternates: { canonical: '/features' },
  openGraph: {
    title: 'Finvosmart Features — 14 Modules in One Platform',
    description: 'HRMS, Finance, GST Invoicing, CRM, Inventory, AI and more — fully integrated in one cloud ERP.',
    url: 'https://finvosmart.com/features',
  },
}

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
