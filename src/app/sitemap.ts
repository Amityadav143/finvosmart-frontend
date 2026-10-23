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
import { CONTENT_UPDATED, PAGES, absoluteUrl, languagesFor, type PageKey } from '@/lib/seo'

/** Every indexable page, straight from src/lib/seo.ts, with the date its content last changed. */
export default function sitemap(): MetadataRoute.Sitemap {
  return (Object.keys(PAGES) as PageKey[]).map(key => ({
    url: absoluteUrl(PAGES[key].path),
    // A plain YYYY-MM-DD date: a Date object would be written in UTC, i.e. the day before
    // (midnight in India is 18:30 UTC the previous day).
    lastModified: CONTENT_UPDATED[key],
    changeFrequency: PAGES[key].changeFrequency,
    priority: PAGES[key].priority,
    // Language versions (the English and Hindi homepages name each other).
    ...(PAGES[key].lang || key === 'home'
      ? { alternates: { languages: Object.fromEntries(Object.entries(languagesFor(key)).map(([l, path]) => [l, absoluteUrl(path)])) } }
      : {}),
  }))
}
