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
  CataloguePage, DocSummary, Godown, GodownInput, GodownStockPage, HeldBill, ItemPlaces, LineInput, MaterialIssue, MaterialRequest,
  OrderPage, Pay, Picture, PosBill, PosCustomer, PosItem, PosQuote, PosRegister, PosSession, PosState, Receipt, ShiftReport, ShopOrder,
  ShopSettings, ShopSettingsInput, StockCount, Transfer,
} from '@/types/store'

const data = <T,>(r: { data: ApiResponse<T> }) => r.data.data as T

/** Godowns and the stock in each (/godowns), transfers, material requests and issues, stock counts. */
export const godownsApi = {
  list: async (): Promise<Godown[]> => data(await api.get<ApiResponse<Godown[]>>('/godowns')) ?? [],
  create: async (g: GodownInput) => data(await api.post<ApiResponse<Godown>>('/godowns', g)),
  update: async (id: string, g: GodownInput) => data(await api.put<ApiResponse<Godown>>(`/godowns/${id}`, g)),
  setActive: async (id: string, on: boolean) => data(await api.post<ApiResponse<Godown>>(`/godowns/${id}/active`, null, { params: { on } })),
  stock: async (p: { q?: string; category?: string; page?: number; size?: number } = {}) =>
    data(await api.get<ApiResponse<GodownStockPage>>('/godowns/stock', { params: p })),
  item: async (itemId: string) => data(await api.get<ApiResponse<ItemPlaces>>(`/godowns/stock/${itemId}`)),
  adjust: async (godownId: string, body: { itemId: string; type: 'IN' | 'OUT' | 'ADJUSTMENT'; quantity: number; batchId?: string | null;
                  batchNo?: string; expiry?: string | null; mrp?: number | null; reference?: string; remarks?: string }) =>
    data(await api.post<ApiResponse<ItemPlaces>>(`/godowns/${godownId}/adjust`, body)),
}

export const transfersApi = {
  list: async (p: { godownId?: string; page?: number; size?: number } = {}) =>
    data(await api.get<ApiResponse<PageResponse<DocSummary>>>('/stock-transfers', { params: p })),
  get: async (id: string) => data(await api.get<ApiResponse<Transfer>>(`/stock-transfers/${id}`)),
  create: async (body: { fromGodownId: string; toGodownId: string; date?: string; vehicleNo?: string; notes?: string; lines: LineInput[] }) =>
    data(await api.post<ApiResponse<Transfer>>('/stock-transfers', body)),
  cancel: async (id: string, reason: string) => data(await api.post<ApiResponse<Transfer>>(`/stock-transfers/${id}/cancel`, { reason })),
}

export const materialApi = {
  requests: async (p: { status?: string; mine?: boolean; page?: number; size?: number } = {}) =>
    data(await api.get<ApiResponse<PageResponse<DocSummary>>>('/material-requests', { params: p })),
  request: async (id: string) => data(await api.get<ApiResponse<MaterialRequest>>(`/material-requests/${id}`)),
  ask: async (body: { neededBy?: string | null; departmentId?: string | null; godownId?: string | null; purpose?: string; lines: LineInput[] }) =>
    data(await api.post<ApiResponse<MaterialRequest>>('/material-requests', body)),
  approve: async (id: string, note?: string) => data(await api.post<ApiResponse<MaterialRequest>>(`/material-requests/${id}/approve`, { note })),
  reject: async (id: string, note: string) => data(await api.post<ApiResponse<MaterialRequest>>(`/material-requests/${id}/reject`, { note })),
  cancel: async (id: string) => data(await api.post<ApiResponse<MaterialRequest>>(`/material-requests/${id}/cancel`)),
  close: async (id: string) => data(await api.post<ApiResponse<MaterialRequest>>(`/material-requests/${id}/close`)),
  issues: async (p: { kind?: string; page?: number; size?: number } = {}) =>
    data(await api.get<ApiResponse<PageResponse<DocSummary>>>('/material-issues', { params: p })),
  issue: async (id: string) => data(await api.get<ApiResponse<MaterialIssue>>(`/material-issues/${id}`)),
  give: async (body: { kind: 'ISSUE' | 'RETURN'; godownId: string; requestId?: string | null; departmentId?: string | null; issuedTo?: string;
                purpose?: string; date?: string; lines: LineInput[] }) => data(await api.post<ApiResponse<MaterialIssue>>('/material-issues', body)),
  cancelIssue: async (id: string, reason: string) => data(await api.post<ApiResponse<MaterialIssue>>(`/material-issues/${id}/cancel`, { reason })),
}

