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
import { StructuredData } from '@/components/marketing/StructuredData'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData />
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </>
  )
}
