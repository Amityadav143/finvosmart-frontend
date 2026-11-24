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

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { vendorsApi } from '@/lib/api/purchases'
import { storeReportsApi } from '@/lib/api/purchaseStore'
import { useDebounce } from '@/lib/hooks'
import { usePermissions } from '@/lib/hooks/usePermissions'
import type { OrderToReceive, PendingLine } from '@/types/purchaseStore'

/** 12.5 → "12.5", 1000 → "1,000" (quantities as people write them). */
export const qty = (n?: number | string | null) => n == null || n === '' ? '' : new Intl.NumberFormat('en-IN', { maximumFractionDigits: 3 }).format(Number(n))

const TONES: Record<string, [string, string]> = {
  AT_GATE: ['#b45309', 'rgba(245,158,11,0.14)'], RECEIVED: ['#15803d', 'rgba(22,163,74,0.12)'], TURNED_AWAY: ['#b91c1c', 'rgba(220,38,38,0.10)'],
  DRAFT: ['#475569', 'rgba(71,85,105,0.12)'], INSPECTION: ['#7c3aed', 'rgba(124,58,237,0.12)'], POSTED: ['#15803d', 'rgba(22,163,74,0.12)'],
  CANCELLED: ['#b91c1c', 'rgba(220,38,38,0.10)'], DONE: ['#15803d', 'rgba(22,163,74,0.12)'],
  OUT: ['#b91c1c', 'rgba(220,38,38,0.10)'], NOW: ['#c2410c', 'rgba(234,88,12,0.12)'], SOON: ['#b45309', 'rgba(245,158,11,0.14)'], OK: ['#15803d', 'rgba(22,163,74,0.12)'],
  MATCHED: ['#15803d', 'rgba(22,163,74,0.12)'], MORE_THAN_RECEIVED: ['#b91c1c', 'rgba(220,38,38,0.10)'], RATE_ABOVE_ORDER: ['#c2410c', 'rgba(234,88,12,0.12)'],
  NOT_RECEIVED: ['#b91c1c', 'rgba(220,38,38,0.10)'], MORE_THAN_ORDERED: ['#b91c1c', 'rgba(220,38,38,0.10)'], NOT_ON_ORDER: ['#b91c1c', 'rgba(220,38,38,0.10)'],
}

/** A status as a small coloured word. */
export function Chip({ status, label }: { status: string; label: string }) {
  const [c, bg] = TONES[status] ?? ['var(--text-muted)', 'rgba(0,0,0,0.05)']
  return <span className="badge" style={{ color: c, background: bg }}>{label}</span>
}

/**
 * Search the suppliers; the chosen one shows with a way to change it. Roles that open the supplier records search them;
 * the gate and the stores (security, store keepers) search names, GSTINs and places only.
 */
