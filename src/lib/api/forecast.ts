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
import type { ApiResponse, ForecastItem } from '@/types'

export const forecastApi = {
  inventory: async () => (await api.get<ApiResponse<any>>('/forecast/inventory')).data.data!,
  generatePOs: async (itemIds: string[]) => (await api.post('/forecast/generate-pos', itemIds)).data,
}
