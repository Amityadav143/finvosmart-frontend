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
import type { ApiResponse } from '@/types'
import { download } from './purchases'

const data = <T,>(r: { data: ApiResponse<T> }) => r.data.data as T

export type StatementSide = 'customer' | 'supplier'
type Amount = number | string

export interface StatementLine {
  date: string
  kind: 'INVOICE' | 'DEBIT_NOTE' | 'CREDIT_NOTE' | 'OPENING' | 'PAYMENT' | 'TDS' | 'REFUND' | 'BILL' | 'EXPENSE' | string
  number?: string | null
  description?: string | null
  up: Amount
  down: Amount
  balance: Amount
  link?: string | null
}

/** StatementService.View */
export interface StatementView {
  side: StatementSide
  party: { id: string; name: string; code?: string | null; gstin?: string | null; email?: string | null; phone?: string | null; address: string[] }
  statement: { from: string; to: string; opening: Amount; lines: StatementLine[]; totalUp: Amount; totalDown: Amount; closing: Amount }
  ageing: Record<string, Amount>
  upLabel: string
  downLabel: string
  balanceNote: string
  preparedOn: string
}

const base = (side: StatementSide, id: string) => `/statements/${side === 'customer' ? 'customers' : 'suppliers'}/${id}`

export const statementsApi = {
  get: async (side: StatementSide, id: string, from?: string, to?: string) => data<StatementView>(await api.get(base(side, id), { params: { from, to } })),
  pdf: (side: StatementSide, id: string, from: string, to: string, name: string) =>
    download(`${base(side, id)}/pdf`, { from, to }, `Statement_${name.replace(/[^A-Za-z0-9]+/g, '_')}_${from}_to_${to}.pdf`),
  email: async (id: string, from: string, to: string, body: { to?: string; cc?: string; message?: string }) =>
    data<{ sentTo: string }>(await api.post(`${base('customer', id)}/email`, body, { params: { from, to } })),
}

/** The usual periods, in Indian financial years (1 April – 31 March). */
export function periods(today: string): { key: string; label: string; from: string; to: string }[] {
  const [y, m] = today.split('-').map(Number)
  const fy = m >= 4 ? y : y - 1
  const iso = (yy: number, mm: number, dd: number) => `${yy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
  const lastDay = (yy: number, mm: number) => new Date(Date.UTC(yy, mm, 0)).getUTCDate()
  const pm = m === 1 ? 12 : m - 1, py = m === 1 ? y - 1 : y
  const q = Math.floor(((m + 8) % 12) / 3)                    // 0 = Apr–Jun … 3 = Jan–Mar
  const qStartMonth = [4, 7, 10, 1][q], qYear = q === 3 ? fy + 1 : fy
  return [
    { key: 'fy', label: `This financial year (${fy}-${String((fy + 1) % 100).padStart(2, '0')})`, from: iso(fy, 4, 1), to: today },
    { key: 'quarter', label: 'This quarter', from: iso(qYear, qStartMonth, 1), to: today },
    { key: 'month', label: 'This month', from: iso(y, m, 1), to: today },
    { key: 'last-month', label: 'Last month', from: iso(py, pm, 1), to: iso(py, pm, lastDay(py, pm)) },
    { key: 'last-fy', label: `Last financial year (${fy - 1}-${String(fy % 100).padStart(2, '0')})`, from: iso(fy - 1, 4, 1), to: iso(fy, 3, 31) },
  ]
}
