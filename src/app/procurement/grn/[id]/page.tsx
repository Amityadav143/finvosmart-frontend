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
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, FileText, PackageCheck, Pencil, Printer, RotateCcw, ShieldCheck, XCircle, ShieldPlus } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { grnApi, returnsApi } from '@/lib/api/purchaseStore'
import { apiError } from '@/lib/apiError'
import { inr, todayIST } from '@/lib/money'
import { printHtml } from '@/lib/storeHelpers'
import { fmtDate } from '@/components/godown/GodownParts'
import { seller } from '@/components/godown/print'
import { grnHtml } from '@/components/purchaseStore/print'
import { Chip, qty } from '@/components/purchaseStore/StoreParts'
import type { GoodsReceipt } from '@/types/purchaseStore'

const ANY = ['PROCUREMENT_VIEW', 'PROCUREMENT_RECEIVE', 'QUALITY_INSPECT', 'INVENTORY_VIEW']

/** One goods receipt: its lines, its inspection, and what follows — the bill, returns of what was rejected. */
export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>()
  const { canAny } = usePermissions()
  const allowed = canAny(...ANY)
  const router = useRouter()
  const qc = useQueryClient()
  const { data: g, isLoading, isError, error } = useQuery({ queryKey: ['grn', id], queryFn: () => grnApi.get(id), enabled: allowed })
  const [asking, setAsking] = useState(false)
  const [note, setNote] = useState('')
  const [returning, setReturning] = useState(false)
  const refresh = () => ['grn', 'grns', 'grn-counts', 'store-summary', 'store-pending', 'gate', 'purchase-orders'].forEach(k => qc.invalidateQueries({ queryKey: [k] }))
  const submit = useMutation({ mutationFn: () => grnApi.submit(id), onSuccess: r => { refresh(); toast.success(r.status === 'INSPECTION' ? 'Sent for inspection' : 'The goods are in stock') },
    onError: (e: unknown) => toast.error(apiError(e, 'The receipt could not be submitted.')) })
  const cancel = useMutation({ mutationFn: () => grnApi.cancel(id, note), onSuccess: () => { refresh(); setAsking(false); toast.success('Receipt cancelled') },
    onError: (e: unknown) => toast.error(apiError(e, 'The receipt could not be cancelled.')) })
  if (!allowed) return <PermissionGate anyOf={ANY} showDenied><span /></PermissionGate>
  if (isLoading) return <div className="card text-sm">Loading…</div>
  if (isError || !g) return <div className="card text-sm" style={{ color: 'var(--danger-text)' }}>{apiError(error, 'This receipt could not be opened.')}</div>
  const receiver = canAny('PROCUREMENT_RECEIVE')
  const canCancel = g.status !== 'CANCELLED' && (g.status === 'POSTED' ? canAny('PROCUREMENT_APPROVE', 'INVENTORY_ADMIN') : receiver)
  const billable = g.status === 'POSTED' && !g.bill && canAny('PROCUREMENT_CREATE', 'FINANCE_CREATE') && g.lines.some(l => Number(l.accepted) > 0)
  const print = async () => printHtml(grnHtml(g, await seller()))
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link href="/procurement/grn" className="text-xs inline-flex items-center gap-1 mb-1" style={{ color: 'var(--text-muted)' }}><ArrowLeft className="w-3 h-3" aria-hidden />Goods receipts</Link>
          <h1 className="page-title flex items-center gap-2 flex-wrap">{g.number} <Chip status={g.status} label={g.statusLabel} /></h1>
          <p className="page-subtitle">{g.vendorName} · received {fmtDate(g.receivedDate)}{g.godown ? ` into ${g.godown}` : ''}
            {g.poNumber && g.poId && <> · against <Link href={`/procurement/orders?open=${g.poId}`} className="underline" style={{ color: 'var(--gold)' }}>{g.poNumber}</Link></>}
            {g.gateEntryNumber && g.gateEntryId && <> · gate entry <Link href={`/procurement/gate?open=${g.gateEntryId}`} className="underline" style={{ color: 'var(--gold)' }}>{g.gateEntryNumber}</Link></>}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary h-9" onClick={print} data-testid="grn-print"><Printer className="w-4 h-4" aria-hidden />Print GRN</button>
          {g.status === 'DRAFT' && receiver && <>
            <button className="btn-secondary h-9" onClick={() => router.push(`/procurement/grn/new?id=${g.id}`)}><Pencil className="w-4 h-4" aria-hidden />Edit</button>
            <button className="btn-primary h-9" onClick={() => submit.mutate()} disabled={submit.isPending} data-testid="grn-submit-now"><PackageCheck className="w-4 h-4" aria-hidden />Submit</button>
          </>}
          {billable && <Link href={`/purchases/bills/new?fromGrn=${g.id}`} className="btn-primary h-9" data-testid="grn-make-bill"><FileText className="w-4 h-4" aria-hidden />Make the bill</Link>}
          {g.status === 'POSTED' && Number(g.rejectedToReturn) > 0 && receiver &&
            <button className="btn-secondary h-9" onClick={() => setReturning(true)} data-testid="grn-return"><RotateCcw className="w-4 h-4" aria-hidden />Return rejected goods</button>}
          {g.status === 'POSTED' && canAny('WARRANTY_CLAIMS') &&
            <Link href={`/warranty/new?grn=${g.id}`} className="btn-secondary h-9" data-testid="grn-warranty"><ShieldPlus className="w-4 h-4" aria-hidden />Warranty claim</Link>}
          {canCancel && <button className="btn-ghost h-9" onClick={() => { setNote(''); setAsking(true) }} data-testid="grn-cancel"><XCircle className="w-4 h-4" aria-hidden />Cancel</button>}
        </div>
      </div>

      <dl className="card grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        {[['Their invoice', [g.invoiceNumber, g.invoiceDate && fmtDate(g.invoiceDate)].filter(Boolean).join(' · ')],
          ['Their challan', [g.challanNumber, g.challanDate && fmtDate(g.challanDate)].filter(Boolean).join(' · ')],
          ['Vehicle · LR', [g.vehicleNo, g.lrNumber && 'LR ' + g.lrNumber].filter(Boolean).join(' · ')], ['Transporter', g.transporter],
          ['E-way bill', g.ewayBillNo], ['Counted by', g.receivedBy], ['Inspected', g.inspectedBy ? `${g.inspectedBy}${g.inspectionNote ? ' — ' + g.inspectionNote : ''}` : (g.status === 'INSPECTION' ? 'Waiting' : '')],
          ['Into stock', g.postedBy ? `${g.postedBy}${g.postedAt ? ', ' + fmtDate(g.postedAt) : ''}` : '']].map(([k, v]) => (
          <div key={k as string}><dt className="text-xs" style={{ color: 'var(--text-muted)' }}>{k}</dt><dd className="font-medium">{v || '—'}</dd></div>
        ))}
      </dl>
      {g.cancelReason && <p className="text-sm rounded-xl px-4 py-3" style={{ background: 'rgba(220,38,38,0.08)' }}>Cancelled: {g.cancelReason}</p>}
      {g.remarks && <p className="text-sm"><span style={{ color: 'var(--text-muted)' }}>Remarks:</span> {g.remarks}</p>}

      {g.status === 'INSPECTION' && canAny('QUALITY_INSPECT')
        ? <Inspection g={g} onDone={refresh} />
        : <LinesTable g={g} />}
      {g.status === 'INSPECTION' && !canAny('QUALITY_INSPECT') && <p className="text-sm flex items-center gap-2" style={{ color: 'var(--text-muted)' }}><ShieldCheck className="w-4 h-4" aria-hidden />Waiting for quality: nothing on it is in stock until it is inspected and released.</p>}

      {(g.bill || g.returns.length > 0) && (
        <div className="card text-sm space-y-1">
          {g.bill && <p>Supplier’s bill: <Link href={`/purchases/bills/${g.bill.id}`} className="underline font-mono" style={{ color: 'var(--gold)' }}>{g.bill.number}</Link></p>}
          {g.returns.length > 0 && <p>Returns: {g.returns.map((r, i) => <span key={r.id}>{i ? ', ' : ''}<Link href={`/procurement/returns?open=${r.id}`} className="underline font-mono" style={{ color: 'var(--gold)' }}>{r.number}</Link>{r.status === 'CANCELLED' ? ' (cancelled)' : ''}</span>)}</p>}
        </div>
      )}
      {g.status === 'POSTED' && !g.bill && g.rates && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No supplier bill yet: when their invoice comes, make the bill from here — it is matched to what was ordered and received, and doesn’t bring the goods into stock a second time.</p>}

      {asking && (
        <Modal open onClose={() => setAsking(false)} title={`Cancel ${g.number}`} subtitle={g.status === 'POSTED' ? 'Its accepted goods come back out of stock.' : undefined}>
          <div className="space-y-3">
            <label className="label label-required" htmlFor="c-note">Why is it cancelled?</label>
            <input id="c-note" className="input h-10" value={note} onChange={e => setNote(e.target.value)} autoFocus data-testid="grn-cancel-note" />
            <div className="flex justify-end gap-2"><button className="btn-secondary h-9" onClick={() => setAsking(false)}>Back</button>
              <button className="btn-danger h-9" disabled={!note.trim() || cancel.isPending} onClick={() => cancel.mutate()} data-testid="grn-cancel-ok">Cancel the receipt</button></div>
          </div>
        </Modal>
      )}
      {returning && <ReturnForm g={g} onClose={() => setReturning(false)} onDone={() => { setReturning(false); refresh() }} />}
    </div>
  )
}

