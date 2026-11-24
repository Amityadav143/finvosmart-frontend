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

/** The purchase store: consignments at the gate, goods receipts (GRNs), returns to suppliers, reports and reordering. */

export type GateStatus = 'AT_GATE' | 'RECEIVED' | 'TURNED_AWAY' | 'CANCELLED'
export type GrnStatus = 'DRAFT' | 'INSPECTION' | 'POSTED' | 'CANCELLED'
export interface Ref { id: string; number: string; status: string }

export interface GateEntryInput {
  vendorId?: string | null; partyName?: string | null; poId?: string | null; godownId?: string | null
  docType: 'INVOICE' | 'CHALLAN' | 'NONE'; docNumber?: string | null; docDate?: string | null
  vehicleNo?: string | null; driverName?: string | null; driverPhone?: string | null; transporter?: string | null
  lrNumber?: string | null; ewayBillNo?: string | null; packages?: number | null; weightKg?: number | null; remarks?: string | null
}
export interface GateEntry {
  id: string; number: string; date: string; arrivedAt: string; vendorId?: string | null; partyName: string
  poId?: string | null; poNumber?: string | null; godownId?: string | null; godown?: string | null
  docType: 'INVOICE' | 'CHALLAN' | 'NONE'; docNumber?: string | null; docDate?: string | null
  vehicleNo?: string | null; driverName?: string | null; driverPhone?: string | null; transporter?: string | null
  lrNumber?: string | null; ewayBillNo?: string | null; packages?: number | null; weightKg?: number | null; remarks?: string | null
  status: GateStatus; statusLabel: string; statusNote?: string | null; leftAt?: string | null; createdBy?: string | null; receipts: Ref[]
}

export interface ReceiptLineInput {
  poLineId?: string | null; itemId?: string | null; description?: string | null; unit?: string | null
  challanQty?: number | null; received: number; rejected?: number | null; rejectReason?: string | null
  rate?: number | null; gstRate?: number | null; batchNo?: string | null; expiry?: string | null; mrp?: number | null
}
export interface ReceiptInput {
  gateEntryId?: string | null; poId?: string | null; vendorId?: string | null; receivedDate?: string | null; godownId?: string | null
  invoiceNumber?: string | null; invoiceDate?: string | null; challanNumber?: string | null; challanDate?: string | null
  vehicleNo?: string | null; lrNumber?: string | null; transporter?: string | null; ewayBillNo?: string | null; remarks?: string | null
  sendForInspection?: boolean; lines: ReceiptLineInput[]
}
export interface ReceiptLine {
  id: string; lineNo: number; poLineId?: string | null; itemId?: string | null; itemCode?: string | null; description: string
  unit?: string | null; hsn?: string | null; ordered?: number | null; challanQty?: number | null; received: number; accepted: number
  rejected: number; rejectReason?: string | null; returned: number; rate?: number | null; gstRate?: number | null
  batchNo?: string | null; expiry?: string | null; mrp?: number | null; needsInspection: boolean; batches: boolean; keepsStock: boolean
  value?: number | null
}
export interface GoodsReceipt {
  id: string; number: string; status: GrnStatus; statusLabel: string; receivedDate: string; poId?: string | null; poNumber?: string | null
  gateEntryId?: string | null; gateEntryNumber?: string | null; vendorId: string; vendorName: string; vendorGstin?: string | null
  godownId?: string | null; godown?: string | null; invoiceNumber?: string | null; invoiceDate?: string | null
  challanNumber?: string | null; challanDate?: string | null; vehicleNo?: string | null; lrNumber?: string | null
  transporter?: string | null; ewayBillNo?: string | null; remarks?: string | null; needsInspection: boolean; receivedBy?: string | null
  postedAt?: string | null; postedBy?: string | null; inspectedAt?: string | null; inspectedBy?: string | null; inspectionNote?: string | null
  cancelledAt?: string | null; cancelReason?: string | null; lines: ReceiptLine[]; acceptedValue?: number | null
  rejectedValue?: number | null; rejectedToReturn: number; bill?: Ref | null; returns: Ref[]; rates: boolean
}
export interface ReceiptSummary {
  id: string; number: string; date: string; status: GrnStatus; statusLabel: string; vendorName: string; poId?: string | null
  poNumber?: string | null; godown?: string | null; invoiceNumber?: string | null; lines: number; acceptedValue?: number | null
  rejectedQty: number; billed: boolean; receivedBy?: string | null
}
export interface OrderLineToReceive {
  poLineId: string; itemId?: string | null; itemCode?: string | null; itemName: string; unit?: string | null; hsn?: string | null
  ordered: number; received: number; inInspection: number; pending: number; rate?: number | null; gstRate?: number | null
  batches: boolean; needsInspection: boolean; keepsStock: boolean
}
export interface OrderToReceive {
  poId: string; poNumber: string; status: string; poDate?: string | null; expected?: string | null; vendorId: string; vendorName: string
  receivable: boolean; notReceivableReason?: string | null; lines: OrderLineToReceive[]; receipts: ReceiptSummary[]
}
export interface PendingLine {
  poId: string; poNumber: string; poDate?: string | null; expected?: string | null; daysLate: number; vendorId: string; vendorName: string
  poLineId: string; itemId?: string | null; itemName: string; unit?: string | null; ordered: number; received: number; pending: number
  pendingValue?: number | null
}

