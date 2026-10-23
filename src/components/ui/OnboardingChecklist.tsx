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

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  CheckCircle2, Circle, ArrowRight, X, Rocket, Building2, Users, FileText, Boxes, Receipt, UserPlus, IndianRupee, FileUp, Truck,
  type LucideIcon,
} from 'lucide-react'
import { dashboardApi } from '@/lib/api/dashboard'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useAuthStore } from '@/lib/store/slices/authStore'
import type { SetupStatus } from '@/types/dashboard'

interface Step {
  id: string; label: string; why: string; href: string; icon: LucideIcon
  done: (s: SetupStatus) => boolean
  /** Shown only to people who can do it. */
  allowed: (p: ReturnType<typeof usePermissions>) => boolean
  also?: { label: string; href: string }
}

/** The order an Indian business usually sets up in; each step ticks itself off from real data. */
const STEPS: Step[] = [
  { id: 'company', label: 'Add your GSTIN and address', why: 'They print on every invoice and decide CGST/SGST or IGST.', href: '/settings/company',
    icon: Building2, done: s => s.companyDetails, allowed: p => p.can('SETTINGS_COMPANY') || p.isAdmin },
  { id: 'pay', label: 'Show customers how to pay', why: 'Your UPI ID or bank account goes on invoices, with a UPI QR code.', href: '/settings/company?tab=payments',
    icon: IndianRupee, done: s => s.paymentDetails, allowed: p => p.can('SETTINGS_COMPANY') || p.isAdmin },
  { id: 'customers', label: 'Add your customers', why: 'One by one, or all at once from Excel.', href: '/crm/customers?new=1',
    icon: Users, done: s => s.customers > 0, allowed: p => p.canAny('CRM_CREATE', 'CRM_ADMIN'), also: { label: 'Import from Excel', href: '/import?kind=customers' } },
  { id: 'items', label: 'Add what you sell', why: 'Items with HSN codes and GST rates fill in invoices for you.', href: '/inventory/items?new=1',
    icon: Boxes, done: s => s.items > 0, allowed: p => p.canAny('INVENTORY_CREATE', 'INVENTORY_ADMIN'), also: { label: 'Import', href: '/import?kind=items' } },
  { id: 'invoice', label: 'Send your first GST invoice', why: 'With a pay-online link and UPI QR; reminders go out by themselves.', href: '/invoicing/new',
    icon: FileText, done: s => s.invoicesIssued > 0, allowed: p => p.can('INVOICE_CREATE') },
  { id: 'suppliers', label: 'Add your suppliers', why: 'MSME suppliers get their 45-day pay-by dates tracked.', href: '/procurement/vendors?new=1',
    icon: Truck, done: s => s.suppliers > 0, allowed: p => p.can('PROCUREMENT_CREATE'), also: { label: 'Import', href: '/import?kind=suppliers' } },
  { id: 'bill', label: 'Record a supplier bill', why: 'TDS and input credit worked out; due dates on your dashboard.', href: '/purchases/bills/new',
    icon: Receipt, done: s => s.billsRecorded > 0, allowed: p => p.canAny('PROCUREMENT_CREATE', 'FINANCE_CREATE') },
  { id: 'team', label: 'Invite your team or accountant', why: 'Each person sees only what their role allows.', href: '/settings/users',
    icon: UserPlus, done: s => s.users > 1, allowed: p => p.can('SETTINGS_USERS') || p.isAdmin },
]

const KEY = 'finvo-setup-dismissed'
const SHOW_EVENT = 'finvo:setup-show'

/**
 * "Getting started" on the dashboard: the setup steps this person can do, ticked off from the
 * company's real data. It goes away by itself once everything is done, or when dismissed (in this
 * browser — the "Setup guide" link in the menu brings it back).
 */
