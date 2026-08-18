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

import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Menu, Sun, Moon, Search, ChevronDown, LogOut } from 'lucide-react'
import { useAuthStore } from '@/lib/store/slices/authStore'
import { useTheme } from '@/lib/context/ThemeContext'
import { usePermissions } from '@/lib/hooks/usePermissions'

/* ── Page titles keyed by route ─────────────────────────────────────── */
const TITLES: Record<string, string> = {
  '/dashboard':                'Dashboard',
  '/notifications':            'Notifications',
  '/hrms/employees':           'Employees',
  '/hrms/attendance':          'Attendance',
  '/hrms/leave':               'Leave Management',
  '/hrms/payroll':             'Payroll',
  '/finance/accounts':         'Chart of Accounts',
  '/finance/vouchers':         'Journal Entries',
  '/finance/reports':          'Financial Reports',
  '/invoicing':                'Invoices',
  '/quotations':               'Quotations',
  '/crm/leads':                'CRM — Pipeline',
  '/crm/customers':            'Customers',
  '/procurement/orders':       'Purchase Orders',
  '/procurement/vendors':      'Vendors',
  '/procurement/grn':          'Goods Receipt Notes',
  '/inventory/items':          'Inventory Items',
  '/inventory/stock':          'Stock Movements',
  '/inventory/assets':         'Fixed Assets',
  '/projects':                 'Projects',
  '/reports':                  'Analytics',
  '/ai/cashflow':              'ARIS — Cash Flow Oracle',
  '/ai/wellness':              'Employee Wellness AI',
  '/ai/scanner':               'Smart Bill Scanner',
  '/whatsapp':                 'WhatsApp Hub',
  '/gst-reconciler':           'GST Reconciler',
  '/bank-reconciliation':      'Bank Reconciliation',
  '/expense-claims':           'Expense Claims',
  '/client-portal':            'Client Portal',
  '/subscriptions':            'Recurring Billing',
  '/tds':                      'TDS Tracker',
  '/demand-forecast':          'Demand Forecasting',
  '/esign':                    'Digital Signing',
  '/automations':              'Smart Automations',
  '/settings/company':         'Company Settings',
  '/settings/users':           'Users & Access',
  '/settings/roles':           'Roles & Permissions',
  '/settings/modules':         'Module Settings',
  '/settings/workflow':        'Approval Workflows',
  '/settings/audit-log':       'Audit Log',
}

interface TopbarProps {
  onMenuClick?: () => void
  onSearchOpen?: () => void
}

export function Topbar({ onMenuClick, onSearchOpen }: TopbarProps) {
  const pathname          = usePathname()
  const { user, logout }  = useAuthStore()
  const { isDark, toggle } = useTheme()
  const { data: notifData } = useQuery({
    queryKey: ['notif-count'],
    queryFn: async () => {
      try {
        const { api } = await import('@/lib/api/client')
        const res = await api.get('/notifications/unread-count')
        return res.data.data as { count: number }
      } catch { return { count: 0 } }
    },
    refetchInterval: 60000, // refresh every minute
    staleTime: 30000,
  })
  const notifCount = notifData?.count ?? 0
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

  const title     = TITLES[pathname] ?? 'FINVOSMART'
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
        <span className="hidden md:block text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
          {time}
        </span>

        {/* Search */}
        <button
          className="btn-icon hidden sm:flex"
          onClick={onSearchOpen}
          title="Search (⌘K)"
          aria-label="Open search"
        >
          <Search size={16} />
        </button>

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
        <Link
          href="/notifications"
          className="btn-icon"
          style={{ position: 'relative', textDecoration: 'none' }}
          aria-label="Notifications"
        >
          <Bell size={16} />
          {notifCount > 0 ? (
              <span style={{
                position: 'absolute', top: '-4px', right: '-4px',
                width: notifCount > 9 ? '18px' : '16px', height: '16px',
                borderRadius: '8px', background: '#DC2626',
                color: 'white', fontSize: '10px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'inherit', lineHeight: 1
              }}>
                {notifCount > 99 ? '99+' : notifCount}
              </span>
            ) : (
              <span className="notif-dot" />
            )}
        </Link>

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
                    href="/settings/company"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all no-underline"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e: any) => (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'}
                    onMouseLeave={(e: any) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    Settings
                  </Link>
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
