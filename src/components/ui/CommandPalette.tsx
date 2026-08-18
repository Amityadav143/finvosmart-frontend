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

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight, Users, FileText, ShoppingCart, Package, TrendingUp, BarChart3, Settings, Building2, Clock, Boxes } from 'lucide-react'
import { cn } from '@/lib/utils'

const COMMANDS = [
  { group: 'Navigation', items: [
    { label: 'Dashboard',           href: '/dashboard',              icon: BarChart3 },
    { label: 'Analytics & Reports', href: '/reports',                icon: BarChart3 },
    { label: 'Notifications',       href: '/notifications',          icon: FileText  },
  ]},
  { group: 'HRMS', items: [
    { label: 'Employees',           href: '/hrms/employees',         icon: Users     },
    { label: 'Attendance',          href: '/hrms/attendance',        icon: Clock     },
    { label: 'Leave Management',    href: '/hrms/leave',             icon: FileText  },
    { label: 'Payroll',             href: '/hrms/payroll',           icon: Building2 },
    { label: 'Recruitment / ATS',   href: '/recruitment',            icon: Users     },
    { label: 'Performance Reviews', href: '/performance',            icon: TrendingUp},
    { label: 'Employee Self-Service',href: '/self-service',          icon: Users     },
    { label: 'Expense Claims',      href: '/expense-claims',         icon: FileText  },
  ]},
  { group: 'Finance', items: [
    { label: 'Invoices',            href: '/invoicing',              icon: FileText  },
    { label: 'Chart of Accounts',   href: '/finance/accounts',       icon: Building2 },
    { label: 'Journal Entries',     href: '/finance/vouchers',       icon: FileText  },
    { label: 'Fixed Assets',        href: '/assets',                 icon: Boxes     },
    { label: 'GST Export',          href: '/gst-export',             icon: FileText  },
    { label: 'Bank Import',         href: '/bank-import',            icon: Building2 },
    { label: 'Bank Reconciliation', href: '/bank-reconciliation',    icon: BarChart3 },
    { label: 'TDS Management',      href: '/tds',                    icon: FileText  },
    { label: 'CA Workspace',        href: '/ca-workspace',           icon: Building2 },
  ]},
  { group: 'Procurement & Inventory', items: [
    { label: 'Purchase Orders',     href: '/procurement/orders',     icon: ShoppingCart },
    { label: 'Vendors',             href: '/procurement/vendors',    icon: Package   },
    { label: 'Inventory Items',     href: '/inventory',              icon: Boxes     },
    { label: 'Stock Scanner',       href: '/inventory/scanner',      icon: Package   },
  ]},
  { group: 'CRM', items: [
    { label: 'Leads Pipeline',      href: '/crm/leads',              icon: TrendingUp},
    { label: 'Customers',           href: '/crm/customers',          icon: Users     },
    { label: 'WhatsApp Hub',        href: '/whatsapp',               icon: FileText  },
  ]},
  { group: 'Operations', items: [
    { label: 'Projects',            href: '/projects',               icon: BarChart3 },
    { label: 'Timesheets',          href: '/timesheet',              icon: Clock     },
    { label: 'Contracts',           href: '/contracts',              icon: FileText  },
    { label: 'Bulk Operations',     href: '/bulk-operations',        icon: Boxes     },
    { label: 'Marketplace & API',   href: '/marketplace',            icon: Settings  },
  ]},
  { group: 'Settings', items: [
    { label: 'Company Settings',    href: '/settings/company',       icon: Building2 },
    { label: 'Document Templates', href: '/settings/templates',     icon: Settings  },
    { label: 'Security & 2FA',      href: '/settings/security',      icon: Settings  },
    { label: 'Webhooks',            href: '/webhooks',               icon: Settings  },
    { label: 'Subscriptions',       href: '/subscriptions',          icon: Building2 },
  ]},
]

const ALL = COMMANDS.flatMap(g => g.items.map(i => ({ ...i, group: g.group })))

interface Props { open: boolean; onClose: () => void }

export function CommandPalette({ open, onClose }: Props) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const router = useRouter()
  const ref = useRef<HTMLInputElement>(null)

  const filtered = q.trim()
    ? ALL.filter(c => c.label.toLowerCase().includes(q.toLowerCase()) || c.group.toLowerCase().includes(q.toLowerCase()))
    : ALL

  useEffect(() => { if (open) { setTimeout(() => ref.current?.focus(), 40); setQ(''); setSel(0) } }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, filtered.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSel(s => Math.max(s - 1, 0)) }
      if (e.key === 'Enter' && filtered[sel]) { router.push(filtered[sel].href); onClose() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, sel, filtered, router, onClose])

  if (!open) return null

  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div className="w-full max-w-lg mx-4 animate-[scaleIn_0.18s_cubic-bezier(0.16,1,0.3,1)]"
        onClick={(e: any) => e.stopPropagation()}
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: '20px', boxShadow: 'var(--shadow-modal)', overflow: 'hidden' }}>
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--gold)' }} />
          <input ref={ref} value={q} onChange={e => { setQ(e.target.value); setSel(0) }}
            placeholder="Search pages, actions, modules..."
            className="flex-1 bg-transparent outline-none text-sm font-medium"
            style={{ color: 'var(--text-primary)' }} />
          <kbd className="font-mono text-xs px-2 py-1 rounded-lg flex-shrink-0"
            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '10px' }}>ESC</kbd>
        </div>
        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>No results for "{q}"</p>
          ) : filtered.map((cmd, i) => {
            const Icon = cmd.icon
            const isSelected = i === sel
            return (
              <button key={cmd.href} onClick={() => { router.push(cmd.href); onClose() }}
                onMouseEnter={() => setSel(i)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-75"
                style={{ background: isSelected ? 'var(--gold-muted)' : 'transparent', border: `1px solid ${isSelected ? 'rgba(245,158,11,0.15)' : 'transparent'}` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: isSelected ? 'rgba(245,158,11,0.12)' : 'var(--bg-hover)' }}>
                  <Icon className="w-4 h-4" style={{ color: isSelected ? 'var(--gold)' : 'var(--text-muted)' }} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium" style={{ color: isSelected ? 'var(--gold-light)' : 'var(--text-primary)' }}>{cmd.label}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{cmd.group}</p>
                </div>
                {isSelected && <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--gold)' }} />}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-4 px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
          {[['↑↓', 'navigate'], ['↵', 'select'], ['ESC', 'close']].map(([key, label]) => (
            <span key={label} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <kbd className="font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', fontSize: '10px' }}>{key}</kbd>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
