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
import { JsonLd } from '@/components/seo/JsonLd'
import { LegalPage } from '@/components/marketing/LegalPage'
import { breadcrumbSchema, pageMetadata } from '@/lib/seo'
import { PRIVACY } from '@/lib/legal'

export const metadata: Metadata = pageMetadata('privacy')

export default function PrivacyPage() {
  return (
    <>
      <JsonLd nodes={[breadcrumbSchema('privacy')]} />
      <LegalPage doc={PRIVACY} />
    </>
  )
}
