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
import type { ApiResponse, ExpenseClaim } from '@/types'

export const expensesApi = {
  submit: async (receipt: File, employeeId: string, category: string, amount: number) => {
    const form = new FormData(); form.append('receipt', receipt)
    form.append('employeeId', employeeId); form.append('category', category); form.append('amount', String(amount))
    return (await api.post<ApiResponse<ExpenseClaim>>('/expenses/submit', form,
      { headers: { 'Content-Type': 'multipart/form-data' } })).data.data!
  },
  list: async (employeeId?: string, month?: number): Promise<ExpenseClaim[]> =>
    (await api.get<ApiResponse<ExpenseClaim[]>>('/expenses/employee/' + (employeeId ?? 'me'),
      { params: { month } })).data.data ?? [],
  approve: async (id: string) => (await api.post(`/expenses/${id}/approve`)).data,
  reject:  async (id: string, reason: string) => (await api.post(`/expenses/${id}/reject`, { reason })).data,
}
