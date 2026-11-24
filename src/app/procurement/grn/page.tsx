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

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Plus, Search } from 'lucide-react'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useDebounce } from '@/lib/hooks'
import { grnApi } from '@/lib/api/purchaseStore'
import { apiError } from '@/lib/apiError'
import { inr } from '@/lib/money'
import { fmtDate } from '@/components/godown/GodownParts'
import { Chip, qty } from '@/components/purchaseStore/StoreParts'

const ANY = ['PROCUREMENT_VIEW', 'PROCUREMENT_RECEIVE', 'QUALITY_INSPECT', 'INVENTORY_VIEW']
const TABS = [
  { value: 'DRAFT', label: 'Being counted' }, { value: 'INSPECTION', label: 'Awaiting inspection' }, { value: 'POSTED', label: 'In stock' },
  { value: 'CANCELLED', label: 'Cancelled' }, { value: '', label: 'All' },
]

export default function GoodsReceiptsPage() {
  return <Suspense fallback={<div className="card text-sm">Loading…</div>}><Receipts /></Suspense>
}

/** Goods receipts (GRNs): consignments counted by the stores, inspected, and taken into stock. */
function Receipts() {
  const { canAny } = usePermissions()
  const allowed = canAny(...ANY)
  const router = useRouter()
  const params = useSearchParams()
  const [status, setStatus] = useState(params.get('status') ?? '')
  // a day or dates asked for by the address (the purchase store's "Received today"), until cleared
  const [range, setRange] = useState<{ from?: string; to?: string }>(() => {
    const ok = (d: string | null) => (d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : undefined)
    return { from: ok(params.get('from')), to: ok(params.get('to')) }
  })
  const [q, setQ] = useState('')
  const query = useDebounce(q, 300)
  const [page, setPage] = useState(0)
  const { data: counts } = useQuery({ queryKey: ['grn-counts'], queryFn: grnApi.counts, enabled: allowed })
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['grns', status, query, page, range.from ?? '', range.to ?? ''], enabled: allowed,
    queryFn: () => grnApi.list({ status: status || undefined, q: query || undefined, from: range.from, to: range.to, page, size: 20 }) })
  if (!allowed) return <PermissionGate anyOf={ANY} showDenied><span /></PermissionGate>
  const rows = data?.content ?? []
  const values = rows.some(r => r.acceptedValue != null)
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link href="/procurement/store" className="text-xs inline-flex items-center gap-1 mb-1" style={{ color: 'var(--text-muted)' }}><ArrowLeft className="w-3 h-3" aria-hidden />Purchase store</Link>
          <h1 className="page-title">Goods receipts</h1>
          <p className="page-subtitle">What the stores counted, against an order or not. Items inspected on receipt wait for quality; only accepted goods go into stock, at the order’s rate.</p>
        </div>
        {canAny('PROCUREMENT_RECEIVE') && <Link href="/procurement/grn/new" className="btn-primary h-10" data-testid="grn-new"><Plus className="w-4 h-4" aria-hidden />New goods receipt</Link>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Status">
          {TABS.map(t => (
            <button key={t.value} role="tab" aria-selected={status === t.value} onClick={() => { setStatus(t.value); setPage(0) }}
              className="px-3 h-8 rounded-full text-xs font-semibold" style={{ background: status === t.value ? 'var(--gold-muted)' : 'var(--bg-hover)', color: status === t.value ? 'var(--gold)' : 'var(--text-muted)' }}>
              {t.label}{t.value && counts ? ` (${counts[t.value] ?? 0})` : ''}</button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3" style={{ color: 'var(--text-muted)' }} aria-hidden />
          <input className="input h-10 pl-9" placeholder="Receipt, supplier, invoice, order…" value={q} onChange={e => { setQ(e.target.value); setPage(0) }} aria-label="Search receipts" />
        </div>
      </div>
      {(range.from || range.to) && (
        <p className="text-sm flex items-center gap-2" data-testid="grn-range">
          <span>Received {range.from && range.from === range.to ? `on ${fmtDate(range.from)}` : [range.from && `from ${fmtDate(range.from)}`, range.to && `to ${fmtDate(range.to)}`].filter(Boolean).join(' ')}</span>
          <button type="button" className="underline text-xs" style={{ color: 'var(--text-muted)' }} onClick={() => { setRange({}); setPage(0) }}>Show every date</button>
        </p>
      )}
      {isError && <p className="text-sm" style={{ color: 'var(--danger-text)' }}>{apiError(error, 'Goods receipts could not be loaded.')}</p>}
      <div className="table-wrap">
        <table className="w-full text-sm" data-testid="grn-list">
          <thead><tr>{['Receipt', 'Date', 'Supplier', 'Order', 'Their invoice', 'Godown', 'Lines', ...(values ? ['Accepted value'] : []), 'Rejected', 'Billed', 'Status']
            .map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
          <tbody>
            {isLoading ? <tr><td className="table-cell" colSpan={11}>Loading…</td></tr>
              : rows.length === 0 ? <tr><td className="table-cell" colSpan={11} style={{ color: 'var(--text-muted)' }}>No goods receipts{status ? ' here' : ' yet'}.</td></tr>
              : rows.map(g => (
                <tr key={g.id} className="table-row cursor-pointer" onClick={() => router.push(`/procurement/grn/${g.id}`)}>
                  <td className="table-cell font-mono"><Link href={`/procurement/grn/${g.id}`} onClick={e => e.stopPropagation()}>{g.number}</Link></td>
                  <td className="table-cell">{fmtDate(g.date)}</td>
                  <td className="table-cell">{g.vendorName}</td>
                  <td className="table-cell font-mono text-xs">{g.poNumber ?? '—'}</td>
                  <td className="table-cell text-xs">{g.invoiceNumber ?? ''}</td>
                  <td className="table-cell text-xs">{g.godown ?? ''}</td>
                  <td className="table-cell">{g.lines}</td>
                  {values && <td className="table-cell font-mono">{g.acceptedValue != null ? inr(g.acceptedValue) : ''}</td>}
                  <td className="table-cell">{Number(g.rejectedQty) ? <span style={{ color: '#b91c1c' }}>{qty(g.rejectedQty)}</span> : ''}</td>
                  <td className="table-cell text-xs">{g.status === 'POSTED' ? (g.billed ? 'Yes' : 'Not yet') : ''}</td>
                  <td className="table-cell"><Chip status={g.status} label={g.statusLabel} /></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {(data?.totalPages ?? 0) > 1 && (
        <div className="flex justify-between items-center text-sm">
          <button className="btn-secondary h-9" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Newer</button>
          <span style={{ color: 'var(--text-muted)' }}>Page {page + 1} of {data?.totalPages}</span>
          <button className="btn-secondary h-9" disabled={page + 1 >= (data?.totalPages ?? 1)} onClick={() => setPage(p => p + 1)}>Older</button>
        </div>
      )}
    </div>
  )
}
