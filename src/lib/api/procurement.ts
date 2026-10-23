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
import type { ApiResponse, PageResponse, PurchaseOrder, Vendor } from '@/types'

export const procurementApi = {
  purchaseOrders: {
    list: async (p: { page?: number; size?: number; status?: string; vendorId?: string } = {}) =>
      (await api.get<ApiResponse<PageResponse<PurchaseOrder>>>('/procurement/purchase-orders', { params: p })).data.data!,
    create: async (d: Partial<PurchaseOrder>) => (await api.post<ApiResponse<PurchaseOrder>>('/procurement/purchase-orders', d)).data.data!,
    get: async (id: string) => (await api.get<ApiResponse<PurchaseOrder>>(`/procurement/purchase-orders/${id}`)).data.data!,
    updateStatus: async (id: string, status: PurchaseOrder['status']) =>
      (await api.patch<ApiResponse<PurchaseOrder>>(`/procurement/purchase-orders/${id}/status`, null, { params: { status } })).data.data!,
    /** How many orders are in each status. */
    summary: async (): Promise<Record<PurchaseOrder['status'], number>> =>
      (await api.get<ApiResponse<Record<PurchaseOrder['status'], number>>>('/procurement/purchase-orders/summary')).data.data!,
  },
  vendors: {
    list: async (p: { page?: number; size?: number; q?: string } = {}) =>
      (await api.get<ApiResponse<PageResponse<Vendor>>>('/vendors', { params: p })).data.data!,
    create: async (d: Partial<Vendor>) => (await api.post<ApiResponse<Vendor>>('/vendors', d)).data.data!,
    get: async (id: string) => (await api.get<ApiResponse<Vendor>>(`/vendors/${id}`)).data.data!,
  },
}
