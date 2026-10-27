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

// ── API Wrappers ───────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean; message?: string; data?: T; error?: string; timestamp?: string
}
export interface PageResponse<T> {
  content: T[]; currentPage: number; pageSize: number;
  totalElements: number; totalPages: number; first: boolean; last: boolean
}

// ── Auth ───────────────────────────────────────────────────────────────────────
export interface AuthResponse {
  accessToken: string; refreshToken: string; tokenType: string; expiresIn: number
  userId: string; fullName: string; email: string; companyId: string; branchId: string
  roles: string[]; permissions: string[]
  companyName?: string; companyCode?: string; subscriptionPlan?: string
  mfaPending?: boolean; mfaSessionToken?: string
  companyChooser?: { companyCode: string; companyName: string }[]
  /** Google sign-in for an address no login uses: no tokens — offer to sign up with it (email, fullName say whose). */
  signUpWithGoogle?: boolean
}

// ── HRMS ──────────────────────────────────────────────────────────────────────
export interface Employee {
  id: string; employeeCode: string; firstName: string; middleName?: string
  lastName: string; fullName: string; officialEmail?: string; personalEmail?: string; phonePrimary?: string
  departmentId?: string; departmentName?: string; designationId?: string; designationName?: string; reportingManagerId?: string
  branchId?: string; branchName?: string; companyId: string
  employmentType: 'PERMANENT'|'CONTRACT'|'INTERN'|'CONSULTANT'|'PART_TIME'
  status: 'ACTIVE'|'INACTIVE'|'ON_NOTICE'|'RESIGNED'|'TERMINATED'|'ON_LEAVE'
  dateOfJoining?: string; dateOfBirth?: string; dateOfExit?: string; ctcAnnual?: number
  photoUrl?: string; gender?: string; customData?: Record<string,string>
  /** PAN, PF/ESI numbers and bank details: in full for HR and payroll, masked (XXXX1234) for others. */
  panNumber?: string; pfNumber?: string; esiNumber?: string; bankName?: string; bankAccountNumber?: string; bankIfsc?: string
  currentAddress?: string; city?: string; state?: string; pincode?: string; privateDetails?: boolean
}
export interface Department { id: string; name: string }
export interface Designation { id: string; name: string; departmentId?: string }
export interface EmployeeStats { totalActive: number; onNotice: number; onLeave: number; terminated: number }

export interface LeaveApplication {
  id: string; employeeId: string; employeeName?: string; employeeCode?: string
  leaveTypeName: string; leaveTypeId?: string; fromDate: string; toDate: string
  totalDays: number; reason: string
  status: 'PENDING'|'APPROVED'|'REJECTED'|'CANCELLED'|'WITHDRAWN'
  approvalRemarks?: string; createdAt: string
}

export type AttendanceStatus = 'PRESENT'|'ABSENT'|'HALF_DAY'|'WFH'|'ON_LEAVE'|'HOLIDAY'|'WEEKEND'
export interface AttendanceRecord {
  id: string; employeeId: string; employeeName?: string; employeeCode?: string
  attendanceDate: string; checkInTime?: string; checkOutTime?: string
  status: AttendanceStatus
  source?: string; hoursWorked?: number; remarks?: string
}
/** P present, W work from home, H half day, A absent, L paid leave, U leave without pay, HO holiday, WO weekly off, '' not marked, X not employed. */
export type AttendanceCode = 'P'|'W'|'H'|'A'|'L'|'U'|'HO'|'WO'|''|'X'
export interface AttendanceCounts { present: number; wfh: number; halfDays: number; absent: number; paidLeave: number; unpaidLeave: number; holidays: number; unmarked: number }
export interface AttendanceRegisterRow {
  employeeId: string; name: string; code: string; department?: string | null
  days: AttendanceCode[]; counts: AttendanceCounts; unpaidDays: number | string
}
export interface AttendanceRegister {
  month: string; label: string; days: number
  /** 1 = Monday … 7 = Sunday, for the 1st of the month */
  firstWeekday: number
  today: string
  payrollStatus?: string | null; payrollNote?: string | null
  canEdit: boolean
  employees: AttendanceRegisterRow[]
}

export type { PayrollRun } from './payroll'

