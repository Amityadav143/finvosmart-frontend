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
import type { ApiResponse, Subscription } from '@/types'

export const subscriptionsApi = {
  list: async (): Promise<Subscription[]> => (await api.get<ApiResponse<Subscription[]>>('/subscriptions')).data.data ?? [],
  create: async (d: Partial<Subscription> & { startDate: string }) =>
    (await api.post<ApiResponse<Subscription>>('/subscriptions', null, { params: {
      customerId: d.customerId, description: d.description, amount: d.amount,
      frequency: d.frequency, startDate: d.startDate,
    } })).data.data!,
  pause:  async (id: string) => (await api.patch(`/subscriptions/${id}/pause`)).data,
  resume: async (id: string) => (await api.patch(`/subscriptions/${id}/resume`)).data,
  cancel: async (id: string) => (await api.patch(`/subscriptions/${id}/cancel`)).data,
}
