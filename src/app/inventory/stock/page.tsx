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
import { useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowDownCircle, ArrowLeft, ArrowUpCircle, PackagePlus, RefreshCw, ListChecks } from 'lucide-react'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { apiError } from '@/lib/utils'
import { inventoryApi } from '@/lib/api/inventory'
import { Pagination } from '@/components/ui/Pagination'
import { formatDate } from '@/lib/utils'
import { inr } from '@/lib/money'
import { MOVEMENT_LABEL, qty } from '@/lib/inventory'
import type { MovementType, StockLedgerRow } from '@/types'

/** Where a movement came from: a link to the invoice or bill that made it, or its reference. */
function Reference({ m }: { m: StockLedgerRow }) {
  const text = m.reference || '—'
  if (m.referenceId && m.referenceType === 'INVOICE') return <Link href={`/invoicing/${m.referenceId}`} className="underline" style={{ color: 'var(--gold)' }}>{text}</Link>
  if (m.referenceId && m.referenceType === 'BILL') return <Link href={`/purchases/bills/${m.referenceId}`} className="underline" style={{ color: 'var(--gold)' }}>{text}</Link>
  return <>{text}</>
}

const ICON: Record<MovementType, { icon: any; color: string }> = {
  IN: { icon: ArrowDownCircle, color: '#16a34a' }, OPENING: { icon: PackagePlus, color: '#2563eb' },
  OUT: { icon: ArrowUpCircle, color: '#dc2626' }, ADJUSTMENT: { icon: RefreshCw, color: '#d97706' },
  TRANSFER_IN: { icon: ArrowDownCircle, color: '#2563eb' }, TRANSFER_OUT: { icon: ArrowUpCircle, color: '#7c3aed' },
}
const FILTERS: { value: '' | MovementType; label: string }[] = [
  { value: '', label: 'All' }, { value: 'IN', label: 'Stock in' }, { value: 'OUT', label: 'Stock out' },
  { value: 'ADJUSTMENT', label: 'Adjustments' }, { value: 'OPENING', label: 'Opening stock' },
]

