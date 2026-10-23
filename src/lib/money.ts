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
import { GST_STATES } from '@/lib/gstin'

/** "₹12,34,567.80" — amounts to the paisa (invoices, payments). Accepts numbers or decimal strings. */
export function inr(x: string | number | null | undefined): string {
  if (x === null || x === undefined || x === '') return '—'
  const n = Number(x)
  if (!isFinite(n)) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

/** States and union territories for "place of supply", by name (codes that are no longer used are left out). */
export const PLACES_OF_SUPPLY: { code: string; name: string }[] = Object.entries(GST_STATES)
  .filter(([code]) => !['25', '28', '97', '99'].includes(code))
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name))

export const stateName = (code?: string | null) => (code && GST_STATES[code]) || ''

/** Today in India as YYYY-MM-DD (not the browser's or UTC date). */
export const todayIST = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

/** GST rates: the slabs from 22 Sep 2025 (0, 5, 18, 40), special rates, and older rates for notes against earlier invoices. */
export const GST_RATE_OPTIONS = [
  { value: '0', label: '0% — nil / exempt' }, { value: '0.25', label: '0.25% — rough stones' }, { value: '3', label: '3% — gold, silver' },
  { value: '5', label: '5%' }, { value: '18', label: '18%' }, { value: '40', label: '40% — luxury / sin goods' },
  { value: '12', label: '12% (rate before 22 Sep 2025)' }, { value: '28', label: '28%' },
]

export const PAYMENT_MODES = [
  { value: 'UPI', label: 'UPI' }, { value: 'NEFT', label: 'NEFT' }, { value: 'RTGS', label: 'RTGS' }, { value: 'IMPS', label: 'IMPS' },
  { value: 'CHEQUE', label: 'Cheque' }, { value: 'CASH', label: 'Cash' }, { value: 'CARD', label: 'Card' },
  { value: 'NET_BANKING', label: 'Net banking' }, { value: 'OTHER', label: 'Other' },
]

export const DOC_LABEL: Record<string, string> = {
  TAX_INVOICE: 'Tax invoice', PROFORMA: 'Proforma invoice', QUOTATION: 'Quotation', CREDIT_NOTE: 'Credit note',
  DEBIT_NOTE: 'Debit note', DELIVERY_CHALLAN: 'Delivery challan', OPENING_BALANCE: 'Unpaid from before (opening balance)',
}

export const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft', SENT: 'Sent', VIEWED: 'Viewed', PARTIAL: 'Part paid', PAID: 'Paid', OVERDUE: 'Overdue', CANCELLED: 'Cancelled',
}
