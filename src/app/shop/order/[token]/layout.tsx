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

// A customer's private order page: never indexed, never sent on as a referrer.
export const metadata: Metadata = {
  title: { absolute: 'Your order' },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: 'no-referrer',
}

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return children
}
