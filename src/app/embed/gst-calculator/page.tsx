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
import { GstCalculator } from '@/components/marketing/GstCalculator'
import { EmbedAutoHeight } from '@/components/marketing/EmbedAutoHeight'
import { SITE } from '@/lib/seo'

// The embeddable GST calculator. Other sites may frame /embed/* (next.config.js and nginx
// make that exception); every other page stays SAMEORIGIN. Not indexed: the tool page is.
export const metadata: Metadata = {
  title: { absolute: 'GST calculator — Finvosmart' },
  robots: { index: false, follow: true },
}

export default function EmbedGstCalculator({ searchParams }: { searchParams: { theme?: string } }) {
  const theme = searchParams?.theme === 'light' ? 'light' : 'dark'
  return (
    <div data-theme={theme} style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100vh', padding: '16px 0 4px' }}>
      <div id="embed-content" style={{ display: 'flow-root' }}>
      <GstCalculator embedded />
      <p style={{ textAlign: 'center', fontSize: '12px', margin: '-28px 0 8px' }}>
        <a href={`${SITE.url}/gst-calculator?utm_source=embed&utm_medium=referral`} target="_blank" rel="noopener" style={{ color: 'var(--text-muted)' }}>
          GST calculator by Finvosmart
        </a>
      </p>
      </div>
      <EmbedAutoHeight id="gst-calculator" contentId="embed-content" />
    </div>
  )
}
