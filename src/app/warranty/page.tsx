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

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, ShieldCheck, Truck } from 'lucide-react'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useDebounce } from '@/lib/hooks'
import { warrantyApi } from '@/lib/api/warranty'
import { apiError } from '@/lib/apiError'
import { inr } from '@/lib/money'
import { fmtDate } from '@/components/godown/GodownParts'
import { qty } from '@/components/purchaseStore/StoreParts'
import { ClaimChip } from '@/components/warranty/WarrantyParts'
import type { ClaimKind } from '@/types/warranty'

const STATUSES: Record<ClaimKind, { value: string; label: string }[]> = {
  CUSTOMER: [{ value: 'ACTIVE', label: 'In progress' }, { value: '', label: 'All' }, { value: 'OPEN', label: 'Registered' }, { value: 'APPROVED', label: 'Approved' },
    { value: 'RESOLVED', label: 'Resolved' }, { value: 'REJECTED', label: 'Rejected' }, { value: 'CANCELLED', label: 'Cancelled' }],
  SUPPLIER: [{ value: 'ACTIVE', label: 'In progress' }, { value: '', label: 'All' }, { value: 'OPEN', label: 'To send' }, { value: 'SENT', label: 'With the supplier' },
    { value: 'ACCEPTED', label: 'Accepted' }, { value: 'REJECTED', label: 'Rejected' }, { value: 'SETTLED', label: 'Settled' }, { value: 'CLOSED', label: 'Closed' },
    { value: 'CANCELLED', label: 'Cancelled' }],
}

