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

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, Download, ShoppingCart } from 'lucide-react'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { storeReportsApi } from '@/lib/api/purchaseStore'
import { apiError } from '@/lib/apiError'
import { inr, todayIST } from '@/lib/money'
import { exportToCsv } from '@/lib/utils'
import { Chip, SupplierPicker, qty } from '@/components/purchaseStore/StoreParts'
import type { MadeOrder, PlanRow } from '@/types/purchaseStore'

const ANY = ['PROCUREMENT_VIEW', 'INVENTORY_VIEW']
const URGENCY: Record<string, string> = { OUT: 'Out of stock', NOW: 'Order now', SOON: 'Order soon', OK: 'Enough' }

/**
 * Reordering from the books: each stock item's use over the last weeks, what is in hand and on order, how long its
 * supplier takes — what to order now and how much. Chosen lines become draft purchase orders, one per supplier.
 */
export default function ReorderPlannerPage() {
  const { canAny } = usePermissions()
  const allowed = canAny(...ANY)
  const buyer = canAny('PROCUREMENT_CREATE')
  const qc = useQueryClient()
  const [windowDays, setWindow] = useState(90)
  const [cover, setCover] = useState(30)
  const [all, setAll] = useState(false)
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['planner', windowDays, cover, all], queryFn: () => storeReportsApi.plan({ window: windowDays, cover, all }), enabled: allowed })
  const [picked, setPicked] = useState<Record<string, { on: boolean; qty: string; rate: string; vendor: { id: string; name: string } | null }>>({})
  const [expected, setExpected] = useState('')
  const [made, setMade] = useState<MadeOrder[] | null>(null)
  useEffect(() => {
    if (!data) return
    setPicked(p => {
      const next = { ...p }
      for (const r of data.rows) if (!next[r.itemId]) next[r.itemId] = { on: r.urgency !== 'OK' && Number(r.suggested) > 0, qty: Number(r.suggested) > 0 ? String(Number(r.suggested)) : '',
        rate: r.rate != null ? String(Number(r.rate)) : '', vendor: r.vendorId ? { id: r.vendorId, name: r.vendorName ?? '' } : null }
      return next
    })
  }, [data])
  const chosen = useMemo(() => (data?.rows ?? []).filter(r => picked[r.itemId]?.on && Number(picked[r.itemId]?.qty) > 0), [data, picked])
  const missing = chosen.find(r => !picked[r.itemId]?.vendor || !(Number(picked[r.itemId]?.rate) > 0))
  const order = useMutation({
    mutationFn: () => storeReportsApi.makeOrders({ expected: expected || null, lines: chosen.map(r => ({ itemId: r.itemId, vendorId: picked[r.itemId].vendor!.id,
      quantity: Number(picked[r.itemId].qty), rate: Number(picked[r.itemId].rate) })) }),
    onSuccess: m => { setMade(m); qc.invalidateQueries({ queryKey: ['purchase-orders'] }); qc.invalidateQueries({ queryKey: ['planner'] }); toast.success(m.length === 1 ? 'A draft order was made' : `${m.length} draft orders were made`) },
    onError: (e: unknown) => toast.error(apiError(e, 'The orders could not be made.')),
  })
  if (!allowed) return <PermissionGate anyOf={ANY} showDenied><span /></PermissionGate>
  const rows = data?.rows ?? []
  const set = (id: string, patch: Partial<(typeof picked)[string]>) => setPicked(p => ({ ...p, [id]: { ...p[id], ...patch } }))
  const download = () => {
    if (!exportToCsv('reorder-plan', rows.map(r => ({ Item: r.itemName, Code: r.itemCode, Unit: r.unit ?? '', 'In stock': r.stock, 'On order': r.onOrder,
      [`Used in ${data?.windowDays} days`]: r.used, 'Daily use': r.dailyUse, 'Days left': r.daysLeft ?? '', 'Lead days': r.leadDays, 'Reorder point': r.reorderPoint,
      'Suggested order': r.suggested, Status: URGENCY[r.urgency], 'Last supplier': r.vendorName ?? '', 'Last rate (₹)': r.rate ?? '' })))) toast('Nothing to download')
  }
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link href="/procurement/store" className="text-xs inline-flex items-center gap-1 mb-1" style={{ color: 'var(--text-muted)' }}><ArrowLeft className="w-3 h-3" aria-hidden />Purchase store</Link>
          <h1 className="page-title">Reorder planner</h1>
          <p className="page-subtitle">From your own books: what each item used (sold, issued, taken out — not moved between godowns), what is in hand and on order, and how many days its supplier took on past orders.</p>
        </div>
        <button className="btn-secondary h-10" onClick={download} disabled={!rows.length}><Download className="w-4 h-4" aria-hidden />CSV</button>
      </div>
      <div className="card flex flex-wrap items-end gap-3">
        <div><label className="label" htmlFor="pl-w">Use over the last</label>
          <select id="pl-w" className="input h-9" value={windowDays} onChange={e => setWindow(Number(e.target.value))}>{[30, 60, 90, 180, 365].map(d => <option key={d} value={d}>{d} days</option>)}</select></div>
        <div><label className="label" htmlFor="pl-c">Order enough for</label>
          <select id="pl-c" className="input h-9" value={cover} onChange={e => setCover(Number(e.target.value))}>{[15, 30, 45, 60, 90].map(d => <option key={d} value={d}>{d} days after it arrives</option>)}</select></div>
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer h-9"><input type="checkbox" checked={all} onChange={e => setAll(e.target.checked)} />Show every item</label>
        {data && <div className="flex gap-2 ml-auto text-xs" data-testid="planner-counts">
          <Chip status="OUT" label={`${data.out} out of stock`} /><Chip status="NOW" label={`${data.now} to order now`} /><Chip status="SOON" label={`${data.soon} soon`} /></div>}
      </div>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Reorder point: what the supplier’s lead time uses, plus a safety margin of half of it (or the item’s own reorder level if higher). Lead time: from the order to the goods receipt, averaged over the last year (7 days until there are receipts).</p>
      {isError && <p className="text-sm" style={{ color: 'var(--danger-text)' }}>{apiError(error, 'The plan could not be made.')}</p>}
      <div className="table-wrap">
        <table className="w-full text-sm" data-testid="planner-table">
          <thead><tr>{[...(buyer ? [''] : []), 'Item', 'In stock', 'On order', 'Daily use', 'Days left', 'Lead', 'Reorder point', 'Status', 'Order', ...(buyer ? ['Supplier', 'Rate'] : ['Last supplier'])]
            .map((h, i) => <th key={h + i} className="table-header">{h}</th>)}</tr></thead>
          <tbody>
            {isLoading ? <tr><td className="table-cell" colSpan={12}>Working it out…</td></tr>
              : rows.length === 0 ? <tr><td className="table-cell" colSpan={12} style={{ color: 'var(--text-muted)' }}>{all ? 'No stock items yet.' : 'Nothing needs ordering: every item has enough for its lead time.'}</td></tr>
              : rows.map((r: PlanRow) => {
                const p = picked[r.itemId]
                return (
                  <tr key={r.itemId} className="table-row" data-testid="planner-row">
                    {buyer && <td className="table-cell"><input type="checkbox" checked={!!p?.on} onChange={e => set(r.itemId, { on: e.target.checked })} aria-label={`Order ${r.itemName}`} /></td>}
                    <td className="table-cell min-w-[10rem]"><span className="font-medium">{r.itemName}</span><span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{r.itemCode} · {r.unit}</span></td>
                    <td className="table-cell">{qty(r.stock)}</td><td className="table-cell">{Number(r.onOrder) ? qty(r.onOrder) : ''}</td>
                    <td className="table-cell">{Number(r.dailyUse) ? qty(Number(r.dailyUse).toFixed(2)) : '—'}</td>
                    <td className="table-cell">{r.daysLeft != null ? qty(r.daysLeft) : '—'}</td><td className="table-cell">{r.leadDays} d</td>
                    <td className="table-cell">{qty(r.reorderPoint)}</td><td className="table-cell"><Chip status={r.urgency} label={URGENCY[r.urgency]} /></td>
                    <td className="table-cell">{buyer ? <input className="input h-9 w-24" type="number" min={0} step="any" value={p?.qty ?? ''} onChange={e => set(r.itemId, { qty: e.target.value, on: Number(e.target.value) > 0 })} aria-label={`${r.itemName} quantity`} data-testid="planner-qty" />
                      : Number(r.suggested) ? qty(r.suggested) : ''}</td>
                    {buyer ? <>
                      <td className="table-cell min-w-[13rem]"><SupplierPicker value={p?.vendor ?? null} onChange={v => set(r.itemId, { vendor: v })} label={`${r.itemName} supplier`} required={false} floating bare /></td>
                      <td className="table-cell"><input className="input h-9 w-24" type="number" min={0} step="any" value={p?.rate ?? ''} onChange={e => set(r.itemId, { rate: e.target.value })} aria-label={`${r.itemName} rate`} /></td>
                    </> : <td className="table-cell text-xs">{r.vendorName ?? '—'}{r.rate != null ? ` · ${inr(r.rate)}` : ''}</td>}
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
      {buyer && (
        <div className="card flex flex-wrap items-end justify-between gap-3">
          <div className="text-sm"><b>{chosen.length}</b> line{chosen.length === 1 ? '' : 's'} chosen{chosen.length ? `, for ${new Set(chosen.map(r => picked[r.itemId]?.vendor?.id).filter(Boolean)).size} supplier(s)` : ''}.
            {missing && <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{missing.itemName}: choose its supplier and rate.</span>}</div>
          <div className="flex items-end gap-2">
            <div><label className="label" htmlFor="pl-e">Delivery by</label><input id="pl-e" type="date" className="input h-10" min={todayIST()} value={expected} onChange={e => setExpected(e.target.value)} /></div>
            <button className="btn-primary h-10" disabled={!chosen.length || !!missing || order.isPending} onClick={() => order.mutate()} data-testid="planner-order">
              <ShoppingCart className="w-4 h-4" aria-hidden />{order.isPending ? 'Making…' : 'Make draft orders'}</button>
          </div>
        </div>
      )}
      {made && made.length > 0 && (
        <div className="card text-sm space-y-1" data-testid="planner-made">
          <p className="font-semibold">Draft purchase orders made — check and send them for approval:</p>
          {made.map(o => <p key={o.id}><Link href={`/procurement/orders?open=${o.id}`} className="underline font-mono" style={{ color: 'var(--gold)' }}>{o.number}</Link> · {o.vendorName} · {o.lines} line{o.lines === 1 ? '' : 's'} · {inr(o.total)}</p>)}
        </div>
      )}
    </div>
  )
}
