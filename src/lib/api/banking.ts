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
import type { ApiResponse } from '@/types'

/** A customer's invoice (money in) or, with kind BILL, a supplier's bill (money out): invoiceId/invoiceNumber then carry the bill's. */
export interface StatementAllocation { invoiceId: string; invoiceNumber: string; customerName: string; amount: number; tds: number; kind?: 'INVOICE' | 'BILL' }
export interface StatementSuggestion { confidence: number; reason: string; autoSelect: boolean; allocations: StatementAllocation[] }
export interface StatementLine {
  key: string; row: number; date: string; description: string; reference?: string
  debit?: number; credit?: number; balance?: number; alreadyRecorded: boolean; suggestions: StatementSuggestion[]
}
export interface ParsedStatement {
  fileName: string; layout: string; transactions: number; moneyIn: number; moneyOut: number; totalIn: number; totalOut: number
  from: string; to: string; suggested: number; alreadyRecorded: number; skippedRows: number; warnings: string[]; lines: StatementLine[]
}
export interface StatementConfirmation {
  key: string; date: string; amount: number; description: string; reference?: string
  allocations: { invoiceId: string; amount: number; tds: number; kind?: 'INVOICE' | 'BILL' }[]
}
export interface ConfirmResult { recorded: number; skippedAlreadyRecorded: number; amount: number; errors: string[] }

export const bankingApi = {
  /** Any bank's statement: CSV, Excel (.xlsx/.xls) or OFX. */
  parse: async (file: File) => {
    const form = new FormData(); form.append('file', file)
    return (await api.post<ApiResponse<ParsedStatement>>('/banking/statements/parse', form,
      { headers: { 'Content-Type': 'multipart/form-data' } })).data.data!
  },
  confirm: async (lines: StatementConfirmation[]) =>
    (await api.post<ApiResponse<ConfirmResult>>('/banking/statements/confirm', lines)).data.data!,
}
