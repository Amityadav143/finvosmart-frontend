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

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { gateApi, grnApi } from '@/lib/api/purchaseStore'
import { godownsApi } from '@/lib/api/store'
import { apiError } from '@/lib/apiError'
import { inr, todayIST } from '@/lib/money'
import { ItemPicker } from '@/components/inventory/ItemPicker'
import { OrderSelect, SupplierPicker, qty } from '@/components/purchaseStore/StoreParts'
import type { GoodsReceipt, OrderToReceive, ReceiptInput } from '@/types/purchaseStore'

/** A line as typed: an order line, an item, or words. Quantities as text until saved. */
interface Draft {
  key: string; poLineId?: string; itemId?: string; name: string; unit: string; ordered?: number; pending?: number
  rate: string; gstRate?: number | null; batches: boolean; inspect: boolean; keepsStock: boolean
  challan: string; received: string; rejected: string; reason: string; batchNo: string; expiry: string; mrp: string
}
let seq = 0
const key = () => `d${Date.now().toString(36)}${(seq++).toString(36)}`
const n = (s: string) => (s.trim() === '' ? null : Number(s))

export default function NewReceiptPage() {
  return <Suspense fallback={<div className="card text-sm">Loading…</div>}><ReceiptForm /></Suspense>
}

/** Counting a consignment into a goods receipt: from the gate, against an order, or on its own. */
function ReceiptForm() {
  const { canAny } = usePermissions()
  const allowed = canAny('PROCUREMENT_RECEIVE')
  const buyer = canAny('PROCUREMENT_CREATE', 'PROCUREMENT_EDIT', 'PROCUREMENT_APPROVE')
  const router = useRouter()
  const qc = useQueryClient()
  const params = useSearchParams()
  const gateId = params.get('gate'), editId = params.get('id'), poParam = params.get('po')
  const { data: gate } = useQuery({ queryKey: ['gate-entry', gateId], queryFn: () => gateApi.get(gateId!), enabled: allowed && !!gateId })
  const { data: editing } = useQuery({ queryKey: ['grn', editId], queryFn: () => grnApi.get(editId!), enabled: allowed && !!editId })
  const { data: godowns = [] } = useQuery({ queryKey: ['godowns'], queryFn: godownsApi.list, retry: false, enabled: allowed })
  const [vendor, setVendor] = useState<{ id: string; name: string } | null>(null)
  const [poId, setPoId] = useState(poParam ?? '')
  const [h, setH] = useState({ receivedDate: todayIST(), godownId: '', invoiceNumber: '', invoiceDate: '', challanNumber: '', challanDate: '',
    vehicleNo: '', lrNumber: '', transporter: '', ewayBillNo: '', remarks: '', inspect: false })
  const [lines, setLines] = useState<Draft[]>([])
  const [itemText, setItemText] = useState('')
  const filled = useRef<string | null>(null)
  const setHead = (k: keyof typeof h, v: string | boolean) => setH(p => ({ ...p, [k]: v }))

  // from the gate: the supplier, order and papers as the security wrote them
  useEffect(() => {
    if (!gate || filled.current === 'gate:' + gate.id) return
    filled.current = 'gate:' + gate.id
    if (gate.vendorId) setVendor({ id: gate.vendorId, name: gate.partyName })
    if (gate.poId) setPoId(gate.poId)
    setH(p => ({ ...p, godownId: gate.godownId ?? p.godownId, vehicleNo: gate.vehicleNo ?? '', lrNumber: gate.lrNumber ?? '', transporter: gate.transporter ?? '',
      ewayBillNo: gate.ewayBillNo ?? '', invoiceNumber: gate.docType === 'INVOICE' ? gate.docNumber ?? '' : '', invoiceDate: gate.docType === 'INVOICE' ? gate.docDate ?? '' : '',
      challanNumber: gate.docType === 'CHALLAN' ? gate.docNumber ?? '' : '', challanDate: gate.docType === 'CHALLAN' ? gate.docDate ?? '' : '' }))
  }, [gate])
  // editing a draft: as it was saved
  useEffect(() => {
    if (!editing || filled.current === 'edit:' + editing.id) return
    filled.current = 'edit:' + editing.id
    setVendor({ id: editing.vendorId, name: editing.vendorName })
    setPoId(editing.poId ?? '')
    setH({ receivedDate: editing.receivedDate, godownId: editing.godownId ?? '', invoiceNumber: editing.invoiceNumber ?? '', invoiceDate: editing.invoiceDate ?? '',
      challanNumber: editing.challanNumber ?? '', challanDate: editing.challanDate ?? '', vehicleNo: editing.vehicleNo ?? '', lrNumber: editing.lrNumber ?? '',
      transporter: editing.transporter ?? '', ewayBillNo: editing.ewayBillNo ?? '', remarks: editing.remarks ?? '', inspect: editing.needsInspection })
    setLines(editing.lines.map(l => ({ key: key(), poLineId: l.poLineId ?? undefined, itemId: l.itemId ?? undefined, name: l.description, unit: l.unit ?? '',
      ordered: l.ordered ?? undefined, rate: l.rate != null ? String(l.rate) : '', gstRate: l.gstRate, batches: l.batches, inspect: l.needsInspection, keepsStock: l.keepsStock,
      challan: l.challanQty != null ? String(l.challanQty) : '', received: String(l.received), rejected: Number(l.rejected) ? String(l.rejected) : '',
      reason: l.rejectReason ?? '', batchNo: l.batchNo ?? '', expiry: l.expiry ?? '', mrp: l.mrp != null ? String(l.mrp) : '' })))
  }, [editing])
  // the order's lines still to come
  const { data: order, isFetching: orderLoading } = useQuery({ queryKey: ['grn-order', poId], queryFn: () => grnApi.order(poId), enabled: allowed && !!poId })
  useEffect(() => {
    if (!order || filled.current === 'po:' + order.poId || (editing && editing.poId === order.poId && filled.current === 'edit:' + editing.id)) return
    filled.current = 'po:' + order.poId
    if (!vendor) setVendor({ id: order.vendorId, name: order.vendorName })
    setLines(order.lines.filter(l => Number(l.pending) > 0).map(l => fromOrder(order, l.poLineId)))
  }, [order]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!h.godownId && godowns.length) setHead('godownId', godowns.find(g => g.main)?.id ?? '') }, [godowns]) // eslint-disable-line react-hooks/exhaustive-deps

  const save = useMutation({
    mutationFn: async (submit: boolean) => {
      const body: ReceiptInput = {
        gateEntryId: gateId ?? editing?.gateEntryId ?? null, poId: poId || null, vendorId: vendor?.id ?? null, receivedDate: h.receivedDate || null,
        godownId: h.godownId || null, invoiceNumber: h.invoiceNumber.trim() || null, invoiceDate: h.invoiceDate || null, challanNumber: h.challanNumber.trim() || null,
        challanDate: h.challanDate || null, vehicleNo: h.vehicleNo.trim() || null, lrNumber: h.lrNumber.trim() || null, transporter: h.transporter.trim() || null,
        ewayBillNo: h.ewayBillNo.trim() || null, remarks: h.remarks.trim() || null, sendForInspection: h.inspect,
        lines: lines.filter(l => Number(l.received) > 0).map(l => ({
          poLineId: l.poLineId ?? null, itemId: l.poLineId ? null : l.itemId ?? null, description: l.itemId || l.poLineId ? null : l.name, unit: l.unit || null,
          challanQty: n(l.challan), received: Number(l.received), rejected: n(l.rejected) ?? 0, rejectReason: l.reason.trim() || null,
          rate: l.poLineId ? null : n(l.rate), gstRate: l.gstRate ?? null, batchNo: l.batchNo.trim() || null, expiry: l.expiry || null, mrp: n(l.mrp),
        })),
      }
      const saved: GoodsReceipt = editing ? await grnApi.update(editing.id, body) : await grnApi.create(body)
      return submit ? grnApi.submit(saved.id) : saved
    },
    onSuccess: (g, submit) => {
      ['grns', 'grn-counts', 'store-summary', 'gate', 'store-pending'].forEach(k => qc.invalidateQueries({ queryKey: [k] }))
      toast.success(!submit ? `${g.number} saved — submit it when the count is done` : g.status === 'INSPECTION' ? `${g.number} sent for inspection` : `${g.number}: the goods are in stock`)
      router.push(`/procurement/grn/${g.id}`)
    },
    onError: (e: unknown) => toast.error(apiError(e, 'The receipt could not be saved.')),
  })

  if (!allowed) return <PermissionGate permission="PROCUREMENT_RECEIVE" showDenied><span /></PermissionGate>
  if (editing && editing.status !== 'DRAFT') return <div className="card text-sm">This receipt is {editing.statusLabel.toLowerCase()}: it can't be changed. <Link href={`/procurement/grn/${editing.id}`} className="underline">Open it</Link></div>

  const counted = lines.filter(l => Number(l.received) > 0)
  const needsQuality = h.inspect || counted.some(l => l.inspect)
  const bad = counted.find(l => n(l.rejected) != null && (Number(l.rejected) < 0 || Number(l.rejected) > Number(l.received)))
  const noReason = counted.find(l => Number(l.rejected) > 0 && !l.reason.trim())
  const noBatch = counted.find(l => l.batches && l.keepsStock && !l.batchNo.trim())
  // more accepted than the order still expects: someone who approves purchase orders lets it in
  const approver = canAny('PROCUREMENT_APPROVE')
  const extra = (l: Draft) => Number(l.received) - Number(l.rejected || 0) - Number(l.pending)
  const over = counted.find(l => l.poLineId && l.pending != null && extra(l) > 0.0005)
  const overText = over ? `${over.name}: ${qty(extra(over))} ${over.unit} more than the order still expects` : ''
  const problem = !vendor ? 'Choose the supplier.' : counted.length === 0 ? 'Enter what was received.'
    : bad ? `${bad.name}: what is rejected can't be more than what came.` : noReason ? `Say why ${noReason.name} was rejected.` : null
  // (a draft can still be saved, for someone who approves purchase orders to submit)
  const overBlock = !!over && !approver
  const set = (k: string, f: keyof Draft, v: string) => setLines(ls => ls.map(l => (l.key === k ? { ...l, [f]: v } : l)))
  return (
    <div className="space-y-4">
      <div>
        <Link href="/procurement/grn" className="text-xs inline-flex items-center gap-1 mb-1" style={{ color: 'var(--text-muted)' }}><ArrowLeft className="w-3 h-3" aria-hidden />Goods receipts</Link>
        <h1 className="page-title">{editing ? `Goods receipt ${editing.number}` : 'New goods receipt'}</h1>
        <p className="page-subtitle">{gate ? `From gate entry ${gate.number} — ${gate.partyName}. ` : ''}Count what came: against the order’s lines, with what their papers say and anything damaged. Nothing goes into stock until it is submitted{needsQuality ? ' and inspected' : ''}.</p>
      </div>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); if (!problem && !noBatch && !overBlock) save.mutate(true) }} data-testid="grn-form">
        <div className="card grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="sm:col-span-2"><SupplierPicker value={vendor} onChange={v => { setVendor(v); if (!gate?.poId) { setPoId(''); setLines([]) } }} testId="grn-supplier" /></div>
          <div className="sm:col-span-2">
            <OrderSelect vendorId={vendor?.id} value={poId} testId="grn-po" onChange={(id, o) => { setPoId(id); if (!id) setLines([]); if (o && !vendor) setVendor({ id: o.vendorId, name: o.vendorName }) }} />
            {order && !order.receivable && <p className="text-xs mt-1" style={{ color: 'var(--danger-text)' }}>{order.notReceivableReason}</p>}
          </div>
          <div><label className="label" htmlFor="r-date">Received on</label><input id="r-date" type="date" className="input h-10" max={todayIST()} value={h.receivedDate} onChange={e => setHead('receivedDate', e.target.value)} /></div>
          <div><label className="label" htmlFor="r-gd">Into godown</label>
            <select id="r-gd" className="input h-10" value={h.godownId} onChange={e => setHead('godownId', e.target.value)} data-testid="grn-godown">
              {godowns.length === 0 && <option value="">Main godown</option>}
              {godowns.filter(g => g.active).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select></div>
          <div><label className="label" htmlFor="r-inv">Their invoice no.</label><input id="r-inv" className="input h-10" value={h.invoiceNumber} onChange={e => setHead('invoiceNumber', e.target.value)} data-testid="grn-invoice" /></div>
          <div><label className="label" htmlFor="r-invd">Invoice date</label><input id="r-invd" type="date" className="input h-10" value={h.invoiceDate} onChange={e => setHead('invoiceDate', e.target.value)} /></div>
          <div><label className="label" htmlFor="r-dc">Their challan no.</label><input id="r-dc" className="input h-10" value={h.challanNumber} onChange={e => setHead('challanNumber', e.target.value)} /></div>
          <div><label className="label" htmlFor="r-dcd">Challan date</label><input id="r-dcd" type="date" className="input h-10" value={h.challanDate} onChange={e => setHead('challanDate', e.target.value)} /></div>
          <div><label className="label" htmlFor="r-veh">Vehicle</label><input id="r-veh" className="input h-10 font-mono uppercase" value={h.vehicleNo} onChange={e => setHead('vehicleNo', e.target.value)} /></div>
          <div><label className="label" htmlFor="r-lr">LR / docket</label><input id="r-lr" className="input h-10" value={h.lrNumber} onChange={e => setHead('lrNumber', e.target.value)} /></div>
        </div>

        <div className="table-wrap">
          <table className="w-full text-sm" data-testid="grn-lines">
            <thead><tr>{['Item', 'Ordered / to come', 'As per papers', 'Received', 'Rejected', 'Why rejected', 'Batch · expiry', ...(buyer ? ['Rate'] : []), '']
              .map((x, i) => i === 0
                ? <th key={x} className="table-header sticky left-0 z-10">{x}</th>
                : <th key={x} className="table-header">{x}</th>)}</tr></thead>
            <tbody>
              {orderLoading && <tr><td className="table-cell" colSpan={9}>Loading the order…</td></tr>}
              {!orderLoading && lines.length === 0 && <tr><td className="table-cell" colSpan={9} style={{ color: 'var(--text-muted)' }}>{poId ? 'Nothing is left to come on this order.' : 'Choose the order, or add the items that came.'}</td></tr>}
              {lines.map(l => (
                <tr key={l.key} className="table-row" data-testid="grn-line">
                  <td className="table-cell min-w-[11rem] sticky left-0 z-10" style={{ background: 'var(--bg-base)' }}><span className="font-medium">{l.name}</span>
                    {l.inspect && <span className="ml-1 badge" style={{ color: '#7c3aed', background: 'rgba(124,58,237,0.12)' }} title="Inspected on receipt"><ShieldCheck className="w-3 h-3" aria-hidden />QC</span>}
                    <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{l.unit}</span></td>
                  <td className="table-cell text-xs whitespace-nowrap">{l.ordered != null ? `${qty(l.ordered)} / ${qty(l.pending)}` : '—'}</td>
                  <td className="table-cell"><input className="input h-9 w-20" type="number" min={0} step="any" value={l.challan} onChange={e => set(l.key, 'challan', e.target.value)} aria-label={`${l.name} as per papers`} /></td>
                  <td className="table-cell"><input className="input h-9 w-24" type="number" min={0} step="any" value={l.received} onChange={e => set(l.key, 'received', e.target.value)} aria-label={`${l.name} received`} data-testid="grn-received" /></td>
                  <td className="table-cell"><input className="input h-9 w-20" type="number" min={0} step="any" value={l.rejected} onChange={e => set(l.key, 'rejected', e.target.value)} aria-label={`${l.name} rejected`} data-testid="grn-rejected" /></td>
                  <td className="table-cell"><input className="input h-9 w-40" value={l.reason} onChange={e => set(l.key, 'reason', e.target.value)} placeholder={Number(l.rejected) > 0 ? 'Damaged, short…' : ''} aria-label={`Why ${l.name} was rejected`} data-testid="grn-reason" /></td>
                  <td className="table-cell">{l.batches && l.keepsStock ? (
                    <div className="flex gap-1">
                      <input className="input h-9 w-24 font-mono uppercase" value={l.batchNo} onChange={e => set(l.key, 'batchNo', e.target.value)} placeholder="Batch" aria-label={`${l.name} batch`} data-testid="grn-batch" />
                      <input className="input h-9 w-36" type="date" value={l.expiry} onChange={e => set(l.key, 'expiry', e.target.value)} aria-label={`${l.name} expiry`} />
                    </div>) : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  {buyer && <td className="table-cell">{l.poLineId ? <span className="font-mono text-xs">{l.rate ? inr(Number(l.rate)) : ''}</span>
                    : <input className="input h-9 w-24" type="number" min={0} step="any" value={l.rate} onChange={e => set(l.key, 'rate', e.target.value)} aria-label={`${l.name} rate`} />}</td>}
                  <td className="table-cell"><button type="button" className="btn-ghost h-8 px-2" onClick={() => setLines(ls => ls.filter(x => x.key !== l.key))} aria-label={`Remove ${l.name}`}><Trash2 className="w-4 h-4" aria-hidden /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!poId && vendor && (
          <div className="flex flex-wrap items-end gap-2">
            <div className="w-full sm:w-80"><ItemPicker value={itemText} onChange={setItemText} price="purchase" placeholder="Add an item that came (name or code)" label="Add an item"
              onPick={it => { setLines(ls => [...ls, { key: key(), itemId: it.id, name: it.itemName, unit: it.unit, rate: it.purchasePrice != null ? String(it.purchasePrice) : '',
                gstRate: it.gstRate, batches: !!it.trackBatchNumbers, inspect: !!it.needsInspection, keepsStock: it.trackStock !== false, challan: '', received: '', rejected: '', reason: '',
                batchNo: '', expiry: '', mrp: '' }]); setItemText('') }} /></div>
            <button type="button" className="btn-secondary h-10" disabled={!itemText.trim()} onClick={() => { setLines(ls => [...ls, { key: key(), name: itemText.trim(), unit: '', rate: '', batches: false, inspect: false,
              keepsStock: false, challan: '', received: '', rejected: '', reason: '', batchNo: '', expiry: '', mrp: '' }]); setItemText('') }}><Plus className="w-4 h-4" aria-hidden />Add as words (not stock)</button>
          </div>
        )}
        <div className="card grid sm:grid-cols-2 gap-3">
          <div><label className="label" htmlFor="r-tr">Transporter</label><input id="r-tr" className="input h-10" value={h.transporter} onChange={e => setHead('transporter', e.target.value)} /></div>
          <div><label className="label" htmlFor="r-ew">E-way bill</label><input id="r-ew" className="input h-10 font-mono" value={h.ewayBillNo} onChange={e => setHead('ewayBillNo', e.target.value)} /></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="r-rm">Remarks</label><input id="r-rm" className="input h-10" value={h.remarks} onChange={e => setHead('remarks', e.target.value)} placeholder="Condition of the packages, seal…" /></div>
          <label className="flex items-start gap-2 text-sm cursor-pointer sm:col-span-2">
            <input type="checkbox" className="mt-0.5" checked={h.inspect} onChange={e => setHead('inspect', e.target.checked)} data-testid="grn-inspect" />
            <span>Send the whole receipt for inspection
              <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>Items marked QC are always inspected. Until quality releases it, nothing on the receipt is in stock.</span></span>
          </label>
        </div>
        {noBatch && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{noBatch.name} is kept by batch: enter the batch (and expiry) before it goes into stock.</p>}
        {over && <p className="text-xs" style={{ color: '#b45309' }} data-testid="grn-over">{approver ? `${overText}: submitting accepts it, as you approve purchase orders.`
          : `${overText} — reject the extra, or save it as a draft for someone who approves purchase orders to submit.`}</p>}
        {problem && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{problem}</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className="btn-secondary h-10" disabled={!!problem || save.isPending} onClick={() => save.mutate(false)} data-testid="grn-save-draft">Save as draft</button>
          <button type="submit" className="btn-primary h-10" disabled={!!problem || !!noBatch || overBlock || save.isPending} data-testid="grn-submit">
            {save.isPending ? 'Saving…' : needsQuality ? 'Submit for inspection' : 'Submit — into stock'}</button>
        </div>
      </form>
    </div>
  )
}

function fromOrder(o: OrderToReceive, lineId: string): Draft {
  const l = o.lines.find(x => x.poLineId === lineId)!
  return { key: key(), poLineId: l.poLineId, itemId: l.itemId ?? undefined, name: l.itemName, unit: l.unit ?? '', ordered: Number(l.ordered), pending: Number(l.pending),
    rate: l.rate != null ? String(l.rate) : '', gstRate: l.gstRate, batches: l.batches, inspect: l.needsInspection, keepsStock: l.keepsStock,
    challan: '', received: String(Number(l.pending)), rejected: '', reason: '', batchNo: '', expiry: '', mrp: '' }
}
