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
import type { ApiResponse, Account, JournalEntry, JournalEntryLine, TrialBalance } from '@/types'

export const financeApi = {
  accounts: {
    list: async (): Promise<Account[]> => (await api.get<ApiResponse<Account[]>>('/finance/accounts')).data.data ?? [],
    create: async (d: Partial<Account>) => (await api.post<ApiResponse<Account>>('/finance/accounts', d)).data.data!,
    update: async (id: string, d: Partial<Account>) => (await api.put<ApiResponse<Account>>(`/finance/accounts/${id}`, d)).data.data!,
  },
  journalEntries: {
    list: async (params: { page?: number; size?: number; type?: string } = {}) =>
      (await api.get('/finance/journal-entries', { params })).data.data,
    create: async (d: { entryType: string; entryDate: string; narration: string; lines: Omit<JournalEntryLine,'id'>[] }) =>
      (await api.post<ApiResponse<JournalEntry>>('/finance/journal-entries', d)).data.data!,
  },
  trialBalance: async (): Promise<TrialBalance[]> => (await api.get<ApiResponse<TrialBalance[]>>('/finance/trial-balance')).data.data ?? [],
  profitLoss: async (from: string, to: string) => (await api.get('/finance/reports/profit-loss', { params: { from, to } })).data.data,
  balanceSheet: async (asOf: string) => (await api.get('/finance/reports/balance-sheet', { params: { asOf } })).data.data,
}