// ── Finance ───────────────────────────────────────────────────────────────────
export interface Account {
  id: string; accountCode: string; accountName: string
  accountType: 'ASSET'|'LIABILITY'|'EQUITY'|'INCOME'|'EXPENSE'
  parentId?: string; openingBalance: number; currentBalance: number
  isLeaf: boolean; description?: string
}
export interface JournalEntryLine {
  id?: string; accountId: string; accountName?: string; accountCode?: string
  debitAmount: number | string; creditAmount: number | string; narration?: string
}
export type JournalEntryType = 'JOURNAL'|'PAYMENT'|'RECEIPT'|'CONTRA'|'OPENING'
export interface JournalEntry {
  id: string; entryNumber: string; entryDate: string
  entryType: JournalEntryType
  narration: string; totalDebit: number | string; totalCredit: number | string
  posted: boolean
  /** "Manual entry", "Invoice", "Supplier bill", "Payroll"… */
  source: string
  /** Posted by the system from a document; corrected through that document. */
  automatic: boolean
  /** A manual entry that can still be reversed. */
  reversible: boolean
  reversedBy?: string | null
  lines: JournalEntryLine[]
}
export interface TrialBalance { accountId: string; accountCode: string; accountName: string; accountType: string; debit: number; credit: number; balance: number }

// ── Invoicing ─────────────────────────────────────────────────────────────────
export interface InvoiceLineItem {
  id?: string; itemId?: string; description: string; hsnSacCode?: string
  quantity: number; unit?: string; unitPrice: number; discountPct?: number
  taxableAmount: number; gstRate: number; cgstAmount: number; sgstAmount: number; igstAmount: number; totalAmount: number
}
export type InvoiceType = 'TAX_INVOICE'|'PROFORMA'|'QUOTATION'|'CREDIT_NOTE'|'DEBIT_NOTE'|'DELIVERY_CHALLAN'|'OPENING_BALANCE'
export type InvoiceStatus = 'DRAFT'|'SENT'|'VIEWED'|'PARTIAL'|'PAID'|'OVERDUE'|'CANCELLED'
export interface Invoice {
  id: string; invoiceNumber: string; invoiceType: InvoiceType; status: InvoiceStatus
  invoiceDate: string; dueDate?: string; financialYear?: string
  customerId: string; customerName: string; customerGstin?: string
  billingAddress?: string; shippingAddress?: string
  placeOfSupply?: string; placeOfSupplyName?: string; interState?: boolean; reverseCharge?: boolean
  subtotal: number; discountAmount: number; taxableAmount: number
  cgstAmount: number; sgstAmount: number; igstAmount: number
  totalAmount: number; paidAmount: number; outstanding: number
  currency?: string; paymentTerms?: string; notes?: string; terms?: string; irn?: string
  lineItems?: InvoiceLineItem[]
  // Reference / linkage fields
  customerPoNumber?: string    // Customer Purchase Order number
  workOrderNumber?: string     // Work Order / SOW number
  contractNumber?: string      // Contract / Agreement / AMC reference
  referenceLetterNumber?: string // Reference letter / dispatch authority
  ewayBillNumber?: string      // GSTN e-Way Bill number
  lrNumber?: string            // Lorry Receipt number
  dcReferenceNumber?: string   // Delivery Challan reference
  rfqNumber?: string           // RFQ / Tender reference
  additionalReference?: string // Any other reference
  // Delivery and collection
  payUrl?: string; sentAt?: string; viewedAt?: string; lastReminderAt?: string; reminderCount?: number
  cancelledAt?: string; cancelReason?: string
  /** e.g. credit beyond the MSMED Act's 45 days */
  warning?: string
  /** Whether issuing it moves the stock of the items on it (tax invoices and credit notes) */
  movesStock?: boolean
  /** The quotation, proforma or challan this invoice was made from */
  sourceId?: string | null; sourceNumber?: string | null; sourceType?: InvoiceType | null
  /** For a quotation, proforma or challan: the invoice made from it */
  convertedToId?: string | null; convertedToNumber?: string | null; convertedToStatus?: InvoiceStatus | null
  /** A quotation the customer accepted from its link */
  acceptedAt?: string | null; acceptedBy?: string | null
}
export interface InvoicePaymentRecord {
  id: string; invoiceId: string; paymentDate: string; amount: number; tdsAmount: number
  mode: string; reference?: string; source: 'MANUAL'|'BANK'|'RAZORPAY'|'LEGACY'; notes?: string
  voided: boolean; voidedAt?: string; voidReason?: string; createdAt?: string
}
export interface InvoiceStats {
  draft: number; sent: number; viewed?: number; paid: number; overdue: number; partial: number
  outstanding: number; totalRevenue: number; monthly?: { month: string; amount: number }[]
}