export const countsApi = {
  list: async (p: { page?: number; size?: number } = {}) => data(await api.get<ApiResponse<PageResponse<DocSummary>>>('/stock-counts', { params: p })),
  get: async (id: string) => data(await api.get<ApiResponse<StockCount>>(`/stock-counts/${id}`)),
  start: async (body: { godownId: string; category?: string | null; date?: string; notes?: string }) =>
    data(await api.post<ApiResponse<StockCount>>('/stock-counts', body)),
  record: async (id: string, counted: { lineId: string; counted: number | null }[]) =>
    data(await api.put<ApiResponse<StockCount>>(`/stock-counts/${id}/lines`, counted)),
  addLine: async (id: string, itemId: string, batchId?: string | null) =>
    data(await api.post<ApiResponse<StockCount>>(`/stock-counts/${id}/lines`, { itemId, batchId: batchId ?? null })),
  post: async (id: string) => data(await api.post<ApiResponse<StockCount>>(`/stock-counts/${id}/post`)),
  cancel: async (id: string) => data(await api.post<ApiResponse<StockCount>>(`/stock-counts/${id}/cancel`)),
}

/** A counter bill as sent: the cart, the customer (none: walk-in), and how it is paid. */
export interface SaleBody {
  sessionId: string; clientRef: string
  customer?: { id?: string; name?: string; phone?: string; gstin?: string; email?: string } | null
  lines: { itemId: string; quantity: number; price?: number; discountPct?: number }[]
  billDiscount?: number; payments: Pay[]
  prescription?: { patientName?: string; prescriberName?: string; prescriberAddress?: string; prescriberRegNo?: string; reference?: string; date?: string } | null
  notes?: string
}

/** Counter billing (/pos). */
export const posApi = {
  state: async () => data(await api.get<ApiResponse<PosState>>('/pos/state')),
  registers: async (): Promise<PosRegister[]> => data(await api.get<ApiResponse<PosRegister[]>>('/pos/registers')) ?? [],
  addRegister: async (r: { name: string; godownId?: string | null; receiptWidth?: number; receiptFooter?: string; active?: boolean }) =>
    data(await api.post<ApiResponse<PosRegister>>('/pos/registers', r)),
  saveRegister: async (id: string, r: { name: string; godownId?: string | null; receiptWidth?: number; receiptFooter?: string; active?: boolean }) =>
    data(await api.put<ApiResponse<PosRegister>>(`/pos/registers/${id}`, r)),
  open: async (registerId: string, openingCash: number) => data(await api.post<ApiResponse<PosSession>>('/pos/sessions', { registerId, openingCash })),
  sessions: async (p: { registerId?: string; mine?: boolean; page?: number; size?: number } = {}) =>
    data(await api.get<ApiResponse<PageResponse<PosSession>>>('/pos/sessions', { params: p })),
  report: async (id: string) => data(await api.get<ApiResponse<ShiftReport>>(`/pos/sessions/${id}/report`)),
  cash: async (id: string, direction: 'IN' | 'OUT', amount: number, reason: string) =>
    data(await api.post<ApiResponse<ShiftReport>>(`/pos/sessions/${id}/cash`, { direction, amount, reason })),
  close: async (id: string, countedCash: number, note?: string) => data(await api.post<ApiResponse<ShiftReport>>(`/pos/sessions/${id}/close`, { countedCash, note })),
  items: async (registerId: string, q?: string): Promise<PosItem[]> => data(await api.get<ApiResponse<PosItem[]>>('/pos/items', { params: { registerId, q } })) ?? [],
  byCode: async (registerId: string, code: string) => data(await api.get<ApiResponse<PosItem>>('/pos/items/code', { params: { registerId, code } })),
  customers: async (q: string): Promise<PosCustomer[]> => data(await api.get<ApiResponse<PosCustomer[]>>('/pos/customers', { params: { q } })) ?? [],
  /** The company's UPI QR code for an amount, as SVG text. */
  upiQr: async (amount: number, note?: string) => (await api.get<string>('/pos/upi-qr.svg', { params: { amount, note }, responseType: 'text' })).data,
  /** What the bill will come to, worked out as the bill itself is (nothing is saved). */
  quote: async (body: Omit<SaleBody, 'clientRef' | 'payments'>) => data(await api.post<ApiResponse<PosQuote>>('/pos/quote', { ...body, payments: [] })),
  sell: async (body: SaleBody) => data(await api.post<ApiResponse<Receipt>>('/pos/sales', body)),
  giveBack: async (body: { sessionId: string; clientRef: string; saleId: string; lines: { lineId: string; quantity: number }[];
                    refunds: { mode: Pay['mode']; amount: number | null; reference?: string | null }[]; reason: string }) =>
    data(await api.post<ApiResponse<Receipt>>('/pos/returns', body)),
  bills: async (p: { sessionId?: string; q?: string; page?: number; size?: number } = {}) =>
    data(await api.get<ApiResponse<PageResponse<import('@/types/store').BillRow>>>('/pos/bills', { params: p })),
  find: async (number: string) => data(await api.get<ApiResponse<PosBill>>('/pos/bills/find', { params: { number } })),
  receipt: async (saleId: string) => data(await api.get<ApiResponse<Receipt>>(`/pos/bills/${saleId}/receipt`)),
  held: async (registerId: string): Promise<HeldBill[]> => data(await api.get<ApiResponse<HeldBill[]>>('/pos/held', { params: { registerId } })) ?? [],
  hold: async (registerId: string, label: string, cart: string) => data(await api.post<ApiResponse<HeldBill>>('/pos/held', { registerId, label, cart })),
  dropHeld: async (id: string) => { await api.delete(`/pos/held/${id}`) },
}

