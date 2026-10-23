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
import type { ApiResponse, PageResponse, Employee, EmployeeStats, LeaveApplication, AttendanceRecord, AttendanceRegister, AttendanceStatus, Department, Designation } from '@/types'
import { payrollApi } from './payroll'

export const hrmsApi = {
  employees: {
    list: async (p: { page?: number; size?: number; query?: string; status?: string; departmentId?: string } = {}) =>
      (await api.get<ApiResponse<PageResponse<Employee>>>('/employees', { params: { page: p.page??0, size: p.size??20, query: p.query, status: p.status, departmentId: p.departmentId } })).data.data!,
    get: async (id: string) => (await api.get<ApiResponse<Employee>>(`/employees/${id}`)).data.data!,
    create: async (d: Partial<Employee>) => (await api.post<ApiResponse<Employee>>('/employees', d)).data.data!,
    update: async (id: string, d: Partial<Employee>) => (await api.put<ApiResponse<Employee>>(`/employees/${id}`, d)).data.data!,
    delete: async (id: string) => (await api.delete(`/employees/${id}`)).data,
    stats: async (): Promise<EmployeeStats> => (await api.get<ApiResponse<EmployeeStats>>('/employees/dashboard/stats')).data.data!,
    departments: async () => (await api.get<ApiResponse<Department[]>>('/admin/departments')).data.data ?? [],
    designations: async () => (await api.get<ApiResponse<Designation[]>>('/admin/designations')).data.data ?? [],
  },
  attendance: {
    /** The month's register (month = YYYY-MM): a code per employee per day, with counts and unpaid days. */
    register: async (month: string) =>
      (await api.get<ApiResponse<AttendanceRegister>>('/attendance/register', { params: { month } })).data.data!,
    /** Adds or changes one employee's mark for a day. */
    set: async (employeeId: string, date: string, d: { status: AttendanceStatus; remarks?: string }) =>
      (await api.put<ApiResponse<AttendanceRecord>>(`/attendance/${employeeId}/${date}`, d)).data.data!,
    clear: async (employeeId: string, date: string) => (await api.delete(`/attendance/${employeeId}/${date}`)).data,
    /** Marks a day for several employees; days already marked stay as they are unless overwrite is set. */
    markDay: async (date: string, d: { status: AttendanceStatus; employeeIds: string[]; overwrite?: boolean }) =>
      (await api.put<ApiResponse<{ marked: number }>>(`/attendance/day/${date}`, d)).data.data!,
    /** One employee's marks between two dates (your own, without attendance rights). */
    forEmployee: async (employeeId: string, from: string, to: string) =>
      (await api.get<ApiResponse<AttendanceRecord[]>>(`/attendance/employee/${employeeId}`, { params: { from, to } })).data.data ?? [],
  },
  leave: {
    /** Leave types are names until a leave-types table exists; the server derives a stable id from the name. */
    apply: async (d: { leaveTypeId?: string; leaveTypeName?: string; fromDate: string; toDate: string; reason: string }) =>
      (await api.post<ApiResponse<LeaveApplication>>('/leaves/apply', d)).data.data!,
    /** Waiting for a decision (approvers only). */
    pending: async (): Promise<LeaveApplication[]> => (await api.get<ApiResponse<LeaveApplication[]>>('/leaves/pending')).data.data ?? [],
    /** Decided recently, newest first (approvers only). */
    decided: async (limit = 50): Promise<LeaveApplication[]> =>
      (await api.get<ApiResponse<LeaveApplication[]>>('/leaves/decided', { params: { limit } })).data.data ?? [],
    process: async (id: string, action: 'APPROVED'|'REJECTED', remarks?: string) =>
      (await api.post(`/leaves/${id}/process`, { action, remarks })).data,
    /** The signed-in employee's own requests. */
    my: async () => (await api.get<ApiResponse<LeaveApplication[]>>('/leaves/my')).data.data ?? [],
  },
  /** Payroll lives in its own client (lib/api/payroll.ts); kept here for older imports. */
  payroll: payrollApi,
}
