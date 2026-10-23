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

type Amount = number | string

/** FIX: the portal would reject it or the return would be wrong. CHECK: look before filing. INFO: how a figure was worked out. */
export type GstNoticeLevel = 'FIX' | 'CHECK' | 'INFO'

export interface GstNotice { level: GstNoticeLevel; text: string }

export interface GstMoney { taxable: Amount; igst: Amount; cgst: Amount; sgst: Amount; tax: Amount }

export interface Gstr1Section { key: string; title: string; table: string; count: string; amounts: GstMoney }

/** A line of GSTR-3B: the table ("3.1(a)") and what it holds. */
export interface Gstr3bRow { table: string; label: string; amounts: GstMoney }

export interface GstPlace { pos: string; name: string | null; taxable: Amount; igst: Amount }

export interface GstReturnsSummary {
  period: string                 // "092026"
  label: string                  // "September 2026"
  gstin: string | null
  businessName: string | null
  dueGstr1: string               // "11 October 2026" (monthly filers)
  dueGstr3b: string              // "20 October 2026"
  gstr1: { sections: Gstr1Section[]; total: GstMoney; documents: number; nothingToReport: boolean; notices: GstNotice[] }
  gstr3b: {
    outward: Gstr3bRow[]; unregistered: GstPlace[]; itc: Gstr3bRow[]; exempt: Gstr3bRow[]; payment: Gstr3bRow[]
    cashToPay: Amount; creditCarriedForward: Amount; gstr2bChecked: boolean; bills: number; notices: GstNotice[]
  }
}
