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

import type { PageResponse } from '@/types'

/**
 * Every row of a paged list, asked for a page at a time — for an export of the whole list or a picker that must
 * offer everyone, never just the page on screen or the first few hundred. The server orders each list by a unique
 * key last, so the pages neither repeat nor skip a row.
 */
export async function allPages<T>(page: (n: number) => Promise<PageResponse<T>>): Promise<T[]> {
  const rows: T[] = []
  for (let n = 0; ; n++) {
    const p = await page(n)
    rows.push(...(p?.content ?? []))
    // the last page, an empty one, or an answer that doesn't say there are more (it is the whole list)
    const more = typeof p?.last === 'boolean' ? !p.last : typeof p?.totalPages === 'number' ? n + 1 < p.totalPages : false
    if (!more || !p.content?.length) return rows
  }
}