export function OnboardingChecklist({ companyName }: { companyName?: string }) {
  const perms = usePermissions()
  const { user } = useAuthStore()
  const who = `${user?.companyId ?? ''}:${user?.userId ?? ''}`
  const [dismissed, setDismissed] = useState(true)          // until the saved choice is read, show nothing
  useEffect(() => {
    try { setDismissed(localStorage.getItem(KEY) === who) } catch { setDismissed(false) }
    const show = () => setDismissed(false)
    window.addEventListener(SHOW_EVENT, show)
    return () => window.removeEventListener(SHOW_EVENT, show)
  }, [who])

  const { data } = useQuery({ queryKey: ['setup-status'], queryFn: dashboardApi.setup, staleTime: 60_000, enabled: !dismissed })
  if (dismissed || !data) return null

  const steps = STEPS.filter(s => s.allowed(perms))
  const done = steps.filter(s => s.done(data)).length
  if (steps.length === 0 || done === steps.length) return null
  const next = steps.find(s => !s.done(data))
  const dismiss = () => { setDismissed(true); try { localStorage.setItem(KEY, who) } catch { /* keep it hidden for this visit */ } }

  return (
    <section aria-label="Getting started" data-testid="setup-checklist"
      style={{ position: 'relative', borderRadius: '18px', overflow: 'hidden', border: '1px solid var(--border-strong)', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', marginBottom: '24px' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--btn-primary-bg)' }} />
      <div style={{ padding: '20px 22px' }}>
        <div className="flex items-start justify-between gap-3" style={{ marginBottom: '14px' }}>
          <div className="flex items-center gap-3">
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--gold-muted)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Rocket size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Getting started{companyName ? ` with ${companyName}` : ''}
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                {done} of {steps.length} done{next ? <> · next: <Link href={next.href} style={{ color: 'var(--gold)', fontWeight: 600 }}>{next.label.toLowerCase()}</Link></> : null}
              </p>
            </div>
          </div>
          <button aria-label="Hide getting started" title="Hide (it also goes away by itself once everything is done)" onClick={dismiss} className="btn-icon w-8 h-8">
            <X size={16} />
          </button>
        </div>

        <div style={{ height: '6px', borderRadius: '100px', background: 'var(--bg-input)', overflow: 'hidden', marginBottom: '16px' }}
          role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={done} aria-label="Setup progress">
          <div style={{ height: '100%', width: `${Math.round(done / steps.length * 100)}%`, background: 'var(--btn-primary-bg)', borderRadius: '100px', transition: 'width .5s' }} />
        </div>

        <ol className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', listStyle: 'none', margin: 0, padding: 0 }}>
          {steps.map(s => {
            const ok = s.done(data)
            const Icon = s.icon
            return (
              <li key={s.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '11px', padding: '12px 14px', borderRadius: '12px',
                border: `1px solid ${ok ? 'transparent' : s === next ? 'var(--gold)' : 'var(--border)'}`, background: ok ? 'var(--bg-surface)' : 'var(--bg-card)' }}>
                {ok ? <CheckCircle2 size={19} style={{ color: '#16A34A', flexShrink: 0, marginTop: '1px' }} aria-label="Done" />
                    : <Circle size={19} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '1px' }} aria-label="To do" />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-1.5">
                    <Icon size={13} style={{ color: ok ? 'var(--text-muted)' : 'var(--gold)', flexShrink: 0 }} />
                    {ok ? <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-muted)', textDecoration: 'line-through' }}>{s.label}</span>
                        : <Link href={s.href} style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}>{s.label}</Link>}
                  </div>
                  {!ok && <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0', lineHeight: 1.45 }}>{s.why}</p>}
                  {!ok && (
                    <div className="flex items-center gap-3" style={{ marginTop: '6px' }}>
                      <Link href={s.href} className="inline-flex items-center gap-1" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gold)', textDecoration: 'none' }}>
                        Do it now <ArrowRight size={12} />
                      </Link>
                      {s.also && <Link href={s.also.href} className="inline-flex items-center gap-1" style={{ fontSize: '12px', color: 'var(--text-secondary)', textDecoration: 'none' }}><FileUp size={12} />{s.also.label}</Link>}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

/** Brings the checklist back after it was hidden (the "Setup guide" item in the user menu). */
export function showSetupChecklist() {
  try { localStorage.removeItem(KEY) } catch { /* nothing saved */ }
  window.dispatchEvent(new Event(SHOW_EVENT))
}
