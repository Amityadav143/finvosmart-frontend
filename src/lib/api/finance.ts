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
import { download } from './purchases'
import type { ApiResponse, Account, JournalEntry, JournalEntryLine, PageResponse, TrialBalance } from '@/types'

type Amount = number | string

/** One line of an account's ledger (AccountLedger.Line). */
export interface LedgerLine {
  date: string; entryId: string; entryNumber: string; entryType: string; narration?: string | null
  /** The accounts on the other side of the entry. */
  particulars: string
  debit: Amount; credit: Amount
  /** The balance after this line, and its side ("Dr", "Cr", or "" for nil). */
  balance: Amount; side: string
  voucherLink?: string | null; documentLink?: string | null
}

/** AccountLedgerService.View */
export interface AccountLedgerView {
  account: { id: string; code: string; name: string; type: string; system: boolean }
  ledger: { from: string; to: string; opening: Amount; openingSide: string; lines: LedgerLine[]
            totalDebit: Amount; totalCredit: Amount; closing: Amount; closingSide: string }
}

export interface TrialBalanceReport {
  accounts: { id?: string; code: string; name: string; type: string; balance: number; debit: number; credit: number }[]
  totalDebit: number; totalCredit: number; balanced: boolean
}

export const financeApi = {
  accounts: {
    list: async (): Promise<Account[]> => (await api.get<ApiResponse<Account[]>>('/finance/accounts')).data.data ?? [],
    create: async (d: Partial<Account>) => (await api.post<ApiResponse<Account>>('/finance/accounts', d)).data.data!,
    update: async (id: string, d: Partial<Account>) => (await api.put<ApiResponse<Account>>(`/finance/accounts/${id}`, d)).data.data!,
  },
  journalEntries: {
    list: async (params: { page?: number; size?: number; type?: string } = {}) =>
      (await api.get<ApiResponse<PageResponse<JournalEntry>>>('/finance/journal-entries', { params })).data.data!,
    /** One entry with its lines (opened from a link). */
    get: async (id: string) => (await api.get<ApiResponse<JournalEntry>>(`/finance/journal-entries/${id}`)).data.data!,
    create: async (d: { entryType: string; entryDate: string; narration: string; lines: Omit<JournalEntryLine,'id'>[] }) =>
      (await api.post<ApiResponse<JournalEntry>>('/finance/journal-entries', d)).data.data!,
    /** Posts the mirror image of a manual entry, dated today. */
    reverse: async (id: string, reason?: string) =>
      (await api.post<ApiResponse<JournalEntry>>(`/finance/journal-entries/${id}/reverse`, { reason: reason || null })).data.data!,
  },
  /** An account's ledger for a period (default: this financial year to today). */
  ledger: async (accountId: string, from?: string, to?: string): Promise<AccountLedgerView> =>
    (await api.get<ApiResponse<AccountLedgerView>>(`/finance/accounts/${accountId}/ledger`, { params: { from, to } })).data.data!,
  ledgerPdf: (accountId: string, from: string, to: string, code: string) =>
    download(`/finance/accounts/${accountId}/ledger/pdf`, { from, to }, `Ledger_${code.replace(/[^A-Za-z0-9-]+/g, '')}_${from}_to_${to}.pdf`),
  ledgerCsv: (accountId: string, from: string, to: string, code: string) =>
    download(`/finance/accounts/${accountId}/ledger/csv`, { from, to }, `Ledger_${code.replace(/[^A-Za-z0-9-]+/g, '')}_${from}_to_${to}.csv`),
  // Computed from posted ledger entries; debit/credit are already on the correct side.
  trialBalance: async (): Promise<TrialBalanceReport | null> =>
    (await api.get<ApiResponse<TrialBalanceReport>>('/finance/trial-balance')).data.data ?? null,
  // Posts any invoices the books don't reflect yet (safe to run repeatedly).
  syncLedger: async (): Promise<{ invoicesChecked: number; failed: number }> =>
    (await api.post('/finance/ledger/sync')).data.data,
  profitLoss: async (from: string, to: string) => (await api.get('/finance/reports/profit-loss', { params: { from, to } })).data.data,
  balanceSheet: async (asOf: string) => (await api.get('/finance/reports/balance-sheet', { params: { asOf } })).data.data,
}
