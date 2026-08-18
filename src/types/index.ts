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
}

// ── HRMS ──────────────────────────────────────────────────────────────────────
export interface Employee {
  id: string; employeeCode: string; firstName: string; middleName?: string
  lastName: string; fullName: string; officialEmail?: string; phonePrimary?: string
  departmentId?: string; departmentName?: string; designationName?: string
  branchId?: string; branchName?: string; companyId: string
  employmentType: 'PERMANENT'|'CONTRACT'|'INTERN'|'CONSULTANT'|'PART_TIME'
  status: 'ACTIVE'|'INACTIVE'|'ON_NOTICE'|'RESIGNED'|'TERMINATED'|'ON_LEAVE'
  dateOfJoining?: string; dateOfBirth?: string; ctcAnnual?: number
  photoUrl?: string; gender?: string; customData?: Record<string,string>
}
export interface EmployeeStats { totalActive: number; onNotice: number; onLeave: number; terminated: number }

export interface LeaveApplication {
  id: string; employeeId: string; employeeName?: string; employeeCode?: string
  leaveTypeName: string; leaveTypeId?: string; fromDate: string; toDate: string
  totalDays: number; reason: string
  status: 'PENDING'|'APPROVED'|'REJECTED'|'CANCELLED'|'WITHDRAWN'
  approvalRemarks?: string; createdAt: string
}

export interface AttendanceRecord {
  id: string; employeeId: string; employeeName?: string; employeeCode?: string
  attendanceDate: string; checkInTime?: string; checkOutTime?: string
  status: 'PRESENT'|'ABSENT'|'HALF_DAY'|'WFH'|'ON_LEAVE'|'HOLIDAY'|'WEEKEND'
  source?: string; hoursWorked?: number; remarks?: string
}

export interface PayrollRun {
  id: string; payMonth: string; payYear: number; employeeCount: number
  grossPayroll: number; totalDeductions: number; netPayroll: number
  status: 'DRAFT'|'PROCESSING'|'PROCESSED'|'PAID'; processedAt?: string
}

// ── Finance ───────────────────────────────────────────────────────────────────
export interface Account {
  id: string; accountCode: string; accountName: string
  accountType: 'ASSET'|'LIABILITY'|'EQUITY'|'INCOME'|'EXPENSE'
  parentId?: string; openingBalance: number; currentBalance: number
  isLeaf: boolean; description?: string
}
export interface JournalEntryLine {
  id?: string; accountId: string; accountName?: string; accountCode?: string
  debitAmount: number; creditAmount: number; narration?: string
}
export interface JournalEntry {
  id: string; entryNumber: string; entryDate: string
  entryType: 'JOURNAL'|'PAYMENT'|'RECEIPT'|'CONTRA'|'OPENING'
  narration: string; totalDebit: number; totalCredit: number
  isPosted: boolean; lines: JournalEntryLine[]
}
export interface TrialBalance { accountId: string; accountCode: string; accountName: string; accountType: string; debit: number; credit: number; balance: number }

// ── Invoicing ─────────────────────────────────────────────────────────────────
export interface InvoiceLineItem {
  id?: string; itemId?: string; itemName: string; description?: string
  quantity: number; unit?: string; unitPrice: number; discountPct?: number
  gstRate: number; cgst: number; sgst: number; igst: number; lineTotal: number
}
export interface Invoice {
  id: string; invoiceNumber: string; invoiceDate: string; dueDate?: string
  customerId: string; customerName: string; customerGstin?: string
  billingAddress?: string; shippingAddress?: string
  invoiceType: 'TAX_INVOICE'|'PROFORMA'|'QUOTATION'|'CREDIT_NOTE'|'DEBIT_NOTE'|'DELIVERY_CHALLAN'
  status: 'DRAFT'|'SENT'|'PAID'|'OVERDUE'|'PARTIAL'|'CANCELLED'
  subtotal: number; totalDiscount: number; totalGst: number; totalAmount: number; outstanding: number
  lineItems?: InvoiceLineItem[]; notes?: string; termsAndConditions?: string; paymentTerms?: string
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
}
export interface InvoiceStats { draft: number; sent: number; paid: number; overdue: number; partial: number; outstanding: number; totalRevenue: number }

// ── Procurement ───────────────────────────────────────────────────────────────
export interface PurchaseOrderLineItem { itemId?: string; itemName: string; quantity: number; unit?: string; unitPrice: number; taxRate?: number; lineTotal: number }
export interface PurchaseOrder {
  id: string; poNumber: string; vendorId: string; vendorName: string
  poDate: string; expectedDeliveryDate?: string
  status: 'DRAFT'|'SUBMITTED'|'APPROVED'|'ORDERED'|'PARTIALLY_RECEIVED'|'RECEIVED'|'CANCELLED'
  subtotal: number; taxAmount: number; totalAmount: number; notes?: string
  lineItems?: PurchaseOrderLineItem[]
}
export interface Vendor {
  id: string; vendorCode?: string; name: string; gstin?: string; pan?: string
  email?: string; phone?: string; city?: string; state?: string
  status: 'ACTIVE'|'INACTIVE'|'BLOCKED'; creditDays?: number; totalOrders?: number; totalValue?: number
}
export interface GoodsReceiptNote {
  id: string; grnNumber: string; purchaseOrderId: string; poNumber?: string
  vendorName?: string; receivedDate: string
  status: 'DRAFT'|'QUALITY_CHECK'|'ACCEPTED'|'PARTIALLY_ACCEPTED'|'REJECTED'
  totalItems: number; totalValue: number; remarks?: string
}

// ── Inventory ─────────────────────────────────────────────────────────────────
export interface InventoryItem {
  id: string; itemCode: string; itemName: string; category?: string
  unit: string; purchasePrice: number; sellingPrice: number; gstRate: number
  currentStock: number; reorderLevel: number; isActive: boolean; description?: string
}
export interface StockMovement {
  id: string; itemId: string; itemCode?: string; itemName?: string
  movementDate: string; movementType: 'IN'|'OUT'|'ADJUSTMENT'|'TRANSFER_IN'|'TRANSFER_OUT'
  quantity: number; unitCost?: number; referenceType?: string; referenceNumber?: string
  stockAfter: number; remarks?: string
}
export interface LowStockAlert { id: string; itemCode: string; itemName: string; currentStock: number; reorderLevel: number; unit: string }

// ── CRM ───────────────────────────────────────────────────────────────────────
export interface Customer {
  id: string; customerCode?: string; name: string; email?: string; phone?: string
  gstin?: string; pan?: string; address?: string; city?: string; state?: string
  customerType?: 'RETAIL'|'CORPORATE'|'GOVERNMENT'|'PREMIUM'; creditLimit: number; outstanding: number
}
export interface Lead {
  id: string; name: string; email?: string; phone?: string; companyName?: string
  source?: string; estimatedValue?: number
  status: 'NEW'|'CONTACTED'|'QUALIFIED'|'PROPOSAL'|'NEGOTIATION'|'WON'|'LOST'
  assignedTo?: string; notes?: string; createdAt?: string
}

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
}
export interface CustomQuote {
  monthlyTotal: number; annualTotal: number; annualMonthly: number
  users: number; savingsIfAnnual: number
  breakdown: { moduleKey: string; displayName: string; basePrice: number; perUserPrice: number; lineTotal: number }[]
}
