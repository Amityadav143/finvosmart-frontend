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
import LandingPageContent from '@/components/marketing/LandingPageContent'
import MarketingNav from '@/components/marketing/MarketingNav'
import MarketingFooter from '@/components/marketing/MarketingFooter'
import SignedInRedirect from '@/components/marketing/SignedInRedirect'
import { JsonLd } from '@/components/seo/JsonLd'
import { pageMetadata, organizationSchema, websiteSchema, softwareSchema, faqSchema, webPageSchema } from '@/lib/seo'

// Server component, like the whole landing page: metadata, schema and every word of the
// page are in the initial HTML. Only the header's small islands and the signed-in redirect
// run in the browser.
export const metadata: Metadata = pageMetadata('home')

export default function Home() {
  return (
    <>
      <JsonLd nodes={[organizationSchema(), websiteSchema(), softwareSchema(), webPageSchema('home'), faqSchema()]} />
      <SignedInRedirect />
      <MarketingNav />
      <main>
        <LandingPageContent />
      </main>
      <MarketingFooter />
    </>
  )
}
