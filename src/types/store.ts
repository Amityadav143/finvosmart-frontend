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

/** The store module as the server answers it: godowns, counter billing and the online store (godown/dto, pos/dto, shop/dto). */

// ── godowns ──────────────────────────────────────────────────────────────────
export type GodownKind = 'WAREHOUSE' | 'SHOP' | 'FACTORY' | 'SITE' | 'OTHER'

export interface Godown {
  id: string; code: string; name: string; kind: GodownKind; address?: string | null
  /** value: what the stock in it is worth — only for those who keep the inventory */
  main: boolean; active: boolean; items: number; value?: number | null; usedBy: string[]
}
export interface GodownInput { code: string; name: string; kind: GodownKind; address?: string }

export interface GodownStockRow {
  itemId: string; itemCode: string; itemName: string; unit?: string | null; category?: string | null
  total: number; byGodown: Record<string, number>; batches: boolean
}
export interface GodownStockPage { godowns: Godown[]; rows: GodownStockRow[]; currentPage: number; totalPages: number; totalElements: number }

export interface ItemPlace { godownId: string; godownName: string; batchId?: string | null; batchNo?: string | null; expiry?: string | null; quantity: number }
export interface ItemPlaces { itemId: string; itemCode: string; itemName: string; unit?: string | null; total: number; places: ItemPlace[] }

export interface DocLine {
  itemId: string; itemCode: string; itemName: string; unit?: string | null; hsn?: string | null
  batchId?: string | null; batchNo?: string | null; expiry?: string | null; quantity: number; value?: number | null
}
export interface DocSummary {
  id: string; number: string; date: string; kind: string; status: string; from?: string | null; to?: string | null
  lines: number; value?: number | null; by?: string | null
}
export interface LineInput { itemId: string; batchId?: string | null; quantity: number; requestLineId?: string | null }

export interface Transfer {
  id: string; number: string; date: string; fromGodownId: string; fromGodown: string; toGodownId: string; toGodown: string
  status: 'DONE' | 'CANCELLED'; vehicleNo?: string | null; notes?: string | null; createdBy?: string | null; createdAt: string
  cancelReason?: string | null; lines: DocLine[]; value: number
}

export interface RequestLine {
  id: string; itemId: string; itemCode: string; itemName: string; unit?: string | null
  quantity: number; issued: number; left: number; inGodown: number
}
export interface MaterialRequest {
  id: string; number: string; date: string; neededBy?: string | null; departmentId?: string | null; department?: string | null
  godownId?: string | null; godown?: string | null; purpose?: string | null; status: string; statusLabel: string
  requestedById: string; requestedBy?: string | null; decidedBy?: string | null; decidedAt?: string | null; decisionNote?: string | null
  lines: RequestLine[]
}
export interface MaterialIssue {
  id: string; number: string; kind: 'ISSUE' | 'RETURN'; date: string; godownId: string; godown: string
  requestId?: string | null; requestNumber?: string | null; departmentId?: string | null; department?: string | null
  issuedTo?: string | null; purpose?: string | null; status: 'DONE' | 'CANCELLED'; createdBy?: string | null; createdAt: string
  cancelReason?: string | null; lines: DocLine[]; value: number
}

export interface CountLine {
  id: string; itemId: string; itemCode: string; itemName: string; unit?: string | null; batchId?: string | null; batchNo?: string | null
  book: number; counted?: number | null; difference?: number | null; unitCost?: number | null; value?: number | null; adjusted?: number | null
}
export interface CountSummary { lines: number; counted: number; matched: number; shortLines: number; overLines: number; shortValue: number; overValue: number; net: number }
export interface StockCount {
  id: string; number: string; date: string; godownId: string; godown: string; category?: string | null
  status: 'OPEN' | 'POSTED' | 'CANCELLED'; notes?: string | null; createdBy?: string | null; createdAt: string
  postedBy?: string | null; postedAt?: string | null; lines: CountLine[]; summary: CountSummary
}

// ── counter billing ──────────────────────────────────────────────────────────
export type PayMode = 'CASH' | 'UPI' | 'CARD' | 'CREDIT'
export interface Pay { mode: PayMode; amount: number; reference?: string | null }

