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

/** The cash-flow forecast (GET /dashboard/cash-forecast — CashForecastService.View). Amounts come as numbers. */
type Money = number | string

/** One amount expected to move on a day: a customer's invoice, a supplier's bill, salaries, a tax. */
export interface CashMove {
  direction: 'IN' | 'OUT'
  kind: 'INVOICE' | 'BILL' | 'SALARIES' | 'PF_ESI' | 'TDS_SALARIES' | 'TDS_SUPPLIERS' | 'GST' | string
  what: string
  party: string
  on: string
  amount: Money
  link: string
  basis: string
}

export interface CashWeek {
  number: number
  start: string
  end: string
  in: Money
  out: Money
  closing: Money
  /** how many moves the week has (the first 60 are listed) */
  moves: number
  flows: CashMove[]
}

export interface CashForecastResult {
  today: string
  opening: Money
  weeks: CashWeek[]
  totalIn: Money
  totalOut: Money
  closing: Money
  lowest: Money
  lowestWeek: string | null
  /** the first week whose closing cash is below zero */
  shortWeek: string | null
  laterIn: Money
  laterOut: Money
}

export interface LateCustomer { customerId: string | null; name: string; amount: Money; invoices: number; daysLate: number }

export interface CashForecastView {
  forecast: CashForecastResult
  accounts: { code: string; name: string; balance: Money }[]
  booksHaveEntries: boolean
  /** invoices later than their customer usually pays: not counted */
  lateTotal: Money
  lateCount: number
  lateCustomers: LateCustomer[]
  /** how many days late customers pay on average (null: no payments in the last year) */
  usualLateDays: number | null
  payrollCounted: boolean
  notCounted: string[]
}
