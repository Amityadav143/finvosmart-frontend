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
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { dashboardApi } from '@/lib/api/dashboard'
import { SalesChart, SERIES } from '@/components/dashboard/SalesChart'
import { useTheme } from '@/lib/context/ThemeContext'
import { formatDate } from '@/lib/utils'
import { inr } from '@/lib/money'
import type { DashAnalytics, DashBucket, DashNamed } from '@/types/dashboard'

const n = (x: unknown) => Number(x ?? 0)
const rupees = (x: unknown) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.round(n(x)))
const PERIODS: { months: 3 | 6 | 12; label: string }[] = [{ months: 3, label: '3 months' }, { months: 6, label: '6 months' }, { months: 12, label: '12 months' }]
const LEAD_LABEL: Record<string, string> = {
  NEW: 'New', CONTACTED: 'Contacted', QUALIFIED: 'Qualified', PROPOSAL: 'Proposal sent', NEGOTIATION: 'Negotiating', WON: 'Won', LOST: 'Lost',
}

export default function AnalyticsPage() {
  const [months, setMonths] = useState<3 | 6 | 12>(12)
  const { isDark } = useTheme()
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['analytics', months], queryFn: () => dashboardApi.analytics(months), placeholderData: prev => prev,
  })
  const bar = isDark ? SERIES.dark.invoiced : SERIES.light.invoiced

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {data ? `${formatDate(data.from)} to ${formatDate(data.to)} · ` : ''}from your invoices, payments, bills, employees and leads
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-xl overflow-hidden" role="group" aria-label="Period" style={{ border: '1px solid var(--border)' }}>
            {PERIODS.map(p => (
              <button key={p.months} onClick={() => setMonths(p.months)} aria-pressed={months === p.months}
                className="px-3 h-9 text-xs font-semibold"
                style={{ background: months === p.months ? 'var(--gold-muted)' : 'transparent', color: months === p.months ? 'var(--gold)' : 'var(--text-secondary)' }}>
                {p.label}
              </button>
            ))}
          </div>
          <button className="btn-secondary h-9 text-sm" disabled={!data} onClick={() => data && exportCsv(data)}><Download size={14} />Export CSV</button>
        </div>
      </div>

      {isError && <div className="card text-sm" style={{ color: '#dc2626' }}>Analytics couldn't be loaded. Check your connection and try again.</div>}
      {isLoading && <div className="card text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</div>}

      {data && (
        <div className="space-y-5" style={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity .2s' }}>
          {data.sales && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Figure label={`Invoiced in ${months} months`} value={rupees(data.invoiced)} />
              <Figure label={`Collected in ${months} months`} value={rupees(data.collected)}
                sub={n(data.invoiced) > 0 ? `${Math.round((n(data.collected) / n(data.invoiced)) * 100)}% of what was invoiced` : undefined} />
              <Figure label="Customers owe you now" value={rupees(data.receivable)} />
              <Figure label="Of which overdue" value={rupees(data.overdue)}
                sub={n(data.receivable) > 0 ? `${Math.round((n(data.overdue) / n(data.receivable)) * 100)}% of what's owed` : undefined} />
            </div>
          )}

          {data.sales && (
            <SalesChart months={data.sales} dark={isDark} title="Invoiced and collected by month" subtitle="Credit notes and refunds netted" />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {data.receivableAgeing && (
              <Bars title="What customers owe, by age" note="Open invoices by days past their due date" color={bar}
                rows={data.receivableAgeing.map((b: DashBucket) => ({ key: b.key, label: b.label, value: n(b.amount), text: `${inr(b.amount)}${b.count ? ` · ${b.count}` : ''}` }))}
                empty="Nothing is owed to you right now." link={{ href: '/invoicing', label: 'Invoices' }} />
            )}
            {data.topCustomers && (
              <Bars title="Top customers" note={`By value invoiced in the last ${months} months`} color={bar}
                rows={data.topCustomers.map((c: DashNamed, i) => ({ key: c.name + i, label: c.name, value: n(c.amount), text: `${inr(c.amount)} · ${c.count} doc${c.count === 1 ? '' : 's'}` }))}
                empty="No invoices in this period." link={{ href: '/crm/customers', label: 'Customers' }} />
            )}
            {data.payableAgeing && (
              <Bars title="What you owe suppliers, by age" note="Open bills by days past their due date" color={bar}
                rows={data.payableAgeing.map((b: DashBucket) => ({ key: b.key, label: b.label, value: n(b.amount), text: inr(b.amount) }))}
                empty="You owe suppliers nothing right now." link={{ href: '/purchases', label: 'Bills' }} />
            )}
            {data.headcountByDepartment && (
              <Bars title="Team by department" note="Active employees, including those serving notice" color={bar}
                rows={data.headcountByDepartment.map((h: DashNamed) => ({ key: h.name, label: h.name, value: h.count, text: String(h.count) }))}
                empty="No employees yet." link={{ href: '/hrms/employees', label: 'Employees' }} />
            )}
            {data.leadsByStatus && (
              <Bars title="Leads by stage" note="All leads, with their estimated value" color={bar}
                rows={data.leadsByStatus.map((l: DashNamed) => ({ key: l.name, label: LEAD_LABEL[l.name] ?? l.name, value: l.count,
                  text: `${l.count}${n(l.amount) > 0 ? ` · ${rupees(l.amount)}` : ''}` }))}
                empty="No leads yet." link={{ href: '/crm/leads', label: 'Leads' }} />
            )}
          </div>
          {!data.sales && !data.payableAgeing && !data.headcountByDepartment && !data.leadsByStatus && (
            <div className="card text-sm" style={{ color: 'var(--text-secondary)' }}>There's nothing here for your role yet.</div>
          )}
        </div>
      )}
    </div>
  )
}

function Figure({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card">
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-2xl font-semibold tracking-tight mt-1" style={{ color: 'var(--text-primary)', fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{sub}</p>}
    </div>
  )
}

/** A ranked list of horizontal bars, one colour, each value written at the bar's end. */
function Bars({ title, note, rows, color, empty, link }: {
  title: string; note: string; rows: { key: string; label: string; value: number; text: string }[]; color: string; empty: string
  link: { href: string; label: string }
}) {
  const max = Math.max(0, ...rows.map(r => r.value))
  return (
    <section className="card" aria-label={title}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="section-title">{title}</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{note}</p>
        </div>
        <Link href={link.href} className="text-xs font-semibold shrink-0" style={{ color: 'var(--gold)' }}>{link.label}</Link>
      </div>
      {max <= 0 ? (
        <p className="text-sm py-6" style={{ color: 'var(--text-muted)' }}>{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map(r => (
            <li key={r.key} className="grid items-center gap-3" style={{ gridTemplateColumns: 'minmax(90px, 32%) 1fr' }}>
              <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }} title={r.label}>{r.label}</span>
              <span className="flex items-center gap-2 min-w-0">
                <span className="h-3 rounded-r" style={{ width: `${max ? Math.max(r.value > 0 ? 1.5 : 0, (r.value / max) * 70) : 0}%`, background: color }} />
                <span className="text-xs font-mono whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>{r.text}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function exportCsv(d: DashAnalytics) {
  const cell = (v: unknown) => { const t = v == null ? '' : String(v); return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t }
  const lines: string[] = [`Analytics ${d.from} to ${d.to}`, '']
  if (d.sales) {
    lines.push('Month,Invoiced,Collected')
    d.sales.forEach(m => lines.push([m.month, n(m.invoiced).toFixed(2), n(m.collected).toFixed(2)].map(cell).join(',')))
    lines.push('')
  }
  if (d.receivableAgeing) {
    lines.push('Owed by customers,Amount,Invoices')
    d.receivableAgeing.forEach(b => lines.push([b.label, n(b.amount).toFixed(2), b.count].map(cell).join(',')))
    lines.push('')
  }
  if (d.topCustomers) {
    lines.push('Customer,Invoiced,Documents')
    d.topCustomers.forEach(c => lines.push([c.name, n(c.amount).toFixed(2), c.count].map(cell).join(',')))
    lines.push('')
  }
  if (d.payableAgeing) {
    lines.push('Owed to suppliers,Amount')
    d.payableAgeing.forEach(b => lines.push([b.label, n(b.amount).toFixed(2)].map(cell).join(',')))
    lines.push('')
  }
  if (d.headcountByDepartment) {
    lines.push('Department,Employees')
    d.headcountByDepartment.forEach(h => lines.push([h.name, h.count].map(cell).join(',')))
    lines.push('')
  }
  if (d.leadsByStatus) {
    lines.push('Lead stage,Leads,Estimated value')
    d.leadsByStatus.forEach(l => lines.push([LEAD_LABEL[l.name] ?? l.name, l.count, n(l.amount).toFixed(2)].map(cell).join(',')))
  }
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `analytics_${d.from}_to_${d.to}.csv`; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
