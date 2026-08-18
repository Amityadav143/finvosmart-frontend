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

import { useState } from 'react'
import { Shield, Check, X, Info, ChevronDown, ChevronRight, Users, Plus, Edit2 } from 'lucide-react'
import { usePermissions, PERMS } from '@/lib/hooks/usePermissions'
import { PermissionGate } from '@/components/ui/PermissionGate'

const SYSTEM_ROLES = [
  { name: 'SUPER_ADMIN',   display: 'Super Admin',        color: '#f59e0b', desc: 'Full system access — everything',                       users: 1 },
  { name: 'COMPANY_ADMIN', display: 'Company Admin',      color: '#3b82f6', desc: 'Full access within the company',                        users: 2 },
  { name: 'MANAGER',       display: 'Manager',            color: '#8b5cf6', desc: 'Approve leaves, POs, expenses; team view',              users: 4 },
  { name: 'FINANCE_ADMIN', display: 'Finance Admin',      color: '#16a34a', desc: 'Full finance, invoicing, GST, bank reconciliation',     users: 3 },
  { name: 'HR_ADMIN',      display: 'HR Admin',           color: '#ec4899', desc: 'Full HRMS: employees, payroll, wellness',               users: 2 },
  { name: 'ACCOUNTANT',    display: 'Accountant',         color: '#0d9488', desc: 'Finance create/edit (no delete), invoicing, TDS',       users: 5 },
  { name: 'SALES_EXEC',    display: 'Sales Executive',    color: '#ea580c', desc: 'CRM, Invoicing, client portal, WhatsApp',               users: 8 },
  { name: 'EMPLOYEE',      display: 'Employee',           color: '#64748b', desc: 'Own attendance, leave, payslip, expenses',              users: 42 },
  { name: 'VIEWER',        display: 'Viewer (Read-only)', color: '#94a3b8', desc: 'Read-only access to assigned modules',                  users: 3 },
]

