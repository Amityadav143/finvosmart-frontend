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
import { useQuery } from '@tanstack/react-query'
import {
  AlertOctagon, AlertTriangle, CalendarClock, CheckCircle2, ChevronRight, Info, Landmark,
  IndianRupee, Package, Receipt, RefreshCw, Scale, TrendingUp, Users, Wallet,
} from 'lucide-react'
import { SalesChart } from '@/components/dashboard/SalesChart'
import { dashboardApi } from '@/lib/api/dashboard'
import { OnboardingChecklist } from '@/components/ui/OnboardingChecklist'
import { useTheme } from '@/lib/context/ThemeContext'
import { useAuthStore } from '@/lib/store/slices/authStore'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { formatDate } from '@/lib/utils'
import { inr } from '@/lib/money'
import type { DashAction, DashboardSummary, DashDeadline } from '@/types/dashboard'

const n = (x: unknown) => Number(x ?? 0)

/** ₹ without paise for tiles: "₹12,34,567". */
const rupees = (x: unknown) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.round(n(x)))

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { isDark } = useTheme()
  const { data, isLoading, isError, refetch, isFetching } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.summary, staleTime: 60_000 })

  const hour = Number(new Date().toLocaleString('en-IN', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' }))
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title">{greeting}, <span className="text-gold-grad">{user?.fullName?.split(' ')[0] ?? 'there'}</span></h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{today}{data ? ` · financial year ${data.financialYear}` : ''}</p>
        </div>
        <button className="btn-secondary h-9 text-sm" onClick={() => refetch()} disabled={isFetching} aria-label="Refresh the dashboard">
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />Refresh
        </button>
      </div>

      <OnboardingChecklist companyName={user?.companyName} />

      {isError && <div className="card text-sm" style={{ color: '#dc2626' }}>The dashboard couldn't be loaded. Check your connection and refresh.</div>}
      {isLoading && <div className="card text-sm" style={{ color: 'var(--text-muted)' }}>Loading your numbers…</div>}

      {data && (
        <div className="space-y-5" style={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity .2s' }}>
          <Actions actions={data.actions} />
          <Tiles d={data} />
          {data.sales && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <SalesChart className="xl:col-span-2" months={data.sales.months} dark={isDark} title="Invoiced and collected"
                subtitle={`Last 12 months · credit notes and refunds netted${data.sales.avgDaysToGetPaid != null ? ` · customers pay ${data.sales.avgDaysToGetPaid} days after invoicing on average` : ''}`} />
              <Debtors d={data} />
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            <Deadlines deadlines={data.deadlines} />
            {data.payroll && <PayrollCard d={data} />}
            {data.gst && <GstCard d={data} />}
            {data.people && <PeopleCard d={data} />}
            {data.stock && <StockCard d={data} />}
            {data.cash && data.cash.accounts.length > 0 && <CashCard d={data} />}
          </div>
          {!data.sales && !data.payables && !data.cash && !data.payroll && !data.people && !data.stock && (
            <div className="card text-sm" style={{ color: 'var(--text-secondary)' }}>
              Your role shows a short dashboard. Your own payslips, leave and attendance are in <Link href="/self-service" className="underline">My Portal</Link>.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── what needs doing ────────────────────────────────────────────────────

const TONE = {
  red: { color: '#d03b3b', icon: AlertOctagon, label: 'Act now' },
  amber: { color: '#b45309', icon: AlertTriangle, label: 'Soon' },
  blue: { color: '#2a78d6', icon: Info, label: 'To do' },
}

function Actions({ actions }: { actions: DashAction[] }) {
  if (actions.length === 0) {
    return (
      <div className="card flex items-center gap-3 text-sm">
        <CheckCircle2 size={18} style={{ color: '#16a34a' }} aria-hidden />
        <span><strong>Nothing needs your attention right now.</strong> <span style={{ color: 'var(--text-secondary)' }}>Overdue invoices, bills due, payroll and filing dates will show up here.</span></span>
      </div>
    )
  }
  return (
    <section className="card" aria-labelledby="todo-title">
      <h2 id="todo-title" className="section-title mb-3">Needs your attention</h2>
      <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
        {actions.slice(0, 8).map((a, i) => {
          const t = TONE[a.tone] ?? TONE.blue
          return (
            <li key={i} style={{ borderColor: 'var(--border)' }}>
              <Link href={a.href} className="flex items-start gap-3 py-2.5 group">
                <t.icon size={17} className="shrink-0 mt-0.5" style={{ color: t.color }} aria-label={t.label} />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{a.title}</span>
                  {a.detail && <span className="block text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{a.detail}</span>}
                </span>
                <ChevronRight size={16} className="shrink-0 mt-0.5 opacity-50 group-hover:opacity-100" aria-hidden />
              </Link>
            </li>
          )
        })}
      </ul>
      {actions.length > 8 && <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>…and {actions.length - 8} more.</p>}
    </section>
  )
}

// ── headline figures ────────────────────────────────────────────────────

function Tiles({ d }: { d: DashboardSummary }) {
  const tiles: JSX.Element[] = []
  const s = d.sales, p = d.payables, c = d.cash, pr = d.profit, g = d.gst
  if (s) {
    tiles.push(<Tile key="rec" icon={Receipt} label="Customers owe you" value={rupees(s.receivable)} href="/invoicing"
      sub={n(s.overdue) > 0 ? `${rupees(s.overdue)} overdue on ${s.overdueCount} invoice${s.overdueCount === 1 ? '' : 's'}` : `${s.openInvoices} open invoice${s.openInvoices === 1 ? '' : 's'}, none overdue`} />)
    tiles.push(<Tile key="col" icon={IndianRupee} label="Collected this month" value={rupees(s.collectedThisMonth)} href="/invoicing"
      sub={`Last month ${rupees(s.collectedLastMonth)}${s.avgDaysToGetPaid != null ? ` · customers pay in ${s.avgDaysToGetPaid} days on average` : ''}`} />)
  }
  if (p) tiles.push(<Tile key="pay" icon={Landmark} label="You owe suppliers" value={rupees(p.owed)} href="/purchases"
    sub={p.dueNext7Count > 0 ? `${rupees(p.dueNext7Days)} due in the next 7 days` : n(p.overdue) > 0 ? `${rupees(p.overdue)} overdue` : `${p.openBills} open bill${p.openBills === 1 ? '' : 's'}`} />)
  if (c) tiles.push(<Tile key="cash" icon={Wallet} label="Bank and cash (per books)" value={rupees(c.total)} href="/finance/accounts"
    sub={c.hasEntries ? c.accounts.slice(0, 2).map(a => `${a.name} ${rupees(a.balance)}`).join(' · ') : 'Nothing posted yet — add opening balances'} />)
  if (pr) tiles.push(<Tile key="pl" icon={TrendingUp} label="Profit this month" value={rupees(pr.profitThisMonth)} href="/finance/reports"
    sub={`${pr.financialYear} so far: ${rupees(pr.profitYear)}`} />)
  if (g) tiles.push(<Tile key="gst" icon={Scale} label={`GST for ${g.period} (estimate)`} value={rupees(g.estimatedPayable)} href="/gst-reconciler"
    sub={`GSTR-3B by ${formatDate(g.gstr3bDue)}${n(g.creditCarriedForward) > 0 ? ` · ${rupees(g.creditCarriedForward)} credit left` : ''}`} />)
  if (tiles.length === 0) return null
  return <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">{tiles}</div>
}

function Tile({ icon: Icon, label, value, sub, href }: { icon: any; label: string; value: string; sub?: string; href: string }) {
  return (
    <Link href={href} className="card block hover:opacity-95 transition-opacity">
      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}><Icon size={14} aria-hidden />{label}</div>
      <p className="text-2xl font-semibold tracking-tight mt-1.5" style={{ color: 'var(--text-primary)', fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{sub}</p>}
    </Link>
  )
}

function Debtors({ d }: { d: DashboardSummary }) {
  const list = d.sales?.overdueCustomers ?? []
  return (
    <section className="card" aria-labelledby="debtors-title">
      <div className="flex items-center justify-between">
        <h2 id="debtors-title" className="section-title">Customers to chase</h2>
        <Link href="/invoicing" className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--gold)' }}>Invoices <ChevronRight size={12} /></Link>
      </div>
      {list.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>No overdue invoices. Nicely done.</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {list.map(c => (
            <li key={(c.customerId ?? '') + c.name} className="flex items-start justify-between gap-3 text-sm">
              <span className="min-w-0">
                <span className="block font-medium truncate">{c.name}</span>
                <span className="block text-xs" style={{ color: 'var(--text-secondary)' }}>{c.invoices} invoice{c.invoices === 1 ? '' : 's'} · up to {c.daysLate} day{c.daysLate === 1 ? '' : 's'} late</span>
              </span>
              <span className="font-mono shrink-0">{inr(c.overdue)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// ── the rest ────────────────────────────────────────────────────────────

const AREA_HREF: Record<string, string> = { GST: '/gst-reconciler', TDS: '/tds', PAYROLL: '/hrms/payroll', INCOME_TAX: '/finance/reports' }

function Deadlines({ deadlines }: { deadlines: DashDeadline[] }) {
  return (
    <section className="card" aria-labelledby="dates-title">
      <h2 id="dates-title" className="section-title flex items-center gap-2"><CalendarClock size={16} style={{ color: 'var(--gold)' }} />Coming up</h2>
      {deadlines.length === 0 ? (
        <p className="text-sm py-6" style={{ color: 'var(--text-muted)' }}>No statutory dates for your areas in the next five weeks.</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {deadlines.slice(0, 7).map(dl => (
            <li key={dl.date + dl.title}>
              <Link href={AREA_HREF[dl.area] ?? '/dashboard'} className="flex items-start gap-3 text-sm" title={dl.detail}>
                <span className="w-12 shrink-0 text-center rounded-lg py-1" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <span className="block text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>{new Date(dl.date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short' })}</span>
                  <span className="block font-semibold leading-tight">{dl.date.slice(8, 10)}</span>
                </span>
                <span className="min-w-0">
                  <span className="block font-medium">{dl.title}</span>
                  <span className="block text-xs" style={{ color: dl.daysLeft <= 2 ? '#d03b3b' : 'var(--text-secondary)' }}>
                    {dl.daysLeft === 0 ? 'Due today' : dl.daysLeft === 1 ? 'Due tomorrow' : `In ${dl.daysLeft} days`}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[11px] mt-3" style={{ color: 'var(--text-muted)' }}>Dates as the law sets them; a holiday or a government extension can move them.</p>
    </section>
  )
}

const PAYROLL_LABEL: Record<string, string> = { DRAFT: 'Draft — not approved', APPROVED: 'Approved, not yet paid', PAID: 'Paid' }

function PayrollCard({ d }: { d: DashboardSummary }) {
  const p = d.payroll!
  return (
    <section className="card" aria-labelledby="payroll-title">
      <div className="flex items-center justify-between">
        <h2 id="payroll-title" className="section-title flex items-center gap-2"><Users size={16} style={{ color: 'var(--gold)' }} />Payroll</h2>
        <Link href="/hrms/payroll" className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--gold)' }}>Open <ChevronRight size={12} /></Link>
      </div>
      <dl className="mt-3 space-y-2 text-sm">
        <Row k={p.currentLabel} v={p.currentStatus ? (PAYROLL_LABEL[p.currentStatus] ?? p.currentStatus) : 'Not run yet'} />
        {p.latestLabel && <Row k={`Net pay, ${p.latestLabel}`} v={inr(p.latestNet)} />}
        {p.latestLabel && <Row k="Cost to company" v={inr(p.latestCost)} />}
        <Row k="Salary set-ups" v={`${p.employeesSetUp} ready${p.employeesMissingSetUp ? `, ${p.employeesMissingSetUp} missing` : ''}`} />
      </dl>
    </section>
  )
}

function GstCard({ d }: { d: DashboardSummary }) {
  const g = d.gst!
  return (
    <section className="card" aria-labelledby="gst-title">
      <div className="flex items-center justify-between">
        <h2 id="gst-title" className="section-title flex items-center gap-2"><Landmark size={16} style={{ color: 'var(--gold)' }} />GST — {g.period}</h2>
        <Link href="/gst-reconciler" className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--gold)' }}>Check credit <ChevronRight size={12} /></Link>
      </div>
      <dl className="mt-3 space-y-2 text-sm">
        <Row k="GST on your sales" v={inr(g.outputTax)} />
        <Row k="Input credit from bills" v={`− ${inr(g.inputTax)}`} />
        {n(g.reverseCharge) > 0 && <Row k="Reverse charge (pay in cash)" v={inr(g.reverseCharge)} />}
        <Row k="Estimated to pay" v={inr(g.estimatedPayable)} strong />
      </dl>
      <p className="text-[11px] mt-3" style={{ color: 'var(--text-muted)' }}>
        From your invoices and recorded bills. Claim only credit that appears in GSTR-2B. GSTR-1 by {formatDate(g.gstr1Due)}, GSTR-3B by {formatDate(g.gstr3bDue)} (monthly filers).
      </p>
    </section>
  )
}

function PeopleCard({ d }: { d: DashboardSummary }) {
  const p = d.people!
  return (
    <section className="card" aria-labelledby="people-title">
      <div className="flex items-center justify-between">
        <h2 id="people-title" className="section-title flex items-center gap-2"><Users size={16} style={{ color: 'var(--gold)' }} />People</h2>
        <Link href="/hrms/employees" className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--gold)' }}>Employees <ChevronRight size={12} /></Link>
      </div>
      <dl className="mt-3 space-y-2 text-sm">
        <Row k="Active employees" v={String(p.active)} />
        <Row k="On leave today" v={String(p.onLeaveToday)} />
        {(p.joinedThisMonth > 0 || p.leavingThisMonth > 0) && <Row k="Joining / leaving this month" v={`${p.joinedThisMonth} / ${p.leavingThisMonth}`} />}
        {p.onNotice > 0 && <Row k="Serving notice" v={String(p.onNotice)} />}
        {p.pendingLeave != null && <Row k="Leave requests to approve" v={String(p.pendingLeave)} />}
      </dl>
    </section>
  )
}

function StockCard({ d }: { d: DashboardSummary }) {
  const s = d.stock!
  return (
    <section className="card" aria-labelledby="stock-title">
      <div className="flex items-center justify-between">
        <h2 id="stock-title" className="section-title flex items-center gap-2"><Package size={16} style={{ color: 'var(--gold)' }} />Stock to reorder</h2>
        <Link href="/inventory" className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--gold)' }}>Inventory <ChevronRight size={12} /></Link>
      </div>
      {s.lowCount === 0 ? (
        <p className="text-sm py-6" style={{ color: 'var(--text-muted)' }}>Everything is above its reorder level.</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {s.items.map(i => (
            <li key={i.code} className="flex items-center justify-between gap-3">
              <span className="min-w-0"><span className="block truncate font-medium">{i.name}</span><span className="block text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{i.code}</span></span>
              <span className="text-xs shrink-0" style={{ color: 'var(--text-secondary)' }}>{n(i.stock)} left · reorder at {n(i.reorderLevel)}</span>
            </li>
          ))}
          {s.lowCount > s.items.length && <li className="text-xs" style={{ color: 'var(--text-muted)' }}>…and {s.lowCount - s.items.length} more</li>}
        </ul>
      )}
    </section>
  )
}

function CashCard({ d }: { d: DashboardSummary }) {
  const c = d.cash!
  return (
    <section className="card" aria-labelledby="cash-title">
      <div className="flex items-center justify-between">
        <h2 id="cash-title" className="section-title flex items-center gap-2"><Wallet size={16} style={{ color: 'var(--gold)' }} />Bank and cash</h2>
        <Link href="/bank-reconciliation" className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--gold)' }}>Reconcile <ChevronRight size={12} /></Link>
      </div>
      <dl className="mt-3 space-y-2 text-sm">
        {c.accounts.map(a => <Row key={a.code} k={a.name} v={inr(a.balance)} />)}
        <Row k="Total" v={inr(c.total)} strong />
      </dl>
      <p className="text-[11px] mt-3" style={{ color: 'var(--text-muted)' }}>Per your books. Import a bank statement to match it with the bank.</p>
    </section>
  )
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${strong ? 'font-semibold' : ''}`}>
      <dt style={{ color: strong ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{k}</dt>
      <dd className="font-mono text-right" style={{ color: 'var(--text-primary)' }}>{v}</dd>
    </div>
  )
}
