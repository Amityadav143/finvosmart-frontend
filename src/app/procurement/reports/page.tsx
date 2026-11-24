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

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, Download } from 'lucide-react'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { grnApi, storeReportsApi } from '@/lib/api/purchaseStore'
import { apiError } from '@/lib/apiError'
import { inr, todayIST } from '@/lib/money'
import { exportToCsv } from '@/lib/utils'
import { fmtDate } from '@/components/godown/GodownParts'
import { Chip, qty } from '@/components/purchaseStore/StoreParts'

const ANY = ['PROCUREMENT_VIEW', 'PROCUREMENT_RECEIVE', 'QUALITY_INSPECT', 'FINANCE_VIEW']
type Tab = 'not-billed' | 'rejections' | 'suppliers' | 'register'
const TABS: { value: Tab; label: string; perms: string[] }[] = [
  { value: 'not-billed', label: 'Received, not billed', perms: ['PROCUREMENT_VIEW', 'FINANCE_VIEW'] },
  { value: 'rejections', label: 'Rejections', perms: ['PROCUREMENT_VIEW', 'PROCUREMENT_RECEIVE', 'QUALITY_INSPECT'] },
  { value: 'suppliers', label: 'Supplier performance', perms: ['PROCUREMENT_VIEW'] },
  { value: 'register', label: 'Receipts register', perms: ['PROCUREMENT_VIEW', 'PROCUREMENT_RECEIVE', 'QUALITY_INSPECT'] },
]
const back = (days: number) => { const d = new Date(todayIST() + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - days); return d.toISOString().slice(0, 10) }
const none = (t: string) => toast(t)

export default function StoreReportsPage() {
  return <Suspense fallback={<div className="card text-sm">Loading…</div>}><Reports /></Suspense>
}

/** The purchase store's reports: receipts waiting for the supplier's bill, rejections, how suppliers deliver, the register. */
function Reports() {
  const { canAny } = usePermissions()
  const allowed = canAny(...ANY)
  const params = useSearchParams()
  const visible = TABS.filter(t => canAny(...t.perms))
  const asked = params.get('tab') as Tab | null
  const [tab, setTab] = useState<Tab>(visible.find(t => t.value === asked)?.value ?? visible[0]?.value ?? 'register')
  if (!allowed) return <PermissionGate anyOf={ANY} showDenied><span /></PermissionGate>
  return (
    <div className="space-y-4">
      <div>
        <Link href="/procurement/store" className="text-xs inline-flex items-center gap-1 mb-1" style={{ color: 'var(--text-muted)' }}><ArrowLeft className="w-3 h-3" aria-hidden />Purchase store</Link>
        <h1 className="page-title">Purchase store reports</h1>
      </div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Report">
        {visible.map(t => (
          <button key={t.value} role="tab" aria-selected={tab === t.value} onClick={() => setTab(t.value)} data-testid={`report-${t.value}`}
            className="px-3 h-8 rounded-full text-xs font-semibold" style={{ background: tab === t.value ? 'var(--gold-muted)' : 'var(--bg-hover)', color: tab === t.value ? 'var(--gold)' : 'var(--text-muted)' }}>{t.label}</button>
        ))}
      </div>
      {tab === 'not-billed' && <NotBilledReport />}
      {tab === 'rejections' && <RejectionsReport />}
      {tab === 'suppliers' && <SuppliersReport />}
      {tab === 'register' && <RegisterReport />}
    </div>
  )
}

