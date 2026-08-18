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

export interface Tender {
  id: string
  tenderNumber?: string
  title: string
  source: string
  department?: string
  category?: string
  estimatedValue?: number
  emdAmount?: number
  publishedDate?: string
  submissionDeadline: string
  openingDate?: string
  status: string
  location?: string
  portalUrl?: string
  notes?: string
  eligibilityConfirmed: boolean
  daysToDeadline: number
  urgency: string
}

export interface TenderSummary {
  totalTracking: number
  closingThisWeek: number
  submitted: number
  won: number
  totalPipelineValue: number
  emdBlocked: number
  closingSoon: Tender[]
  alerts: string[]
}

export const tendersApi = {
  list: async (): Promise<Tender[]> =>
    (await api.get<ApiResponse<Tender[]>>('/tenders')).data.data ?? [],
  summary: async (): Promise<TenderSummary | null> =>
    (await api.get<ApiResponse<TenderSummary>>('/tenders/summary')).data.data ?? null,
  create: async (d: Partial<Tender>) =>
    (await api.post<ApiResponse<Tender>>('/tenders', d)).data.data!,
  update: async (id: string, d: Partial<Tender>) =>
    (await api.put<ApiResponse<Tender>>(`/tenders/${id}`, d)).data.data!,
  remove: async (id: string) =>
    (await api.delete<ApiResponse<void>>(`/tenders/${id}`)).data,
}
