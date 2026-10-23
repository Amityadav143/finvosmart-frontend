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
import { download } from './purchases'
import type { ApiResponse } from '@/types'
import type { GstReturnsSummary } from '@/types/gst'

export type GstFile = 'gstr1/json' | 'gstr1/excel' | 'gstr3b/json' | 'gstr3b/excel'

const FILE_NAME: Record<GstFile, (p: string) => string> = {
  'gstr1/json': p => `GSTR1_${p}.json`,
  'gstr1/excel': p => `GSTR1_${p}.xlsx`,
  'gstr3b/json': p => `GSTR3B_${p}.json`,
  'gstr3b/excel': p => `GSTR3B_${p}.xlsx`,
}

export const gstReturnsApi = {
  summary: async (month: number, year: number) =>
    (await api.get<ApiResponse<GstReturnsSummary>>('/gst/export/summary', { params: { month, year } })).data.data as GstReturnsSummary,
  /** Downloads a return file; the period in the name is MMYYYY, as the portal writes it. */
  download: (file: GstFile, month: number, year: number) =>
    download(`/gst/export/${file}`, { month, year }, FILE_NAME[file](`${String(month).padStart(2, '0')}${year}`)),
}
