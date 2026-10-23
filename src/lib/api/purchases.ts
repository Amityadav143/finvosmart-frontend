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
import type { ApiResponse, PageResponse, Vendor } from '@/types'
import type {
  AccountOption, Bill, BillInput, BillPaymentRecord, ItcDocument, ItcReport, ItcStatement, PayablesSummary,
  TdsNatureInfo, TdsRegister, TdsSuggestion,
} from '@/types/purchases'

const data = <T,>(r: { data: ApiResponse<T> }) => r.data.data as T

/** Downloads a file the API returns (CSV) under the given name. */
export async function download(path: string, params: Record<string, any>, fileName: string) {
  const res = await api.get(path, { params, responseType: 'blob' })
  const url = URL.createObjectURL(res.data)
  const a = document.createElement('a'); a.href = url; a.download = fileName; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const billsApi = {
  list: async (p: { page?: number; size?: number; type?: string; status?: string; vendorId?: string; from?: string; to?: string; unpaid?: boolean; overdue?: boolean; q?: string } = {}) =>
    data<PageResponse<Bill>>(await api.get('/bills', { params: p })),
  get: async (id: string) => data<Bill>(await api.get(`/bills/${id}`)),
  create: async (b: BillInput) => data<Bill>(await api.post('/bills', b)),
  update: async (id: string, b: BillInput) => data<Bill>(await api.put(`/bills/${id}`, b)),
  record: async (id: string) => data<Bill>(await api.post(`/bills/${id}/record`)),
  cancel: async (id: string, reason: string) => data<Bill>(await api.post(`/bills/${id}/cancel`, { reason })),
  remove: async (id: string) => api.delete(`/bills/${id}`),
  payments: async (id: string) => data<BillPaymentRecord[]>(await api.get(`/bills/${id}/payments`)),
  pay: async (id: string, p: { amount: string | number; paymentDate: string; mode: string; reference?: string; notes?: string }) =>
    data<BillPaymentRecord>(await api.post(`/bills/${id}/payments`, p)),
  applyCredit: async (id: string, p: { creditNoteId: string; amount?: string | number | null; date?: string }) =>
    data<BillPaymentRecord>(await api.post(`/bills/${id}/apply-credit`, p)),
  voidPayment: async (paymentId: string, reason: string) => data<BillPaymentRecord>(await api.post(`/bills/payments/${paymentId}/void`, { reason })),
  openCreditNotes: async (id: string) => data<Bill[]>(await api.get(`/bills/${id}/credit-notes`)),
  tdsSuggestion: async (p: { vendorId?: string; nature?: string; taxable: string | number; billDate?: string; billId?: string }) =>
    data<TdsSuggestion>(await api.get('/bills/tds-suggestion', { params: p })),
  accounts: async () => data<AccountOption[]>(await api.get('/bills/accounts')),
  exportCsv: (from: string, to: string) => download('/bills/export/csv', { from, to }, `purchases_${from}_to_${to}.csv`),
}

export const payablesApi = {
  summary: async () => data<PayablesSummary>(await api.get('/payables/summary')),
  msmeCsv: (from?: string, to?: string) => download('/payables/msme/csv', { from, to }, `msme_payments_${to ?? 'today'}.csv`),
}

export type VendorInput = Partial<Omit<Vendor, 'id' | 'outstanding' | 'vendorCode'>>

export const vendorsApi = {
  list: async (p: { page?: number; size?: number; q?: string } = {}) => data<PageResponse<Vendor>>(await api.get('/vendors', { params: p })),
  get: async (id: string) => data<Vendor>(await api.get(`/vendors/${id}`)),
  byGstin: async (gstin: string) => data<Vendor>(await api.get(`/vendors/by-gstin/${encodeURIComponent(gstin)}`)),
  create: async (v: VendorInput) => data<Vendor>(await api.post('/vendors', v)),
  update: async (id: string, v: VendorInput) => data<Vendor>(await api.put(`/vendors/${id}`, v)),
}

export const itcApi = {
  upload: async (files: File[]) => {
    const form = new FormData()
    files.forEach(f => form.append('files', f))
    return data<ItcReport>(await api.post('/gst/itc/gstr2b', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }))
  },
  statements: async () => data<ItcStatement[]>(await api.get('/gst/itc/gstr2b')),
  report: async (period: string) => data<ItcReport>(await api.get(`/gst/itc/gstr2b/${period}`)),
  recheck: async (period: string) => data<ItcReport>(await api.post(`/gst/itc/gstr2b/${period}/recheck`)),
  remove: async (period: string) => api.delete(`/gst/itc/gstr2b/${period}`),
  csv: (period: string) => download(`/gst/itc/gstr2b/${period}/csv`, {}, `itc_check_${period}.csv`),
  document: async (id: string) => data<ItcDocument>(await api.get(`/gst/itc/documents/${id}`)),
}

export const tdsRegisterApi = {
  register: async (from?: string, to?: string) => data<TdsRegister>(await api.get('/tds/register', { params: { from, to } })),
  csv: (from: string, to: string) => download('/tds/register/csv', { from, to }, `tds_register_${from}_to_${to}.csv`),
  natures: async () => data<TdsNatureInfo[]>(await api.get('/tds/natures')),
}
