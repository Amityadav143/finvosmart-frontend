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
  title: 'Features — All 14 Modules in One Platform',
  description: 'Explore every FINVOSMART module: HRMS, Finance, GST e-Invoicing, CRM, Inventory, Procurement, Projects, AI Cash Flow and WhatsApp billing — one integrated system built for Indian businesses.',
  alternates: { canonical: '/features' },
  openGraph: {
    title: 'FINVOSMART Features — 14 Modules, One Platform',
    description: 'HRMS, Finance, GST Invoicing, CRM, Inventory, AI and WhatsApp billing — fully integrated for Indian SMEs.',
    url: '/features',
  },
}

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return children
}