function LinesTable({ g }: { g: GoodsReceipt }) {
  return (
    <div className="table-wrap">
      <table className="w-full text-sm" data-testid="grn-view-lines">
        <thead><tr>{['Item', 'Ordered', 'As per papers', 'Received', 'Accepted', 'Rejected', 'Returned', 'Batch', ...(g.rates ? ['Rate', 'Accepted value'] : [])]
          .map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
        <tbody>
          {g.lines.map(l => (
            <tr key={l.id} className="table-row">
              <td className="table-cell"><span className="font-medium">{l.description}</span>{l.needsInspection && <span className="ml-1 text-xs" style={{ color: '#7c3aed' }}>QC</span>}
                <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{[l.itemCode, l.unit, l.hsn && 'HSN ' + l.hsn].filter(Boolean).join(' · ')}</span></td>
              <td className="table-cell">{qty(l.ordered)}</td><td className="table-cell">{qty(l.challanQty)}</td><td className="table-cell">{qty(l.received)}</td>
              <td className="table-cell font-semibold">{qty(l.accepted)}</td>
              <td className="table-cell">{Number(l.rejected) ? <span style={{ color: '#b91c1c' }}>{qty(l.rejected)}</span> : ''}{l.rejectReason && <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{l.rejectReason}</span>}</td>
              <td className="table-cell">{Number(l.returned) ? qty(l.returned) : ''}</td>
              <td className="table-cell text-xs">{l.batchNo ?? ''}{l.expiry ? ` · ${fmtDate(l.expiry)}` : ''}</td>
              {g.rates && <><td className="table-cell font-mono">{l.rate != null ? inr(l.rate) : ''}</td><td className="table-cell font-mono">{l.value != null ? inr(l.value) : ''}</td></>}
            </tr>
          ))}
        </tbody>
      </table>
      {g.rates && g.acceptedValue != null && <p className="text-sm text-right px-3 py-2">Accepted, before GST: <span className="font-mono font-semibold">{inr(g.acceptedValue)}</span></p>}
    </div>
  )
}

/** Quality's verdict, line by line; what passes is released to stock. */
function Inspection({ g, onDone }: { g: GoodsReceipt; onDone: () => void }) {
  const [rows, setRows] = useState(() => g.lines.map(l => ({ lineId: l.id, accepted: String(Number(l.accepted)), rejected: Number(l.rejected) ? String(Number(l.rejected)) : '0', reason: l.rejectReason ?? '' })))
  const [note, setNote] = useState('')
  useEffect(() => { setRows(g.lines.map(l => ({ lineId: l.id, accepted: String(Number(l.accepted)), rejected: Number(l.rejected) ? String(Number(l.rejected)) : '0', reason: l.rejectReason ?? '' }))) }, [g])
  const release = useMutation({
    mutationFn: () => grnApi.inspect(g.id, { note: note.trim() || null, lines: rows.map(r => ({ lineId: r.lineId, accepted: Number(r.accepted), rejected: Number(r.rejected || 0), reason: r.reason.trim() || null })) }),
    onSuccess: () => { onDone(); toast.success('Released: the accepted goods are in stock') },
    onError: (e: unknown) => toast.error(apiError(e, 'The inspection could not be recorded.')),
  })
  const set = (id: string, k: 'accepted' | 'rejected' | 'reason', v: string) => setRows(rs => rs.map(r => {
    if (r.lineId !== id) return r
    const line = g.lines.find(l => l.id === id)!
    if (k === 'rejected') return { ...r, rejected: v, accepted: v === '' ? r.accepted : String(Math.max(0, Number(line.received) - Number(v))) }
    if (k === 'accepted') return { ...r, accepted: v, rejected: v === '' ? r.rejected : String(Math.max(0, Number(line.received) - Number(v))) }
    return { ...r, reason: v }
  }))
  const problem = rows.map(r => {
    const l = g.lines.find(x => x.id === r.lineId)!
    if (Math.abs(Number(r.accepted) + Number(r.rejected || 0) - Number(l.received)) > 0.0005) return `${l.description}: accepted and rejected must add up to the ${qty(l.received)} received.`
    if (Number(r.rejected) > 0 && !r.reason.trim()) return `Say why ${l.description} was rejected.`
    return null
  }).find(Boolean) ?? null
  return (
    <div className="card space-y-3" data-testid="grn-inspection">
      <h2 className="font-semibold flex items-center gap-2"><ShieldCheck className="w-4 h-4" aria-hidden style={{ color: '#7c3aed' }} />Inspection</h2>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>For each line, how much passes and how much is rejected (with why). Releasing puts what passes into stock; what is rejected waits to go back to the supplier.</p>
      <div className="table-wrap">
        <table className="w-full text-sm">
          <thead><tr>{['Item', 'Received', 'Accepted', 'Rejected', 'Why rejected'].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
          <tbody>
            {g.lines.map(l => {
              const r = rows.find(x => x.lineId === l.id)!
              return (
                <tr key={l.id} className="table-row" data-testid="inspect-line">
                  <td className="table-cell"><span className="font-medium">{l.description}</span>{l.needsInspection && <span className="ml-1 text-xs" style={{ color: '#7c3aed' }}>QC</span>}
                    {l.batchNo && <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>Batch {l.batchNo}{l.expiry ? ` · ${fmtDate(l.expiry)}` : ''}</span>}</td>
                  <td className="table-cell">{qty(l.received)} {l.unit}</td>
                  <td className="table-cell"><input className="input h-9 w-24" type="number" min={0} step="any" value={r.accepted} onChange={e => set(l.id, 'accepted', e.target.value)} aria-label={`${l.description} accepted`} data-testid="inspect-accepted" /></td>
                  <td className="table-cell"><input className="input h-9 w-24" type="number" min={0} step="any" value={r.rejected} onChange={e => set(l.id, 'rejected', e.target.value)} aria-label={`${l.description} rejected`} data-testid="inspect-rejected" /></td>
                  <td className="table-cell"><input className="input h-9 w-48" value={r.reason} onChange={e => set(l.id, 'reason', e.target.value)} aria-label={`Why ${l.description} was rejected`} data-testid="inspect-reason" /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div><label className="label" htmlFor="i-note">Inspection note</label><input id="i-note" className="input h-10" value={note} onChange={e => setNote(e.target.value)} placeholder="Sample checked, test certificate seen…" data-testid="inspect-note" /></div>
      {problem && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{problem}</p>}
      <div className="flex justify-end"><button className="btn-primary h-10" disabled={!!problem || release.isPending} onClick={() => release.mutate()} data-testid="inspect-release">
        {release.isPending ? 'Releasing…' : 'Release to stock'}</button></div>
    </div>
  )
}

/** Rejected goods going back to the supplier, with the challan that travels with them. */
function ReturnForm({ g, onClose, onDone }: { g: GoodsReceipt; onClose: () => void; onDone: () => void }) {
  const router = useRouter()
  const left = g.lines.filter(l => Number(l.rejected) - Number(l.returned) > 0)
  const [qtys, setQtys] = useState<Record<string, string>>(() => Object.fromEntries(left.map(l => [l.id, String(Number(l.rejected) - Number(l.returned))])))
  const [f, setF] = useState({ date: todayIST(), vehicleNo: g.vehicleNo ?? '', transporter: g.transporter ?? '', lrNumber: '', ewayBillNo: '', notes: '' })
  const make = useMutation({
    mutationFn: () => returnsApi.create({ grnId: g.id, date: f.date, vehicleNo: f.vehicleNo.trim() || null, transporter: f.transporter.trim() || null,
      lrNumber: f.lrNumber.trim() || null, ewayBillNo: f.ewayBillNo.trim() || null, notes: f.notes.trim() || null,
      lines: left.filter(l => Number(qtys[l.id]) > 0).map(l => ({ grnLineId: l.id, quantity: Number(qtys[l.id]) })) }),
    onSuccess: r => { onDone(); toast.success(`Return ${r.number} recorded — print its challan`); router.push(`/procurement/returns?open=${r.id}`) },
    onError: (e: unknown) => toast.error(apiError(e, 'The return could not be recorded.')),
  })
  const none = !left.some(l => Number(qtys[l.id]) > 0)
  return (
    <Modal open onClose={onClose} size="lg" title={`Return rejected goods — ${g.vendorName}`} subtitle={`Rejected on ${g.number}. They never went into stock, so nothing moves.`}>
      <div className="space-y-3" data-testid="return-form">
        <table className="w-full text-sm">
          <thead><tr>{['Item', 'Rejected', 'Already back', 'Sending back'].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
          <tbody>{left.map(l => (
            <tr key={l.id} className="table-row"><td className="table-cell">{l.description}<span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{l.rejectReason}</span></td>
              <td className="table-cell">{qty(l.rejected)}</td><td className="table-cell">{qty(l.returned)}</td>
              <td className="table-cell"><input className="input h-9 w-24" type="number" min={0} step="any" value={qtys[l.id] ?? ''} onChange={e => setQtys(q => ({ ...q, [l.id]: e.target.value }))} aria-label={`${l.description} going back`} data-testid="return-qty" /></td></tr>
          ))}</tbody>
        </table>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div><label className="label" htmlFor="rt-d">Date</label><input id="rt-d" type="date" className="input h-10" max={todayIST()} value={f.date} onChange={e => setF(p => ({ ...p, date: e.target.value }))} /></div>
          <div><label className="label" htmlFor="rt-v">Vehicle</label><input id="rt-v" className="input h-10 font-mono uppercase" value={f.vehicleNo} onChange={e => setF(p => ({ ...p, vehicleNo: e.target.value }))} /></div>
          <div><label className="label" htmlFor="rt-t">Transporter</label><input id="rt-t" className="input h-10" value={f.transporter} onChange={e => setF(p => ({ ...p, transporter: e.target.value }))} /></div>
          <div><label className="label" htmlFor="rt-l">LR / docket</label><input id="rt-l" className="input h-10" value={f.lrNumber} onChange={e => setF(p => ({ ...p, lrNumber: e.target.value }))} /></div>
          <div><label className="label" htmlFor="rt-e">E-way bill</label><input id="rt-e" className="input h-10 font-mono" value={f.ewayBillNo} onChange={e => setF(p => ({ ...p, ewayBillNo: e.target.value }))} /></div>
          <div><label className="label" htmlFor="rt-n">Notes</label><input id="rt-n" className="input h-10" value={f.notes} onChange={e => setF(p => ({ ...p, notes: e.target.value }))} /></div>
        </div>
        <div className="flex justify-end gap-2"><button className="btn-secondary h-10" onClick={onClose}>Cancel</button>
          <button className="btn-primary h-10" disabled={none || make.isPending} onClick={() => make.mutate()} data-testid="return-save">{make.isPending ? 'Recording…' : 'Record the return'}</button></div>
      </div>
    </Modal>
  )
}
