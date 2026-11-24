'use client'
/*
 * FINVOSMART — Finvosmart by Navgrow
 *
 * Copyright (c) 2025-2026 Navgrow Engineering Service Pvt. Ltd.
 * CIN: U29302WB2025PTC281015
 *
 * All rights reserved. This source code is proprietary and confidential.
 * Unauthorized copying, distribution, modification, or use of this file,
 * via any medium, is strictly prohibited without prior written permission.
 */

import { Fragment, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { AlertOctagon, ArrowDownLeft, ArrowUpRight, CheckCircle2, ChevronDown, Info, Landmark, RefreshCw, Table2, Wallet } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { compact, SERIES } from '@/components/dashboard/SalesChart'
import { dashboardApi } from '@/lib/api/dashboard'
import { useTheme } from '@/lib/context/ThemeContext'
import { inr } from '@/lib/money'
import { apiError, formatDate } from '@/lib/utils'
import type { CashForecastView, CashMove, CashWeek } from '@/types/cashflow'

const n = (x: unknown) => Number(x ?? 0)
/** Whole rupees, halves rounded away from zero for minus amounts too (Math.round alone takes −0.5 up to 0), and never "−₹0". */
const whole = (v: number) => { const r = Math.sign(v) * Math.round(Math.abs(v)); return r === 0 ? 0 : r }
const rupees = (x: unknown) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(whole(n(x)))
const weekName = (w: { start: string; end: string }) => `${formatDate(w.start, 'd MMM')} – ${formatDate(w.end, 'd MMM')}`
/** Critical, as the dashboard's "Act now" (status colours are kept for status, with an icon and words beside them). */
const SHORT = '#d03b3b'

/**
 * Cash for the next 13 weeks, from the books (CashForecastService): where it starts, what comes in and goes out each
 * week, the lowest point and the first week it would run short — and what isn't counted, with the invoices to chase.
 */
export default function CashFlowPage() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({ queryKey: ['cash-forecast'], queryFn: dashboardApi.cashForecast, staleTime: 60_000 })
  return (
    <PermissionGate anyOf={['FINANCE_VIEW', 'FINANCE_REPORTS']} showDenied>
      <div className="space-y-5" data-testid="cash-flow">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="page-title">Cash-flow forecast</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              The next 13 weeks from your books: bank and cash today, open invoices, supplier bills, salaries and taxes.
            </p>
          </div>
          <button className="btn-secondary h-9 text-sm" onClick={() => refetch()} disabled={isFetching} aria-label="Work the forecast out again">
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />Refresh
          </button>
        </div>
        {isLoading && <div className="card text-sm" style={{ color: 'var(--text-muted)' }}>Working out the weeks ahead…</div>}
        {error && <div className="card text-sm" style={{ color: '#dc2626' }} role="alert">{apiError(error, 'The forecast couldn’t be worked out. Refresh to try again.')}</div>}
        {data && <Forecast v={data} />}
      </div>
    </PermissionGate>
  )
}

