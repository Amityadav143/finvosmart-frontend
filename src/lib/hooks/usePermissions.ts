'use client'
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

import { useAuthStore } from '@/lib/store/slices/authStore'

/**
 * FINVOSMART — Frontend RBAC Hook
 *
 * Usage:
 *   const { can, isAdmin, isHR, isFinance } = usePermissions()
 *   if (!can('INVOICE_CREATE')) return <AccessDenied />
 */

// Mirror of backend Permission.java constants
export const PERMS = {
  DASHBOARD_VIEW:       'DASHBOARD_VIEW',
  EMPLOYEE_VIEW:        'EMPLOYEE_VIEW',
  EMPLOYEE_CREATE:      'EMPLOYEE_CREATE',
  EMPLOYEE_EDIT:        'EMPLOYEE_EDIT',
  EMPLOYEE_DELETE:      'EMPLOYEE_DELETE',
  EMPLOYEE_EXPORT:      'EMPLOYEE_EXPORT',
  ATTENDANCE_VIEW:      'ATTENDANCE_VIEW',
  ATTENDANCE_CREATE:    'ATTENDANCE_CREATE',
  ATTENDANCE_EDIT:      'ATTENDANCE_EDIT',
  ATTENDANCE_ADMIN:     'ATTENDANCE_ADMIN',
  LEAVE_VIEW:           'LEAVE_VIEW',
  LEAVE_APPLY:          'LEAVE_APPLY',
  LEAVE_APPROVE:        'LEAVE_APPROVE',
  LEAVE_ADMIN:          'LEAVE_ADMIN',
  PAYROLL_VIEW:         'PAYROLL_VIEW',
  PAYROLL_PROCESS:      'PAYROLL_PROCESS',
  PAYROLL_ADMIN:        'PAYROLL_ADMIN',
  WELLNESS_VIEW:        'WELLNESS_VIEW',
  WELLNESS_ADMIN:       'WELLNESS_ADMIN',
  FINANCE_VIEW:         'FINANCE_VIEW',
  FINANCE_CREATE:       'FINANCE_CREATE',
  FINANCE_EDIT:         'FINANCE_EDIT',
  FINANCE_DELETE:       'FINANCE_DELETE',
  FINANCE_APPROVE:      'FINANCE_APPROVE',
  FINANCE_REPORTS:      'FINANCE_REPORTS',
  FINANCE_ADMIN:        'FINANCE_ADMIN',
  INVOICE_VIEW:         'INVOICE_VIEW',
  INVOICE_CREATE:       'INVOICE_CREATE',
  INVOICE_EDIT:         'INVOICE_EDIT',
  INVOICE_DELETE:       'INVOICE_DELETE',
  INVOICE_APPROVE:      'INVOICE_APPROVE',
  INVOICE_SEND:         'INVOICE_SEND',
  INVOICE_EXPORT:       'INVOICE_EXPORT',
  CRM_VIEW:             'CRM_VIEW',
  CRM_CREATE:           'CRM_CREATE',
  CRM_EDIT:             'CRM_EDIT',
  CRM_DELETE:           'CRM_DELETE',
  CRM_ADMIN:            'CRM_ADMIN',
  PROCUREMENT_VIEW:     'PROCUREMENT_VIEW',
  PROCUREMENT_CREATE:   'PROCUREMENT_CREATE',
  PROCUREMENT_EDIT:     'PROCUREMENT_EDIT',
  PROCUREMENT_DELETE:   'PROCUREMENT_DELETE',
  PROCUREMENT_APPROVE:  'PROCUREMENT_APPROVE',
  PROCUREMENT_RECEIVE:  'PROCUREMENT_RECEIVE',
  INVENTORY_VIEW:       'INVENTORY_VIEW',
  INVENTORY_CREATE:     'INVENTORY_CREATE',
  INVENTORY_EDIT:       'INVENTORY_EDIT',
  INVENTORY_ADJUST:     'INVENTORY_ADJUST',
  INVENTORY_ADMIN:      'INVENTORY_ADMIN',
  PROJECT_VIEW:         'PROJECT_VIEW',
  PROJECT_CREATE:       'PROJECT_CREATE',
  PROJECT_EDIT:         'PROJECT_EDIT',
  PROJECT_DELETE:       'PROJECT_DELETE',
  PROJECT_MANAGE:       'PROJECT_MANAGE',
  REPORTS_VIEW:         'REPORTS_VIEW',
  REPORTS_EXPORT:       'REPORTS_EXPORT',
  REPORTS_ADMIN:        'REPORTS_ADMIN',
  AI_CASHFLOW_VIEW:     'AI_CASHFLOW_VIEW',
  AI_CASHFLOW_RUN:      'AI_CASHFLOW_RUN',
  AI_SCANNER_USE:       'AI_SCANNER_USE',
  AI_WELLNESS_VIEW:     'AI_WELLNESS_VIEW',
  AI_WELLNESS_ADMIN:    'AI_WELLNESS_ADMIN',
  GST_RECON_VIEW:       'GST_RECON_VIEW',
  GST_RECON_RUN:        'GST_RECON_RUN',
  VOICE_USE:            'VOICE_USE',
  BANK_RECON_VIEW:      'BANK_RECON_VIEW',
  BANK_RECON_RUN:       'BANK_RECON_RUN',
  BANK_RECON_APPROVE:   'BANK_RECON_APPROVE',
  EXPENSE_VIEW:         'EXPENSE_VIEW',
  EXPENSE_SUBMIT:       'EXPENSE_SUBMIT',
  EXPENSE_APPROVE:      'EXPENSE_APPROVE',
  EXPENSE_ADMIN:        'EXPENSE_ADMIN',
  PORTAL_VIEW:          'PORTAL_VIEW',
  PORTAL_ADMIN:         'PORTAL_ADMIN',
  SUBSCRIPTIONS_VIEW:   'SUBSCRIPTIONS_VIEW',
  SUBSCRIPTIONS_ADMIN:  'SUBSCRIPTIONS_ADMIN',
  TDS_VIEW:             'TDS_VIEW',
  TDS_PROCESS:          'TDS_PROCESS',
  FORECAST_VIEW:        'FORECAST_VIEW',
  FORECAST_RUN:         'FORECAST_RUN',
  ESIGN_USE:            'ESIGN_USE',
  ESIGN_ADMIN:          'ESIGN_ADMIN',
  AUTOMATIONS_VIEW:     'AUTOMATIONS_VIEW',
  AUTOMATIONS_MANAGE:   'AUTOMATIONS_MANAGE',
  WHATSAPP_VIEW:        'WHATSAPP_VIEW',
  WHATSAPP_SEND:        'WHATSAPP_SEND',
  SETTINGS_VIEW:        'SETTINGS_VIEW',
  SETTINGS_COMPANY:     'SETTINGS_COMPANY',
  SETTINGS_USERS:       'SETTINGS_USERS',
  SETTINGS_ROLES:       'SETTINGS_ROLES',
  SETTINGS_MODULES:     'SETTINGS_MODULES',
  SETTINGS_WORKFLOW:    'SETTINGS_WORKFLOW',
  SETTINGS_BILLING:     'SETTINGS_BILLING',
  AUDIT_LOG_VIEW:       'AUDIT_LOG_VIEW',
} as const

