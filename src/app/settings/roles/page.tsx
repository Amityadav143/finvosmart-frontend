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

import { Fragment, useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Check, ChevronDown, ChevronRight, Shield, X } from 'lucide-react'
import { api } from '@/lib/api/client'
import type { ApiResponse } from '@/types'

interface RoleInfo { name: string; displayName: string | null; system: boolean; users: number; permissions: string[] }

/** What the built-in roles are for (the permissions themselves come from the server). */
const ROLE_META: Record<string, { color: string; desc: string }> = {
  COMPANY_ADMIN: { color: '#2563eb', desc: 'Full access within the company' },
  MANAGER:       { color: '#7c3aed', desc: 'Approves leave and purchase orders; sees their team' },
  FINANCE_ADMIN: { color: '#16a34a', desc: 'Accounts, invoices, GST, bank matching' },
  HR_ADMIN:      { color: '#db2777', desc: 'Employees, attendance, leave and payroll' },
  ACCOUNTANT:    { color: '#0d9488', desc: 'Day-to-day bookkeeping, invoices, TDS' },
  SALES_EXEC:    { color: '#ea580c', desc: 'Customers, leads and invoices' },
  EMPLOYEE:      { color: '#64748b', desc: 'Own leave, attendance and payslips' },
  VIEWER:        { color: '#94a3b8', desc: 'Read-only access' },
}
const meta = (r: RoleInfo) => ROLE_META[r.name] ?? { color: '#a16207', desc: r.system ? 'Built-in role' : 'A role made for your company' }
const title = (r: RoleInfo) => r.displayName || r.name.replace(/_/g, ' ').toLowerCase().replace(/^./, c => c.toUpperCase())

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

