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
import type { ApiResponse, PageResponse, InventoryItem, StockMovement, LowStockAlert } from '@/types'

export const inventoryApi = {
  items: {
    list: async (p: { page?: number; size?: number; q?: string; category?: string } = {}) =>
      (await api.get<ApiResponse<PageResponse<InventoryItem>>>('/inventory/items', { params: p })).data.data!,
    create: async (d: Partial<InventoryItem>) => (await api.post<ApiResponse<InventoryItem>>('/inventory/items', d)).data.data!,
    update: async (id: string, d: Partial<InventoryItem>) => (await api.put<ApiResponse<InventoryItem>>(`/inventory/items/${id}`, d)).data.data!,
    adjust: async (id: string, qty: number, type: string, ref?: string) =>
      (await api.post(`/inventory/items/${id}/adjust`, { quantity: qty, movementType: type, referenceNumber: ref })).data,
  },
  movements: {
    list: async (p: { page?: number; size?: number; itemId?: string; type?: string } = {}) =>
      (await api.get<ApiResponse<PageResponse<StockMovement>>>('/inventory/movements', { params: p })).data.data!,
  },
  alerts: {
    lowStock: async (): Promise<LowStockAlert[]> =>
      (await api.get<ApiResponse<LowStockAlert[]>>('/inventory/alerts/low-stock')).data.data ?? [],
  },
}
