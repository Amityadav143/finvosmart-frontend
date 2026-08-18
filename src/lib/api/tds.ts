/*
 * FINVOSMART — India's Business Operating System
 *
 * Copyright (c) 2025-2026 Navgrow Engineering Service Pvt. Ltd.
 * CIN: U29302WB2025PTC281015
 *
 * All rights reserved. This source code is proprietary and confidential.
 * Unauthorized copying, distribution, modification, or use of this file,
 * via any medium, is strictly prohibited without prior written permission.
 */

import { api } from './client'
import type { ApiResponse, TdsEntry, TdsSection } from '@/types'

export const tdsApi = {
  detectSection: async (category: string): Promise<TdsSection> =>
    (await api.get<ApiResponse<TdsSection>>('/tds/detect-section', { params: { category } })).data.data!,
  calculate: async (vendorId: string, category: string, amount: number): Promise<TdsEntry> =>
    (await api.post<ApiResponse<TdsEntry>>('/tds/calculate', null, { params: { vendorId, category, amount } })).data.data!,
  quarterSummary: async (quarter: string) =>
    (await api.get('/tds/quarter/' + quarter)).data.data,
  exportForm26Q: async (quarter: string) =>
    api.get(`/tds/export/form26q?quarter=${quarter}`, { responseType: 'blob' }),
}
