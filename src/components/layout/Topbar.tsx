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

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Sun, Moon, Search, ChevronDown, LogOut, Keyboard, UserCircle, Rocket } from 'lucide-react'
import { useAuthStore } from '@/lib/store/slices/authStore'
import { useTheme } from '@/lib/context/ThemeContext'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { NotificationBell } from './NotificationBell'
import { QuickCreate } from './QuickCreate'
import { showSetupChecklist } from '@/components/ui/OnboardingChecklist'
import { useRouter } from 'next/navigation'

/* ── Page titles keyed by route ─────────────────────────────────────── */
const TITLES: Record<string, string> = {
  '/dashboard':                'Dashboard',
  '/notifications':            'Notifications',
  '/hrms/employees':           'Employees',
  '/hrms/attendance':          'Attendance',
  '/hrms/leave':               'Leave',
  '/hrms/payroll':             'Payroll',
  '/hrms/payroll/setup':       'Salary set-up',
  '/finance/accounts':         'Chart of Accounts',
  '/finance/vouchers':         'Journal Entries',
  '/finance/ledger':           'Ledger',
  '/finance/reports':          'Financial Reports',
  '/invoicing':                'Invoices',
  '/quotations':               'Quotations',
  '/crm/leads':                'CRM — Pipeline',
  '/crm/customers':            'Customers',
  '/procurement/orders':       'Purchase Orders',
  '/procurement/vendors':      'Suppliers',
  '/purchases':                'Bills and Payables',
  '/purchases/bills/new':      'New Bill',
  '/procurement/grn':          'Goods Receipt Notes',
  '/inventory/items':          'Inventory Items',
  '/inventory/stock':          'Stock Ledger',
  '/inventory/assets':         'Fixed Assets',
  '/projects':                 'Projects',
  '/reports':                  'Analytics',
  '/ai/cashflow':              'ARIS — Cash Flow Oracle',
  '/ai/wellness':              'Employee Wellness AI',
  '/ai/scanner':               'Smart Bill Scanner',
  '/whatsapp':                 'WhatsApp Hub',
  '/gst-reconciler':           'GST Credit Check',
  '/bank-reconciliation':      'Bank Reconciliation',
  '/expense-claims':           'Expense Claims',
  '/client-portal':            'Client Portal',
  '/subscriptions':            'Recurring Billing',
  '/tds':                      'TDS Register',
  '/demand-forecast':          'Demand Forecasting',
  '/esign':                    'Digital Signing',
  '/automations':              'Smart Automations',
  '/settings/company':         'Company Settings',
  '/settings/users':           'Users & Access',
  '/settings/roles':           'Roles & Permissions',
  '/settings/modules':         'Module Settings',
  '/settings/workflow':        'Approval Workflows',
  '/settings/audit-log':       'Audit Log',
  '/import':                   'Import from Excel',
  '/webhooks':                 'Webhooks',
  '/statements':               'Statement of Account',
  '/settings':                 'Settings',
  '/settings/templates':       'Document Templates',
  '/settings/email':           'Email Alerts',
  '/settings/security':        'Sign-in & security',
  '/self-service':             'My Portal',
  '/recruitment':              'Recruitment',
  '/performance':              'Performance',
  '/contracts':                'Contracts',
  '/tenders':                  'Tenders',
  '/ca-workspace':             'CA Workspace',
  '/gst-export':               'GST Returns',
  '/purchases/bills':          'Bills',
  '/procurement':              'Procurement',
  '/inventory/warehouses':     'Warehouses',
  '/inventory/scanner':        'Stock Scanner',
}

interface TopbarProps {
  onMenuClick?: () => void
  onSearchOpen?: () => void
  onShortcuts?: () => void
}

