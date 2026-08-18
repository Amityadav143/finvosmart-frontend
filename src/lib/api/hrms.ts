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

import { api } from './client'
import type { ApiResponse, PageResponse, Employee, EmployeeStats, LeaveApplication, AttendanceRecord, PayrollRun } from '@/types'

export const hrmsApi = {
  employees: {
    list: async (p: { page?: number; size?: number; query?: string; status?: string; departmentId?: string } = {}) =>
      (await api.get<ApiResponse<PageResponse<Employee>>>('/employees', { params: { page: p.page??0, size: p.size??20, query: p.query, status: p.status, departmentId: p.departmentId } })).data.data!,
    get: async (id: string) => (await api.get<ApiResponse<Employee>>(`/employees/${id}`)).data.data!,
    create: async (d: Partial<Employee>) => (await api.post<ApiResponse<Employee>>('/employees', d)).data.data!,
    update: async (id: string, d: Partial<Employee>) => (await api.put<ApiResponse<Employee>>(`/employees/${id}`, d)).data.data!,
    delete: async (id: string) => (await api.delete(`/employees/${id}`)).data,
    stats: async (): Promise<EmployeeStats> => (await api.get<ApiResponse<EmployeeStats>>('/employees/dashboard/stats')).data.data!,
  },
  attendance: {
    mark: async (d: { employeeId?: string; attendanceDate: string; status: string; source?: string; checkInTime?: string; checkOutTime?: string; remarks?: string }) =>
      (await api.post<ApiResponse<AttendanceRecord>>('/attendance', d)).data.data!,
    list: async (params: { employeeId?: string; from?: string; to?: string; page?: number; size?: number } = {}) =>
      (await api.get<ApiResponse<PageResponse<AttendanceRecord>>>('/attendance', { params })).data.data!,
    today: async () => (await api.get<ApiResponse<AttendanceRecord[]>>('/attendance/today')).data.data ?? [],
  },
  leave: {
    apply: async (d: { leaveTypeId: string; fromDate: string; toDate: string; reason: string }) =>
      (await api.post<ApiResponse<LeaveApplication>>('/leaves/apply', d)).data.data!,
    pending: async (): Promise<LeaveApplication[]> => (await api.get<ApiResponse<LeaveApplication[]>>('/leaves/pending')).data.data ?? [],
    process: async (id: string, action: 'APPROVED'|'REJECTED', remarks?: string) =>
      (await api.post(`/leaves/${id}/process`, { action, remarks })).data,
    my: async () => (await api.get<ApiResponse<LeaveApplication[]>>('/leaves/my')).data.data ?? [],
  },
  payroll: {
    list: async () => (await api.get<ApiResponse<PayrollRun[]>>('/payroll/runs')).data.data ?? [],
    process: async (payMonth: string, payYear: number, payDate: string) =>
      (await api.post<ApiResponse<PayrollRun>>('/payroll/runs/process', { payMonth, payYear, payDate })).data.data!,
    get: async (id: string) => (await api.get<ApiResponse<PayrollRun>>(`/payroll/runs/${id}`)).data.data!,
  },
}
