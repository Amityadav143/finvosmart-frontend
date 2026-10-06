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

import type { MetadataRoute } from 'next'
import { PAGES, absoluteUrl, type PageSeo } from '@/lib/seo'

// Generated at build time, so lastModified is the deploy date.
const BUILT_AT = new Date()

/** Every indexable page, straight from src/lib/seo.ts. */
export default function sitemap(): MetadataRoute.Sitemap {
  return Object.values(PAGES).map((p: PageSeo) => ({
    url: absoluteUrl(p.path),
    lastModified: BUILT_AT,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }))
}