export function Topbar({ onMenuClick, onSearchOpen, onShortcuts }: TopbarProps) {
  const pathname          = usePathname()
  const router            = useRouter()
  const { user, logout }  = useAuthStore()
  const { isDark, toggle } = useTheme()
  const { roles }         = usePermissions()
  const [time, setTime]   = useState('')
  const [mounted, setMounted] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }))
    }
    tick()
    const id = setInterval(tick, 60000)
    return () => clearInterval(id)
  }, [])

  // The page's own title, else the nearest section's (e.g. /invoicing/123 → Invoices)
  const title     = TITLES[pathname]
    ?? Object.keys(TITLES).filter(k => pathname.startsWith(k + '/')).sort((a, b) => b.length - a.length).map(k => TITLES[k])[0]
    ?? 'FINVOSMART'
  const initials  = (user?.fullName ?? 'U').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
  const firstName = user?.fullName?.split(' ')[0] ?? 'User'
  const roleLabel = roles[0]?.replace(/_/g, ' ') ?? 'Employee'

  return (
    <header
      className="flex items-center gap-3 px-4 md:px-5 flex-shrink-0"
      style={{ height: '60px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}
    >
      {/* Mobile menu toggle */}
      <button aria-label="Open menu" className="btn-icon lg:hidden" onClick={onMenuClick}><Menu size={18} />
      </button>

      {/* Page title */}
      <h1 className="font-serif flex-1 truncate" style={{ fontSize: '18px', fontWeight: 400, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
        {title}
      </h1>

      {/* Actions */}
      <div className="flex items-center gap-2">

        {/* Clock */}
        <span className="hidden xl:block text-xs font-mono whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
          {time}
        </span>

        {/* Create */}
        <QuickCreate />

        {/* Search */}
        <button
          className="hidden sm:flex items-center gap-2 h-9 rounded-xl px-3 text-sm"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', minWidth: '210px' }}
          onClick={onSearchOpen}
          title="Search invoices, customers, bills, items… (Ctrl K or /)"
          aria-label="Search"
          data-testid="open-search"
        >
          <Search size={15} />
          <span className="flex-1 text-left">Search…</span>
          <kbd className="font-mono" style={{ fontSize: '10px', border: '1px solid var(--border)', borderRadius: '5px', padding: '0 5px' }}>Ctrl K</kbd>
        </button>
        <button className="btn-icon sm:hidden" onClick={onSearchOpen} aria-label="Search"><Search size={16} /></button>

        {/* Theme toggle */}
        {mounted && (
          <button
            className="btn-icon"
            onClick={toggle}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        )}

        {/* Notifications */}
        <NotificationBell />

        {/* User menu */}
        <div style={{ position: 'relative' }}>
          <button
            className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 transition-all"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit' }}
            onClick={() => setUserMenuOpen(v => !v)}
          >
            <div
              className="flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0"
              style={{ width: '28px', height: '28px', background: 'var(--btn-primary-bg)', color: 'var(--text-on-gold)' }}
            >
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold leading-none" style={{ color: 'var(--text-primary)' }}>{firstName}</p>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', textTransform: 'capitalize' }}>{roleLabel.toLowerCase()}</p>
            </div>
            <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />
          </button>

          {/* Dropdown */}
          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
              <div
                className="absolute right-0 z-50 mt-2 rounded-xl overflow-hidden slide-up"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', minWidth: '200px' }}
              >
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.fullName}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
                  <span
                    className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: 'var(--gold-muted)', color: 'var(--gold)', fontSize: '10px' }}
                  >
                    {roleLabel}
                  </span>
                </div>
                <div style={{ padding: '6px' }}>
                  <Link
                    href="/self-service"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all no-underline"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e: any) => (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'}
                    onMouseLeave={(e: any) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <UserCircle size={14} />My portal
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all no-underline"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e: any) => (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'}
                    onMouseLeave={(e: any) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => { setUserMenuOpen(false); onShortcuts?.() }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
                    style={{ color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                    onMouseEnter={(e: any) => (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'}
                    onMouseLeave={(e: any) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <Keyboard size={14} />Keyboard shortcuts <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>?</span>
                  </button>
                  <button
                    onClick={() => { setUserMenuOpen(false); showSetupChecklist(); if (pathname !== '/dashboard') router.push('/dashboard') }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
                    style={{ color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                    onMouseEnter={(e: any) => (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'}
                    onMouseLeave={(e: any) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <Rocket size={14} />Setup guide
                  </button>
                  <button
                    onClick={() => { setUserMenuOpen(false); logout() }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
                    style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                    onMouseEnter={(e: any) => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'}
                    onMouseLeave={(e: any) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <LogOut size={14} />Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
