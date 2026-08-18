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
import type { ApiResponse, PageResponse, Customer, Lead } from '@/types'

export const crmApi = {
  customers: {
    list: async (p: { page?: number; size?: number; q?: string } = {}) =>
      (await api.get<ApiResponse<PageResponse<Customer>>>('/crm/customers', { params: p })).data.data!,
    create: async (d: Partial<Customer>) => (await api.post<ApiResponse<Customer>>('/crm/customers', d)).data.data!,
    get: async (id: string) => (await api.get<ApiResponse<Customer>>(`/crm/customers/${id}`)).data.data!,
  },
  leads: {
    list: async (): Promise<Lead[]> => (await api.get<ApiResponse<Lead[]>>('/crm/leads')).data.data ?? [],
    create: async (d: Partial<Lead>) => (await api.post<ApiResponse<Lead>>('/crm/leads', d)).data.data!,
    updateStatus: async (id: string, status: string) =>
      (await api.patch<ApiResponse<Lead>>(`/crm/leads/${id}/status`, { status })).data.data!,
    pipeline: async (): Promise<Record<string,number>> =>
      (await api.get<ApiResponse<Record<string,number>>>('/crm/leads/pipeline')).data.data ?? {},
  },
}
