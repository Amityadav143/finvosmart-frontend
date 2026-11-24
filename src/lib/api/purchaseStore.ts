/*
 * FINVOSMART — Finvosmart by Navgrow
 *
 * Copyright (c) 2025-2026 Navgrow Engineering Service Pvt. Ltd.
 * CIN: U29302WB2025PTC281015
 *
 * All rights reserved. This source code is proprietary and confidential.
 * Unauthorized copying, distribution, modification, or use of this file,
 * via any medium, is strictly prohibited without prior written permission.
 */

import { api } from './client'
import type { ApiResponse, PageResponse } from '@/types'
import type {
  GateEntry, GateEntryInput, GoodsReceipt, MadeOrder, NotBilled, OrderToReceive, PendingLine, Plan, PurchaseReturn, ReceiptInput,
  ReceiptSummary, Rejection, ReturnInput, ReturnSummary, StoreSummary, SupplierName, SupplierRow,
} from '@/types/purchaseStore'

const data = <T,>(r: { data: ApiResponse<T> }) => r.data.data as T

/** The gate register (/procurement/gate-entries). */
export const gateApi = {
  list: async (p: { status?: string; from?: string; to?: string; q?: string; page?: number; size?: number } = {}) =>
    data<PageResponse<GateEntry>>(await api.get('/procurement/gate-entries', { params: p })),
  get: async (id: string) => data<GateEntry>(await api.get(`/procurement/gate-entries/${id}`)),
  create: async (b: GateEntryInput) => data<GateEntry>(await api.post('/procurement/gate-entries', b)),
  update: async (id: string, b: GateEntryInput) => data<GateEntry>(await api.put(`/procurement/gate-entries/${id}`, b)),
  turnAway: async (id: string, note: string) => data<GateEntry>(await api.post(`/procurement/gate-entries/${id}/turn-away`, { note })),
  vehicleOut: async (id: string) => data<GateEntry>(await api.post(`/procurement/gate-entries/${id}/vehicle-out`)),
  cancel: async (id: string, note: string) => data<GateEntry>(await api.post(`/procurement/gate-entries/${id}/cancel`, { note })),
}

/** Goods receipts (/procurement/grns). */
export const grnApi = {
  list: async (p: { status?: string; vendorId?: string; poId?: string; from?: string; to?: string; q?: string; page?: number; size?: number } = {}) =>
    data<PageResponse<ReceiptSummary>>(await api.get('/procurement/grns', { params: p })),
  counts: async () => data<Record<string, number>>(await api.get('/procurement/grns/counts')),
  order: async (poId: string) => data<OrderToReceive>(await api.get(`/procurement/grns/order/${poId}`)),
  get: async (id: string) => data<GoodsReceipt>(await api.get(`/procurement/grns/${id}`)),
  create: async (b: ReceiptInput) => data<GoodsReceipt>(await api.post('/procurement/grns', b)),
  update: async (id: string, b: ReceiptInput) => data<GoodsReceipt>(await api.put(`/procurement/grns/${id}`, b)),
  submit: async (id: string) => data<GoodsReceipt>(await api.post(`/procurement/grns/${id}/submit`)),
  inspect: async (id: string, b: { note?: string | null; lines: { lineId: string; accepted: number; rejected: number; reason?: string | null }[] }) =>
    data<GoodsReceipt>(await api.post(`/procurement/grns/${id}/inspect`, b)),
  cancel: async (id: string, note: string) => data<GoodsReceipt>(await api.post(`/procurement/grns/${id}/cancel`, { note })),
}

/** Returns to suppliers (/procurement/returns). */
export const returnsApi = {
  list: async (p: { grnId?: string; page?: number; size?: number } = {}) => data<PageResponse<ReturnSummary>>(await api.get('/procurement/returns', { params: p })),
  get: async (id: string) => data<PurchaseReturn>(await api.get(`/procurement/returns/${id}`)),
  create: async (b: ReturnInput) => data<PurchaseReturn>(await api.post('/procurement/returns', b)),
  cancel: async (id: string, note: string) => data<PurchaseReturn>(await api.post(`/procurement/returns/${id}/cancel`, { note })),
}

/** The purchase store's page, reports and the reorder planner (/procurement/store). */
export const storeReportsApi = {
  summary: async () => data<StoreSummary>(await api.get('/procurement/store/summary')),
  pending: async (vendorId?: string) => data<PendingLine[]>(await api.get('/procurement/store/pending', { params: { vendorId } })),
  notBilled: async () => data<NotBilled[]>(await api.get('/procurement/store/not-billed')),
  rejections: async (waiting = true) => data<Rejection[]>(await api.get('/procurement/store/rejections', { params: { waiting } })),
  suppliers: async (from?: string, to?: string) => data<SupplierRow[]>(await api.get('/procurement/store/suppliers', { params: { from, to } })),
  /** Suppliers to pick, for roles that don't open the supplier records (the gate, the stores): name, GSTIN and place. */
  supplierNames: async (q?: string, size = 8) => data<SupplierName[]>(await api.get('/procurement/store/supplier-names', { params: { q, size } })),
  plan: async (p: { window?: number; cover?: number; all?: boolean } = {}) => data<Plan>(await api.get('/procurement/store/planner', { params: p })),
  makeOrders: async (b: { expected?: string | null; lines: { itemId: string; vendorId: string; quantity: number; rate: number }[] }) =>
    data<MadeOrder[]>(await api.post('/procurement/store/planner/orders', b)),
}