export function SupplierPicker({ value, onChange, label = 'Supplier', required = true, testId, floating = false, bare = false }: {
  value: { id: string; name: string } | null; onChange: (v: { id: string; name: string } | null) => void
  label?: string; required?: boolean; testId?: string
  /** In a table that scrolls (whose box would cut the list off): the list floats over the page instead. */
  floating?: boolean
  /** In a table whose column header names it: the label is for screen readers only. */
  bare?: boolean
}) {
  const { canAny } = usePermissions()
  const records = canAny('PROCUREMENT_VIEW', 'PROCUREMENT_CREATE', 'FINANCE_VIEW')
  const adder = canAny('PROCUREMENT_CREATE', 'FINANCE_CREATE')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const query = useDebounce(q, 250)
  const box = useRef<HTMLInputElement>(null)
  const [at, setAt] = useState<{ top: number; left: number; width: number } | null>(null)
  useEffect(() => {
    if (!floating || !open) return
    const place = () => { const r = box.current?.getBoundingClientRect(); if (r) setAt({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 240) }) }
    place()
    window.addEventListener('scroll', place, true); window.addEventListener('resize', place)
    return () => { window.removeEventListener('scroll', place, true); window.removeEventListener('resize', place) }
  }, [floating, open])
  const { data: results = [], isFetching, isError } = useQuery({ queryKey: ['vendor-search', records, query], enabled: open, retry: false,
    queryFn: async (): Promise<{ id: string; name: string; gstin?: string | null; city?: string | null; state?: string | null; email?: string | null; status?: string | null }[]> =>
      records ? (await vendorsApi.list({ q: query || undefined, size: 8 })).content : storeReportsApi.supplierNames(query || undefined, 8) })
  if (value) {
    return (
      <div className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }} data-testid={testId}>
        <div>{!bare && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>}<p className="font-semibold text-sm">{value.name}</p></div>
        <button type="button" className="btn-ghost h-8 text-sm" aria-label={`Change ${label.toLowerCase()}`} onClick={() => { onChange(null); setQ(''); setOpen(true) }}>Change</button>
      </div>
    )
  }
  const list = (
        <div className={floating ? 'fixed z-[70] rounded-xl overflow-hidden' : 'absolute z-30 mt-1 w-full rounded-xl overflow-hidden'} data-testid={testId ? `${testId}-list` : undefined}
          style={{ ...(floating && at ? at : {}), background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-modal)' }}>
          {results.map(v => (
            <button type="button" key={v.id} className="w-full text-left px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}
              onMouseDown={e => e.preventDefault()} onClick={() => { onChange({ id: v.id, name: v.name }); setOpen(false) }}>
              <p className="text-sm font-medium">{v.name}{v.status && v.status !== 'ACTIVE' ? <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}> · {v.status.toLowerCase()}</span> : null}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{[v.gstin, v.city, v.state].filter(Boolean).join(' · ') || v.email || '—'}</p>
            </button>
          ))}
          {!isFetching && results.length === 0 && (
            <div className="px-3 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
              {isError ? 'The suppliers could not be searched (your role may not include it).'
                : <>No suppliers found.{adder ? <> <Link href="/procurement/vendors?new=1" className="underline">Add a supplier</Link></> : ' Purchasing adds new suppliers.'}</>}
            </div>
          )}
        </div>
  )
  return (
    <div className="relative">
      <label className={bare ? 'sr-only' : `label ${required ? 'label-required' : ''}`}>{label}</label>
      <input ref={box} className="input h-10" value={q} placeholder="Search by name, GSTIN or city…" data-testid={testId}
        onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} onChange={e => { setQ(e.target.value); setOpen(true) }}
        aria-autocomplete="list" aria-label={label} />
      {open && (floating ? at && createPortal(list, document.body) : list)}
    </div>
  )
}

export interface OpenOrder { poId: string; poNumber: string; vendorId: string; vendorName: string; expected?: string | null; daysLate: number; lines: number }

/** The orders with goods still to come (optionally one supplier's), for receiving against. */
export function useOpenOrders(vendorId?: string | null, enabled = true) {
  const { data, isLoading, isError } = useQuery({ queryKey: ['store-pending', vendorId ?? ''], queryFn: () => storeReportsApi.pending(vendorId ?? undefined), enabled, retry: false })
  const orders = useMemo(() => {
    const by = new Map<string, OpenOrder>()
    for (const p of (data ?? []) as PendingLine[]) {
      const o = by.get(p.poId) ?? { poId: p.poId, poNumber: p.poNumber, vendorId: p.vendorId, vendorName: p.vendorName, expected: p.expected, daysLate: p.daysLate, lines: 0 }
      o.lines++
      by.set(p.poId, o)
    }
    return Array.from(by.values())
  }, [data])
  return { orders, isLoading, isError }
}