// ── Procurement ───────────────────────────────────────────────────────────────
export interface PurchaseOrderLineItem {
  id?: string; itemId?: string | null; description: string; hsnSacCode?: string; unit?: string
  quantity: number; unitPrice: number; gstRate?: number; totalAmount: number; receivedQty?: number
}
/** A supplier bill entered against a purchase order */
export interface PurchaseOrderBill { id: string; referenceNumber: string; billNumber?: string | null; status: string; billDate: string; totalAmount: number }
export type PurchaseOrderStatus = 'DRAFT'|'SUBMITTED'|'APPROVED'|'ORDERED'|'PARTIALLY_RECEIVED'|'RECEIVED'|'CANCELLED'
export interface PurchaseOrder {
  id: string; poNumber: string; vendorId: string; vendorName: string
  poDate: string; expectedDeliveryDate?: string
  status: PurchaseOrderStatus
  subtotal: number; taxAmount: number; totalAmount: number
  paymentTerms?: string; remarks?: string
  lineItems?: PurchaseOrderLineItem[]
  /** On a single order: the bills entered for it */
  bills?: PurchaseOrderBill[] | null
}
export interface Vendor {
  id: string; vendorCode?: string; name: string; gstin?: string; pan?: string
  email?: string; phone?: string; city?: string; state?: string; stateCode?: string
  contactPerson?: string; billingAddress?: string; paymentTerms?: string; creditLimit?: number | string
  bankAccount?: string; bankIfsc?: string
  status: 'ACTIVE'|'INACTIVE'|'BLACKLISTED'
  /** MSMED Act: MICRO / SMALL / MEDIUM, and MANUFACTURING / SERVICES / TRADING */
  msmeCategory?: string | null; msmeActivity?: string | null; udyamNumber?: string | null
  /** Default TDS on their bills (CONTRACTOR, PROFESSIONAL, …) and an optional fixed rate */
  tdsNature?: string | null; tdsRate?: number | string | null
  expenseAccountCode?: string | null
  /** Open bills less unused credit notes */
  outstanding?: number | string
}
export interface GoodsReceiptNote {
  id: string; grnNumber: string; purchaseOrderId: string; poNumber?: string
  vendorName?: string; receivedDate: string
  status: 'DRAFT'|'QUALITY_CHECK'|'ACCEPTED'|'PARTIALLY_ACCEPTED'|'REJECTED'
  totalItems: number; totalValue: number; remarks?: string
}

// ── Inventory ─────────────────────────────────────────────────────────────────
export interface InventoryItem {
  id: string; itemCode: string; itemName: string; category?: string; hsnSacCode?: string
  unit: string; purchasePrice?: number | null; sellingPrice?: number | null; gstRate: number
  currentStock: number; reorderLevel: number; minOrderQty?: number
  /** JSON name of the entity's isActive flag */
  active: boolean; description?: string
  /** Whether stock is kept: invoices and bills move it (off for services) */
  trackStock?: boolean
}
export type MovementType = 'IN'|'OUT'|'ADJUSTMENT'|'TRANSFER_IN'|'TRANSFER_OUT'|'OPENING'
export interface StockMovement {
  id: string; itemId: string; itemCode?: string; itemName?: string
  movementDate: string; movementType: MovementType
  quantity: number; unitCost?: number; referenceType?: string; referenceNumber?: string
  stockAfter: number; remarks?: string
}
/** One line of the stock ledger across items; change is + for stock in, − for stock out. */
export interface StockLedgerRow {
  id: string; itemId: string; itemCode?: string; itemName: string; unit?: string; date: string; type: MovementType
  change: number; unitCost?: number | null; reference?: string | null; stockAfter: number; remarks?: string | null
  /** INVOICE or BILL when a document made the movement (referenceId is its id); MANUAL, OPENING… otherwise */
  referenceType?: string | null; referenceId?: string | null
}
export interface StockRecheckResult { documentsChecked: number; movementsPosted: number; failed: number }
export interface StockDaySummary { date: string; stockIn: number; stockOut: number; adjustments: number; transfers: number }
/** What the item form sends (stock changes only through movements; opening stock on create). */
export interface InventoryItemInput {
  itemCode?: string; itemName: string; category?: string; hsnSacCode?: string; unit?: string
  purchasePrice?: number | null; sellingPrice?: number | null; gstRate?: number; reorderLevel?: number | null
  description?: string; active?: boolean; openingStock?: number | null; trackStock?: boolean
}
/** An item at or below its reorder level (the server sends the whole item). */
export interface LowStockAlert extends InventoryItem {}
/** The stock at a glance */
export interface StockSummary { items: number; tracked: number; stockValue: number; lowStock: number; belowZero: number }

