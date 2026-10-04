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
import type { ApiResponse, PageResponse, Invoice, InvoiceStats } from '@/types'

export const invoicingApi = {
  list: async (p: { page?: number; size?: number; status?: string; query?: string; customerId?: string; invoiceType?: string } = {}) =>
    (await api.get<ApiResponse<PageResponse<Invoice>>>('/invoices', { params: p })).data.data!,
  get: async (id: string) => (await api.get<ApiResponse<Invoice>>(`/invoices/${id}`)).data.data!,
  create: async (d: Partial<Invoice>) => (await api.post<ApiResponse<Invoice>>('/invoices', d)).data.data!,
  updateStatus: async (id: string, status: string) =>
    (await api.patch<ApiResponse<Invoice>>(`/invoices/${id}/status`, null, { params: { status } })).data.data!,
  stats: async (): Promise<InvoiceStats> => (await api.get<ApiResponse<InvoiceStats>>('/invoices/dashboard/stats')).data.data!,
  sendWhatsApp: async (invoiceId: string, phone: string) =>
    (await api.post('/whatsapp/invoices/send', { invoiceId, recipientPhone: phone, includePaymentLink: true })).data,
  download: async (id: string) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
}