export type PermKey = keyof typeof PERMS

export function usePermissions() {
  const { user } = useAuthStore()
  const roles       = user?.roles       ?? []
  const permissions = user?.permissions ?? []

  // Super-admin bypass
  const isSuperAdmin = roles.includes('SUPER_ADMIN')

  /** Check a single permission */
  const can = (perm: string): boolean => {
    if (isSuperAdmin) return true
    return permissions.includes(perm)
  }

  /** Check any of the permissions */
  const canAny = (...perms: string[]): boolean => {
    if (isSuperAdmin) return true
    return perms.some(p => permissions.includes(p))
  }

  /** Check all of the permissions */
  const canAll = (...perms: string[]): boolean => {
    if (isSuperAdmin) return true
    return perms.every(p => permissions.includes(p))
  }

  /** Role shortcuts */
  const hasRole = (role: string) => roles.includes(role)

  return {
    can,
    canAny,
    canAll,
    hasRole,
    roles,
    permissions,
    isSuperAdmin,
    isAdmin:       isSuperAdmin || hasRole('COMPANY_ADMIN'),
    isManager:     isSuperAdmin || hasRole('MANAGER'),
    isHR:          isSuperAdmin || hasRole('HR_ADMIN'),
    isFinance:     isSuperAdmin || hasRole('FINANCE_ADMIN') || hasRole('ACCOUNTANT'),
    isSales:       isSuperAdmin || hasRole('SALES_EXEC'),
    isEmployee:    hasRole('EMPLOYEE'),
    isViewer:      hasRole('VIEWER'),
    canViewHR:     canAny('EMPLOYEE_VIEW', 'ATTENDANCE_VIEW', 'LEAVE_VIEW', 'PAYROLL_VIEW'),
    canViewFinance:canAny('FINANCE_VIEW', 'INVOICE_VIEW'),
    canApprove:    canAny('LEAVE_APPROVE', 'PROCUREMENT_APPROVE', 'EXPENSE_APPROVE', 'INVOICE_APPROVE', 'FINANCE_APPROVE'),
  }
}