/** Warranty claims: from customers (repair, replace, credit) and on suppliers (send back, their answer, what they make good). */
export default function WarrantyPage() {
  const { canAny } = usePermissions()
  const allowed = canAny('WARRANTY_CLAIMS')
  const router = useRouter()
  const [kind, setKind] = useState<ClaimKind>('CUSTOMER')
  const [status, setStatus] = useState('ACTIVE')
  const [text, setText] = useState('')
  const [page, setPage] = useState(0)
  const q = useDebounce(text, 300)
  // "?kind=SUPPLIER&status=SENT" from other pages (the purchase store, a supplier's report)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get('kind') === 'SUPPLIER' || p.get('kind') === 'CUSTOMER') setKind(p.get('kind') as ClaimKind)
    if (p.get('status') != null) setStatus(p.get('status')!)
  }, [])
  const { data: counts } = useQuery({ queryKey: ['warranty-counts'], queryFn: warrantyApi.counts, enabled: allowed })
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['warranty-claims', kind, status, q, page],
    queryFn: () => warrantyApi.list({ kind, status: status || undefined, q: q.trim() || undefined, page, size: 20 }), enabled: allowed })
  if (!allowed) return <PermissionGate anyOf={['WARRANTY_CLAIMS']} showDenied><span /></PermissionGate>
  const rows = data?.content ?? []
  const values = rows.some(r => r.claimedValue != null)
  const show = (k: ClaimKind, s: string) => { setKind(k); setStatus(s); setPage(0) }
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="page-title">Warranty claims</h1>
          <p className="page-subtitle">Faulty goods your customers bring back — checked against the warranty from their invoice, then repaired, replaced from stock or credited —
            and claims on your suppliers for what they sold you: sent back with a challan, followed until their credit note or replacement comes.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/warranty/new?kind=SUPPLIER" className="btn-secondary h-10" data-testid="warranty-new-supplier"><Truck className="w-4 h-4" aria-hidden />Claim on a supplier</Link>
          <Link href="/warranty/new" className="btn-primary h-10" data-testid="warranty-new"><Plus className="w-4 h-4" aria-hidden />New claim</Link>
        </div>
      </div>

      <section aria-label="Waiting on each side" className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="warranty-tiles">
        <Tile label="To decide" value={counts?.customerOpen} sub="customers’ claims registered" tone={counts?.customerOpen ? '#b45309' : undefined}
          onClick={() => show('CUSTOMER', 'OPEN')} testId="tile-to-decide" />
        <Tile label="To settle" value={counts?.customerApproved} sub="approved: repair, replace or credit" tone={counts?.customerApproved ? '#1d4ed8' : undefined}
          onClick={() => show('CUSTOMER', 'APPROVED')} testId="tile-to-settle" />
        <Tile label="With suppliers" value={counts ? counts.supplierToSend + counts.supplierWithSupplier : undefined}
          sub={counts ? `${counts.supplierToSend} to send, ${counts.supplierWithSupplier} sent` : 'claims on suppliers'} tone={counts?.supplierWithSupplier ? '#7c3aed' : undefined}
          onClick={() => show('SUPPLIER', 'ACTIVE')} testId="tile-with-suppliers" />
        <Tile label="To recover" value={counts ? (counts.pendingRecovery != null ? inr(counts.pendingRecovery) : counts.supplierAccepted + counts.supplierRejected) : undefined}
          sub={counts ? `${counts.supplierAccepted} accepted, ${counts.supplierRejected} rejected${counts.recovered90 != null ? ` · ${inr(counts.recovered90)} recovered in 90 days` : ''}` : ''}
          onClick={() => show('SUPPLIER', 'ACCEPTED')} testId="tile-to-recover" />
      </section>

      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Kind of claim">
        {(['CUSTOMER', 'SUPPLIER'] as ClaimKind[]).map(k => (
          <button key={k} role="tab" aria-selected={kind === k} className={kind === k ? 'btn-primary h-9' : 'btn-secondary h-9'} onClick={() => show(k, 'ACTIVE')}
            data-testid={`warranty-tab-${k.toLowerCase()}`}>{k === 'CUSTOMER' ? <ShieldCheck className="w-4 h-4" aria-hidden /> : <Truck className="w-4 h-4" aria-hidden />}
            {k === 'CUSTOMER' ? 'From customers' : 'On suppliers'}</button>
        ))}
        <select className="input h-9 w-auto" value={status} onChange={e => { setStatus(e.target.value); setPage(0) }} aria-label="Status" data-testid="warranty-status">
          {STATUSES[kind].map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} aria-hidden />
          <input className="input h-9 pl-9" value={text} onChange={e => { setText(e.target.value); setPage(0) }} placeholder="Claim number, customer or supplier, item, serial number" aria-label="Search claims" data-testid="warranty-search" />
        </div>
      </div>

      {isError && <p className="text-sm" style={{ color: 'var(--danger-text)' }}>{apiError(error, 'The claims could not be loaded.')}</p>}
      <div className="table-wrap">
        <table className="w-full text-sm" data-testid="warranty-list">
          <thead><tr>{['Claim', 'Date', kind === 'CUSTOMER' ? 'Customer' : 'Supplier', 'Goods', 'Warranty', 'Settled by', ...(values ? [kind === 'CUSTOMER' ? 'Value' : 'Claimed · recovered'] : []), 'Status']
            .map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
          <tbody>
            {isLoading ? <tr><td className="table-cell" colSpan={8}>Loading…</td></tr>
              : rows.length === 0 ? <tr><td className="table-cell" colSpan={8} style={{ color: 'var(--text-muted)' }}>
                {status === 'ACTIVE' ? 'Nothing in progress.' : 'No claims here.'} {kind === 'CUSTOMER' ? 'A claim starts from the customer’s invoice — or New claim.' : 'A claim on a supplier is passed on from a customer’s claim, made from a goods receipt, or typed in.'}</td></tr>
              : rows.map(r => (
                <tr key={r.id} className="table-row cursor-pointer" onClick={() => router.push(`/warranty/${r.id}`)}>
                  <td className="table-cell"><Link href={`/warranty/${r.id}`} className="font-mono" onClick={e => e.stopPropagation()}>{r.number}</Link>
                    {r.parentNumber && <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>from {r.parentNumber}</span>}</td>
                  <td className="table-cell whitespace-nowrap">{fmtDate(r.claimDate)}<span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{r.ageDays} {r.ageDays === 1 ? 'day' : 'days'}</span></td>
                  <td className="table-cell">{r.partyName}</td>
                  <td className="table-cell">{r.description}<span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{qty(r.quantity)} {r.unit ?? ''}{r.serialNo ? ` · ${r.serialNo}` : ''}</span></td>
                  <td className="table-cell text-xs" style={{ color: r.inWarranty === true ? '#15803d' : r.inWarranty === false ? '#b91c1c' : '#b45309' }}>
                    {r.inWarranty === true ? 'In warranty' : r.inWarranty === false ? 'Out of warranty' : 'Not known'}</td>
                  <td className="table-cell text-xs">{r.resolutionLabel ?? ''}</td>
                  {values && <td className="table-cell font-mono text-xs whitespace-nowrap">{r.claimedValue != null ? inr(r.claimedValue) : ''}
                    {kind === 'SUPPLIER' && r.recoveredValue != null && <span className="block">{inr(r.recoveredValue)}</span>}</td>}
                  <td className="table-cell"><ClaimChip status={r.status} label={r.statusLabel} /></td>
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
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>A free repair or replacement under warranty carries no further GST (CBIC Circular 195/07/2023-GST): the replacement goes with a
        delivery challan, and stock moves only for what really moves — a replacement given from stock, goods in stock sent back to a supplier, and what a supplier sends that goes into stock.</p>
    </div>
  )
}

/** A figure that opens its list. */
function Tile({ label, value, sub, tone = 'var(--text-primary)', onClick, testId }: {
  label: string; value?: string | number; sub?: string; tone?: string; onClick: () => void; testId?: string
}) {
  return (
    <button type="button" onClick={onClick} className="card text-left hover:shadow-md transition-shadow" data-testid={testId}>
      <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="block text-2xl font-semibold mt-1" style={{ color: tone, fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}>{value ?? '…'}</span>
      {sub && <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</span>}
    </button>
  )
}
