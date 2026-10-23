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
import type { Bill, BillType, ItcLineStatus, ItcStatus } from '@/types/purchases'
import { apiError } from './apiError'

export const BILL_TYPE_LABEL: Record<BillType, string> = { BILL: 'Bill', EXPENSE: 'Expense', CREDIT_NOTE: 'Supplier credit note', OPENING_BALANCE: 'Unpaid from before (opening balance)' }

/** Status as people say it; credit notes are "used" rather than "paid". */
export function billStatusLabel(b: Pick<Bill, 'status' | 'billType'> & { daysOverdue?: number | null }): string {
  if (b.billType === 'CREDIT_NOTE') return ({ DRAFT: 'Draft', OPEN: 'Not used yet', PARTIAL: 'Partly used', PAID: 'Used', CANCELLED: 'Cancelled' } as const)[b.status]
  if ((b.status === 'OPEN' || b.status === 'PARTIAL') && (b.daysOverdue ?? 0) > 0) return 'Overdue'
  return ({ DRAFT: 'Draft', OPEN: 'Unpaid', PARTIAL: 'Part paid', PAID: 'Paid', CANCELLED: 'Cancelled' } as const)[b.status]
}

/** Maps a bill to an existing badge style. */
export function billBadge(b: Pick<Bill, 'status' | 'billType'> & { daysOverdue?: number | null }): string {
  if ((b.status === 'OPEN' || b.status === 'PARTIAL') && b.billType !== 'CREDIT_NOTE' && (b.daysOverdue ?? 0) > 0) return 'OVERDUE'
  return ({ DRAFT: 'DRAFT', OPEN: 'SENT', PARTIAL: 'PARTIAL', PAID: 'PAID', CANCELLED: 'CANCELLED' } as const)[b.status]
}

/** Kinds of payment that carry TDS — the usual rate, and when it applies (limits for 2025-26 and 2026-27). */
export const TDS_NATURES: { value: string; label: string; hint: string }[] = [
  { value: '', label: 'No TDS', hint: '' },
  { value: 'CONTRACTOR', label: 'Contractor (194C)', hint: '1% individual/HUF, 2% others · over ₹30,000 a bill or ₹1,00,000 a year' },
  { value: 'PROFESSIONAL', label: 'Professional fees (194J)', hint: '10% · over ₹50,000 a year' },
  { value: 'TECHNICAL', label: 'Technical services (194J)', hint: '2% · over ₹50,000 a year' },
  { value: 'RENT_BUILDING', label: 'Rent — land, building, furniture (194-I)', hint: '10% · rent over ₹50,000 a month' },
  { value: 'RENT_MACHINERY', label: 'Rent — plant, machinery (194-I)', hint: '2% · rent over ₹50,000 a month' },
  { value: 'COMMISSION', label: 'Commission / brokerage (194H)', hint: '2% · over ₹20,000 a year' },
  { value: 'GOODS', label: 'Purchase of goods (194Q)', hint: '0.1% on purchases above ₹50 lakh a year · only if your turnover was over ₹10 crore' },
]
export const tdsLabel = (v?: string | null) => TDS_NATURES.find(n => n.value === (v ?? ''))?.label ?? v ?? ''

export const MSME_CATEGORIES = [{ value: 'MICRO', label: 'Micro' }, { value: 'SMALL', label: 'Small' }, { value: 'MEDIUM', label: 'Medium' }]
export const MSME_ACTIVITIES = [{ value: 'MANUFACTURING', label: 'Manufacturing' }, { value: 'SERVICES', label: 'Services' }, { value: 'TRADING', label: 'Trading' }]
/** Micro and small enterprises in manufacturing or services must be paid within 45 days (MSMED Act, Section 15). */
export const msmeCovered = (category?: string | null, activity?: string | null) =>
  !!category && ['MICRO', 'SMALL'].includes(category.toUpperCase()) && (activity ?? '').toUpperCase() !== 'TRADING'