const PERMISSION_GROUPS = [
  { group: 'HRMS', color: '#2563EB', perms: [
    { key:'EMPLOYEE_VIEW',    label:'View Employees' },
    { key:'EMPLOYEE_CREATE',  label:'Create Employees' },
    { key:'EMPLOYEE_EDIT',    label:'Edit Employees' },
    { key:'EMPLOYEE_DELETE',  label:'Delete Employees' },
    { key:'ATTENDANCE_VIEW',  label:'View Attendance' },
    { key:'ATTENDANCE_ADMIN', label:'Admin Attendance' },
    { key:'LEAVE_VIEW',       label:'View Leaves' },
    { key:'LEAVE_APPLY',      label:'Apply Leave' },
    { key:'LEAVE_APPROVE',    label:'Approve Leaves' },
    { key:'LEAVE_ADMIN',      label:'Admin Leaves' },
    { key:'PAYROLL_VIEW',     label:'View Payroll' },
    { key:'PAYROLL_PROCESS',  label:'Process Payroll' },
    { key:'WELLNESS_VIEW',    label:'View Wellness' },
    { key:'WELLNESS_ADMIN',   label:'Admin Wellness' },
  ]},
  { group: 'Finance', color: '#16A34A', perms: [
    { key:'FINANCE_VIEW',     label:'View Finance' },
    { key:'FINANCE_CREATE',   label:'Create Entries' },
    { key:'FINANCE_EDIT',     label:'Edit Entries' },
    { key:'FINANCE_DELETE',   label:'Delete Entries' },
    { key:'FINANCE_APPROVE',  label:'Approve Entries' },
    { key:'FINANCE_REPORTS',  label:'View P&L / B/S' },
    { key:'FINANCE_ADMIN',    label:'Admin (FY close)' },
  ]},
  { group: 'Invoicing', color: '#E9C46A', perms: [
    { key:'INVOICE_VIEW',     label:'View Invoices' },
    { key:'INVOICE_CREATE',   label:'Create Invoices' },
    { key:'INVOICE_EDIT',     label:'Edit Invoices' },
    { key:'INVOICE_DELETE',   label:'Delete Invoices' },
    { key:'INVOICE_APPROVE',  label:'Approve Invoices' },
    { key:'INVOICE_SEND',     label:'Send via WhatsApp' },
    { key:'INVOICE_EXPORT',   label:'Export / PDF' },
  ]},
  { group: 'CRM', color: '#7C3AED', perms: [
    { key:'CRM_VIEW',         label:'View CRM' },
    { key:'CRM_CREATE',       label:'Create Leads' },
    { key:'CRM_EDIT',         label:'Edit Leads' },
    { key:'CRM_DELETE',       label:'Delete Leads' },
    { key:'CRM_ADMIN',        label:'Admin Pipeline' },
  ]},
  { group: 'Procurement', color: '#EA580C', perms: [
    { key:'PROCUREMENT_VIEW',    label:'View POs' },
    { key:'PROCUREMENT_CREATE',  label:'Create POs' },
    { key:'PROCUREMENT_EDIT',    label:'Edit POs' },
    { key:'PROCUREMENT_APPROVE', label:'Approve POs' },
    { key:'PROCUREMENT_RECEIVE', label:'Record GRN' },
  ]},
  { group: 'Inventory', color: '#0D9488', perms: [
    { key:'INVENTORY_VIEW',   label:'View Inventory' },
    { key:'INVENTORY_CREATE', label:'Add Items' },
    { key:'INVENTORY_EDIT',   label:'Edit Items' },
    { key:'INVENTORY_ADJUST', label:'Stock Adjustments' },
    { key:'INVENTORY_ADMIN',  label:'Item Master Admin' },
  ]},
  { group: 'AI Features', color: '#8B5CF6', perms: [
    { key:'AI_CASHFLOW_VIEW', label:'View Cash Flow AI' },
    { key:'AI_CASHFLOW_RUN',  label:'Run Forecasts' },
    { key:'AI_SCANNER_USE',   label:'Use Bill Scanner' },
    { key:'AI_WELLNESS_VIEW', label:'View Wellness AI' },
    { key:'AI_WELLNESS_ADMIN',label:'Admin Wellness AI' },
    { key:'GST_RECON_VIEW',   label:'View GST Reconciler' },
    { key:'GST_RECON_RUN',    label:'Run GST Reconcile' },
    { key:'VOICE_USE',        label:'BharatVoice' },
  ]},
  { group: 'Smart Tools', color: '#F59E0B', perms: [
    { key:'BANK_RECON_VIEW',     label:'View Bank Recon' },
    { key:'BANK_RECON_RUN',      label:'Run Bank Recon' },
    { key:'BANK_RECON_APPROVE',  label:'Approve Recon' },
    { key:'EXPENSE_VIEW',        label:'View Expenses' },
    { key:'EXPENSE_SUBMIT',      label:'Submit Expenses' },
    { key:'EXPENSE_APPROVE',     label:'Approve Expenses' },
    { key:'EXPENSE_ADMIN',       label:'Admin Expenses' },
    { key:'TDS_VIEW',            label:'View TDS' },
    { key:'TDS_PROCESS',         label:'Process TDS' },
    { key:'FORECAST_VIEW',       label:'View Demand Forecast' },
    { key:'FORECAST_RUN',        label:'Run Forecast' },
    { key:'ESIGN_USE',           label:'Use eSign' },
    { key:'AUTOMATIONS_VIEW',    label:'View Automations' },
    { key:'AUTOMATIONS_MANAGE',  label:'Manage Automations' },
    { key:'WHATSAPP_VIEW',       label:'View WhatsApp Hub' },
    { key:'WHATSAPP_SEND',       label:'Send via WhatsApp' },
  ]},
  { group: 'Settings', color: '#64748B', perms: [
    { key:'SETTINGS_VIEW',     label:'View Settings' },
    { key:'SETTINGS_COMPANY',  label:'Company Profile' },
    { key:'SETTINGS_USERS',    label:'User Management' },
    { key:'SETTINGS_ROLES',    label:'Role Management' },
    { key:'SETTINGS_MODULES',  label:'Module Config' },
    { key:'SETTINGS_WORKFLOW', label:'Approval Flows' },
    { key:'SETTINGS_BILLING',  label:'Billing & Plans' },
    { key:'AUDIT_LOG_VIEW',    label:'Audit Log' },
  ]},
]

