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
import type { ApiResponse } from '@/types'

export const bankingApi = {
  reconcile: async (file: File, bank: string) => {
    const form = new FormData(); form.append('file', file); form.append('bank', bank)
    return (await api.post<ApiResponse<any>>('/banking/reconcile', form,
      { headers: { 'Content-Type': 'multipart/form-data' } })).data.data!
  },
  post: async (txnIds: string[]) => (await api.post('/banking/reconcile/post', txnIds)).data,
}
