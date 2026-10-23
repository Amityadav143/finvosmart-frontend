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

export interface AuditEntry {
  id: string
  createdAt: string
  action: string
  entityType: string | null
  entityId: string | null
  entityLabel: string | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  userId: string | null
  userName: string
}

export interface AuditPage {
  content: AuditEntry[]
  currentPage: number
  pageSize: number
  totalElements: number
  totalPages: number
}

export interface AuditFilter {
  from?: string
  to?: string
  action?: string
  entityType?: string
  q?: string
}

const clean = (f: AuditFilter) =>
  Object.fromEntries(Object.entries(f).filter(([, v]) => v !== undefined && v !== ''))

export const auditApi = {
  search: async (f: AuditFilter, page = 0, size = 50): Promise<AuditPage> =>
    (await api.get('/audit-trail', { params: { ...clean(f), page, size } })).data.data,
  types: async (): Promise<string[]> => (await api.get('/audit-trail/types')).data.data ?? [],
  /** Downloads the CSV through the authenticated client and saves it. */
  exportCsv: async (f: AuditFilter) => {
    const res = await api.get('/audit-trail/export', { params: clean(f), responseType: 'blob' })
    const url = URL.createObjectURL(res.data as Blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-trail-${f.from || 'start'}-to-${f.to || 'today'}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  },
}
