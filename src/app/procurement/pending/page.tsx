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
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, Download, PackageCheck } from 'lucide-react'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { storeReportsApi } from '@/lib/api/purchaseStore'
import { apiError } from '@/lib/apiError'
import { inr } from '@/lib/money'
import { exportToCsv } from '@/lib/utils'
import { fmtDate } from '@/components/godown/GodownParts'
import { SupplierPicker, qty } from '@/components/purchaseStore/StoreParts'
import type { PendingLine } from '@/types/purchaseStore'

const ANY = ['PROCUREMENT_VIEW', 'PROCUREMENT_RECEIVE', 'GATE_ENTRY']

/** Every approved order line still to come, by order — the late ones first — with a way to receive it. */
export default function PendingDeliveriesPage() {
  const { canAny } = usePermissions()
  const allowed = canAny(...ANY)
  const [vendor, setVendor] = useState<{ id: string; name: string } | null>(null)
  const [lateOnly, setLateOnly] = useState(false)
  const { data = [], isLoading, isError, error } = useQuery({ queryKey: ['store-pending', vendor?.id ?? ''], queryFn: () => storeReportsApi.pending(vendor?.id), enabled: allowed })
  const orders = useMemo(() => {
    const by = new Map<string, PendingLine[]>()
    for (const p of data) if (!lateOnly || p.daysLate > 0) by.set(p.poId, [...(by.get(p.poId) ?? []), p])
    return Array.from(by.values()).sort((a, b) => b[0].daysLate - a[0].daysLate)
  }, [data, lateOnly])
  if (!allowed) return <PermissionGate anyOf={ANY} showDenied><span /></PermissionGate>
  const receiver = canAny('PROCUREMENT_RECEIVE')
  const values = data.some(p => p.pendingValue != null)
  const total = data.reduce((s, p) => s + Number(p.pendingValue ?? 0), 0)
  const late = new Set(data.filter(p => p.daysLate > 0).map(p => p.poId)).size
  const download = () => {
    const n = exportToCsv('pending-deliveries', data.map(p => ({ Order: p.poNumber, 'Order date': p.poDate ?? '', Expected: p.expected ?? '', 'Days late': p.daysLate,
      Supplier: p.vendorName, Item: p.itemName, Unit: p.unit ?? '', Ordered: p.ordered, Received: p.received, 'Still to come': p.pending,
      ...(values ? { 'Value to come (₹, before GST)': p.pendingValue ?? '' } : {}) })))
    if (!n) toast('Nothing to download')
  }
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link href="/procurement/store" className="text-xs inline-flex items-center gap-1 mb-1" style={{ color: 'var(--text-muted)' }}><ArrowLeft className="w-3 h-3" aria-hidden />Purchase store</Link>
          <h1 className="page-title">Pending deliveries</h1>
          <p className="page-subtitle">What approved orders still have to bring: {orders.length} order{orders.length === 1 ? '' : 's'}{late ? `, ${late} past the expected date` : ''}{values && total ? ` · ${inr(total)} to come` : ''}.</p>
        </div>
        <button className="btn-secondary h-10" onClick={download} disabled={data.length === 0}><Download className="w-4 h-4" aria-hidden />Download CSV</button>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-80"><SupplierPicker value={vendor} onChange={setVendor} required={false} label="Supplier (all when none)" /></div>
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer h-10"><input type="checkbox" checked={lateOnly} onChange={e => setLateOnly(e.target.checked)} />Late only</label>
      </div>
      {isError && <p className="text-sm" style={{ color: 'var(--danger-text)' }}>{apiError(error, 'Pending deliveries could not be loaded.')}</p>}
      {isLoading ? <div className="card text-sm">Loading…</div>
        : orders.length === 0 ? <div className="card text-sm" style={{ color: 'var(--text-muted)' }}>Nothing is waiting to come{vendor ? ` from ${vendor.name}` : ''}{lateOnly ? ' late' : ''}.</div>
        : orders.map(lines => {
          const o = lines[0]
          return (
            <section key={o.poId} className="card space-y-2" data-testid="pending-order">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <p className="font-semibold"><Link href={`/procurement/orders?open=${o.poId}`} className="font-mono underline" style={{ color: 'var(--gold)' }}>{o.poNumber}</Link> · {o.vendorName}</p>
                  <p className="text-xs" style={{ color: o.daysLate > 0 ? '#c2410c' : 'var(--text-muted)' }}>
                    Ordered {o.poDate ? fmtDate(o.poDate) : '—'} · {o.expected ? `expected ${fmtDate(o.expected)}` : 'no date expected'}{o.daysLate > 0 ? ` · ${o.daysLate} day${o.daysLate === 1 ? '' : 's'} late` : ''}</p>
                </div>
                {receiver && <Link href={`/procurement/grn/new?po=${o.poId}`} className="btn-primary h-9" data-testid="pending-receive"><PackageCheck className="w-4 h-4" aria-hidden />Receive</Link>}
              </div>
              <div className="table-wrap">
                <table className="w-full text-sm">
                  <thead><tr>{['Item', 'Ordered', 'Received', 'Still to come', ...(values ? ['Value to come'] : [])].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
                  <tbody>{lines.map(l => (
                    <tr key={l.poLineId} className="table-row"><td className="table-cell">{l.itemName}<span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>{l.unit}</span></td>
                      <td className="table-cell">{qty(l.ordered)}</td><td className="table-cell">{qty(l.received)}</td><td className="table-cell font-semibold">{qty(l.pending)}</td>
                      {values && <td className="table-cell font-mono">{l.pendingValue != null ? inr(l.pendingValue) : ''}</td>}</tr>
                  ))}</tbody>
                </table>
              </div>
            </section>
          )
        })}
    </div>
  )
}
