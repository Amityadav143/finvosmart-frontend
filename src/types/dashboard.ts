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

export interface DashMonth { month: string; label: string; invoiced: Amount; collected: Amount }
export interface DashDebtor { customerId?: string; name: string; overdue: Amount; invoices: number; daysLate: number }
export interface DashSales {
  receivable: Amount; openInvoices: number; overdue: Amount; overdueCount: number; drafts: number
  invoicedThisMonth: Amount; collectedThisMonth: Amount; invoicedLastMonth: Amount; collectedLastMonth: Amount
  avgDaysToGetPaid?: number | null; months: DashMonth[]; overdueCustomers: DashDebtor[]
}
export interface DashPayables {
  owed: Amount; openBills: number; overdue: Amount; overdueCount: number; dueNext7Days: Amount; dueNext7Count: number
  msmeLate: Amount; msmeLateCount: number; paidThisMonth: Amount; tdsThisMonth: Amount; tdsDepositDue?: string
}
export interface DashCash { total: Amount; accounts: { code: string; name: string; balance: Amount }[]; hasEntries: boolean }
export interface DashProfit {
  incomeThisMonth: Amount; expensesThisMonth: Amount; profitThisMonth: Amount
  incomeYear: Amount; expensesYear: Amount; profitYear: Amount; financialYear: string
}
export interface DashGst {
  period: string; outputTax: Amount; inputTax: Amount; reverseCharge: Amount; estimatedPayable: Amount
  creditCarriedForward: Amount; gstr1Due: string; gstr3bDue: string
}
export interface DashPayroll {
  latestId?: string; latestLabel?: string; latestStatus?: string; latestNet?: Amount; latestCost?: Amount
  currentId?: string; currentLabel: string; currentStatus?: string | null; employeesSetUp: number; employeesMissingSetUp: number
}
export interface DashPeople { active: number; onNotice: number; onLeaveToday: number; joinedThisMonth: number; leavingThisMonth: number; pendingLeave?: number | null }
export interface DashStock { lowCount: number; items: { code: string; name: string; stock: Amount; reorderLevel: Amount }[] }
export interface DashAction { tone: 'red' | 'amber' | 'blue'; title: string; detail: string; href: string }
export interface DashDeadline { date: string; area: 'GST' | 'TDS' | 'PAYROLL' | 'INCOME_TAX'; title: string; detail: string; daysLeft: number }

/** DashboardDto.Setup */
export interface SetupStatus {
  companyDetails: boolean; paymentDetails: boolean
  customers: number; suppliers: number; items: number; invoicesIssued: number; billsRecorded: number; users: number; employees: number
}

export interface DashboardSummary {
  today: string; financialYear: string
  sales?: DashSales | null; payables?: DashPayables | null; cash?: DashCash | null; profit?: DashProfit | null; gst?: DashGst | null
  payroll?: DashPayroll | null; people?: DashPeople | null; stock?: DashStock | null
  actions: DashAction[]; deadlines: DashDeadline[]
}

export interface DashBucket { key: string; label: string; amount: Amount; count: number }
export interface DashNamed { name: string; amount: Amount; count: number }
export interface DashAnalytics {
  months: number; from: string; to: string; invoiced?: Amount | null; collected?: Amount | null; receivable?: Amount | null; overdue?: Amount | null
  sales?: DashMonth[] | null; receivableAgeing?: DashBucket[] | null; topCustomers?: DashNamed[] | null; payableAgeing?: DashBucket[] | null
  headcountByDepartment?: DashNamed[] | null; leadsByStatus?: DashNamed[] | null
}
