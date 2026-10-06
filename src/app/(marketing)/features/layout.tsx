/*
 * FINVOSMART — India's Business Operating System
 *
 * Copyright (c) 2025-2026 Navgrow Engineering Service Pvt. Ltd.
 * CIN: U29302WB2025PTC281015
 *
 * All rights reserved. This source code is proprietary and confidential.
 * Unauthorized copying, distribution, modification, or use of this file,
 * via any medium, is strictly prohibited without prior written permission.
 */

import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbSchema, pageMetadata } from '@/lib/seo'

// Title, description, canonical and social preview come from src/lib/seo.ts.
export const metadata: Metadata = pageMetadata('features')

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd nodes={[breadcrumbSchema('features')]} />
      {children}
    </>
  )
}