export interface ReturnInput {
  grnId: string; date?: string | null; vehicleNo?: string | null; transporter?: string | null; lrNumber?: string | null
  ewayBillNo?: string | null; notes?: string | null; lines: { grnLineId: string; quantity: number }[]
}
export interface ReturnLine {
  grnLineId: string; itemId?: string | null; itemCode?: string | null; itemName: string; unit?: string | null; hsn?: string | null
  batchNo?: string | null; quantity: number; rate?: number | null; gstRate?: number | null; reason?: string | null; value?: number | null
}
export interface PurchaseReturn {
  id: string; number: string; date: string; status: 'DONE' | 'CANCELLED'; grnId: string; grnNumber: string; poId?: string | null
  poNumber?: string | null; vendorId?: string | null; vendorName: string; vendorGstin?: string | null; vendorAddress?: string | null
  vehicleNo?: string | null; transporter?: string | null; lrNumber?: string | null; ewayBillNo?: string | null; notes?: string | null
  createdBy?: string | null; createdAt?: string | null; cancelReason?: string | null; lines: ReturnLine[]
  taxable?: number | null; total?: number | null; creditNote?: Ref | null; rates: boolean
}
export interface ReturnSummary {
  id: string; number: string; date: string; status: 'DONE' | 'CANCELLED'; vendorName: string; grnNumber: string; lines: number
  total?: number | null; creditNote: boolean
}

export interface StoreSummary {
  atGate: number; drafts: number; awaitingInspection: number; rejectedToReturn: number; receivedNotBilled: number
  receivedNotBilledValue?: number | null; deliveriesDue: number; deliveriesOverdue: number; materialToIssue: number; receivedToday: number
}
export interface NotBilled { grnId: string; number: string; date: string; vendorName: string; poNumber?: string | null; invoiceNumber?: string | null; value?: number | null; days: number }
export interface Rejection {
  grnId: string; grnNumber: string; date: string; vendorName: string; grnLineId: string; itemName: string; unit?: string | null
  rejected: number; returned: number; toReturn: number; reason?: string | null
}
export interface SupplierRow {
  vendorId: string; vendorName: string; receipts: number; withDueDate: number; onTime: number; onTimePercent?: number | null
  averageDaysLate?: number | null; received: number; rejected: number; rejectionPercent?: number | null; value?: number | null
  /** warranty claims on the supplier raised in the period, and how much they are for */
  warrantyClaims: number; claimedQuantity?: number | null
  /** the rating: each criterion 0–100 (null: nothing to judge it on), the score 1–100 and its grade (A–D); null: not rated */
  quality?: number | null; delivery?: number | null; price?: number | null; service?: number | null; score?: number | null; grade?: string | null
}

/** A supplier as the gate and the stores pick one (no bank, tax or account details). */
export interface SupplierName { id: string; name: string; gstin?: string | null; city?: string | null; state?: string | null; status?: string | null }

export type Urgency = 'OUT' | 'NOW' | 'SOON' | 'OK'
export interface PlanRow {
  itemId: string; itemCode: string; itemName: string; unit?: string | null; category?: string | null; hsn?: string | null
  stock: number; onOrder: number; used: number; dailyUse: number; daysLeft?: number | null; leadDays: number; reorderLevel: number
  reorderPoint: number; suggested: number; urgency: Urgency; vendorId?: string | null; vendorName?: string | null; rate?: number | null
  gstRate?: number | null
}
export interface Plan { windowDays: number; coverDays: number; out: number; now: number; soon: number; rows: PlanRow[] }
export interface MadeOrder { id: string; number: string; vendorName: string; lines: number; total: number }

export interface MatchRow {
  item: string; ordered?: number | null; received: number; billedBefore: number; billed: number; orderRate?: number | null
  billRate?: number | null; status: 'MATCHED' | 'MORE_THAN_RECEIVED' | 'RATE_ABOVE_ORDER' | 'NOT_RECEIVED'; statusLabel: string
}
export interface BillMatch { against: string; matched: boolean; rows: MatchRow[] }