function Forecast({ v }: { v: CashForecastView }) {
  const f = v.forecast
  const short = f.shortWeek ? f.weeks.find(w => w.start === f.shortWeek) : undefined
  return (
    <>
      {short ? (
        <div className="card flex items-start gap-3" role="alert" data-testid="cash-short" style={{ borderColor: `${SHORT}55` }}>
          <AlertOctagon size={20} className="shrink-0 mt-0.5" style={{ color: SHORT }} aria-hidden />
          <div className="text-sm">
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Cash may run short in the week of {formatDate(short.start, 'd MMMM')}: about {rupees(-n(short.closing))} below zero by its end.
            </p>
            <p className="mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {n(v.lateTotal) > 0 ? `Chasing the ${rupees(v.lateTotal)} of invoices later than usual would help — ` : ''}
              or move a supplier payment to a later week. The weeks below show what comes in and goes out.
            </p>
          </div>
        </div>
      ) : (
        <div className="card flex items-start gap-3 text-sm" data-testid="cash-ok">
          <CheckCircle2 size={20} className="shrink-0 mt-0.5" style={{ color: '#16a34a' }} aria-hidden />
          <p>
            <strong>Cash stays above zero for the next 13 weeks.</strong>{' '}
            <span style={{ color: 'var(--text-secondary)' }}>
              Lowest: {rupees(f.lowest)}{f.lowestWeek ? ` at the end of the week of ${formatDate(f.lowestWeek, 'd MMMM')}` : ''}.
            </span>
          </p>
        </div>
      )}
      {!v.booksHaveEntries && (
        <div className="card flex items-start gap-3 text-sm">
          <Info size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--gold)' }} aria-hidden />
          <p>Your books have no bank or cash balance yet, so the forecast starts from ₹0.{' '}
            <Link href="/import?kind=opening-balances" className="text-link">Add opening balances</Link> to start from the cash you have.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Tile icon={Wallet} label="Cash today (per books)" value={rupees(f.opening)} href="/finance/accounts"
          sub={v.accounts.slice(0, 2).map(a => `${a.name} ${rupees(a.balance)}`).join(' · ') || 'Bank and cash accounts'} />
        <Tile icon={ArrowDownLeft} label="Coming in · 13 weeks" value={rupees(f.totalIn)} href="/invoicing"
          sub={`From open invoices${v.usualLateDays ? `, as late as each customer usually pays (on average ${v.usualLateDays} days)` : ''}`} />
        <Tile icon={ArrowUpRight} label="Going out · 13 weeks" value={rupees(f.totalOut)} href="/purchases"
          sub={v.payrollCounted ? 'Supplier bills, salaries, PF, ESI, TDS and GST' : 'Supplier bills, TDS and GST'} />
        <Tile icon={Landmark} label="Cash in 13 weeks" value={rupees(f.closing)} tone={n(f.closing) < 0 ? SHORT : undefined}
          sub={f.weeks.length ? `By ${formatDate(f.weeks[f.weeks.length - 1].end, 'd MMM yyyy')}` : ''} />
      </div>

      <CashChart weeks={f.weeks} opening={n(f.opening)} />
      <Weeks weeks={f.weeks} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="card" aria-labelledby="late-title" data-testid="cash-late">
          <h2 id="late-title" className="section-title">Not counted: later than usual</h2>
          {v.lateCount === 0 ? (
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>No invoice is later than its customer usually pays.</p>
          ) : (
            <>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {rupees(v.lateTotal)} on {v.lateCount} invoice{v.lateCount === 1 ? '' : 's'}: later than these customers usually pay, so not
                expected in any week. Chase them — every rupee collected adds to the weeks above.
              </p>
              <ul className="mt-3 space-y-2">
                {v.lateCustomers.map(c => (
                  <li key={(c.customerId ?? '') + c.name} className="flex items-start justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      <span className="block font-medium truncate">{c.name}</span>
                      <span className="block text-xs" style={{ color: 'var(--text-secondary)' }}>{c.invoices} invoice{c.invoices === 1 ? '' : 's'} · {c.daysLate} days past due</span>
                    </span>
                    <span className="font-mono shrink-0">{inr(c.amount)}</span>
                  </li>
                ))}
              </ul>
              <Link href="/invoicing" className="text-link text-sm inline-block mt-3">Open invoices to chase</Link>
            </>
          )}
        </section>
        <section className="card" aria-labelledby="how-title">
          <h2 id="how-title" className="section-title">How it is worked out</h2>
          <ul className="mt-2 space-y-1.5 text-sm list-disc pl-5" style={{ color: 'var(--text-secondary)' }}>
            <li>It starts from your bank and cash balances in the books today.</li>
            <li>Each open invoice comes in on its due date, later by the days that customer usually pays late (from their payments in the last year).</li>
            <li>Each supplier bill goes out on its due date — an MSME supplier’s pay-by date when earlier; one already past is counted this week.</li>
            {v.payrollCounted && <li>Salaries go out on the pay day of your latest payroll run, for the same amount; PF and ESI by the 15th and TDS by the 7th of the next month.</li>}
            <li>GST goes out by the 20th (GSTR-3B), estimated from your invoices and bills; TDS deducted from suppliers by the 7th.</li>
            <li>Taxes and salary dues stay counted until their due date — one already paid early still shows until then.</li>
          </ul>
          <p className="text-sm mt-3 font-semibold" style={{ color: 'var(--text-primary)' }}>Not counted</p>
          <ul className="mt-1 space-y-1 text-sm list-disc pl-5" style={{ color: 'var(--text-secondary)' }} data-testid="cash-not-counted">
            {v.notCounted.map(t => <li key={t}>{t}</li>)}
            {(n(f.laterIn) > 0 || n(f.laterOut) > 0) && <li>After the 13 weeks: {rupees(f.laterIn)} in and {rupees(f.laterOut)} out already known</li>}
          </ul>
        </section>
      </div>
    </>
  )
}

function Tile({ icon: Icon, label, value, sub, href, tone }: { icon: any; label: string; value: string; sub?: string; href?: string; tone?: string }) {
  const body = (
    <>
      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}><Icon size={14} aria-hidden />{label}</div>
      <p className="text-2xl font-semibold tracking-tight mt-1.5" style={{ color: tone ?? 'var(--text-primary)', fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{sub}</p>}
    </>
  )
  return href ? <Link href={href} className="card block hover:opacity-95 transition-opacity">{body}</Link> : <div className="card">{body}</div>
}

/** Cash at the end of each week: one line, the ₹0 line marked, a week below zero marked in red — and a table view. */
function CashChart({ weeks, opening }: { weeks: CashWeek[]; opening: number }) {
  const { isDark } = useTheme()
  const [table, setTable] = useState(false)
  const line = isDark ? SERIES.dark.invoiced : SERIES.light.invoiced
  const grid = isDark ? '#24324b' : '#ece7dc', axis = isDark ? '#8a9bb8' : '#7b6c56'
  const rows = [{ label: 'Today', start: '', end: '', closing: opening, in: 0, out: 0, today: true },
    // each point is the cash at a week's end, so it carries that day (Sunday): Today, 22 Nov, 29 Nov… in date order
    ...weeks.map(w => ({ label: formatDate(w.end, 'd MMM'), start: w.start, end: w.end, closing: n(w.closing), in: n(w.in), out: n(w.out), today: false }))]
  return (
    <section className="card" aria-label="Cash at the end of each week" data-testid="cash-chart">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="section-title">Cash at the end of each week</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Weeks run Monday to Sunday · below the ₹0 line, cash would run out</p>
        </div>
        <button className="btn-secondary h-8 text-xs" onClick={() => setTable(t => !t)} aria-pressed={table}><Table2 size={13} />{table ? 'Chart' : 'Table'}</button>
      </div>
      {table ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
            <thead><tr className="text-xs" style={{ color: 'var(--text-muted)' }}>
              <th className="text-left py-1.5 font-semibold">Week</th><th className="text-right font-semibold">In</th><th className="text-right font-semibold">Out</th><th className="text-right font-semibold">Cash at the end</th>
            </tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.label} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="py-1.5">{r.today ? 'Today' : weekName(r)}</td>
                  <td className="text-right font-mono">{r.today ? '' : inr(r.in)}</td>
                  <td className="text-right font-mono">{r.today ? '' : inr(r.out)}</td>
                  <td className="text-right font-mono" style={r.closing < 0 ? { color: SHORT, fontWeight: 600 } : undefined}>{inr(r.closing)}{r.closing < 0 ? ' · short' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 10, right: 12, left: 0, bottom: 0 }} accessibilityLayer>
              <CartesianGrid vertical={false} stroke={grid} strokeWidth={1} />
              <XAxis dataKey="label" axisLine={{ stroke: grid }} tickLine={false} tick={{ fontSize: 11, fill: axis }} interval="preserveStartEnd" />
              <YAxis axisLine={false} tickLine={false} width={60} tick={{ fontSize: 11, fill: axis }} tickFormatter={compact} />
              <ReferenceLine y={0} stroke={axis} strokeDasharray="4 4" ifOverflow="extendDomain" />
              <Tooltip cursor={{ stroke: axis, strokeDasharray: '3 3' }} content={<WeekTip />} />
              <Line type="monotone" dataKey="closing" name="Cash at the end" stroke={line} strokeWidth={2} isAnimationActive={false}
                dot={(p: any) => <circle key={p.index} cx={p.cx} cy={p.cy} r={p.payload.closing < 0 ? 5 : 3.5} fill={p.payload.closing < 0 ? SHORT : line}
                  stroke="var(--bg-card)" strokeWidth={2} />}
                activeDot={{ r: 6, stroke: 'var(--bg-card)', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}

function WeekTip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const r = payload[0].payload
  return (
    <div className="rounded-xl px-3 py-2.5 text-xs" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-md)' }}>
      <p className="mb-1.5" style={{ color: 'var(--text-secondary)' }}>{r.today ? 'Today' : `Week of ${weekName(r)}`}</p>
      {!r.today && <p style={{ color: 'var(--text-secondary)' }}>In <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>{inr(r.in)}</strong> · Out <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>{inr(r.out)}</strong></p>}
      <p className="mt-1" style={{ color: r.closing < 0 ? SHORT : 'var(--text-primary)' }}>
        <strong className="font-mono">{inr(r.closing)}</strong> {r.today ? 'in the bank and cash' : 'at the end of the week'}{r.closing < 0 ? ' — short' : ''}
      </p>
    </div>
  )
}

/** Week by week: what comes in and goes out, each week opening to its moves. */
function Weeks({ weeks }: { weeks: CashWeek[] }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <section className="card" aria-labelledby="weeks-title" data-testid="cash-weeks">
      <h2 id="weeks-title" className="section-title">Week by week</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
          <thead>
            <tr className="text-xs" style={{ color: 'var(--text-muted)' }}>
              <th className="text-left py-1.5 font-semibold">Week</th>
              <th className="text-right font-semibold">Coming in</th>
              <th className="text-right font-semibold">Going out</th>
              <th className="text-right font-semibold">Cash at the end</th>
              <th className="w-8" aria-label="Details" />
            </tr>
          </thead>
          <tbody>
            {weeks.map(w => {
              const isOpen = open === w.number
              const shortWeek = n(w.closing) < 0
              return (
                <Fragment key={w.number}>
                  <tr style={{ borderTop: '1px solid var(--border)', cursor: w.moves ? 'pointer' : 'default' }} data-week={w.start}
                    onClick={() => w.moves && setOpen(isOpen ? null : w.number)}>
                    <td className="py-2">{weekName(w)}{w.number === 1 && <span className="text-xs ml-1.5" style={{ color: 'var(--text-muted)' }}>this week</span>}</td>
                    <td className="text-right font-mono" style={{ color: n(w.in) > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>{n(w.in) > 0 ? inr(w.in) : '—'}</td>
                    <td className="text-right font-mono" style={{ color: n(w.out) > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>{n(w.out) > 0 ? inr(w.out) : '—'}</td>
                    <td className="text-right font-mono" style={shortWeek ? { color: SHORT, fontWeight: 600 } : undefined}>
                      {inr(w.closing)}{shortWeek && <span className="text-xs font-sans ml-1">short</span>}
                    </td>
                    <td className="text-right">
                      {w.moves > 0 && (
                        <button type="button" className="btn-icon w-7 h-7" aria-expanded={isOpen} aria-label={`${isOpen ? 'Hide' : 'Show'} the week of ${weekName(w)}`}
                          onClick={e => { e.stopPropagation(); setOpen(isOpen ? null : w.number) }}>
                          <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} aria-hidden />
                        </button>
                      )}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={5} className="pb-3">
                        <ul className="rounded-xl p-2 space-y-1" style={{ background: 'var(--bg-surface)' }} data-testid="cash-moves">
                          {w.flows.map((m, i) => <Move key={i} m={m} />)}
                          {w.moves > w.flows.length && <li className="text-xs px-2 py-1" style={{ color: 'var(--text-muted)' }}>…and {w.moves - w.flows.length} more, counted in the totals.</li>}
                        </ul>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Move({ m }: { m: CashMove }) {
  const inbound = m.direction === 'IN'
  return (
    <li className="flex items-start gap-3 px-2 py-1.5 text-sm">
      <span className="text-xs w-14 shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>{formatDate(m.on, 'EEE d MMM')}</span>
      <span className="flex-1 min-w-0">
        <Link href={m.link} className="font-medium hover:underline">{m.what}</Link>
        <span style={{ color: 'var(--text-secondary)' }}> · {m.party}</span>
        <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{m.basis}</span>
      </span>
      <span className="font-mono shrink-0" style={{ color: inbound ? 'var(--ok-text)' : 'var(--text-primary)' }}>{inbound ? '+' : '−'}{inr(m.amount)}</span>
    </li>
  )
}
