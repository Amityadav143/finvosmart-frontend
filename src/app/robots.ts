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
import { SITE } from '@/lib/seo'

/**
 * Only the API is blocked. Signed-in app screens (dashboard, hrms, …) are NOT
 * listed here: a URL blocked in robots.txt can still be indexed from links —
 * just without a description ("No information is available for this page").
 * Instead they send an `X-Robots-Tag: noindex` header (see next.config.js),
 * which crawlers can only read if they're allowed to fetch the page.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/'] }],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  }
}
