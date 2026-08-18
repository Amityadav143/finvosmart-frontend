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

export const reportsApi = {
  dashboardSummary: async () => (await api.get('/reports/dashboard-summary')).data.data,
  topCustomers: async (limit = 10) =>
    (await api.get('/reports/top-customers', { params: { limit } })).data.data ?? [],
  revenueByMonth: async (year: number) =>
    (await api.get('/reports/revenue-by-month', { params: { year } })).data.data ?? [],
  expensesByCategory: async (from: string, to: string) =>
    (await api.get('/reports/expenses-by-category', { params: { from, to } })).data.data ?? [],
}
