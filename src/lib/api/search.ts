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
import { api } from './client'
import type { ApiResponse } from '@/types'

/** SearchService.Hit — one record found, and where it opens. */
export interface SearchHit {
  kind: 'invoice' | 'customer' | 'bill' | 'supplier' | 'purchase_order' | 'item' | 'employee' | string
  id: string
  title: string
  subtitle?: string | null
  badge?: string | null
  link: string
}
export interface SearchGroup { kind: string; label: string; hits: SearchHit[] }
export interface SearchResults { query: string; groups: SearchGroup[] }

export const searchApi = {
  /** Records of every kind the user may open; nothing for fewer than 2 characters. */
  find: async (q: string, limit = 5, signal?: AbortSignal): Promise<SearchResults> =>
    ((await api.get<ApiResponse<SearchResults>>('/search', { params: { q, limit }, signal })).data.data) ?? { query: q, groups: [] },
}
