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
  title: 'About Us — Building India\'s Business OS',
  description: 'Finvosmart by Navgrow is on a mission to give every Indian business one powerful, affordable platform to run operations — replacing a stack of disconnected tools with a single cloud ERP built for India.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About Finvosmart by Navgrow',
    description: 'Our mission: give every Indian business one powerful, affordable platform built for India.',
    url: 'https://finvosmart.com/about',
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
