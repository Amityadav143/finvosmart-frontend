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

import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { calculateGst, formatINR, GST_SLABS, SPECIAL_RATES, type GstMode, type SupplyType } from '@/lib/gst'

const RATE_OPTIONS: { rate: number; hint?: string }[] = [
  ...GST_SLABS.map(rate => ({ rate })),
  ...SPECIAL_RATES.map(s => ({ rate: s.rate, hint: s.label })),
]

/** 9 → "9", 2.5 → "2.5", 0.125 → "0.125" */
const fmtRate = (r: number) => String(Number(r.toFixed(3)))

const card: CSSProperties = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }
const label: CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', margin: '18px 0 8px' }
const field: CSSProperties = {
  width: '100%', height: '48px', padding: '0 14px', fontSize: '18px', fontWeight: 600, borderRadius: '10px',
  border: '1px solid var(--border-strong)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontFamily: 'inherit',
}
const chip = (on: boolean): CSSProperties => ({
  height: '38px', minWidth: '58px', padding: '0 12px', borderRadius: '9px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
  fontFamily: 'inherit', border: `1px solid ${on ? 'var(--gold)' : 'var(--border)'}`,
  background: on ? 'var(--gold-muted)' : 'var(--bg-surface)', color: on ? 'var(--gold)' : 'var(--text-secondary)',
})

function Segmented<T extends string>({ value, onChange, options, name }:
  { value: T; onChange: (v: T) => void; options: [T, string][]; name: string }) {
  return (
    <div role="group" aria-label={name} style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
      {options.map(([v, text]) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}
                style={{ ...chip(value === v), flex: '1 1 180px' }}>{text}</button>
      ))}
    </div>
  )
}

function Row({ label: l, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '10px 0',
                  borderBottom: strong ? 'none' : '1px solid var(--border)' }}>
      <span style={{ fontSize: strong ? '15px' : '14px', fontWeight: strong ? 700 : 500,
                     color: strong ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{l}</span>
      <span style={{ fontSize: strong ? '22px' : '15px', fontWeight: 700, color: strong ? 'var(--gold)' : 'var(--text-primary)',
                     fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  )
}

export function GstCalculator() {
  const [amount, setAmount] = useState('10000')
  const [rate, setRate] = useState<number>(18)
  const [customRate, setCustomRate] = useState('')
  const [mode, setMode] = useState<GstMode>('exclusive')
  const [supply, setSupply] = useState<SupplyType>('intra')

  const usingCustom = customRate.trim() !== ''
  const effectiveRate = usingCustom ? parseFloat(customRate) : rate
  const r = useMemo(() => calculateGst(parseFloat(amount), effectiveRate, mode, supply),
                    [amount, effectiveRate, mode, supply])
  const formula = mode === 'exclusive'
    ? `GST = ${formatINR(r.taxable)} × ${fmtRate(r.rate)}% = ${formatINR(r.gst)}`
    : `Taxable value = ${formatINR(r.total)} ÷ ${fmtRate(1 + r.rate / 100)} = ${formatINR(r.taxable)}`

  return (
    <section style={{ padding: '8px 0 48px' }}>
      <div style={{ maxWidth: '980px', margin: '0 auto', padding: '0 24px' }}>
        <div className="auto-grid-2" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '20px', alignItems: 'start' }}>
          <div style={card}>
            <label htmlFor="gst-amount" style={{ ...label, marginTop: 0 }}>Amount (₹)</label>
            <input id="gst-amount" type="text" inputMode="decimal" autoComplete="off" value={amount} style={field}
                   onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} />

            <span style={label}>GST rate</span>
            <div role="group" aria-label="GST rate" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {RATE_OPTIONS.map(o => (
                <button key={o.rate} type="button" title={o.hint} aria-pressed={!usingCustom && rate === o.rate}
                        onClick={() => { setRate(o.rate); setCustomRate('') }} style={chip(!usingCustom && rate === o.rate)}>
                  {fmtRate(o.rate)}%
                </button>
              ))}
              <input aria-label="Other GST rate in percent" placeholder="Other %" inputMode="decimal" value={customRate}
                     onChange={e => setCustomRate(e.target.value.replace(/[^0-9.]/g, ''))}
                     style={{ ...chip(usingCustom), width: '96px', textAlign: 'center' }} />
            </div>

            <span style={label}>The amount is</span>
            <Segmented name="Amount type" value={mode} onChange={setMode}
                       options={[['exclusive', 'Before GST — add GST'], ['inclusive', 'Including GST — remove GST']]} />

            <span style={label}>Customer is in</span>
            <Segmented name="Place of supply" value={supply} onChange={setSupply}
                       options={[['intra', 'Same state — CGST + SGST'], ['inter', 'Another state — IGST']]} />
          </div>

          <div style={{ ...card, borderTop: '3px solid var(--gold)' }} aria-live="polite">
            <Row label="Taxable value" value={formatINR(r.taxable)} />
            {supply === 'intra' ? (
              <>
                <Row label={`CGST @ ${fmtRate(r.rate / 2)}%`} value={formatINR(r.cgst)} />
                <Row label={`SGST @ ${fmtRate(r.rate / 2)}%`} value={formatINR(r.sgst)} />
              </>
            ) : (
              <Row label={`IGST @ ${fmtRate(r.rate)}%`} value={formatINR(r.igst)} />
            )}
            <Row label="Total GST" value={formatINR(r.gst)} />
            <Row label="Total amount" value={formatINR(r.total)} strong />
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '10px 0 18px', fontVariantNumeric: 'tabular-nums' }}>{formula}</p>
            <Link href="/gst-billing-software" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)', textDecoration: 'none' }}>
              Put this on a GST invoice automatically →
            </Link>
          </div>
        </div>
        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '14px', textAlign: 'center' }}>
          Rates as per GST 2.0, in force since 22 September 2025. Confirm the rate for your item&apos;s HSN/SAC code — results are for guidance only.
        </p>
      </div>
    </section>
  )
}
