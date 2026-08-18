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
 * Dynamic sitemap consumed by search engines. Lists the public marketing pages
 * with sensible change frequencies and priorities so crawlers index the most
 * important pages first. App (authenticated) routes are intentionally excluded.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const routes: { path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' }[] = [
    { path: '',             priority: 1.0, changeFrequency: 'weekly'  },
    { path: '/features',    priority: 0.9, changeFrequency: 'monthly' },
    { path: '/pricing',     priority: 0.9, changeFrequency: 'weekly'  },
    { path: '/custom-plan', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/about',       priority: 0.6, changeFrequency: 'monthly' },
    { path: '/contact',     priority: 0.7, changeFrequency: 'monthly' },
  ]

  return routes.map(r => ({
    url: `${BASE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))
}
