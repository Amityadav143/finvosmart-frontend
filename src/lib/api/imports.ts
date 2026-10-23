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
import type { ImportKind, ImportKindInfo, ImportPreview, ImportResult, OpeningDifference } from '@/types/imports'

const data = <T,>(r: { data: ApiResponse<T> }) => r.data.data as T

const form = (file: File) => { const f = new FormData(); f.append('file', file); return f }
const MULTIPART = { 'Content-Type': 'multipart/form-data' }

export const importsApi = {
  /** What can be imported, the columns of each file, and which the signed-in person may import. */
  kinds: async () => data<ImportKindInfo[]>(await api.get('/import/kinds')),
  /** Our CSV template (opens in Excel). */
  template: (kind: ImportKind, fileName: string) => download(`/import/${kind}/template`, {}, fileName),
  /** What importing the file would do, row by row. Saves nothing. */
  preview: async (kind: ImportKind, file: File, asOf?: string) =>
    data<ImportPreview>(await api.post(`/import/${kind}/preview`, form(file), { params: asOf ? { asOf } : {}, headers: MULTIPART, timeout: 180000 })),
  /** Imports the ready rows: all together, or none. */
  run: async (kind: ImportKind, file: File, opts: { asOf?: string; skipProblems?: boolean } = {}) =>
    data<ImportResult>(await api.post(`/import/${kind}`, form(file), {
      params: { ...(opts.asOf ? { asOf: opts.asOf } : {}), skipProblems: !!opts.skipProblems }, headers: MULTIPART, timeout: 300000,
    })),
  /** Opening balances not yet explained (the balance of Opening Balance Difference). */
  openingDifference: async () => data<OpeningDifference>(await api.get('/import/opening-difference')),
}
