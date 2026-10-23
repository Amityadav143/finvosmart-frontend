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

import { useState } from 'react'
import Link from 'next/link'
import { Table2 } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { inr } from '@/lib/money'
import type { DashMonth } from '@/types/dashboard'

const n = (x: unknown) => Number(x ?? 0)

/** Axis ticks: ₹0, ₹50K, ₹2L, ₹1.5Cr. */
export function compact(v: number) {
  const a = Math.abs(v), s = v < 0 ? '−' : ''
  if (a >= 1e7) return `${s}₹${+(a / 1e7).toFixed(1)}Cr`
  if (a >= 1e5) return `${s}₹${+(a / 1e5).toFixed(1)}L`
  if (a >= 1e3) return `${s}₹${+(a / 1e3).toFixed(0)}K`
  return `${s}₹${a}`
}

/**
 * Two categorical slots validated together (adjacent CVD ΔE 24.7 light on white, 26.8 dark on
 * the dark card; contrast ≥ 3:1 in both): invoiced = slot 1 (blue), collected = slot 2 (orange).
 */
export const SERIES = { light: { invoiced: '#2a78d6', collected: '#eb6834' }, dark: { invoiced: '#3987e5', collected: '#d95926' } }

/**
 * Invoiced and collected by month: grouped columns (≤ 24px, rounded data-end, 2px gap), a
 * legend, a hairline grid, one tooltip per month — and a table view with every value.
 */
export function SalesChart({ months, dark, title, subtitle, className }: {
  months: DashMonth[]; dark: boolean; title: string; subtitle: string; className?: string
}) {
  const [table, setTable] = useState(false)
  const col = dark ? SERIES.dark : SERIES.light
  const rows = months.map(m => ({ ...m, invoiced: n(m.invoiced), collected: n(m.collected), year: m.month.slice(0, 4) }))
  const empty = rows.every(r => r.invoiced === 0 && r.collected === 0)
  const grid = dark ? '#24324b' : '#ece7dc', axis = dark ? '#8a9bb8' : '#7b6c56'
  return (
    <section className={`card ${className ?? ''}`} aria-label={title}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="section-title">{title}</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}><span className="w-2.5 h-2.5 rounded-sm" style={{ background: col.invoiced }} />Invoiced</span>
          <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}><span className="w-2.5 h-2.5 rounded-sm" style={{ background: col.collected }} />Collected</span>
          <button className="btn-secondary h-8 text-xs" onClick={() => setTable(t => !t)} aria-pressed={table}><Table2 size={13} />{table ? 'Chart' : 'Table'}</button>
        </div>
      </div>
      {empty ? (
        <p className="text-sm py-10 text-center" style={{ color: 'var(--text-muted)' }}>No invoices in this period yet. <Link href="/invoicing/new" className="underline">Create an invoice</Link>.</p>
      ) : table ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
            <thead><tr className="text-xs" style={{ color: 'var(--text-muted)' }}><th className="text-left py-1.5 font-semibold">Month</th><th className="text-right font-semibold">Invoiced</th><th className="text-right font-semibold">Collected</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.month} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="py-1.5">{r.label} {r.year}</td><td className="text-right font-mono">{inr(r.invoiced)}</td><td className="text-right font-mono">{inr(r.collected)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4" style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barGap={2} barCategoryGap="22%" accessibilityLayer>
              <CartesianGrid vertical={false} stroke={grid} strokeWidth={1} />
              <XAxis dataKey="label" axisLine={{ stroke: grid }} tickLine={false} tick={{ fontSize: 11, fill: axis }} />
              <YAxis axisLine={false} tickLine={false} width={56} tick={{ fontSize: 11, fill: axis }} tickFormatter={compact} />
              <Tooltip cursor={{ fill: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }} content={<ChartTip colors={col} />} />
              <Bar dataKey="invoiced" name="Invoiced" fill={col.invoiced} maxBarSize={24} radius={[4, 4, 0, 0]} />
              <Bar dataKey="collected" name="Collected" fill={col.collected} maxBarSize={24} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}

function ChartTip({ active, payload, colors }: any) {
  if (!active || !payload?.length) return null
  const r = payload[0].payload
  return (
    <div className="rounded-xl px-3 py-2.5 text-xs" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-md)' }}>
      <p className="mb-1.5" style={{ color: 'var(--text-secondary)' }}>{r.label} {r.year}</p>
      {[['Invoiced', r.invoiced, colors.invoiced], ['Collected', r.collected, colors.collected]].map(([k, v, c]) => (
        <p key={k as string} className="flex items-center gap-2">
          <span className="inline-block w-3 h-0.5 rounded" style={{ background: c as string }} />
          <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>{inr(v as number)}</strong>
          <span style={{ color: 'var(--text-muted)' }}>{k as string}</span>
        </p>
      ))}
    </div>
  )
}
