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

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store/slices/authStore'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, Clock, Calendar, DollarSign, FileText,
  ShoppingCart, Boxes, FolderOpen, UserCheck, BarChart3, Settings,
  LogOut, Building2, TrendingUp, Zap, X, MessageCircle, Camera,
  Heart, RefreshCw, CreditCard, Globe, PenLine, Activity, Package2,
  Bell, ClipboardList, ChevronDown, Timer, FileDown, Layers, ShieldCheck
, Plug , Palette, Mail, Brain, ShieldAlert, Landmark } from 'lucide-react'
import { useState } from 'react'

/* ── Navigation structure ─────────────────────────────────────────────── */
type NavItem = { href: string; label: string; icon: any; perm: string; dot?: string }
type NavSection = { id: string; label: string | null; items: NavItem[]; accent?: string }
const NAV_SECTIONS: NavSection[] = [
  {
    id: 'main',
    label: null,
    items: [
      { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard, perm: 'DASHBOARD_VIEW' },
      { href: '/notifications', label: 'Notifications', icon: Bell, perm: 'DASHBOARD_VIEW' },
    ],
  },
  {
    id: 'ai',
    label: 'AI Features',
    accent: '#8b5cf6',
    items: [
      { href: '/ai/cfo',         label: 'AI CFO',            icon: Brain,         dot: '#8b5cf6', perm: 'AI_CFO_VIEW' },
      { href: '/ai/health-score', label: 'Health Score',     icon: Activity,      dot: '#0d9488', perm: 'AI_HEALTH_VIEW' },
      { href: '/ai/fraud',       label: 'Fraud Detection',   icon: ShieldAlert,   dot: '#dc2626', perm: 'AI_FRAUD_VIEW' },
      { href: '/ai/cashflow',    label: 'Cash Flow Oracle', icon: Zap,           dot: '#8b5cf6', perm: 'AI_CASHFLOW_VIEW' },
      { href: '/ai/wellness',    label: 'Wellness AI',       icon: Heart,         dot: '#ec4899', perm: 'WELLNESS_VIEW' },
      { href: '/ai/scanner',     label: 'Bill Scanner',      icon: Camera,        dot: '#8b5cf6', perm: 'AI_SCANNER_USE' },
      { href: '/whatsapp',       label: 'WhatsApp Hub',      icon: MessageCircle, dot: '#22c55e', perm: 'WHATSAPP_VIEW' },
      { href: '/gst-reconciler', label: 'GST Reconciler',    icon: RefreshCw,     dot: '#14b8a6', perm: 'GST_RECON_VIEW' },
    ],
  },
  {
    id: 'smart',
    label: 'Smart Tools',
    accent: '#f59e0b',
    items: [
      { href: '/bank-reconciliation', label: 'Bank Reconciliation', icon: Building2,  dot: '#2563eb', perm: 'BANK_RECON_VIEW' },
      { href: '/tenders',             label: 'Tender Management',   icon: Landmark,   dot: '#2563eb', perm: 'TENDER_VIEW' },
      { href: '/expense-claims',      label: 'Expense Claims',      icon: CreditCard, dot: '#16a34a', perm: 'EXPENSE_VIEW' },
      { href: '/client-portal',       label: 'Client Portal',       icon: Globe,      dot: '#7c3aed', perm: 'PORTAL_VIEW' },
      { href: '/subscriptions',       label: 'Recurring Billing',   icon: RefreshCw,  dot: '#0d9488', perm: 'SUBSCRIPTIONS_VIEW' },
      { href: '/tds',                 label: 'TDS Tracker',         icon: DollarSign, dot: '#b45309', perm: 'TDS_VIEW' },
      { href: '/demand-forecast',     label: 'Demand Forecast',     icon: Package2,   dot: '#db2777', perm: 'FORECAST_VIEW' },
      { href: '/esign',               label: 'Digital Signing',     icon: PenLine,    dot: '#c2410c', perm: 'ESIGN_USE' },
      { href: '/automations',         label: 'Automations',         icon: Activity,   dot: '#57534e', perm: 'AUTOMATIONS_VIEW' },
    ],
  },
  {
    id: 'people',
    label: 'People',
    items: [
      { href: '/hrms/employees',  label: 'Employees',   icon: Users,      perm: 'EMPLOYEE_VIEW' },
      { href: '/hrms/attendance', label: 'Attendance',  icon: Clock,      perm: 'ATTENDANCE_VIEW' },
      { href: '/hrms/leave',      label: 'Leave',       icon: Calendar,   perm: 'LEAVE_VIEW' },
      { href: '/hrms/payroll',    label: 'Payroll',     icon: DollarSign, perm: 'PAYROLL_VIEW' },
      { href: '/timesheet',      label: 'Timesheets',  icon: Timer,      perm: 'ATTENDANCE_VIEW' },
      { href: '/recruitment',    label: 'Recruitment', icon: Users,      perm: 'EMPLOYEE_VIEW' },
      { href: '/performance',    label: 'Performance', icon: TrendingUp, perm: 'EMPLOYEE_VIEW' },
      { href: '/self-service',    label: 'My Portal',   icon: UserCheck,  perm: 'ATTENDANCE_VIEW' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    items: [
      { href: '/finance/accounts', label: 'Accounts', icon: Building2, perm: 'FINANCE_VIEW' },
      { href: '/finance/vouchers', label: 'Vouchers', icon: FileText,  perm: 'FINANCE_CREATE' },
      { href: '/finance/reports',  label: 'Reports',  icon: BarChart3, perm: 'FINANCE_REPORTS' },
      { href: '/ca-workspace',     label: 'CA Workspace', icon: ShieldCheck, dot: '#d97706', perm: 'CA_WORKSPACE_VIEW' },
    ],
  },
  {
    id: 'commerce',
    label: 'Commerce',
    items: [
      { href: '/invoicing',     label: 'Invoices',   icon: FileText,  perm: 'INVOICE_VIEW' },
      { href: '/crm/leads',     label: 'Leads',      icon: TrendingUp,perm: 'CRM_VIEW' },
      { href: '/crm/customers', label: 'Customers',  icon: UserCheck, perm: 'CRM_VIEW' },
    ],
  },
  {
    id: 'ops',
    label: 'Operations',
    items: [
      { href: '/procurement/orders', label: 'Purchases',  icon: ShoppingCart, perm: 'PROCUREMENT_VIEW' },
      { href: '/inventory/items',    label: 'Inventory',  icon: Boxes,        perm: 'INVENTORY_VIEW' },
      { href: '/projects',           label: 'Projects',   icon: FolderOpen,   perm: 'PROJECT_VIEW' },
      { href: '/reports',            label: 'Analytics',  icon: BarChart3,    perm: 'REPORTS_VIEW' },
      { href: '/marketplace',        label: 'Marketplace & API', icon: Plug,  dot: '#7c3aed', perm: 'MARKETPLACE_VIEW' },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    items: [
      { href: '/settings/company',   label: 'Company',      icon: Settings,      perm: 'SETTINGS_VIEW' },
      { href: '/settings/users',     label: 'Users',        icon: Users,         perm: 'SETTINGS_USERS' },
      { href: '/settings/templates', label: 'Templates', icon: Palette, perm: 'SETTINGS_VIEW' },
      { href: '/settings/email',     label: 'Email Alerts', icon: Mail, perm: 'SETTINGS_COMPANY' },
      { href: '/settings/roles',     label: 'Roles',        icon: ClipboardList, perm: 'SETTINGS_ROLES' },
      { href: '/settings/audit-log', label: 'Audit Log',    icon: ClipboardList, perm: 'AUDIT_LOG_VIEW' },
    ],
  },
]

interface SidebarProps { onClose?: () => void }

export function Sidebar({ onClose }: SidebarProps) {
  const pathname              = usePathname()
  const { user, logout }      = useAuthStore()
  const { can }               = usePermissions()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const initials = (user?.fullName ?? 'U')
    .split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()

  const toggleSection = (id: string) =>
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <aside
      style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)', height: '100%' }}
      className="flex flex-col w-full"
    >
      {/* ── Logo ──────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4"
        style={{ height: '60px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}
      >
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ width: '32px', height: '32px', background: 'var(--btn-primary-bg)' }}
          >
            <Zap size={15} style={{ color: 'var(--text-on-gold)' }} />
          </div>
          <div>
            <p className="font-serif text-sm text-gold-grad leading-none tracking-tight">FINVOSMART</p>
            <p style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>by Navgrow · v1.1</p>
          </div>
        </Link>
        {onClose && (
          <button aria-label="Close" className="btn-icon w-7 h-7 border-0" style={{ background: 'transparent' }} onClick={onClose}><X size={16} />
          </button>
        )}
      </div>

      {/* ── Navigation ────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {NAV_SECTIONS.map(section => {
          // Filter items user can access
          const visibleItems = section.items.filter(item => !item.perm || can(item.perm))
          if (!visibleItems.length) return null

          const isOpen = !collapsed[section.id]

          return (
            <div key={section.id} className="mb-1">
              {/* Section header */}
              {section.label && (
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-3 py-1.5 mb-0.5 rounded-lg"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: section.accent ?? 'var(--text-muted)',
                      }}
                    >
                      {section.label}
                    </span>
                    {section.accent && (
                      <span
                        className="text-xs font-bold px-1.5 rounded"
                        style={{ fontSize: '7.5px', background: `${section.accent}15`, color: section.accent }}
                      >
                        AI
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    size={11}
                    style={{
                      color: 'var(--text-muted)',
                      transform: isOpen ? 'none' : 'rotate(-90deg)',
                      transition: 'transform 0.2s',
                    }}
                  />
                </button>
              )}

              {/* Items */}
              {(isOpen || !section.label) && (
                <div>
                  {visibleItems.map(item => {
                    const active = isActive(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 no-underline transition-all"
                        style={{
                          background: active ? `${item.dot ?? 'var(--gold)'}15` : 'transparent',
                          border: `1px solid ${active ? `${item.dot ?? 'var(--gold)'}30` : 'transparent'}`,
                        }}
                      >
                        <item.icon
                          size={15}
                          style={{ color: active ? (item.dot ?? 'var(--gold)') : 'var(--text-muted)', flexShrink: 0 }}
                        />
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: active ? 600 : 400,
                            color: active ? (item.dot ?? 'var(--gold)') : 'var(--text-secondary)',
                            flex: 1,
                          }}
                        >
                          {item.label}
                        </span>
                        {item.dot && !active && (
                          <span
                            style={{ width: '5px', height: '5px', borderRadius: '50%', background: item.dot, flexShrink: 0 }}
                          />
                        )}
                        {(item as any).badge && (
                          <span
                            className="text-xs font-bold rounded-full px-1.5"
                            style={{ fontSize: '10px', background: '#ef4444', color: '#fff', minWidth: '16px', textAlign: 'center' }}
                          >
                            {(item as any).badge}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* ── User footer ───────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '12px', flexShrink: 0 }}>
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl" style={{ background: 'var(--bg-card)' }}>
          <div
            className="flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0"
            style={{ width: '32px', height: '32px', background: 'var(--btn-primary-bg)', color: 'var(--text-on-gold)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {user?.fullName?.split(' ')[0] ?? 'User'}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              {user?.roles?.[0]?.replace('_', ' ') ?? 'Employee'}
            </p>
          </div>
          <button aria-label="Sign out"
            onClick={logout}
            className="btn-icon w-7 h-7 flex-shrink-0"
            style={{ border: 'none', background: 'transparent' }}
            title="Sign out"
          ><LogOut size={14} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
      </div>
    </aside>
  )
}
