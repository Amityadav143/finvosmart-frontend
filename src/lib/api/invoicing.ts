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
import type { ApiResponse, PageResponse, Invoice, InvoiceStats, InvoicePaymentRecord, InvoiceType } from '@/types'

export interface InvoiceLineInput {
  itemId?: string; description: string; hsnSacCode?: string; quantity: string | number; unit?: string
  unitPrice: string | number; discountPct?: string | number; gstRate: string | number
}

export interface InvoiceInput {
  invoiceType: InvoiceType; invoiceDate: string; dueDate?: string | null; customerId: string
  customerName?: string; customerGstin?: string; billingAddress?: string; shippingAddress?: string
  placeOfSupply?: string; reverseCharge?: boolean; lineItems: InvoiceLineInput[]
  paymentTerms?: string; notes?: string; terms?: string; discountAmount?: string | number | null; roundOff?: boolean
  customerPoNumber?: string; workOrderNumber?: string; contractNumber?: string; referenceLetterNumber?: string
  ewayBillNumber?: string; lrNumber?: string; dcReferenceNumber?: string; rfqNumber?: string; additionalReference?: string
  /** Tax invoices and credit notes: move the stock of the items on it when issued (default yes) */
  updateStock?: boolean
}

export interface SendInput { email: boolean; to?: string; cc?: string; message?: string; whatsapp: boolean; phone?: string }
export interface SendResult { invoice: Invoice; emailed: boolean; emailedTo?: string; whatsappStatus?: string; payUrl?: string }
export interface PaymentInput { amount: string | number; tdsAmount?: string | number; paymentDate: string; mode: string; reference?: string; notes?: string }

export const invoicingApi = {
  list: async (p: { page?: number; size?: number; status?: string; query?: string; customerId?: string; invoiceType?: string } = {}) =>
    (await api.get<ApiResponse<PageResponse<Invoice>>>('/invoices', { params: p })).data.data!,
  get: async (id: string) => (await api.get<ApiResponse<Invoice>>(`/invoices/${id}`)).data.data!,
  create: async (d: InvoiceInput) => (await api.post<ApiResponse<Invoice>>('/invoices', d)).data.data!,
  update: async (id: string, d: InvoiceInput) => (await api.put<ApiResponse<Invoice>>(`/invoices/${id}`, d)).data.data!,
  issue: async (id: string) => (await api.post<ApiResponse<Invoice>>(`/invoices/${id}/issue`)).data.data!,
  /** The tax invoice for a quotation, proforma or delivery challan, drafted once and linked both ways. */
  convert: async (id: string) => (await api.post<ApiResponse<Invoice>>(`/invoices/${id}/convert`)).data.data!,
  send: async (id: string, d: SendInput) => (await api.post<ApiResponse<SendResult>>(`/invoices/${id}/send`, d)).data.data!,
  remind: async (id: string) => (await api.post<ApiResponse<Record<string, string>>>(`/invoices/${id}/remind`)).data.data!,
  cancel: async (id: string, reason: string) => (await api.post<ApiResponse<Invoice>>(`/invoices/${id}/cancel`, { reason })).data.data!,
  /** Older flow: SENT issues, PAID records a payment for the balance, CANCELLED cancels. */
  updateStatus: async (id: string, status: string) =>
    (await api.patch<ApiResponse<Invoice>>(`/invoices/${id}/status`, null, { params: { status } })).data.data!,
  stats: async (): Promise<InvoiceStats> => (await api.get<ApiResponse<InvoiceStats>>('/invoices/dashboard/stats')).data.data!,
  pdf: async (id: string, download = false) =>
    (await api.get(`/invoices/${id}/pdf`, { params: download ? { download: true } : {}, responseType: 'blob' })).data as Blob,
  /** Kept for older callers. */
  download: async (id: string) => api.get(`/invoices/${id}/pdf`, { params: { download: true }, responseType: 'blob' }),
  payments: async (id: string) => (await api.get<ApiResponse<InvoicePaymentRecord[]>>(`/invoices/${id}/payments`)).data.data ?? [],
  recordPayment: async (id: string, d: PaymentInput) =>
    (await api.post<ApiResponse<InvoicePaymentRecord>>(`/invoices/${id}/payments`, d)).data.data!,
  voidPayment: async (paymentId: string, reason: string) =>
    (await api.post<ApiResponse<InvoicePaymentRecord>>(`/invoices/payments/${paymentId}/void`, { reason })).data.data!,
  paymentLink: async (id: string) => (await api.post<ApiResponse<{ url: string }>>(`/invoices/${id}/payment-link`)).data.data!.url,
  sendWhatsApp: async (invoiceId: string, phone: string) =>
    (await api.post('/whatsapp/invoices/send', { invoiceId, recipientPhone: phone, includePaymentLink: true })).data,
}

export interface CompanyPaymentSettings {
  upiId?: string; upiPayeeName?: string; bankName?: string; bankAccountName?: string; bankAccountNumber?: string
  bankIfsc?: string; bankBranch?: string; udyamNumber?: string; msmeCategory?: string; msmeActivity?: string
  defaultPaymentTerms?: string; invoiceTerms?: string; invoiceNotes?: string; remindersEnabled?: boolean
  msmeNotePreview?: string
  razorpay?: { connected: boolean; keyId?: string; webhookSecretSet: boolean; webhookUrl: string; webhookEvents: string; encryptionReady: boolean }
}

export const companyPaymentsApi = {
  get: async () => (await api.get<ApiResponse<CompanyPaymentSettings>>('/admin/company/payments')).data.data!,
  save: async (d: CompanyPaymentSettings) => (await api.put<ApiResponse<CompanyPaymentSettings>>('/admin/company/payments', d)).data.data!,
  connectRazorpay: async (d: { keyId: string; keySecret?: string; webhookSecret?: string }) =>
    (await api.put<ApiResponse<CompanyPaymentSettings['razorpay']>>('/admin/company/payments/razorpay', d)).data.data!,
  disconnectRazorpay: async () => (await api.delete<ApiResponse<CompanyPaymentSettings['razorpay']>>('/admin/company/payments/razorpay')).data.data!,
}
