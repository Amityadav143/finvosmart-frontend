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

/** Money arrives from the server as JSON numbers; inputs are kept as strings. */
type Amount = number | string

export type BillType = 'BILL' | 'EXPENSE' | 'CREDIT_NOTE' | 'OPENING_BALANCE'
export type BillStatus = 'DRAFT' | 'OPEN' | 'PARTIAL' | 'PAID' | 'CANCELLED'
export type ItcStatus = 'NOT_CHECKED' | 'MATCHED' | 'MISMATCH' | 'NOT_IN_2B' | 'NOT_AVAILABLE' | 'NA'

export interface BillLine {
  id?: string; itemId?: string; description: string; hsnSacCode?: string; accountCode?: string
  quantity: Amount; unit?: string; unitPrice: Amount; discountPct?: Amount; gstRate: Amount
  taxableAmount?: Amount; cgstAmount?: Amount; sgstAmount?: Amount; igstAmount?: Amount; totalAmount?: Amount
}

export interface Bill {
  id: string; billType: BillType; status: BillStatus; referenceNumber: string; billNumber?: string
  billDate: string; receivedDate?: string; dueDate?: string; payBy?: string; msmePayBy?: string; paymentTerms?: string; financialYear: string
  vendorId?: string; vendorName: string; vendorGstin?: string; vendorPan?: string
  vendorMsmeCategory?: string; vendorMsmeActivity?: string; msmeCovered: boolean; msmeLate: boolean
  placeOfSupply?: string; placeOfSupplyName?: string; interState: boolean; reverseCharge: boolean; itcEligible: boolean
  subtotal: Amount; discountAmount: Amount; taxableAmount: Amount; cgstAmount: Amount; sgstAmount: Amount; igstAmount: Amount
  roundOff: Amount; totalAmount: Amount
  tdsNature?: string; tdsNatureLabel?: string; tdsSection?: string; tdsRate: Amount; tdsAmount: Amount
  payableAmount: Amount; paidAmount: Amount; outstanding: Amount; daysOverdue?: number | null
  itcStatus: ItcStatus; itcPeriod?: string; itcNote?: string
  poId?: string; poNumber?: string | null; notes?: string; cancelledAt?: string; cancelReason?: string; createdAt?: string
  /** Whether recording it moves the stock of the items on it */
  movesStock?: boolean
  warnings?: string[]; lines: BillLine[]
}

export interface BillInput {
  billType: BillType; vendorId?: string; vendorName?: string; vendorGstin?: string; billNumber?: string
  billDate: string; receivedDate?: string | null; dueDate?: string | null; paymentTerms?: string
  placeOfSupply?: string; reverseCharge: boolean; itcEligible: boolean; accountCode?: string
  discountAmount?: Amount | null; roundToRupee: boolean; adjustment?: Amount | null
  tdsNature?: string; tdsRate?: Amount | null; tdsAmount?: Amount | null
  notes?: string; draft: boolean
  paidNow?: { mode: string; reference?: string; date?: string } | null
  /** The purchase order it is for */
  poId?: string | null
  /** Bring the items into stock (a supplier credit note: take returned goods out) */
  updateStock?: boolean
  lines: BillLine[]
}

export interface BillPaymentRecord {
  id: string; billId: string; paymentDate: string; amount: Amount; mode: string; reference?: string
  creditNoteId?: string; creditNoteReference?: string; billReference?: string; source: string; notes?: string
  voidedAt?: string; voidReason?: string; createdAt?: string; late?: boolean
}

export interface TdsSuggestion {
  nature: string; natureLabel: string; applies: boolean; rate: Amount; base: Amount; amount: Amount
  section?: string; note?: string; earlierInYear: Amount
}

export interface AccountOption { code: string; name: string; type: string }

export interface PayablesSummary {
  outstanding: Amount; openBills: number; unusedCredits: Amount; netPayable: Amount
  overdue: Amount; overdueCount: number; dueNext7Days: Amount; dueNext7Count: number
  ageing: Record<'NOT_DUE' | 'DAYS_1_30' | 'DAYS_31_60' | 'DAYS_61_90' | 'OVER_90', Amount>
  msmeOutstanding: Amount; msmeLate: Amount; msmeLateCount: number; msmeDueNext7Days: Amount
  tdsThisMonth: Amount; tdsDepositDue: string; paidThisMonth: Amount
  vendors: { vendorId?: string; vendorName: string; outstanding: Amount; overdue: Amount; bills: number; msme: boolean; msmeLate: Amount }[]
  due: { billId: string; referenceNumber: string; billNumber?: string; vendorName: string; billDate: string; payBy?: string
         daysOverdue: number; outstanding: Amount; msme: boolean; msmeLate: boolean }[]
}

// ── GST credit check (GSTR-2B) ──────────────────────────────────────────────
export type ItcLineStatus = 'MATCHED' | 'PROBABLE' | 'MISMATCH' | 'ONLY_IN_2B' | 'ONLY_IN_BOOKS' | 'NOT_AVAILABLE' | 'OTHER'

export interface ItcStatement {
  id: string; period: string; periodLabel: string; source: string; gstin?: string; generatedOn?: string; fileName?: string
  documentCount: number; warnings: string[]; importedAt?: string; matchedAt?: string
}

export interface ItcSummary {
  documents: number; matched: number; probable: number; mismatched: number; onlyIn2b: number; onlyInBooks: number
  notAvailable: number; other: number
  itcIn2b: Amount; itcNotAvailable: Amount; itcMatched: Amount; itcMismatched: Amount; itcOnlyIn2b: Amount
  itcOnlyInBooks: Amount; itcInBooks: Amount; reverseChargeTax: Amount; importsIgst: Amount
}

export interface ItcLine {
  status: ItcLineStatus; documentId?: string; section?: string; kind?: string; supplierGstin?: string; supplierName?: string
  documentNumber?: string; documentDate?: string; taxable?: Amount; igst?: Amount; cgst?: Amount; sgst?: Amount; cess?: Amount; tax?: Amount
  reverseCharge: boolean; itcAvailable?: string; reason?: string
  billId?: string; billReference?: string; billNumber?: string; billDate?: string; billTaxable?: Amount; billTax?: Amount; billCreditBlocked: boolean
  differences: string[]; imsAction?: 'ACCEPT' | 'REJECT' | 'PENDING' | null; advice?: string
}

export interface ItcReport { statement: ItcStatement; summary: ItcSummary; lines: ItcLine[] }

export interface ItcDocument {
  id: string; period: string; kind: string; supplierGstin?: string; supplierName?: string; number?: string; date?: string
  taxable: Amount; igst: Amount; cgst: Amount; sgst: Amount; value: Amount; placeOfSupply?: string; reverseCharge: boolean
  gstRate: Amount; vendorId?: string; vendorName?: string
}

// ── TDS register ────────────────────────────────────────────────────────────
export interface TdsRegister {
  from: string; to: string; count: number; totalBase: Amount; totalTds: Amount; missingPan: number; statementDue: string
  months: { month: string; label: string; count: number; tds: Amount; depositDue: string }[]
  natures: { nature: string; label: string; section: string; count: number; base: Amount; tds: Amount }[]
  entries: { billId: string; referenceNumber: string; billNumber?: string; date: string; vendorName: string; pan?: string
             nature: string; natureLabel: string; section: string; base: Amount; rate: Amount; tds: Amount
             depositDue: string; quarter: number; panMissing: boolean }[]
}

export interface TdsNatureInfo {
  code: string; label: string; oldSection: string; section: string; singleLimit?: Amount | null; yearLimit?: Amount | null
  companyRate: Amount; individualRate: Amount
}
