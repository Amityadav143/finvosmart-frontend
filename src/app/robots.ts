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
import { AI_CRAWLERS, SITE } from '@/lib/seo'

/**
 * Only the API is blocked. Signed-in app screens (dashboard, hrms, …) are NOT
 * listed here: a URL blocked in robots.txt can still be indexed from links —
 * just without a description ("No information is available for this page").
 * Instead they send an `X-Robots-Tag: noindex` header (see next.config.js),
 * which crawlers can only read if they're allowed to fetch the page.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // the online stores' product photos and logos may be fetched (for image search and product results)
      { userAgent: '*', allow: ['/', '/api/v1/public/shop/'], disallow: ['/api/'] },
      // AI assistants and answer engines, by name (lib/seo.ts): the same rules, and the files written for them
      { userAgent: [...AI_CRAWLERS], allow: ['/', '/llms.txt', '/llms-full.txt', '/api/v1/public/shop/'], disallow: ['/api/'] },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  }
}