function NotBilledReport() {
  const { canAny } = usePermissions()
  const { data = [], isLoading, isError, error } = useQuery({ queryKey: ['store-not-billed'], queryFn: storeReportsApi.notBilled })
  const total = data.reduce((s, r) => s + Number(r.value ?? 0), 0)
  const billing = canAny('PROCUREMENT_CREATE', 'FINANCE_CREATE')
  return (
    <section className="space-y-2" data-testid="not-billed">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Goods in stock that no supplier bill has been made from (nor recorded for their order since){data.length ? ` — ${data.length} receipt${data.length === 1 ? '' : 's'}${data.some(r => r.value != null) ? `, ${inr(total)} with GST, owed but not yet in the books` : ''}` : ''}.</p>
      {isError && <p className="text-sm" style={{ color: 'var(--danger-text)' }}>{apiError(error, 'The report could not be loaded.')}</p>}
      <div className="table-wrap">
        <table className="w-full text-sm">
          <thead><tr>{['Receipt', 'Received', 'Days', 'Supplier', 'Order', 'Their invoice', 'Value with GST', ''].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
          <tbody>
            {isLoading ? <tr><td className="table-cell" colSpan={8}>Loading…</td></tr>
              : data.length === 0 ? <tr><td className="table-cell" colSpan={8} style={{ color: 'var(--text-muted)' }}>Every receipt has its bill.</td></tr>
              : data.map(r => (
                <tr key={r.grnId} className="table-row">
                  <td className="table-cell font-mono"><Link href={`/procurement/grn/${r.grnId}`} className="underline">{r.number}</Link></td>
                  <td className="table-cell">{fmtDate(r.date)}</td><td className="table-cell" style={{ color: r.days > 30 ? '#c2410c' : undefined }}>{r.days}</td>
                  <td className="table-cell">{r.vendorName}</td><td className="table-cell font-mono text-xs">{r.poNumber ?? '—'}</td><td className="table-cell text-xs">{r.invoiceNumber ?? ''}</td>
                  <td className="table-cell font-mono">{r.value != null ? inr(r.value) : ''}</td>
                  <td className="table-cell">{billing && <Link href={`/purchases/bills/new?fromGrn=${r.grnId}`} className="btn-ghost h-8 text-xs">Make the bill</Link>}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function RejectionsReport() {
  const [waiting, setWaiting] = useState(true)
  const { data = [], isLoading, isError, error } = useQuery({ queryKey: ['store-rejections', waiting], queryFn: () => storeReportsApi.rejections(waiting) })
  const download = () => { if (!exportToCsv('rejections', data.map(r => ({ Receipt: r.grnNumber, Date: r.date, Supplier: r.vendorName, Item: r.itemName, Unit: r.unit ?? '',
    Rejected: r.rejected, 'Sent back': r.returned, 'To send back': r.toReturn, Why: r.reason ?? '' })))) none('Nothing to download') }
  return (
    <section className="space-y-2" data-testid="rejections">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={waiting} onChange={e => setWaiting(e.target.checked)} />Only those still to go back</label>
        <button className="btn-secondary h-9" onClick={download} disabled={!data.length}><Download className="w-4 h-4" aria-hidden />CSV</button>
      </div>
      {isError && <p className="text-sm" style={{ color: 'var(--danger-text)' }}>{apiError(error, 'The report could not be loaded.')}</p>}
      <div className="table-wrap">
        <table className="w-full text-sm">
          <thead><tr>{['Receipt', 'Date', 'Supplier', 'Item', 'Rejected', 'Sent back', 'To send back', 'Why'].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
          <tbody>
            {isLoading ? <tr><td className="table-cell" colSpan={8}>Loading…</td></tr>
              : data.length === 0 ? <tr><td className="table-cell" colSpan={8} style={{ color: 'var(--text-muted)' }}>{waiting ? 'Nothing rejected is waiting to go back.' : 'Nothing has been rejected.'}</td></tr>
              : data.map(r => (
                <tr key={r.grnLineId} className="table-row">
                  <td className="table-cell font-mono"><Link href={`/procurement/grn/${r.grnId}`} className="underline">{r.grnNumber}</Link></td>
                  <td className="table-cell">{fmtDate(r.date)}</td><td className="table-cell">{r.vendorName}</td><td className="table-cell">{r.itemName} <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.unit}</span></td>
                  <td className="table-cell">{qty(r.rejected)}</td><td className="table-cell">{qty(r.returned)}</td>
                  <td className="table-cell font-semibold" style={{ color: Number(r.toReturn) > 0 ? '#b91c1c' : undefined }}>{qty(r.toReturn)}</td><td className="table-cell text-xs">{r.reason ?? ''}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/** A grade's colours: A green, B blue, C amber, D red. */
const GRADE: Record<string, [string, string]> = {
  A: ['#15803d', 'rgba(22,163,74,0.12)'], B: ['#1d4ed8', 'rgba(37,99,235,0.12)'], C: ['#b45309', 'rgba(245,158,11,0.14)'], D: ['#b91c1c', 'rgba(220,38,38,0.10)'],
}

function SuppliersReport() {
  const [from, setFrom] = useState(back(89))
  const [to, setTo] = useState(todayIST())
  const { data = [], isLoading, isError, error } = useQuery({ queryKey: ['store-suppliers', from, to], queryFn: () => storeReportsApi.suppliers(from, to), enabled: !!from && !!to && from <= to })
  const pct = (v?: number | null) => (v == null ? '—' : `${Number(v).toFixed(1)}%`)
  const download = () => { if (!exportToCsv('supplier-performance', data.map(r => ({ Supplier: r.vendorName, Receipts: r.receipts, 'With a due date': r.withDueDate, 'On time': r.onTime,
    'On time %': r.onTimePercent ?? '', 'Average days late': r.averageDaysLate ?? '', Received: r.received, Rejected: r.rejected, 'Rejected %': r.rejectionPercent ?? '',
    'Warranty claims': r.warrantyClaims, 'Quantity under claim': r.claimedQuantity ?? '', Quality: r.quality ?? '', Delivery: r.delivery ?? '', Price: r.price ?? '',
    Service: r.service ?? '', Score: r.score ?? '', Grade: r.grade ?? '', 'Value accepted (₹, before GST)': r.value ?? '' })))) none('Nothing to download') }
  return (
    <section className="space-y-2" data-testid="suppliers">
      <div className="flex flex-wrap items-end gap-2">
        <div><label className="label" htmlFor="sp-f">From</label><input id="sp-f" type="date" className="input h-9" value={from} max={to} onChange={e => setFrom(e.target.value)} /></div>
        <div><label className="label" htmlFor="sp-t">To</label><input id="sp-t" type="date" className="input h-9" value={to} max={todayIST()} onChange={e => setTo(e.target.value)} /></div>
        <button className="btn-secondary h-9 ml-auto" onClick={download} disabled={!data.length}><Download className="w-4 h-4" aria-hidden />CSV</button>
      </div>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>On time: received by the date expected on the order (receipts against orders with a date). Rejected: of what came, how much failed at receipt or inspection.
        {' '}<b>Rating</b> (1–100): quality 40% (what came, less what was rejected or claimed under warranty), delivery 30% (on time), price 15% (billed lines at no more than the order’s rate)
        and service 15% (warranty claims they accepted, of those they answered) — what can’t be judged in the period is left out. A from 85, B from 70, C from 50, else D.</p>
      {isError && <p className="text-sm" style={{ color: 'var(--danger-text)' }}>{apiError(error, 'The report could not be loaded.')}</p>}
      <div className="table-wrap">
        <table className="w-full text-sm">
          <thead><tr>{['Supplier', 'Rating', 'Receipts', 'On time', 'Average days late', 'Rejected', 'Warranty claims', ...(data.some(r => r.value != null) ? ['Value accepted'] : [])].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
          <tbody>
            {isLoading ? <tr><td className="table-cell" colSpan={8}>Loading…</td></tr>
              : data.length === 0 ? <tr><td className="table-cell" colSpan={8} style={{ color: 'var(--text-muted)' }}>No receipts between these dates.</td></tr>
              : data.map(r => (
                <tr key={r.vendorId} className="table-row" data-testid="supplier-row">
                  <td className="table-cell font-medium">{r.vendorName}</td>
                  <td className="table-cell whitespace-nowrap" data-testid="supplier-rating">{r.score != null ? <><span className="badge" style={{ color: GRADE[r.grade ?? 'D'][0], background: GRADE[r.grade ?? 'D'][1] }}>{r.grade}</span> <b>{r.score}</b>
                    <span className="block text-xs" style={{ color: 'var(--text-muted)' }} title="Quality · delivery · price · service">{[r.quality, r.delivery, r.price, r.service].map(v => v ?? '–').join(' · ')}</span></> : '—'}</td>
                  <td className="table-cell">{r.receipts}</td>
                  <td className="table-cell">{r.withDueDate ? `${pct(r.onTimePercent)} (${r.onTime} of ${r.withDueDate})` : '—'}</td>
                  <td className="table-cell">{r.averageDaysLate != null ? Number(r.averageDaysLate).toFixed(1) : '—'}</td>
                  <td className="table-cell" style={{ color: Number(r.rejectionPercent ?? 0) > 2 ? '#b91c1c' : undefined }}>{pct(r.rejectionPercent)} <span className="text-xs" style={{ color: 'var(--text-muted)' }}>({qty(r.rejected)} of {qty(r.received)})</span></td>
                  <td className="table-cell">{r.warrantyClaims ? <>{r.warrantyClaims} <span className="text-xs" style={{ color: 'var(--text-muted)' }}>({qty(r.claimedQuantity)})</span></> : '—'}</td>
                  {data.some(x => x.value != null) && <td className="table-cell font-mono">{r.value != null ? inr(r.value) : ''}</td>}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function RegisterReport() {
  const [from, setFrom] = useState(back(29))
  const [to, setTo] = useState(todayIST())
  const [page, setPage] = useState(0)
  const ok = !!from && !!to && from <= to
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['grn-register', from, to, page], queryFn: () => grnApi.list({ from, to, page, size: 50 }), enabled: ok })
  const rows = data?.content ?? []
  const download = async () => {
    try {
      const all = await grnApi.list({ from, to, page: 0, size: 200 })
      const n = exportToCsv(`goods-receipts-${from}-to-${to}`, all.content.map(g => ({ Receipt: g.number, Date: g.date, Status: g.statusLabel, Supplier: g.vendorName,
        Order: g.poNumber ?? '', 'Their invoice': g.invoiceNumber ?? '', Godown: g.godown ?? '', Lines: g.lines, 'Rejected quantity': g.rejectedQty,
        Billed: g.status === 'POSTED' ? (g.billed ? 'Yes' : 'No') : '', ...(g.acceptedValue != null ? { 'Accepted value (₹, before GST)': g.acceptedValue } : {}) })))
      if (!n) none('Nothing to download')
      else if (all.totalElements > all.content.length) toast(`The first ${all.content.length} of ${all.totalElements} receipts were downloaded: choose fewer days for the rest.`)
    } catch (e) { toast.error(apiError(e, 'The register could not be downloaded.')) }
  }
  return (
    <section className="space-y-2" data-testid="register">
      <div className="flex flex-wrap items-end gap-2">
        <div><label className="label" htmlFor="rg-f">From</label><input id="rg-f" type="date" className="input h-9" value={from} max={to} onChange={e => { setFrom(e.target.value); setPage(0) }} /></div>
        <div><label className="label" htmlFor="rg-t">To</label><input id="rg-t" type="date" className="input h-9" value={to} max={todayIST()} onChange={e => { setTo(e.target.value); setPage(0) }} /></div>
        <button className="btn-secondary h-9 ml-auto" onClick={download} disabled={!rows.length}><Download className="w-4 h-4" aria-hidden />CSV</button>
      </div>
      {isError && <p className="text-sm" style={{ color: 'var(--danger-text)' }}>{apiError(error, 'The register could not be loaded.')}</p>}
      <div className="table-wrap">
        <table className="w-full text-sm">
          <thead><tr>{['Receipt', 'Date', 'Supplier', 'Order', 'Their invoice', 'Lines', 'Rejected', 'Billed', 'Status'].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
          <tbody>
            {isLoading ? <tr><td className="table-cell" colSpan={9}>Loading…</td></tr>
              : rows.length === 0 ? <tr><td className="table-cell" colSpan={9} style={{ color: 'var(--text-muted)' }}>No receipts between these dates.</td></tr>
              : rows.map(g => (
                <tr key={g.id} className="table-row">
                  <td className="table-cell font-mono"><Link href={`/procurement/grn/${g.id}`} className="underline">{g.number}</Link></td><td className="table-cell">{fmtDate(g.date)}</td>
                  <td className="table-cell">{g.vendorName}</td><td className="table-cell font-mono text-xs">{g.poNumber ?? '—'}</td><td className="table-cell text-xs">{g.invoiceNumber ?? ''}</td>
                  <td className="table-cell">{g.lines}</td><td className="table-cell">{Number(g.rejectedQty) ? qty(g.rejectedQty) : ''}</td>
                  <td className="table-cell text-xs">{g.status === 'POSTED' ? (g.billed ? 'Yes' : 'Not yet') : ''}</td><td className="table-cell"><Chip status={g.status} label={g.statusLabel} /></td>
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
    </section>
  )
}
