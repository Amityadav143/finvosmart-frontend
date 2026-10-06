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
import HomeClient from '@/components/marketing/HomeClient'
import { JsonLd } from '@/components/seo/JsonLd'
import { pageMetadata, organizationSchema, websiteSchema, softwareSchema, faqSchema } from '@/lib/seo'

// Server component: owns the homepage's metadata and schema so they are in the
// initial HTML. The interactive landing page itself lives in HomeClient.
export const metadata: Metadata = pageMetadata('home')

export default function Home() {
  return (
    <>
      <JsonLd nodes={[organizationSchema(), websiteSchema(), softwareSchema(), faqSchema()]} />
      <HomeClient />
    </>
  )
}