export interface PosSession {
  id: string; registerId: string; register: string; status: 'OPEN' | 'CLOSED'; openedById: string; openedBy?: string | null
  openedAt: string; openingCash: number; closedBy?: string | null; closedAt?: string | null; expectedCash?: number | null
  countedCash?: number | null; difference?: number | null; closeNote?: string | null; bills: number; sales: number
}
export interface PosRegister {
  id: string; name: string; godownId: string; godown: string; receiptWidth: 58 | 80; receiptFooter?: string | null
  active: boolean; openSession?: PosSession | null
}
export interface PosState { registers: PosRegister[]; mine?: PosSession | null; admin: boolean; upi: boolean; upiId?: string | null; company: string }

export interface PosItem {
  id: string; code: string; name: string; unit?: string | null; hsn?: string | null; price: number; gstRate: number
  priceWithGst: number; stock: number; batches: boolean; keepsStock: boolean
  /** A medicine's schedule: H, H1 or X (H1 and X need the prescription on the bill). */
  schedule?: string | null
}
export interface PosCustomer { id: string; name: string; phone?: string | null; gstin?: string | null; email?: string | null; outstanding?: number | null }

/** What a bill will come to, worked out on the server as the bill itself is; the H1/X medicines that need the prescription. */
export interface PosQuote {
  subtotal: number; discount: number; taxable: number; tax: number; roundOff: number; total: number
  interState: boolean; placeOfSupply?: string | null; prescriptionFor: string[]
}

export interface ReceiptLine {
  name: string; hsn?: string | null; quantity: number; unit?: string | null; rate: number; discountPct?: number | null
  taxable: number; gstRate: number; amount: number; batchNo?: string | null; expiry?: string | null
}
export interface TaxRow { rate: number; taxable: number; cgst: number; sgst: number; igst: number }
export interface Receipt {
  saleId: string; kind: 'SALE' | 'RETURN'; invoiceId: string; number: string; originalNumber?: string | null; at: string
  register: string; cashier?: string | null
  seller: { name: string; legalName?: string | null; gstin?: string | null; address?: string | null; phone?: string | null; email?: string | null }
  customer: string; customerPhone?: string | null; customerGstin?: string | null; placeOfSupply?: string | null
  lines: ReceiptLine[]; taxes: TaxRow[]; subtotal: number; discount: number; taxable: number; cgst: number; sgst: number; igst: number
  roundOff: number; total: number; payments: Pay[]; cashGiven: number; change: number; onAccount: number
  footer?: string | null; width: 58 | 80; link?: string | null; qrSvg?: string | null; whatsappText: string
}
export interface BillLine {
  lineId: string; itemId?: string | null; name: string; unit?: string | null; sold: number; returned: number; left: number
  unitPrice: number; gstRate: number; lineTotal: number; batchNo?: string | null
}
export interface PosBill {
  saleId: string; kind: 'SALE' | 'RETURN'; invoiceId: string; number: string; at: string; register: string; customer: string
  customerId: string; walkIn: boolean; total: number; status?: string | null; lines: BillLine[]
}
export interface BillRow { saleId: string; kind: 'SALE' | 'RETURN'; invoiceId: string; number: string; at: string; customer: string; total: number; modes?: string | null; by?: string | null }
export interface ByMode { mode: PayMode; in: number; out: number; net?: number }
export interface CashMove { id: string; direction: 'IN' | 'OUT'; amount: number; reason: string; by?: string | null; at: string }
export interface ShiftReport {
  session: PosSession; bills: number; returns: number; sales: number; returnsTotal: number; net: number; tax: number
  byMode: ByMode[]; cashMoves: CashMove[]; expectedCash: number; billRows: BillRow[]
}
export interface HeldBill { id: string; registerId: string; label: string; cart: string; by?: string | null; at: string }