/** The online store, as the shop runs it (/shop). */
export const shopApi = {
  settings: async () => data(await api.get<ApiResponse<ShopSettings>>('/shop/settings')),
  save: async (s: ShopSettingsInput) => data(await api.put<ApiResponse<ShopSettings>>('/shop/settings', s)),
  logo: async (file: File) => {
    const f = new FormData(); f.append('file', file)
    return data(await api.post<ApiResponse<ShopSettings>>('/shop/logo', f, { headers: { 'Content-Type': 'multipart/form-data' } }))
  },
  noLogo: async () => data(await api.delete<ApiResponse<ShopSettings>>('/shop/logo')),
  /** The store's link as a QR code, as SVG text. */
  qr: async () => (await api.get<string>('/shop/qr.svg', { responseType: 'text' })).data,
  catalogue: async (p: { q?: string; published?: boolean; page?: number; size?: number } = {}) =>
    data(await api.get<ApiResponse<CataloguePage>>('/shop/catalogue', { params: p })),
  publish: async (itemIds: string[], published: boolean, featured?: boolean) =>
    data(await api.post<ApiResponse<{ items: number }>>('/shop/catalogue/publish', { itemIds, published, featured })),
  pictures: async (itemId: string): Promise<Picture[]> => data(await api.get<ApiResponse<Picture[]>>(`/shop/items/${itemId}/pictures`)) ?? [],
  addPicture: async (itemId: string, file: File) => {
    const f = new FormData(); f.append('file', file)
    return data(await api.post<ApiResponse<Picture[]>>(`/shop/items/${itemId}/pictures`, f, { headers: { 'Content-Type': 'multipart/form-data' } })) ?? []
  },
  orderPictures: async (itemId: string, order: string[]) => data(await api.put<ApiResponse<Picture[]>>(`/shop/items/${itemId}/pictures`, order)) ?? [],
  deletePicture: async (id: string) => { await api.delete(`/shop/pictures/${id}`) },
  /** A photo of one of the company's items, as an object URL (the request carries the session, so <img src> can't fetch it). */
  pictureUrl: async (id: string, thumb = true) => URL.createObjectURL((await api.get(`/shop/pictures/${id}`, { params: { thumb }, responseType: 'blob' })).data),
  orders: async (p: { status?: string; q?: string; page?: number; size?: number } = {}) =>
    data(await api.get<ApiResponse<OrderPage>>('/shop/orders', { params: p })),
  order: async (id: string) => data(await api.get<ApiResponse<ShopOrder>>(`/shop/orders/${id}`)),
  step: async (id: string, action: string, note?: string) => data(await api.post<ApiResponse<ShopOrder>>(`/shop/orders/${id}/step`, { action, note })),
  invoice: async (id: string) => data(await api.post<ApiResponse<ShopOrder>>(`/shop/orders/${id}/invoice`)),
}
