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
import { pageMetadata } from '@/lib/seo'

// Indexable: people search "finvosmart sign up" / "free trial".
export const metadata: Metadata = pageMetadata('register')

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
