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
import type { ApiResponse, PageResponse, InventoryItem, InventoryItemInput, StockMovement, StockLedgerRow, StockDaySummary, LowStockAlert, StockRecheckResult, StockSummary } from '@/types'

export const inventoryApi = {
  items: {
    list: async (p: { page?: number; size?: number; q?: string; category?: string } = {}) =>
      (await api.get<ApiResponse<PageResponse<InventoryItem>>>('/inventory/items', { params: p })).data.data!,
    get: async (id: string) => (await api.get<ApiResponse<InventoryItem>>(`/inventory/items/${id}`)).data.data!,
    create: async (d: InventoryItemInput) => (await api.post<ApiResponse<InventoryItem>>('/inventory/items', d)).data.data!,
    update: async (id: string, d: InventoryItemInput) => (await api.put<ApiResponse<InventoryItem>>(`/inventory/items/${id}`, d)).data.data!,
    /** Stock in, stock out or an adjustment (a negative adjustment is a shortage found on counting). */
    adjust: async (id: string, qty: number, type: string, opts: { reference?: string; remarks?: string } = {}) =>
      (await api.post<ApiResponse<StockMovement>>(`/inventory/items/${id}/adjust`, null, {
        params: { qty, type, ...(opts.reference ? { reference: opts.reference } : {}), ...(opts.remarks ? { remarks: opts.remarks } : {}) },
      })).data.data!,
  },
  movements: {
    list: async (p: { page?: number; size?: number; itemId?: string; type?: string; from?: string; to?: string } = {}) =>
      (await api.get<ApiResponse<PageResponse<StockLedgerRow>>>('/inventory/movements', { params: p })).data.data!,
    today: async () => (await api.get<ApiResponse<StockDaySummary>>('/inventory/movements/today')).data.data!,
    /** Re-checks stock against invoices and bills and posts whatever is missing (safe to repeat). */
    recheck: async () => (await api.post<ApiResponse<StockRecheckResult>>('/inventory/movements/recheck')).data.data!,
  },
  /** Items, stock value at purchase price, low and below-zero stock. */
  summary: async () => (await api.get<ApiResponse<StockSummary>>('/inventory/summary')).data.data!,
  alerts: {
    lowStock: async (): Promise<LowStockAlert[]> =>
      (await api.get<ApiResponse<LowStockAlert[]>>('/inventory/alerts/low-stock')).data.data ?? [],
  },
}
