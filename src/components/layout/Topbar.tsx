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
import { Menu, Sun, Moon, Search, ChevronDown, LogOut, Keyboard, UserCircle, Rocket, Globe } from 'lucide-react'
import { useAuthStore } from '@/lib/store/slices/authStore'
import { signOut } from '@/lib/auth/session'
import { useTheme } from '@/lib/context/ThemeContext'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useIndustry } from '@/lib/hooks/useIndustry'
import { NotificationBell } from './NotificationBell'
import { QuickCreate } from './QuickCreate'
import { showSetupChecklist } from '@/components/ui/OnboardingChecklist'
import { useRouter } from 'next/navigation'
import { RELEASE } from '@/lib/release'
import { PLATFORM_COLOR } from '@/components/platform/theme'

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
  '/invoicing/h1-register':    'Schedule H1 Register',
  '/demand-forecast':          'Demand Forecasting',
  '/esign':                    'Digital Signing',
  '/automations':              'Smart Automations',
  '/settings/industry':       'Industry',
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
  '/platform':                 'Platform console',
  '/platform/companies':       'All companies',
  '/platform/users':           'All logins',
  '/platform/payments':        'Plan payments',
  '/platform/leads':           'Website enquiries',
  '/platform/activity':        'Console activity',
  '/platform/admins':          'Console administrators',
  '/platform/settings':        'Platform settings',
}

interface TopbarProps {
  onMenuClick?: () => void
  onSearchOpen?: () => void
  onShortcuts?: () => void
}

export function Topbar({ onMenuClick, onSearchOpen, onShortcuts }: TopbarProps) {
  const pathname          = usePathname()
  const router            = useRouter()
  const { user }  = useAuthStore()
  const { isDark, toggle } = useTheme()
  const { roles, isPlatformAdmin } = usePermissions()
  const industry          = useIndustry()
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
  // …in the words of the company's sector ("Patients" for customers in a clinic)
  const titleKey  = TITLES[pathname] ? pathname
    : Object.keys(TITLES).filter(k => pathname.startsWith(k + '/')).sort((a, b) => b.length - a.length)[0]
  const title     = titleKey ? industry.name(titleKey, TITLES[titleKey]) : 'FINVOSMART'
  const initials  = (user?.fullName ?? 'U').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
  const firstName = user?.fullName?.split(' ')[0] ?? 'User'
  const roleLabel = roles[0]?.replace(/_/g, ' ') ?? 'Employee'
  const inConsole = pathname === '/platform' || pathname.startsWith('/platform/')

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

        {/* The platform console — for Finvosmart's own administrators, always one click away */}
        {isPlatformAdmin && (
          <Link
            href="/platform"
            className="flex items-center gap-1.5 h-9 rounded-xl px-3 text-sm font-semibold no-underline whitespace-nowrap"
            style={{
              background: inConsole ? PLATFORM_COLOR : `${PLATFORM_COLOR}14`, color: inConsole ? '#fff' : PLATFORM_COLOR,
              border: `1px solid ${PLATFORM_COLOR}55`,
            }}
            title="Finvosmart platform console: every company, logins, payments, enquiries and the settings for all of Finvosmart"
            aria-current={inConsole ? 'page' : undefined}
            data-testid="open-console"
          >
            <Globe size={15} aria-hidden />
            <span className="hidden md:inline">Admin console</span>
          </Link>
        )}

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
            aria-label="Your account menu"
            aria-expanded={userMenuOpen}
            data-testid="user-menu"
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
                  {isPlatformAdmin && (
                    <span
                      className="inline-block mt-2 ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: `${PLATFORM_COLOR}1a`, color: PLATFORM_COLOR, fontSize: '10px' }}
                      data-testid="console-badge"
                    >
                      Finvosmart administrator
                    </span>
                  )}
                </div>
                <div style={{ padding: '6px' }}>
                  {isPlatformAdmin && (
                    <Link
                      href="/platform"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all no-underline"
                      style={{ color: PLATFORM_COLOR }}
                      onMouseEnter={(e: any) => (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e: any) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                      data-testid="menu-console"
                    >
                      <Globe size={14} />Platform console
                    </Link>
                  )}
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
                    onClick={() => { setUserMenuOpen(false); signOut().finally(() => { window.location.href = '/login?signedout=1' }) }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
                    style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                    onMouseEnter={(e: any) => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'}
                    onMouseLeave={(e: any) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <LogOut size={14} />Sign out
                  </button>
                </div>
                {/* which build of the web app this is — what an update should have changed */}
                <p className="px-4 py-2 font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}
                  data-testid="app-release">
                  Release {RELEASE}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
