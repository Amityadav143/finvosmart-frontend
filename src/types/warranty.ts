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

/** Warranty claims: from customers (WC/…) and on suppliers (SWC/…). */

export type ClaimKind = 'CUSTOMER' | 'SUPPLIER'
export type ClaimStatus = 'OPEN' | 'APPROVED' | 'REJECTED' | 'RESOLVED' | 'SENT' | 'ACCEPTED' | 'SETTLED' | 'CLOSED' | 'CANCELLED'
export type Resolution = 'REPAIR' | 'REPLACE' | 'CREDIT'
export type ClaimAction = 'APPROVE' | 'REJECT' | 'REOPEN' | 'RECEIVE_UNIT' | 'RETURN_REPAIRED' | 'ISSUE_REPLACEMENT' | 'CREDIT_NOTE' | 'PASS_ON'
  | 'SEND' | 'ACCEPT' | 'SUPPLIER_REJECT' | 'APPEAL' | 'SETTLE_GOODS' | 'SUPPLIER_CREDIT' | 'CLOSE' | 'CANCEL'

export interface ClaimRef { id: string; number: string; status: string; statusLabel: string }
export interface ClaimEvent { at: string; by?: string | null; action: string; label: string; note?: string | null }

export interface WarrantyClaim {
  id: string; number: string; kind: ClaimKind; status: ClaimStatus; statusLabel: string; claimDate: string
  customerId?: string | null; vendorId?: string | null; partyName: string; partyGstin?: string | null; partyAddress?: string | null; contactPhone?: string | null
  invoiceId?: string | null; invoiceNumber?: string | null; invoiceLineId?: string | null; grnId?: string | null; grnNumber?: string | null; grnLineId?: string | null
  billId?: string | null; billNumber?: string | null; sourceDoc?: string | null; sourceDate?: string | null; parent?: ClaimRef | null; passedOn: ClaimRef[]
  itemId?: string | null; itemCode?: string | null; description: string; hsn?: string | null; quantity: number; unit?: string | null; serialNo?: string | null
  batchId?: string | null; batchNo?: string | null; unitRate?: number | null; gstRate?: number | null; claimedValue?: number | null
  warrantyFrom?: string | null; warrantyMonths?: number | null; warrantyUntil?: string | null; inWarranty?: boolean | null; coverage: string
  complaint: string; receivedWith?: string | null; unitReceivedOn?: string | null; fromStock: boolean; godownId?: string | null; godownName?: string | null
  stockOut: boolean; resolution?: Resolution | null; resolutionLabel?: string | null; goodwill: boolean; decisionNote?: string | null
  decidedAt?: string | null; decidedBy?: string | null; sentOn?: string | null; vehicleNo?: string | null; transporter?: string | null
  lrNumber?: string | null; ewayBillNo?: string | null; appeals: number; acceptedValue?: number | null; recoveredValue?: number | null
  replacementItemId?: string | null; replacementItem?: string | null; replacementSerial?: string | null; resolvedOn?: string | null
  resolutionNote?: string | null; creditNote?: ClaimRef | null; createdBy?: string | null; createdAt?: string | null; cancelReason?: string | null
  itemKeepsStock: boolean; itemByBatch: boolean; actions: ClaimAction[]; history: ClaimEvent[]; values: boolean
}

export interface ClaimSummary {
  id: string; number: string; kind: ClaimKind; status: ClaimStatus; statusLabel: string; claimDate: string; partyName: string
  description: string; quantity: number; unit?: string | null; serialNo?: string | null; inWarranty?: boolean | null
  resolution?: Resolution | null; resolutionLabel?: string | null; claimedValue?: number | null; recoveredValue?: number | null
  ageDays: number; parentNumber?: string | null
}

export interface ClaimCounts {
  customerOpen: number; customerApproved: number; customerResolved30: number; supplierToSend: number; supplierWithSupplier: number
  supplierAccepted: number; supplierRejected: number; pendingRecovery?: number | null; recovered90?: number | null; values: boolean
}

/** What a new claim starts from (an invoice line, a receipt line, a customer's claim passed on). */
export interface ClaimStart {
  kind: ClaimKind; customerId?: string | null; vendorId?: string | null; partyName?: string | null; contactPhone?: string | null
  invoiceId?: string | null; invoiceNumber?: string | null; invoiceLineId?: string | null; grnId?: string | null; grnNumber?: string | null
  grnLineId?: string | null; billId?: string | null; billNumber?: string | null; parentClaimId?: string | null; parentNumber?: string | null
  itemId?: string | null; description?: string | null; quantity?: number | null; claimable?: number | null; unit?: string | null
  serialNo?: string | null; batchId?: string | null; batchNo?: string | null; unitRate?: number | null; sourceDoc?: string | null
  sourceDate?: string | null; warrantyFrom?: string | null; warrantyMonths?: number | null; warrantySource?: string | null
  warrantyUntil?: string | null; inWarranty?: boolean | null; coverage?: string | null; complaint?: string | null
  supplierFound?: string | null; fromStock: boolean; values: boolean
}

export interface ClaimParty { id: string; name: string; phone?: string | null; city?: string | null; gstin?: string | null }
export interface ClaimItem {
  id: string; code?: string | null; name: string; unit?: string | null; warrantyMonths?: number | null; supplierWarrantyMonths?: number | null
  keepsStock: boolean; byBatch: boolean
}
export interface ClaimLine { lineId: string; itemId?: string | null; description: string; quantity?: number | null; claimed: number; unit?: string | null; batchNo?: string | null }
export interface ClaimDocument { kind: 'invoice' | 'receipt'; id: string; number: string; date: string; partyName: string; status: string; lines: ClaimLine[] }

export interface NewClaimInput {
  kind: ClaimKind; invoiceLineId?: string | null; grnLineId?: string | null; parentClaimId?: string | null; customerId?: string | null
  vendorId?: string | null; contactPhone?: string | null; itemId?: string | null; description?: string | null; quantity?: number | null
  unit?: string | null; serialNo?: string | null; batchNo?: string | null; unitRate?: number | null; sourceDoc?: string | null
  sourceDate?: string | null; claimDate?: string | null; warrantyFrom?: string | null; warrantyMonths?: number | null; complaint: string
  receivedWith?: string | null; unitReceived?: boolean | null; fromStock?: boolean | null; godownId?: string | null; batchId?: string | null
}
