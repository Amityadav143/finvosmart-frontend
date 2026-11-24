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

import MarketingNav from '@/components/marketing/MarketingNav'
import MarketingFooter from '@/components/marketing/MarketingFooter'
import { WebsiteAssistant } from '@/components/assistant/WebsiteAssistant'
import { JsonLd } from '@/components/seo/JsonLd'
import { organizationSchema, websiteSchema } from '@/lib/seo'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Site-wide: who publishes this site. Page-specific schema lives in each page's layout. */}
      <JsonLd nodes={[organizationSchema(), websiteSchema()]} />
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
      {/* Ask Finvosmart: shown only when the server's website assistant answers (asked after the page loads) */}
      <WebsiteAssistant />
    </>
  )
}
