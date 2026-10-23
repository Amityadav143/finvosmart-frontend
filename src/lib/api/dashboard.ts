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
import type { DashAnalytics, DashboardSummary, SetupStatus } from '@/types/dashboard'

export const dashboardApi = {
  /** Everything on the home dashboard; sections the person may not see come back empty. */
  summary: async () => (await api.get<ApiResponse<DashboardSummary>>('/dashboard/summary')).data.data!,
  /** What is set up already — the getting-started checklist ticks itself off from this. */
  setup: async () => (await api.get<ApiResponse<SetupStatus>>('/dashboard/setup')).data.data!,
  /** The analytics page over the last 3, 6 or 12 months. */
  analytics: async (months: 3 | 6 | 12) => (await api.get<ApiResponse<DashAnalytics>>('/dashboard/analytics', { params: { months } })).data.data!,
}