export const ITC_STATUS: Record<ItcStatus, { label: string; color: string }> = {
  NOT_CHECKED: { label: 'Not checked yet', color: '#64748b' },
  MATCHED: { label: 'On GSTR-2B', color: '#16a34a' },
  MISMATCH: { label: 'Differs on GSTR-2B', color: '#d97706' },
  NOT_IN_2B: { label: 'Not on GSTR-2B yet', color: '#dc2626' },
  NOT_AVAILABLE: { label: 'No credit available', color: '#dc2626' },
  NA: { label: 'No GST credit', color: '#64748b' },
}

export const ITC_LINE: Record<ItcLineStatus, { label: string; color: string; help: string }> = {
  MISMATCH: { label: 'Mismatch', color: '#d97706', help: 'Found, but the amounts or kind of tax differ' },
  ONLY_IN_2B: { label: 'Not in your books', color: '#2563eb', help: 'The supplier reported it; you have no bill' },
  ONLY_IN_BOOKS: { label: 'Not on GSTR-2B', color: '#dc2626', help: 'Your bill, not reported by the supplier yet' },
  PROBABLE: { label: 'Probable match', color: '#0d9488', help: 'Same supplier and amounts, number written differently' },
  NOT_AVAILABLE: { label: 'No credit', color: '#dc2626', help: 'GSTR-2B says credit is not available' },
  MATCHED: { label: 'Matched', color: '#16a34a', help: 'Same supplier, number and amounts' },
  OTHER: { label: 'Other credit', color: '#64748b', help: 'Imports and credit from your Input Service Distributor' },
}

export const IMS_LABEL: Record<string, { label: string; color: string }> = {
  ACCEPT: { label: 'Accept', color: '#16a34a' }, REJECT: { label: 'Reject', color: '#dc2626' }, PENDING: { label: 'Keep pending', color: '#d97706' },
}

/** "092026" ⇄ "2026-09" (month inputs) and "Sep 2026". */
export const periodToMonth = (p: string) => `${p.slice(2)}-${p.slice(0, 2)}`
export const monthToPeriod = (m: string) => `${m.slice(5, 7)}${m.slice(0, 4)}`
export const periodLabel = (p: string) => new Date(`${p.slice(2)}-${p.slice(0, 2)}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })

/** 1 April of the Indian financial year a date falls in. */
export const fyStart = (iso: string) => {
  const y = Number(iso.slice(0, 4)), m = Number(iso.slice(5, 7))
  return `${m >= 4 ? y : y - 1}-04-01`
}

/** First and last day of the financial-year quarter a date falls in. */
export function quarterOf(iso: string): { from: string; to: string; label: string } {
  const y = Number(iso.slice(0, 4)), m = Number(iso.slice(5, 7))
  const startMonth = m >= 4 && m <= 6 ? 4 : m >= 7 && m <= 9 ? 7 : m >= 10 ? 10 : 1
  const from = `${y}-${String(startMonth).padStart(2, '0')}-01`
  const end = new Date(Date.UTC(y, startMonth - 1 + 3, 0))
  const to = end.toISOString().slice(0, 10)
  const fy = m >= 4 ? y : y - 1
  const q = startMonth === 4 ? 1 : startMonth === 7 ? 2 : startMonth === 10 ? 3 : 4
  return { from, to, label: `Q${q} ${fy}-${String((fy + 1) % 100).padStart(2, '0')}` }
}

export const addDays = (iso: string, days: number) => {
  const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10)
}
export const daysBetween = (a: string, b: string) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000)

/** Credit days in payment terms such as "Net 30" or "Due on receipt" (null when the terms don't say). */
export function termsDays(terms?: string | null): number | null {
  if (!terms) return null
  const t = terms.toLowerCase()
  if (t.includes('receipt') || t.includes('immediate') || t === 'cash' || t === 'advance') return 0
  const net = t.match(/net\s*-?\s*(\d{1,3})/)          // "2/10 net 30" → 30
  if (net) return Number(net[1])
  const m = t.match(/(\d{1,3})/)
  return m ? Number(m[1]) : null
}

/** The MSMED Act pay-by date: acceptance + agreed days (at most 45), or + 15 days with no agreement. */
export function msmePayBy(acceptance: string, agreedDays: number | null): string {
  return addDays(acceptance, agreedDays === null ? 15 : Math.max(0, Math.min(agreedDays, 45)))
}

export const errText = (e: any, fallback: string) => apiError(e, fallback)
