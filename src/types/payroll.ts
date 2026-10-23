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

/** Money arrives as JSON numbers; form inputs are kept as strings. */
type Amount = number | string

export type PayrollStatus = 'DRAFT' | 'APPROVED' | 'PAID' | 'PROCESSING' | 'PROCESSED'

export interface PayrollRun {
  id: string; month: number; year: number; label: string; status: PayrollStatus; payDate?: string; employees: number
  gross: Amount; deductions: Amount; net: Amount; employerCost: Amount; pf: Amount; esi: Amount; pt: Amount; tds: Amount
  approvedAt?: string; paidOn?: string; paidFrom?: string; paymentReference?: string
}

export interface PayAmount { code: string; label: string; amount: Amount }

export interface PayPf {
  member: boolean; wageLimit: Amount; epfWages: Amount; epsWages: Amount; edliWages: Amount
  employee: Amount; eps: Amount; employer: Amount; edli: Amount; admin: Amount
}
export interface PayEsi { covered: boolean; wages: Amount; employee: Amount; employer: Amount }
export interface PayTax {
  regime: string; projectedSalary: Amount; taxableIncome: Amount; annualTax: Amount; alreadyDeducted: Amount
  monthsLeft: number; monthly: Amount; overridden: boolean
}

export interface PayrollItem {
  id: string; employeeId: string; employeeCode?: string; employeeName: string; department?: string; designation?: string
  pan?: string; uan?: string; esiNumber?: string; bankName?: string; bankAccountMasked?: string; bankIfsc?: string
  bankReady: boolean; workState?: string
  daysInMonth: number; daysEmployed: Amount; lopDays: Amount; lopFromAttendance: Amount; lopOverride: boolean; paidDays: Amount
  overtime: Amount; bonus: Amount; commission: Amount; arrears: Amount; otherEarnings: Amount
  advanceRecovery: Amount; otherDeductions: Amount; tdsOverride?: Amount | null; inputNote?: string
  earnings: PayAmount[]; deductions: PayAmount[]; gross: Amount; codeWages: Amount; wagesAddedBack: Amount
  pf: PayPf; esi: PayEsi; pt: Amount; tds: Amount; totalDeductions: Amount; netPay: Amount; employerCost: Amount
  tax: PayTax; notes: string[]; warnings: string[]
}

export interface PayrollDues { pfDue: string; esiDue: string; tdsDue: string; pf: Amount; esi: Amount; pt: Amount; tds: Amount }

export interface PayrollRunDetail {
  run: PayrollRun; items: PayrollItem[]; notSetUp: string[]; blockers: string[]; warnings: number; dues: PayrollDues
}

export interface PayrollItemInput {
  lopDays?: Amount | null; resetLop?: boolean; overtime?: Amount; bonus?: Amount; commission?: Amount; arrears?: Amount
  otherEarnings?: Amount; advanceRecovery?: Amount; otherDeductions?: Amount; tdsOverride?: Amount | null
  clearTdsOverride?: boolean; note?: string
}

export interface MyPayslip {
  id: string; month: number; year: number; label: string; status: PayrollStatus
  gross: Amount; deductions: Amount; net: Amount; paidDays: Amount; paidOn?: string
}

export type PfMode = 'CEILING' | 'ACTUAL' | 'NONE'
export type EsiMode = 'AUTO' | 'ALWAYS' | 'NEVER'

export interface SalarySetupRow {
  employeeId: string; employeeCode?: string; name: string; department?: string; designation?: string; status?: string
  dateOfJoining?: string; hasSetup: boolean; monthlyGross?: Amount | null; codeWages?: Amount | null
  pfMode?: PfMode | null; esiMode?: EsiMode | null; workState?: string | null; taxRegime?: string | null; missing: string[]
}

export interface SalarySetup {
  employeeId: string; employeeCode?: string; name: string; exists: boolean
  basic: Amount; da: Amount; hra: Amount; conveyance: Amount; specialAllowance: Amount; otherAllowance: Amount
  fixedDeduction: Amount; fixedDeductionLabel?: string | null
  pfMode: PfMode; epsMember: boolean; uan?: string | null; esiMode: EsiMode; disabled: boolean
  workState?: string | null; ptExempt: boolean; ptFixed?: Amount | null
  taxRegime: 'NEW' | 'OLD'; rentPaidMonthly: Amount; metroCity: boolean; declared80c: Amount; declared80d: Amount
  declaredNps: Amount; otherIncome: Amount; previousEmployerSalary: Amount; previousEmployerTds: Amount
  declarationsYear?: number | null; notes?: string | null; ctcAnnual?: Amount | null; pan?: string | null
  esiNumber?: string | null; bankReady: boolean
}

export type SalarySetupInput = Omit<SalarySetup, 'employeeId' | 'employeeCode' | 'name' | 'exists' | 'declarationsYear' | 'ctcAnnual' | 'pan' | 'esiNumber' | 'bankReady'>

export interface PayPreview {
  month: string; gross: Amount; codeWages: Amount; wagesAddedBack: Amount; pf: PayPf; esi: PayEsi; pt: Amount; tax: PayTax
  earnings: PayAmount[]; deductions: PayAmount[]; totalDeductions: Amount; netPay: Amount; employerCost: Amount
  notes: string[]; warnings: string[]
}
