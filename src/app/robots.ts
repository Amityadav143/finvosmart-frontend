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

const BASE_URL = 'https://finvosmart.com'

/**
 * robots.txt — tells crawlers to index the public marketing site but stay out
 * of the authenticated application, API and auth routes (which carry no SEO
 * value and shouldn't appear in search results). Points to the sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard',
          '/hrms/',
          '/finance/',
          '/invoicing',
          '/procurement/',
          '/inventory/',
          '/crm/',
          '/settings/',
          '/ai/',
          '/onboarding',
          '/login',
          '/reports',
          '/marketplace',
          '/ca-workspace',
          '/timesheet',
          '/assets',
          '/contracts',
          '/performance',
          '/expense-claims',
          '/bank-import',
          '/bulk-operations',
          '/gst-export',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
