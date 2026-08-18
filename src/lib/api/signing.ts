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
import type { ApiResponse, SigningRequest } from '@/types'

export const signingApi = {
  create: async (documentId: string, type: string, signers: any[]) =>
    (await api.post<ApiResponse<SigningRequest>>('/signing', signers, { params: { documentId, type } })).data.data!,
  history: async (): Promise<SigningRequest[]> =>
    (await api.get<ApiResponse<SigningRequest[]>>('/signing/history')).data.data ?? [],
  status: async (id: string) => (await api.get(`/signing/${id}`)).data.data,
}