// Permission matrix per role (true = has permission)
const ROLE_PERMS: Record<string, Set<string>> = {
  SUPER_ADMIN:   new Set(Object.values(PERMS)),
  COMPANY_ADMIN: new Set(Object.values(PERMS)),
  MANAGER:       new Set(['DASHBOARD_VIEW','EMPLOYEE_VIEW','EMPLOYEE_EDIT','EMPLOYEE_EXPORT','ATTENDANCE_VIEW','ATTENDANCE_EDIT','ATTENDANCE_ADMIN','LEAVE_VIEW','LEAVE_APPLY','LEAVE_APPROVE','PAYROLL_VIEW','WELLNESS_VIEW','WELLNESS_ADMIN','AI_WELLNESS_VIEW','AI_WELLNESS_ADMIN','FINANCE_VIEW','FINANCE_REPORTS','INVOICE_VIEW','INVOICE_CREATE','INVOICE_EDIT','INVOICE_APPROVE','INVOICE_SEND','INVOICE_EXPORT','CRM_VIEW','CRM_CREATE','CRM_EDIT','CRM_ADMIN','PROCUREMENT_VIEW','PROCUREMENT_CREATE','PROCUREMENT_EDIT','PROCUREMENT_APPROVE','PROCUREMENT_RECEIVE','INVENTORY_VIEW','INVENTORY_ADJUST','PROJECT_VIEW','PROJECT_CREATE','PROJECT_EDIT','PROJECT_MANAGE','REPORTS_VIEW','REPORTS_EXPORT','AI_CASHFLOW_VIEW','AI_CASHFLOW_RUN','AI_SCANNER_USE','BANK_RECON_VIEW','BANK_RECON_RUN','EXPENSE_VIEW','EXPENSE_SUBMIT','EXPENSE_APPROVE','TDS_VIEW','FORECAST_VIEW','WHATSAPP_VIEW','WHATSAPP_SEND','ESIGN_USE','AUTOMATIONS_VIEW','SETTINGS_VIEW','AUDIT_LOG_VIEW']),
  FINANCE_ADMIN: new Set(['DASHBOARD_VIEW','EMPLOYEE_VIEW','PAYROLL_VIEW','ATTENDANCE_VIEW','FINANCE_VIEW','FINANCE_CREATE','FINANCE_EDIT','FINANCE_DELETE','FINANCE_APPROVE','FINANCE_REPORTS','FINANCE_ADMIN','INVOICE_VIEW','INVOICE_CREATE','INVOICE_EDIT','INVOICE_DELETE','INVOICE_APPROVE','INVOICE_SEND','INVOICE_EXPORT','CRM_VIEW','PROCUREMENT_VIEW','PROCUREMENT_APPROVE','PROCUREMENT_RECEIVE','INVENTORY_VIEW','REPORTS_VIEW','REPORTS_EXPORT','AI_CASHFLOW_VIEW','AI_CASHFLOW_RUN','AI_SCANNER_USE','GST_RECON_VIEW','GST_RECON_RUN','BANK_RECON_VIEW','BANK_RECON_RUN','BANK_RECON_APPROVE','EXPENSE_VIEW','EXPENSE_APPROVE','EXPENSE_ADMIN','SUBSCRIPTIONS_VIEW','SUBSCRIPTIONS_ADMIN','TDS_VIEW','TDS_PROCESS','WHATSAPP_VIEW','WHATSAPP_SEND','ESIGN_USE','SETTINGS_VIEW','AUDIT_LOG_VIEW']),
  HR_ADMIN:      new Set(['DASHBOARD_VIEW','EMPLOYEE_VIEW','EMPLOYEE_CREATE','EMPLOYEE_EDIT','EMPLOYEE_DELETE','EMPLOYEE_EXPORT','ATTENDANCE_VIEW','ATTENDANCE_CREATE','ATTENDANCE_EDIT','ATTENDANCE_ADMIN','LEAVE_VIEW','LEAVE_APPLY','LEAVE_APPROVE','LEAVE_ADMIN','PAYROLL_VIEW','PAYROLL_PROCESS','PAYROLL_ADMIN','WELLNESS_VIEW','WELLNESS_ADMIN','AI_WELLNESS_VIEW','AI_WELLNESS_ADMIN','EXPENSE_VIEW','EXPENSE_SUBMIT','EXPENSE_APPROVE','EXPENSE_ADMIN','REPORTS_VIEW','REPORTS_EXPORT','ESIGN_USE','SETTINGS_VIEW','SETTINGS_USERS','AUDIT_LOG_VIEW']),
  ACCOUNTANT:    new Set(['DASHBOARD_VIEW','EMPLOYEE_VIEW','PAYROLL_VIEW','FINANCE_VIEW','FINANCE_CREATE','FINANCE_EDIT','FINANCE_REPORTS','INVOICE_VIEW','INVOICE_CREATE','INVOICE_EDIT','INVOICE_SEND','INVOICE_EXPORT','CRM_VIEW','PROCUREMENT_VIEW','PROCUREMENT_RECEIVE','INVENTORY_VIEW','REPORTS_VIEW','REPORTS_EXPORT','AI_CASHFLOW_VIEW','AI_SCANNER_USE','GST_RECON_VIEW','GST_RECON_RUN','BANK_RECON_VIEW','BANK_RECON_RUN','EXPENSE_VIEW','EXPENSE_SUBMIT','TDS_VIEW','TDS_PROCESS','WHATSAPP_VIEW','WHATSAPP_SEND','SETTINGS_VIEW']),
  SALES_EXEC:    new Set(['DASHBOARD_VIEW','CRM_VIEW','CRM_CREATE','CRM_EDIT','INVOICE_VIEW','INVOICE_CREATE','INVOICE_EDIT','INVOICE_SEND','INVOICE_EXPORT','INVENTORY_VIEW','PROJECT_VIEW','PROJECT_CREATE','REPORTS_VIEW','PORTAL_VIEW','WHATSAPP_VIEW','WHATSAPP_SEND','ESIGN_USE','EXPENSE_VIEW','EXPENSE_SUBMIT','SETTINGS_VIEW']),
  EMPLOYEE:      new Set(['DASHBOARD_VIEW','ATTENDANCE_VIEW','LEAVE_APPLY','LEAVE_VIEW','PAYROLL_VIEW','WELLNESS_VIEW','AI_WELLNESS_VIEW','EXPENSE_VIEW','EXPENSE_SUBMIT','PROJECT_VIEW','SETTINGS_VIEW']),
  VIEWER:        new Set(['DASHBOARD_VIEW','EMPLOYEE_VIEW','ATTENDANCE_VIEW','FINANCE_VIEW','FINANCE_REPORTS','INVOICE_VIEW','CRM_VIEW','PROCUREMENT_VIEW','INVENTORY_VIEW','PROJECT_VIEW','REPORTS_VIEW','SETTINGS_VIEW']),
}

