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

/** Import from Excel/CSV — mirrors com.finvosmart.imports.ImportDto. */
export type ImportKind = 'customers' | 'suppliers' | 'items' | 'employees' | 'opening-balances' | 'customer-dues' | 'supplier-dues'

export interface ImportColumn { key: string; label: string; required: boolean; hint: string; example: string }

export interface ImportKindInfo { kind: ImportKind; label: string; allowed: boolean; columns: ImportColumn[]; templateFile: string }

/** NEW = will be added, UPDATE = opening balance set on an account you have, EXISTS = already there, SKIPPED = nothing to bring in. */
export type ImportRowStatus = 'NEW' | 'UPDATE' | 'EXISTS' | 'SKIPPED' | 'ERROR'

export interface ImportNote { column: string; text: string; error: boolean }

export interface ImportRow { line: number; status: ImportRowStatus; label: string; detail: string; notes: ImportNote[] }

export interface ImportSummary {
  rows: number; ready: number; exists: number; skipped: number; errors: number; warnings: number
  /** Opening balances only. */
  debit: number | null; credit: number | null; difference: number | null
  /** Unpaid invoices and bills only: the total due. */
  amount: number | null
}

export interface ImportPreview {
  kind: ImportKind; label: string; fileName: string; headerLine: number
  found: string[]; missing: string[]; ignored: string[]; examples: number; truncated: boolean
  summary: ImportSummary; rows: ImportRow[]; rowsShown: number
  newDepartments: string[]; newDesignations: string[]; newAccounts: string[]
}

export interface ImportResult { kind: ImportKind; imported: number; notImported: number; message: string }

export interface OpeningDifference { accountCode: string; amount: number; balanced: boolean }
