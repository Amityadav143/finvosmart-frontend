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
import type { ApiResponse, WorkflowInstance } from '@/types'

export const workflowApi = {
  myPending: async (): Promise<WorkflowInstance[]> =>
    (await api.get<ApiResponse<WorkflowInstance[]>>('/workflow/my-pending')).data.data ?? [],
  approve: async (id: string, remarks?: string) =>
    (await api.post(`/workflow/instances/${id}/approve`, { remarks })).data,
  reject: async (id: string, remarks: string) =>
    (await api.post(`/workflow/instances/${id}/reject`, { remarks })).data,
}
