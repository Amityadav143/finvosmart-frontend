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
import { serverGet } from '@/lib/serverApi'

/** The online stores that asked to be listed, and their items — read from the API, hourly. */
interface StoreEntry { slug: string; updatedAt?: string | null; items: string[] }

// Rebuilt at most hourly, so new stores and items appear without a new build.
export const revalidate = 3600

/** Every indexable page, straight from src/lib/seo.ts, with the date its content last changed — then the listed stores. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = (Object.keys(PAGES) as PageKey[]).map(key => ({
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
  // the API being down never breaks the sitemap: the stores are left out until the next rebuild (and the log says so)
  let stores: StoreEntry[] = []
  try {
    stores = (await serverGet<StoreEntry[]>('/public/shop-sitemap', 3600)) ?? []
  } catch (e) {
    console.error(`[finvo] sitemap: the online stores are left out until it is made again (within the hour) — ${e instanceof Error ? e.message : e}`)
  }
  const day = (at?: string | null) => (at ? at.slice(0, 10) : undefined)
  const shops: MetadataRoute.Sitemap = stores.flatMap(st => [
    { url: absoluteUrl(`/shop/${st.slug}`), lastModified: day(st.updatedAt), changeFrequency: 'daily' as const, priority: 0.5 },
    ...st.items.map(id => ({ url: absoluteUrl(`/shop/${st.slug}/p/${id}`), lastModified: day(st.updatedAt), changeFrequency: 'weekly' as const, priority: 0.4 })),
  ])
  return [...pages, ...shops]
}