/** Choose an order with goods still to come (or none). */
export function OrderSelect({ vendorId, value, onChange, testId, allowNone = true }: {
  vendorId?: string | null; value: string; onChange: (poId: string, o?: OpenOrder) => void; testId?: string; allowNone?: boolean
}) {
  const { orders, isLoading, isError } = useOpenOrders(vendorId)
  return (
    <div>
      <label className="label">Against purchase order</label>
      <select className="input h-10" value={value} data-testid={testId} disabled={isLoading}
        onChange={e => onChange(e.target.value, orders.find(o => o.poId === e.target.value))}>
        {allowNone && <option value="">{isLoading ? 'Loading open orders…' : 'No order'}</option>}
        {orders.map(o => (
          <option key={o.poId} value={o.poId}>{o.poNumber} · {o.vendorName}{o.daysLate > 0 ? ` · ${o.daysLate} days late` : ''}</option>
        ))}
      </select>
      {isError && <p className="text-xs mt-1" style={{ color: 'var(--danger-text)' }}>Open orders could not be loaded.</p>}
      {!isLoading && !isError && orders.length === 0 && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>No approved order has goods still to come{vendorId ? ' from this supplier' : ''}.</p>}
    </div>
  )
}

/** A figure on the purchase store's page: what waits at a step, and where to deal with it (when the role opens that page). */
export function StepTile({ label, value, sub, href, tone = 'var(--text-primary)', testId }: {
  label: string; value: string | number; sub?: string; href?: string | null; tone?: string; testId?: string
}) {
  const body = <>
    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
    <p className="text-2xl font-semibold mt-1" style={{ color: tone, fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}>{value}</p>
    {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
  </>
  return href
    ? <Link href={href} className="card block hover:shadow-md transition-shadow" style={{ textDecoration: 'none' }} data-testid={testId}>{body}</Link>
    : <div className="card" data-testid={testId}>{body}</div>
}

/** An order as the purchase store sees it: each line ordered, received, with quality and still to come; its receipts. */
export function OrderReceiving({ o, canClose, onClose }: { o: OrderToReceive; canClose: boolean; onClose: () => void }) {
  const { canAny } = usePermissions()
  const receipts = o.receipts.filter(r => r.status !== 'CANCELLED')
  const anyIn = o.lines.some(l => Number(l.received) > 0 || Number(l.inInspection) > 0)
  if (!anyIn && !o.receivable && receipts.length === 0) return null
  return (
    <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }} data-testid="po-receiving">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="font-semibold text-sm">Receiving</p>
        <div className="flex gap-2">
          {canClose && <button type="button" className="btn-ghost h-8 text-xs" onClick={onClose} data-testid="po-close">Close the rest</button>}
          {o.receivable && canAny('PROCUREMENT_RECEIVE') && <Link href={`/procurement/grn/new?po=${o.poId}`} className="btn-primary h-8 text-xs" data-testid="po-receive">Receive goods</Link>}
        </div>
      </div>
      <table className="w-full text-xs">
        <thead><tr>{['Item', 'Ordered', 'Received', 'With quality', 'To come'].map(h => <th key={h} className="text-left font-medium py-1" style={{ color: 'var(--text-muted)' }}>{h}</th>)}</tr></thead>
        <tbody>{o.lines.map(l => (
          <tr key={l.poLineId}><td className="py-1">{l.itemName}</td><td>{qty(l.ordered)}</td><td>{qty(l.received)}</td>
            <td>{Number(l.inInspection) ? qty(l.inInspection) : ''}</td><td className="font-semibold">{Number(l.pending) ? qty(l.pending) : '—'}</td></tr>
        ))}</tbody>
      </table>
      {receipts.length > 0 && (
        <p className="text-xs">Receipts: {receipts.map((r, i) => <span key={r.id}>{i ? ', ' : ''}<Link href={`/procurement/grn/${r.id}`} className="underline font-mono" style={{ color: 'var(--gold)' }}>{r.number}</Link> ({r.statusLabel.toLowerCase()}{r.status === 'POSTED' ? (r.billed ? ', billed' : ', not billed') : ''})</span>)}</p>
      )}
      {!o.receivable && o.notReceivableReason && o.status !== 'RECEIVED' && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{o.notReceivableReason}</p>}
    </div>
  )
}