export default function RolesPage() {
  const { data: roles = [], isLoading, isError } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async () => (await api.get<ApiResponse<RoleInfo[]>>('/admin/roles')).data.data ?? [],
  })
  const [selected, setSelected] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['HRMS', 'Finance']))
  const [matrix, setMatrix] = useState(false)
  const role = roles.find(r => r.name === selected) ?? roles[0]
  const perms = useMemo(() => new Set(role?.permissions ?? []), [role])

  // Permissions the server knows about that the groups above don't list, so nothing is hidden.
  const known = useMemo(() => new Set(PERMISSION_GROUPS.flatMap(g => g.perms.map(p => p.key))), [])
  const groups = useMemo(() => {
    const extra = Array.from(new Set(roles.flatMap(r => r.permissions))).filter(p => !known.has(p)).sort()
    return extra.length ? [...PERMISSION_GROUPS, { group: 'Other', color: '#64748b', perms: extra.map(k => ({ key: k, label: k.replace(/_/g, ' ').toLowerCase().replace(/^./, c => c.toUpperCase()) })) }] : PERMISSION_GROUPS
  }, [roles, known])
  const toggle = (g: string) => setExpanded(prev => { const n = new Set(prev); n.has(g) ? n.delete(g) : n.add(g); return n })

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="page-title">Roles &amp; permissions</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            What each role can do — exactly what the server checks. To give someone a role, open <Link href="/settings/users" className="underline">Users</Link>.
          </p>
        </div>
        {roles.length > 0 && <button onClick={() => setMatrix(v => !v)} className="btn-secondary h-9 text-sm">{matrix ? 'One role at a time' : 'All roles side by side'}</button>}
      </div>

      {isLoading && <div className="card text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</div>}
      {isError && <div className="card text-sm" style={{ color: '#dc2626' }}>The roles couldn't be loaded.</div>}

      {roles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {roles.map(r => {
            const m = meta(r), on = role?.name === r.name && !matrix
            return (
              <button key={r.name} onClick={() => { setSelected(r.name); setMatrix(false) }} aria-pressed={on}
                className="card text-left" style={{ borderColor: on ? m.color : 'var(--border)', background: on ? `${m.color}0d` : 'var(--bg-card)' }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color }} aria-hidden />
                  <span className="text-sm font-semibold truncate">{title(r)}</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.users === 1 ? '1 user' : `${r.users} users`} · {r.permissions.length} permissions</p>
                <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{m.desc}</p>
              </button>
            )
          })}
        </div>
      )}

      {roles.length > 0 && matrix && (
        <div className="card overflow-x-auto">
          <table className="text-xs" style={{ borderCollapse: 'collapse', minWidth: 720, width: '100%' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th className="text-left px-3 py-2" style={{ minWidth: 180, color: 'var(--text-secondary)' }}>Permission</th>
                {roles.map(r => <th key={r.name} className="px-2 py-2 text-center" style={{ color: meta(r).color, minWidth: 84 }}>{title(r)}</th>)}
              </tr>
            </thead>
            <tbody>
              {groups.map(g => (
                <Fragment key={g.group}>
                  <tr style={{ background: `${g.color}0d`, borderBottom: '1px solid var(--border)' }}>
                    <td colSpan={roles.length + 1} className="px-3 py-1.5 font-bold uppercase tracking-wide" style={{ color: g.color }}>{g.group}</td>
                  </tr>
                  {g.perms.map(p => (
                    <tr key={p.key} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-3 py-1.5" style={{ color: 'var(--text-secondary)' }}>{p.label}</td>
                      {roles.map(r => (
                        <td key={r.name} className="text-center py-1.5">
                          {r.permissions.includes(p.key)
                            ? <Check size={13} color="#16a34a" strokeWidth={3} style={{ margin: '0 auto' }} aria-label="Yes" />
                            : <span style={{ color: 'var(--text-muted)' }} aria-label="No">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {role && !matrix && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="card h-fit">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${meta(role).color}1a` }}>
                <Shield size={20} color={meta(role).color} />
              </div>
              <div>
                <h2 className="font-semibold">{title(role)}</h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{role.permissions.length} permissions · {role.users === 1 ? '1 user' : `${role.users} users`}</p>
              </div>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{meta(role).desc}</p>
            <div className="space-y-1.5">
              {groups.map(g => {
                const has = g.perms.filter(p => perms.has(p.key)).length
                return (
                  <div key={g.group} className="flex justify-between items-center px-3 py-2 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
                    <span className="text-xs font-medium inline-flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: g.color }} aria-hidden />{g.group}
                    </span>
                    <span className="text-xs font-bold" style={{ color: has === g.perms.length ? '#16a34a' : has === 0 ? 'var(--text-muted)' : 'var(--text-primary)' }}>{has}/{g.perms.length}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="lg:col-span-2 space-y-3">
            {groups.map(g => {
              const open = expanded.has(g.group)
              const has = g.perms.filter(p => perms.has(p.key)).length
              return (
                <div key={g.group} className="card p-0 overflow-hidden">
                  <button onClick={() => toggle(g.group)} aria-expanded={open} className="w-full flex items-center justify-between px-5 py-3">
                    <span className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: g.color }} aria-hidden />
                      <span className="font-semibold text-sm">{g.group}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>{has}/{g.perms.length}</span>
                    </span>
                    {open ? <ChevronDown size={15} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={15} style={{ color: 'var(--text-muted)' }} />}
                  </button>
                  {open && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-5 pb-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                      {g.perms.map(p => {
                        const yes = perms.has(p.key)
                        return (
                          <div key={p.key} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg" style={{ background: yes ? 'var(--bg-surface)' : 'transparent' }}>
                            <span className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: yes ? '#16a34a1f' : 'var(--bg-hover)' }}>
                              {yes ? <Check size={11} color="#16a34a" strokeWidth={3} aria-label="Allowed" /> : <X size={11} color="var(--text-muted)" aria-label="Not allowed" />}
                            </span>
                            <span>
                              <span className="block text-xs font-medium" style={{ color: yes ? 'var(--text-primary)' : 'var(--text-muted)' }}>{p.label}</span>
                              <span className="block font-mono" style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>{p.key}</span>
                            </span>
                          </div>
                        )
                      })}
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
