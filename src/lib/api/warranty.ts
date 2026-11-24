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
import type { ClaimCounts, ClaimDocument, ClaimItem, ClaimKind, ClaimParty, ClaimStart, ClaimSummary, NewClaimInput, Resolution, WarrantyClaim } from '@/types/warranty'

const data = <T,>(r: { data: ApiResponse<T> }) => r.data.data as T
const one = (r: { data: ApiResponse<WarrantyClaim> }) => data<WarrantyClaim>(r)

/** Warranty claims (/warranty-claims): from customers and on suppliers. */
export const warrantyApi = {
  list: async (p: { kind: ClaimKind; status?: string; q?: string; partyId?: string; itemId?: string; page?: number; size?: number }) =>
    data<PageResponse<ClaimSummary>>(await api.get('/warranty-claims', { params: p })),
  counts: async () => data<ClaimCounts>(await api.get('/warranty-claims/counts')),
  document: async (kind: 'invoice' | 'receipt', id: string) => data<ClaimDocument>(await api.get('/warranty-claims/document', { params: { kind, id } })),
  documents: async (kind: 'invoice' | 'receipt', q: string) => data<ClaimDocument[]>(await api.get('/warranty-claims/documents', { params: { kind, q } })),
  parties: async (kind: ClaimKind, q: string) => data<ClaimParty[]>(await api.get('/warranty-claims/parties', { params: { kind, q } })),
  items: async (q: string) => data<ClaimItem[]>(await api.get('/warranty-claims/items', { params: { q } })),
  start: async (p: { invoiceLineId?: string; grnLineId?: string; parentClaimId?: string }) =>
    data<ClaimStart>(await api.get('/warranty-claims/start', { params: p })),
  get: async (id: string) => data<WarrantyClaim>(await api.get(`/warranty-claims/${id}`)),
  create: async (b: NewClaimInput) => data<WarrantyClaim>(await api.post('/warranty-claims', b)),
  approve: async (id: string, b: { resolution: Resolution; note?: string | null; goodwill?: boolean }) => one(await api.post(`/warranty-claims/${id}/approve`, b)),
  reject: async (id: string, note: string) => one(await api.post(`/warranty-claims/${id}/reject`, { note })),
  reopen: async (id: string, note?: string) => one(await api.post(`/warranty-claims/${id}/reopen`, { note })),
  receive: async (id: string, b: { date?: string | null; receivedWith?: string | null }) => one(await api.post(`/warranty-claims/${id}/receive`, b)),
  returned: async (id: string, b: { date?: string | null; note?: string | null }) => one(await api.post(`/warranty-claims/${id}/returned`, b)),
  replace: async (id: string, b: { godownId?: string | null; itemId?: string | null; batchId?: string | null; serial?: string | null; date?: string | null; note?: string | null }) =>
    one(await api.post(`/warranty-claims/${id}/replace`, b)),
  send: async (id: string, b: { date?: string | null; vehicleNo?: string | null; transporter?: string | null; lrNumber?: string | null; ewayBillNo?: string | null; note?: string | null }) =>
    one(await api.post(`/warranty-claims/${id}/send`, b)),
  accept: async (id: string, b: { resolution: Resolution; acceptedValue?: number | null; note?: string | null }) => one(await api.post(`/warranty-claims/${id}/accept`, b)),
  appeal: async (id: string, note: string) => one(await api.post(`/warranty-claims/${id}/appeal`, { note })),
  goodsBack: async (id: string, b: { date?: string | null; intoStock?: boolean; godownId?: string | null; batchNo?: string | null; expiry?: string | null; serial?: string | null; note?: string | null }) =>
    one(await api.post(`/warranty-claims/${id}/goods-back`, b)),
  close: async (id: string, b: { note: string; backIntoStock?: boolean; godownId?: string | null; batchNo?: string | null; expiry?: string | null }) => one(await api.post(`/warranty-claims/${id}/close`, b)),
  cancel: async (id: string, note: string) => one(await api.post(`/warranty-claims/${id}/cancel`, { note })),
}
