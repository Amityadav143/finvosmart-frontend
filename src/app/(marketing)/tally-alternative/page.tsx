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
import { SolutionPage } from '@/components/marketing/SolutionPage'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata('tallyAlternative')

export default function TallyAlternativePage() {
  return <SolutionPage id="tallyAlternative" />
}