// ── the online store ─────────────────────────────────────────────────────────
export interface ShopSettings {
  slug: string; published: boolean; acceptingOrders: boolean; listed: boolean; displayName: string; tagline?: string | null
  about?: string | null; phone?: string | null; whatsapp?: string | null; email?: string | null; address?: string | null
  pickup: boolean; delivery: boolean; deliveryCharge: number; deliveryGstRate: number; freeDeliveryAbove?: number | null
  minOrder?: number | null; deliveryNote?: string | null; godownId?: string | null; godown?: string | null; showOutOfStock: boolean
  accent?: string | null; hasLogo: boolean; url: string; items: number; newOrders: number; saved: boolean; readOnlyReason?: string | null
}
export type ShopSettingsInput = Partial<Omit<ShopSettings, 'godown' | 'hasLogo' | 'url' | 'items' | 'newOrders' | 'saved' | 'readOnlyReason'>>

export interface CatalogueItem {
  itemId: string; code: string; name: string; category?: string | null; unit?: string | null; price: number; gstRate: number
  priceWithGst: number; stock: number; keepsStock: boolean; published: boolean; featured: boolean; images: string[]; description?: string | null
}
export interface CataloguePage { items: CatalogueItem[]; currentPage: number; totalPages: number; totalElements: number; published: number }
export interface Picture { id: string; itemId: string; position: number; width: number; height: number; bytes: number }

export type OrderStatus = 'NEW' | 'CONFIRMED' | 'READY' | 'OUT_FOR_DELIVERY' | 'COMPLETED' | 'CANCELLED'
export interface OrderLine { itemId: string; name: string; unit?: string | null; quantity: number; unitPrice: number; gstRate: number; lineTotal: number; stock?: number | null }
export interface OrderEvent { status: string; label: string; note?: string | null; by?: string | null; at: string }
export interface ShopOrder {
  id: string; number: string; status: OrderStatus; statusLabel: string; fulfilment: 'PICKUP' | 'DELIVERY'; payment: 'ON_DELIVERY' | 'ONLINE'
  customerName: string; phone: string; email?: string | null; address?: string | null; city?: string | null; pincode?: string | null; state?: string | null
  note?: string | null; itemsTotal: number; deliveryCharge: number; total: number; customerId?: string | null; invoiceId?: string | null
  invoiceNumber?: string | null; invoiceStatus?: string | null; invoiceDue?: number | null; payUrl?: string | null; cancelReason?: string | null
  createdAt: string; lines: OrderLine[]; events: OrderEvent[]; trackUrl: string; whatsapp?: string | null; next: string[]
}
export interface OrderRow { id: string; number: string; status: OrderStatus; statusLabel: string; fulfilment: 'PICKUP' | 'DELIVERY'; customerName: string; phone: string; total: number; lines: number; invoiceNumber?: string | null; createdAt: string }
export interface OrderPage { rows: OrderRow[]; currentPage: number; totalPages: number; totalElements: number; newOrders: number }

// public
export interface PublicItem {
  id: string; name: string; description?: string | null; category?: string | null; unit?: string | null; price: number; gstRate: number
  priceWithGst: number; inStock: boolean; left?: number | null; featured: boolean; images: string[]
}
export interface PublicStore {
  slug: string; name: string; tagline?: string | null; about?: string | null; phone?: string | null; whatsapp?: string | null; email?: string | null
  address?: string | null; city?: string | null; state?: string | null; gstin?: string | null; legalName?: string | null; pickup: boolean; delivery: boolean
  deliveryCharge?: number | null; freeDeliveryAbove?: number | null; minOrder?: number | null; deliveryNote?: string | null; accepting: boolean
  closedReason?: string | null; accent?: string | null; hasLogo: boolean; categories: string[]; items: PublicItem[]; updatedAt?: string | null; listed: boolean
  /** the bill's payment page can take money online (UPI, a bank transfer or a gateway) */
  onlinePay: boolean
}
export interface PlacedOrder { number: string; token: string; total: number; trackUrl: string; whatsapp?: string | null }
export interface PublicOrder {
  shopSlug: string; shopName: string; shopPhone?: string | null; shopWhatsapp?: string | null; number: string; status: OrderStatus; statusLabel: string
  fulfilment: 'PICKUP' | 'DELIVERY'; payment: 'ON_DELIVERY' | 'ONLINE'; customerName: string; lines: OrderLine[]; itemsTotal: number
  deliveryCharge: number; total: number; payUrl?: string | null; due?: number | null; events: OrderEvent[]; createdAt: string; whatsapp?: string | null
}