export default function StockPage() {
  return <Suspense fallback={<div className="card text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</div>}><StockLedger /></Suspense>
}

function StockLedger() {
  const params = useSearchParams()
  const itemId = params.get('item') || undefined
  const [type, setType] = useState<'' | MovementType>('')
  const [page, setPage] = useState(0)
  const { data, isLoading, isError } = useQuery({
    queryKey: ['stock-ledger', itemId, type, page],
    queryFn: () => inventoryApi.movements.list({ itemId, type: type || undefined, page, size: 50 }),
  })
  const { data: today } = useQuery({ queryKey: ['stock-today'], queryFn: inventoryApi.movements.today })
  const qc = useQueryClient()
  const { canAny } = usePermissions()
  const recheck = useMutation({
    mutationFn: inventoryApi.movements.recheck,
    onSuccess: r => {
      qc.invalidateQueries({ queryKey: ['stock-ledger'] }); qc.invalidateQueries({ queryKey: ['stock-today'] })
      qc.invalidateQueries({ queryKey: ['inv-items'] }); qc.invalidateQueries({ queryKey: ['low-stock'] })
      toast.success(r.movementsPosted === 0 ? `Stock matches all ${r.documentsChecked} invoices and bills — nothing to correct`
        : `${r.movementsPosted} stock ${r.movementsPosted === 1 ? 'movement' : 'movements'} posted from ${r.documentsChecked} documents checked`)
      if (r.failed > 0) toast.error(`${r.failed} documents couldn't be checked — try again later`)
    },
    onError: (e: any) => toast.error(apiError(e, 'Stock could not be re-checked')),
  })
  const rows = data?.content ?? []
  const itemName = itemId && rows[0]?.itemId === itemId ? rows[0].itemName : null

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link href="/inventory/items" className="text-sm inline-flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><ArrowLeft size={14} />Items and stock</Link>
          <h1 className="page-title mt-1">{itemId ? `Stock ledger${itemName ? ` — ${itemName}` : ''}` : 'Stock ledger'}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Every stock movement, newest first: what came in, what went out, and the stock after each. Invoices, credit notes and supplier bills move stock by themselves.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canAny('INVENTORY_ADJUST', 'INVENTORY_ADMIN') && (
            <button className="btn-secondary h-9 text-sm" disabled={recheck.isPending} onClick={() => recheck.mutate()}
              title="Checks every invoice, credit note and bill against the stock ledger and posts anything missing. Safe to run any time.">
              <ListChecks className="w-4 h-4" aria-hidden />{recheck.isPending ? 'Checking…' : 'Re-check from documents'}
            </button>
          )}
          {itemId && <Link href="/inventory/stock" className="btn-secondary h-9 text-sm">All items</Link>}
        </div>
      </div>

      {!itemId && today && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Stock-in entries today', val: today.stockIn },
            { label: 'Stock-out entries today', val: today.stockOut },
            { label: 'Adjustments today', val: today.adjustments },
            { label: 'Transfers today', val: today.transfers },
          ].map(s => (
            <div key={s.label} className="card">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              <p className="text-2xl font-semibold mt-1" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}>{s.val}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap" role="group" aria-label="Kind of movement">
        {FILTERS.map(f => (
          <button key={f.value || 'all'} onClick={() => { setType(f.value); setPage(0) }} aria-pressed={type === f.value}
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: type === f.value ? 'var(--gold-muted)' : 'var(--bg-hover)', color: type === f.value ? 'var(--gold)' : 'var(--text-muted)', border: `1px solid ${type === f.value ? 'rgba(245,158,11,.2)' : 'var(--border)'}` }}>
            {f.label}
          </button>
        ))}
      </div>

      {isError && <div className="card text-sm" style={{ color: '#dc2626' }}>The stock ledger couldn't be loaded.</div>}
      <div className="table-wrap">
        <table className="w-full text-sm">
          <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Item', 'Date', 'Movement', 'Quantity', 'Unit cost', 'Reference', 'Stock after'].map(h => <th key={h} className="table-header">{h}</th>)}
          </tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="table-cell text-center" style={{ color: 'var(--text-muted)' }}>Loading…</td></tr>}
            {!isLoading && rows.length === 0 && (
              <tr><td colSpan={7} className="table-cell text-center py-10" style={{ color: 'var(--text-muted)' }}>
                No stock movements yet. Stock moves when you issue invoices and record supplier bills for your items, with an item&apos;s opening stock, and with stock in / out from the items list.
              </td></tr>
            )}
            {rows.map(m => {
              const cfg = ICON[m.type] ?? ICON.ADJUSTMENT
              const n = Number(m.change)
              return (
                <tr key={m.id} className="table-row">
                  <td className="table-cell">
                    <Link href={`/inventory/stock?item=${m.itemId}`} className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{m.itemName}</Link>
                    {m.itemCode && <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{m.itemCode}</p>}
                  </td>
                  <td className="table-cell text-xs">{formatDate(m.date)}</td>
                  <td className="table-cell">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: cfg.color }}><cfg.icon className="w-3.5 h-3.5" aria-hidden />{MOVEMENT_LABEL[m.type] ?? m.type}</span>
                    {m.remarks && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{m.remarks}</p>}
                  </td>
                  <td className="table-cell font-mono text-sm font-bold" style={{ color: n >= 0 ? '#16a34a' : '#dc2626' }}>{n > 0 ? '+' : n < 0 ? '−' : ''}{qty(Math.abs(n))} <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>{m.unit}</span></td>
                  <td className="table-cell font-mono text-sm">{m.unitCost == null ? '—' : inr(m.unitCost)}</td>
                  <td className="table-cell font-mono text-xs" style={{ color: 'var(--text-secondary)' }}><Reference m={m} /></td>
                  <td className="table-cell font-mono text-sm font-semibold">{qty(m.stockAfter)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {data && data.totalPages > 1 && <Pagination currentPage={data.currentPage} totalPages={data.totalPages} onPageChange={setPage} totalElements={data.totalElements} pageSize={50} />}
    </div>
  )
}