// ── CRM ───────────────────────────────────────────────────────────────────────
export interface Customer {
  id: string; customerCode?: string; name: string; email?: string; phone?: string
  gstin?: string; pan?: string; city?: string; state?: string
  billingAddress?: string; shippingAddress?: string; paymentTerms?: string; notes?: string
  customerType?: 'REGULAR'|'PREMIUM'|'GOVERNMENT'|'INSTITUTIONAL'; creditLimit: number; outstanding: number
  /** automatic payment reminders for this customer's invoices */
  remindersEnabled?: boolean; active?: boolean
}
export interface Lead {
  id: string; name: string; email?: string; phone?: string; companyName?: string
  source?: string; estimatedValue?: number
  status: 'NEW'|'CONTACTED'|'QUALIFIED'|'PROPOSAL'|'NEGOTIATION'|'WON'|'LOST'
  assignedTo?: string; notes?: string; createdAt?: string
  nextFollowUp?: string; expectedCloseDate?: string; convertedToCustomerId?: string | null; industry?: string
}
/** What the lead card sends when its details are edited (only the fields present change) */
export interface LeadUpdate {
  name?: string; email?: string; phone?: string; companyName?: string; source?: string; industry?: string
  estimatedValue?: number | null; expectedCloseDate?: string | null; nextFollowUp?: string | null; clearFollowUp?: boolean; notes?: string
}
export interface LeadConversion { lead: Lead; customer: Customer; created: boolean }

// ── Workflow ──────────────────────────────────────────────────────────────────
export interface WorkflowInstance {
  id: string; entityType: string; entityId: string; currentStepOrder: number
  status: 'PENDING'|'APPROVED'|'REJECTED'|'CANCELLED'; createdAt?: string
}

// ── Banking ───────────────────────────────────────────────────────────────────
export interface BankTransaction { id: string; date: string; narration: string; amount: number; type: 'CREDIT'|'DEBIT'; balance: number }
export interface ReconciliationResult { bank: string; account: string; from: string; to: string; opening: number; closing: number; total: number; matched: number; unmatched: number; reconPct: number; timeSavedMinutes: number }

// ── Expenses ──────────────────────────────────────────────────────────────────
export interface ExpenseClaim { id: string; employeeName: string; category: string; amount: number; vendor: string; status: 'APPROVED'|'PENDING_REVIEW'|'REJECTED'; submittedAt: string; receiptUrl?: string; remarks: string; autoApproved: boolean }

// ── Subscriptions ─────────────────────────────────────────────────────────────
export interface Subscription { id: string; customerId: string; customerName: string; description: string; amount: number; frequency: 'MONTHLY'|'QUARTERLY'|'HALF_YEARLY'|'ANNUALLY'; startDate: string; nextBillingDate: string; status: 'ACTIVE'|'PAUSED'|'CANCELLED'; invoicesGenerated: number; totalBilled: number }

// ── TDS ───────────────────────────────────────────────────────────────────────
export interface TdsEntry { vendorId: string; vendorName: string; vendorPan: string; section: string; paymentAmount: number; tdsRate: number; tdsAmount: number; paymentDate: string; status: string }
export interface TdsSection { section: string; description: string; rateIndividual: number; rateCompany: number; threshold: number }

// ── Forecasting ───────────────────────────────────────────────────────────────
export interface ForecastItem { itemId: string; itemCode: string; itemName: string; currentStock: number; reorderLevel: number; avgDailyUsage: number; supplierLeadDays: number; predictedStockoutDate: string; recommendedOrderQty: number; riskScore: number; riskLevel: string; action: string }

// ── Signing ───────────────────────────────────────────────────────────────────
export interface SigningRequest { id: string; docType: string; documentName: string; documentId: string; signers: any[]; status: string; createdAt: string; completedAt?: string }

// ── Automation ────────────────────────────────────────────────────────────────
export interface AutomationRule { id: string; name: string; trigger: string; conditions: any[]; action: string; actionConfig?: string; active: boolean; executionsToday: number; lastRun?: string }

// ── Fixed Asset ───────────────────────────────────────────────────────────────
export interface FixedAsset { id: string; code: string; name: string; category: string; grossValue: number; wdv: number; depreciationRate: number; location: string; condition: string }

// ── Custom Plan / Module Pricing ──────────────────────────────────────────────
export interface PlanModule {
  module_key: string; display_name: string; description: string
  category: 'CORE'|'ERP'|'AI'|'SMART'
  base_price_month: number; price_per_user: number; min_users: number
  is_core: boolean; sort_order: number; icon_name: string; accent_color: string
  /** Still being built: shown on the plan builder, but can't be chosen or priced yet. */
  coming_soon?: boolean
}
export interface CustomQuote {
  monthlyTotal: number; annualTotal: number; annualMonthly: number
  users: number; savingsIfAnnual: number
  breakdown: { moduleKey: string; displayName: string; basePrice: number; perUserPrice: number; lineTotal: number }[]
}