export default function RolesPage() {
  const { can } = usePermissions()
  const [selectedRole, setSelectedRole] = useState('COMPANY_ADMIN')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['HRMS', 'Finance']))
  const [showMatrix, setShowMatrix] = useState(false)

  const rolePerms = ROLE_PERMS[selectedRole] || new Set()
  const totalPerms = Object.values(PERMS).length
  const rolePermCount = selectedRole === 'SUPER_ADMIN' ? totalPerms : rolePerms.size

  const toggleGroup = (g: string) =>
    setExpandedGroups(prev => { const next = new Set(prev); next.has(g) ? next.delete(g) : next.add(g); return next })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Roles & Permissions</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {SYSTEM_ROLES.length} system roles · {totalPerms} granular permissions across 14 modules
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowMatrix(v => !v)}
            className="btn-secondary h-9 text-sm">
            {showMatrix ? 'Role Detail' : 'Permission Matrix'}
          </button>
          <PermissionGate permission="SETTINGS_ROLES">
            <button className="btn-primary h-9 text-sm">
              <Plus className="w-4 h-4" />Custom Role
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-3 xl:grid-cols-5 gap-3">
        {SYSTEM_ROLES.map(r => (
          <button key={r.name}
            onClick={() => setSelectedRole(r.name)}
            className="card text-left transition-all duration-200"
            style={{ borderColor: selectedRole === r.name ? r.color : 'var(--border)', background: selectedRole === r.name ? `${r.color}08` : 'var(--bg-card)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: r.color, flexShrink: 0 }} />
              <span className="text-xs font-bold truncate" style={{ color: selectedRole === r.name ? r.color : 'var(--text-primary)' }}>{r.display}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '22px', color: r.color }}>{r.users}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>users</span>
            </div>
            <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)', lineHeight: 1.4 }}>{r.desc}</p>
          </button>
        ))}
      </div>

      {/* Permission Matrix View */}
      {showMatrix ? (
        <div className="card overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Full Permission Matrix</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>✓ = has permission   —  = no access</p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', width: '180px', color: 'var(--text-secondary)', fontWeight: 600 }}>Permission</th>
                {SYSTEM_ROLES.slice(0, 6).map(r => (
                  <th key={r.name} style={{ padding: '8px 6px', textAlign: 'center', color: r.color, fontWeight: 700, fontSize: '10px', width: '90px' }}>
                    {r.display}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_GROUPS.map(grp => (
                <>
                  <tr key={`hdr-${grp.group}`} style={{ background: `${grp.color}08`, borderBottom: '1px solid var(--border)' }}>
                    <td colSpan={7} style={{ padding: '6px 12px', fontWeight: 700, color: grp.color, fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {grp.group}
                    </td>
                  </tr>
                  {grp.perms.map(p => (
                    <tr key={p.key} style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={(e: any) => (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e: any) => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                      <td style={{ padding: '5px 12px', color: 'var(--text-secondary)' }}>{p.label}</td>
                      {SYSTEM_ROLES.slice(0, 6).map(r => {
                        const has = r.name === 'SUPER_ADMIN' || r.name === 'COMPANY_ADMIN' || (ROLE_PERMS[r.name]?.has(p.key) ?? false)
                        return (
                          <td key={r.name} style={{ textAlign: 'center', padding: '5px 6px' }}>
                            {has
                              ? <Check size={13} color="#22c55e" strokeWidth={3} style={{ margin: '0 auto' }} />
                              : <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>—</span>
                            }
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Role Detail View */
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-1">
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${SYSTEM_ROLES.find(r=>r.name===selectedRole)?.color ?? '#888'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={20} color={SYSTEM_ROLES.find(r=>r.name===selectedRole)?.color ?? '#888'} />
                </div>
                <div>
                  <h3 className="font-semibold">{SYSTEM_ROLES.find(r=>r.name===selectedRole)?.display}</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {rolePermCount}/{totalPerms} permissions
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ height: '6px', background: 'var(--bg-input)', borderRadius: '3px', marginBottom: '16px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: SYSTEM_ROLES.find(r=>r.name===selectedRole)?.color ?? '#888', borderRadius: '3px', width: `${(rolePermCount/totalPerms)*100}%`, transition: 'width 0.4s' }} />
              </div>

              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                {SYSTEM_ROLES.find(r=>r.name===selectedRole)?.desc}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {PERMISSION_GROUPS.map(grp => {
                  const has = grp.perms.filter(p => selectedRole === 'SUPER_ADMIN' || selectedRole === 'COMPANY_ADMIN' || rolePerms.has(p.key))
                  return (
                    <div key={grp.group} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: grp.color }} />
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{grp.group}</span>
                      </div>
                      <span className="text-xs font-bold" style={{ color: has.length === grp.perms.length ? '#22c55e' : has.length === 0 ? 'var(--text-muted)' : grp.color }}>
                        {has.length}/{grp.perms.length}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="col-span-2 space-y-3">
            {PERMISSION_GROUPS.map(grp => {
              const isExpanded = expandedGroups.has(grp.group)
              const hasCount = grp.perms.filter(p => selectedRole==='SUPER_ADMIN'||selectedRole==='COMPANY_ADMIN'||rolePerms.has(p.key)).length
              return (
                <div key={grp.group} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <button onClick={() => toggleGroup(grp.group)}
                    className="w-full flex items-center justify-between px-5 py-3 transition-all"
                    style={{ background: hasCount === grp.perms.length ? `${grp.color}08` : 'transparent' }}>
                    <div className="flex items-center gap-3">
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: grp.color }} />
                      <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{grp.group}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${grp.color}18`, color: grp.color, fontWeight: 600 }}>
                        {hasCount}/{grp.perms.length}
                      </span>
                    </div>
                    {isExpanded ? <ChevronDown size={15} style={{ color: 'var(--text-muted)' }} />
                                 : <ChevronRight size={15} style={{ color: 'var(--text-muted)' }} />}
                  </button>

                  {isExpanded && (
                    <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--border)' }}>
                      <div className="grid grid-cols-2 gap-2">
                        {grp.perms.map(p => {
                          const has = selectedRole === 'SUPER_ADMIN' || selectedRole === 'COMPANY_ADMIN' || rolePerms.has(p.key)
                          return (
                            <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', borderRadius: '8px', background: has ? `${grp.color}06` : 'var(--bg-input)' }}>
                              <div style={{ width: '20px', height: '20px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: has ? `${grp.color}20` : 'var(--bg-surface)' }}>
                                {has ? <Check size={11} color={grp.color} strokeWidth={3} /> : <X size={11} color="var(--text-muted)" />}
                              </div>
                              <div>
                                <p className="text-xs font-medium" style={{ color: has ? 'var(--text-primary)' : 'var(--text-muted)' }}>{p.label}</p>
                                <p style={{ fontSize: '9.5px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.key}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
