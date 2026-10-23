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
import { api } from './client'
import { download } from './purchases'
import type { ApiResponse } from '@/types'
import type {
  MyPayslip, PayPreview, PayrollItemInput, PayrollRun, PayrollRunDetail, SalarySetup, SalarySetupInput, SalarySetupRow,
} from '@/types/payroll'

const data = <T,>(r: { data: ApiResponse<T> }) => r.data.data as T

export const payrollApi = {
  runs: async () => data<PayrollRun[]>(await api.get('/payroll/runs')) ?? [],
  create: async (month: number, year: number, payDate?: string) =>
    data<PayrollRunDetail>(await api.post('/payroll/runs', { month, year, payDate: payDate || undefined })),
  get: async (id: string) => data<PayrollRunDetail>(await api.get(`/payroll/runs/${id}`)),
  recalculate: async (id: string) => data<PayrollRunDetail>(await api.post(`/payroll/runs/${id}/recalculate`)),
  updateItem: async (id: string, itemId: string, input: PayrollItemInput) =>
    data<PayrollRunDetail>(await api.put(`/payroll/runs/${id}/items/${itemId}`, input)),
  approve: async (id: string) => data<PayrollRunDetail>(await api.post(`/payroll/runs/${id}/approve`)),
  reopen: async (id: string) => data<PayrollRunDetail>(await api.post(`/payroll/runs/${id}/reopen`)),
  pay: async (id: string, p: { paidOn?: string; paidFrom?: 'BANK' | 'CASH'; reference?: string }) =>
    data<PayrollRunDetail>(await api.post(`/payroll/runs/${id}/pay`, p)),
  unpay: async (id: string) => data<PayrollRunDetail>(await api.post(`/payroll/runs/${id}/unpay`)),
  remove: async (id: string) => api.delete(`/payroll/runs/${id}`),

  bankFile: (id: string, ym: string) => download(`/payroll/runs/${id}/bank-file`, {}, `salary_transfer_${ym}.csv`),
  ecr: (id: string, ym: string) => download(`/payroll/runs/${id}/ecr`, {}, `pf_ecr_${ym}.txt`),
  esi: (id: string, ym: string) => download(`/payroll/runs/${id}/esi`, {}, `esi_contribution_${ym}.csv`),
  register: (id: string, ym: string) => download(`/payroll/runs/${id}/register`, {}, `salary_register_${ym}.csv`),
  payslips: (id: string, ym: string) => download(`/payroll/runs/${id}/payslips`, {}, `payslips_${ym}.zip`),
  payslip: (id: string, itemId: string, name: string) => download(`/payroll/runs/${id}/items/${itemId}/payslip`, {}, name),

  setups: async () => data<SalarySetupRow[]>(await api.get('/payroll/setup')) ?? [],
  setup: async (employeeId: string) => data<SalarySetup>(await api.get(`/payroll/setup/${employeeId}`)),
  saveSetup: async (employeeId: string, s: SalarySetupInput) => data<SalarySetup>(await api.put(`/payroll/setup/${employeeId}`, s)),
  preview: async (employeeId: string | undefined, setup: SalarySetupInput, month?: number, year?: number) =>
    data<PayPreview>(await api.post('/payroll/setup/preview', { employeeId, month, year, setup })),

  myPayslips: async () => data<MyPayslip[]>(await api.get('/payroll/my/payslips')) ?? [],
  myPayslip: (itemId: string, name: string) => download(`/payroll/my/payslips/${itemId}/pdf`, {}, name),
}

/** "2026-10" for a run (file names). */
export const runKey = (r: { year: number; month: number }) => `${r.year}-${String(r.month).padStart(2, '0')}`

export const PAYROLL_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft', APPROVED: 'Approved', PAID: 'Paid', PROCESSING: 'Processing', PROCESSED: 'Processed',
}

export const PF_MODE_LABEL: Record<string, string> = {
  CEILING: 'PF on wages up to the limit', ACTUAL: 'PF on full wages', NONE: 'Not a PF member',
}
export const ESI_MODE_LABEL: Record<string, string> = {
  AUTO: 'By pay (up to ₹21,000)', ALWAYS: 'Always covered', NEVER: 'Not covered',
}

/** States whose professional tax slabs are built in (GST state codes). */
export const PT_BUILT_IN = ['27', '29', '19', '33', '36', '37', '24', '23', '21', '18']
export const PT_NONE = ['06', '07', '08', '09']
