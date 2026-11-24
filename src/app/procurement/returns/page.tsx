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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, FileText, Printer, XCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useUrlParams } from '@/lib/hooks/useUrlParams'
import { returnsApi } from '@/lib/api/purchaseStore'
import { apiError } from '@/lib/apiError'
import { inr } from '@/lib/money'
import { printHtml } from '@/lib/storeHelpers'
import { fmtDate } from '@/components/godown/GodownParts'
import { seller } from '@/components/godown/print'
import { returnHtml } from '@/components/purchaseStore/print'
import { Chip, qty } from '@/components/purchaseStore/StoreParts'

const ANY = ['PROCUREMENT_VIEW', 'PROCUREMENT_RECEIVE']

/** Rejected goods sent back to suppliers, each with its challan and, once it comes, the supplier's credit note. */
export default function ReturnsPage() {
  const { canAny } = usePermissions()
  const allowed = canAny(...ANY)
  const [page, setPage] = useState(0)
  const [open, setOpen] = useState<string | null>(null)
  useUrlParams(p => { if (p.get('open')) setOpen(p.get('open')) })
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['purchase-returns', page], queryFn: () => returnsApi.list({ page, size: 20 }), enabled: allowed })
  if (!allowed) return <PermissionGate anyOf={ANY} showDenied><span /></PermissionGate>
  const rows = data?.content ?? []
  const values = rows.some(r => r.total != null)
  return (
    <div className="space-y-4">
      <div>
        <Link href="/procurement/store" className="text-xs inline-flex items-center gap-1 mb-1" style={{ color: 'var(--text-muted)' }}><ArrowLeft className="w-3 h-3" aria-hidden />Purchase store</Link>
        <h1 className="page-title">Returns to suppliers</h1>
        <p className="page-subtitle">Goods rejected on receipt, sent back with a challan. They never went into stock. Record the supplier’s credit note from a return when it comes.
          {' '}A return is made from its goods receipt (<Link href="/procurement/reports?tab=rejections" className="underline">rejections waiting to go back</Link>).</p>
      </div>
      {isError && <p className="text-sm" style={{ color: 'var(--danger-text)' }}>{apiError(error, 'Returns could not be loaded.')}</p>}
      <div className="table-wrap">
        <table className="w-full text-sm" data-testid="return-list">
          <thead><tr>{['Return', 'Date', 'Supplier', 'Receipt', 'Lines', ...(values ? ['Value with GST'] : []), 'Credit note', 'Status'].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
          <tbody>
            {isLoading ? <tr><td className="table-cell" colSpan={8}>Loading…</td></tr>
              : rows.length === 0 ? <tr><td className="table-cell" colSpan={8} style={{ color: 'var(--text-muted)' }}>Nothing has gone back to a supplier yet.</td></tr>
              : rows.map(r => (
                <tr key={r.id} className="table-row cursor-pointer" onClick={() => setOpen(r.id)}>
                  <td className="table-cell font-mono">{r.number}</td><td className="table-cell">{fmtDate(r.date)}</td><td className="table-cell">{r.vendorName}</td>
                  <td className="table-cell font-mono text-xs">{r.grnNumber}</td><td className="table-cell">{r.lines}</td>
                  {values && <td className="table-cell font-mono">{r.total != null ? inr(r.total) : ''}</td>}
                  <td className="table-cell text-xs">{r.status === 'DONE' ? (r.creditNote ? 'Recorded' : 'Not yet') : ''}</td>
                  <td className="table-cell"><Chip status={r.status} label={r.status === 'DONE' ? 'Sent back' : 'Cancelled'} /></td>
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
      {open && <ReturnView id={open} onClose={() => setOpen(null)} />}
    </div>
  )
}

function ReturnView({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient()
  const { canAny } = usePermissions()
  const { data: r, isLoading, isError, error } = useQuery({ queryKey: ['purchase-return', id], queryFn: () => returnsApi.get(id) })
  const [asking, setAsking] = useState(false)
  const [note, setNote] = useState('')
  const cancel = useMutation({ mutationFn: () => returnsApi.cancel(id, note),
    onSuccess: () => { ['purchase-returns', 'purchase-return', 'grn', 'store-summary'].forEach(k => qc.invalidateQueries({ queryKey: [k] })); setAsking(false); toast.success('Return cancelled') },
    onError: (e: unknown) => toast.error(apiError(e, 'The return could not be cancelled.')) })
  const print = async () => { if (r) printHtml(returnHtml(r, await seller())) }
  return (
    <Modal open onClose={onClose} size="lg" title={r ? `${r.number} · ${r.vendorName}` : 'Return'} subtitle={r ? `${fmtDate(r.date)} · rejected on ${r.grnNumber}` : ''}>
      {isLoading ? <p className="text-sm">Loading…</p> : isError || !r ? <p className="text-sm" style={{ color: 'var(--danger-text)' }}>{apiError(error, 'It could not be opened.')}</p> : (
        <div className="space-y-4" data-testid="return-view">
          <table className="w-full text-sm">
            <thead><tr>{['Item', 'Batch', 'Quantity', 'Why', ...(r.rates ? ['Value with GST'] : [])].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
            <tbody>{r.lines.map(l => (
              <tr key={l.grnLineId} className="table-row"><td className="table-cell">{l.itemName}</td><td className="table-cell text-xs">{l.batchNo ?? ''}</td>
                <td className="table-cell">{qty(l.quantity)} {l.unit}</td><td className="table-cell text-xs">{l.reason ?? ''}</td>
                {r.rates && <td className="table-cell font-mono">{l.value != null ? inr(l.value) : ''}</td>}</tr>
            ))}</tbody>
          </table>
          {r.rates && r.total != null && <p className="text-sm text-right">Value with GST: <span className="font-mono font-semibold">{inr(r.total)}</span></p>}
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{[r.vehicleNo && `Vehicle ${r.vehicleNo}`, r.transporter, r.lrNumber && `LR ${r.lrNumber}`, r.ewayBillNo && `E-way bill ${r.ewayBillNo}`, r.createdBy && `by ${r.createdBy}`].filter(Boolean).join(' · ')}</p>
          {r.notes && <p className="text-sm">{r.notes}</p>}
          {r.cancelReason && <p className="text-sm">Cancelled: {r.cancelReason}</p>}
          {r.creditNote && <p className="text-sm">Supplier’s credit note: <Link href={`/purchases/bills/${r.creditNote.id}`} className="underline font-mono" style={{ color: 'var(--gold)' }}>{r.creditNote.number}</Link></p>}
          {asking && (
            <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--bg-surface)' }}>
              <label className="label label-required" htmlFor="rt-note">Why is the return cancelled?</label>
              <input id="rt-note" className="input h-10" value={note} onChange={e => setNote(e.target.value)} autoFocus />
              <div className="flex justify-end gap-2"><button className="btn-secondary h-9" onClick={() => setAsking(false)}>Back</button>
                <button className="btn-danger h-9" disabled={!note.trim() || cancel.isPending} onClick={() => cancel.mutate()}>Cancel the return</button></div>
            </div>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Link href={`/procurement/grn/${r.grnId}`} className="btn-ghost h-9">Open {r.grnNumber}</Link>
            <button className="btn-secondary h-9" onClick={print} data-testid="return-print"><Printer className="w-4 h-4" aria-hidden />Print challan</button>
            {r.status === 'DONE' && !r.creditNote && canAny('PROCUREMENT_CREATE', 'FINANCE_CREATE') &&
              <Link href={`/purchases/bills/new?fromReturn=${r.id}`} className="btn-primary h-9" data-testid="return-credit"><FileText className="w-4 h-4" aria-hidden />Record their credit note</Link>}
            {r.status === 'DONE' && !r.creditNote && canAny('PROCUREMENT_RECEIVE') && <button className="btn-ghost h-9" onClick={() => { setNote(''); setAsking(true) }}><XCircle className="w-4 h-4" aria-hidden />Cancel</button>}
          </div>
        </div>
      )}
    </Modal>
  )
}
