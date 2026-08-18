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
import type { ApiResponse, PageResponse, PurchaseOrder, Vendor, GoodsReceiptNote } from '@/types'

export const procurementApi = {
  purchaseOrders: {
    list: async (p: { page?: number; size?: number; status?: string; vendorId?: string } = {}) =>
      (await api.get<ApiResponse<PageResponse<PurchaseOrder>>>('/procurement/purchase-orders', { params: p })).data.data!,
    create: async (d: Partial<PurchaseOrder>) => (await api.post<ApiResponse<PurchaseOrder>>('/procurement/purchase-orders', d)).data.data!,
    updateStatus: async (id: string, status: string) =>
      (await api.patch(`/procurement/purchase-orders/${id}/status`, { status })).data,
    approve: async (id: string) => (await api.post(`/procurement/purchase-orders/${id}/approve`)).data,
  },
  vendors: {
    list: async (p: { page?: number; size?: number; q?: string } = {}) =>
      (await api.get<ApiResponse<PageResponse<Vendor>>>('/vendors', { params: p })).data.data!,
    create: async (d: Partial<Vendor>) => (await api.post<ApiResponse<Vendor>>('/vendors', d)).data.data!,
    get: async (id: string) => (await api.get<ApiResponse<Vendor>>(`/vendors/${id}`)).data.data!,
  },
  grn: {
    list: async (p: { page?: number; size?: number } = {}) =>
      (await api.get<ApiResponse<PageResponse<GoodsReceiptNote>>>('/procurement/grn', { params: p })).data.data!,
    create: async (d: Partial<GoodsReceiptNote>) => (await api.post<ApiResponse<GoodsReceiptNote>>('/procurement/grn', d)).data.data!,
    accept: async (id: string) => (await api.post(`/procurement/grn/${id}/accept`)).data,
    reject: async (id: string, reason: string) => (await api.post(`/procurement/grn/${id}/reject`, { reason })).data,
  },
}
