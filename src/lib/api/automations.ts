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
import type { ApiResponse, AutomationRule } from '@/types'

export const automationsApi = {
  list: async (): Promise<AutomationRule[]> =>
    (await api.get<ApiResponse<AutomationRule[]>>('/automations')).data.data ?? [],
  create: async (rule: Omit<AutomationRule,'id'|'executionsToday'|'lastRun'>) =>
    (await api.post<ApiResponse<AutomationRule>>('/automations', rule)).data.data!,
  toggle: async (id: string, active: boolean) =>
    (await api.patch(`/automations/${id}`, { active })).data,
  delete: async (id: string) => (await api.delete(`/automations/${id}`)).data,
}
