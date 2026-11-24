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

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, LogOut, PackageCheck, Plus, Printer, Search, Truck, Undo2, XCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useUrlParams } from '@/lib/hooks/useUrlParams'
import { useDebounce } from '@/lib/hooks'
import { gateApi } from '@/lib/api/purchaseStore'
import { godownsApi } from '@/lib/api/store'
import { apiError } from '@/lib/apiError'
import { printHtml } from '@/lib/storeHelpers'
import { fmtDate } from '@/components/godown/GodownParts'
import { seller } from '@/components/godown/print'
import { gateHtml } from '@/components/purchaseStore/print'
import { Chip, OrderSelect, SupplierPicker } from '@/components/purchaseStore/StoreParts'
import type { GateEntry, GateEntryInput } from '@/types/purchaseStore'

const ANY = ['GATE_ENTRY', 'PROCUREMENT_VIEW', 'PROCUREMENT_RECEIVE']
const TABS: { value: string; label: string }[] = [
  { value: 'AT_GATE', label: 'At the gate' }, { value: 'RECEIVED', label: 'Taken in' }, { value: 'TURNED_AWAY', label: 'Turned away' }, { value: '', label: 'All' },
]
const time = (iso?: string | null) => !iso ? '' : new Date(iso + (/[zZ+]/.test(iso.slice(10)) ? '' : '+05:30'))
  .toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export default function GatePage() {
  return <Suspense fallback={<div className="card text-sm">Loading…</div>}><GateRegister /></Suspense>
}

/** The gate register: each consignment as it arrives, before the stores count it in. */
function GateRegister() {
  const { canAny } = usePermissions()
  const allowed = canAny(...ANY)
  const writer = canAny('GATE_ENTRY', 'PROCUREMENT_RECEIVE')
  const params = useSearchParams()
  const [status, setStatus] = useState(params.get('status') ?? 'AT_GATE')
  const [q, setQ] = useState('')
  const query = useDebounce(q, 300)
  const [page, setPage] = useState(0)
  const [form, setForm] = useState<GateEntry | 'new' | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  useUrlParams(p => { if (p.has('new')) setForm('new'); if (p.get('open')) setOpen(p.get('open')) })
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['gate', status, query, page], enabled: allowed,
    queryFn: () => gateApi.list({ status: status || undefined, q: query || undefined, page, size: 20 }) })
  if (!allowed) return <PermissionGate anyOf={ANY} showDenied><span /></PermissionGate>
  const rows = data?.content ?? []
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link href="/procurement/store" className="text-xs inline-flex items-center gap-1 mb-1" style={{ color: 'var(--text-muted)' }}><ArrowLeft className="w-3 h-3" aria-hidden />Purchase store</Link>
          <h1 className="page-title">Gate entries</h1>
          <p className="page-subtitle">Every consignment as it arrives: the supplier, their invoice or challan, the vehicle, LR and e-way bill. The stores are told, and count it into a goods receipt.</p>
        </div>
        {writer && <button className="btn-primary h-10" onClick={() => setForm('new')} data-testid="gate-new"><Plus className="w-4 h-4" aria-hidden />New gate entry</button>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Status">
          {TABS.map(t => (
            <button key={t.value} role="tab" aria-selected={status === t.value} onClick={() => { setStatus(t.value); setPage(0) }}
              className="px-3 h-8 rounded-full text-xs font-semibold" style={{ background: status === t.value ? 'var(--gold-muted)' : 'var(--bg-hover)', color: status === t.value ? 'var(--gold)' : 'var(--text-muted)' }}>{t.label}</button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3" style={{ color: 'var(--text-muted)' }} aria-hidden />
          <input className="input h-10 pl-9" placeholder="Supplier, vehicle, invoice, order…" value={q} onChange={e => { setQ(e.target.value); setPage(0) }} aria-label="Search gate entries" />
        </div>
      </div>
      {isError && <p className="text-sm" style={{ color: 'var(--danger-text)' }}>{apiError(error, 'Gate entries could not be loaded.')}</p>}
      <div className="table-wrap">
        <table className="w-full text-sm" data-testid="gate-list">
          <thead><tr>{['Entry', 'Arrived', 'From', 'Their papers', 'Vehicle', 'Packages', 'Status'].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
          <tbody>
            {isLoading ? <tr><td className="table-cell" colSpan={7}>Loading…</td></tr>
              : rows.length === 0 ? <tr><td className="table-cell" colSpan={7} style={{ color: 'var(--text-muted)' }}>{status === 'AT_GATE' ? 'Nothing waiting at the gate.' : 'No gate entries.'}</td></tr>
              : rows.map(e => (
                <tr key={e.id} className="table-row cursor-pointer" onClick={() => setOpen(e.id)}>
                  <td className="table-cell font-mono">{e.number}</td>
                  <td className="table-cell text-xs">{time(e.arrivedAt)}</td>
                  <td className="table-cell">{e.partyName}{e.poNumber && <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{e.poNumber}</span>}</td>
                  <td className="table-cell text-xs">{e.docType === 'NONE' ? 'None' : `${e.docType === 'CHALLAN' ? 'Challan' : 'Invoice'} ${e.docNumber ?? ''}`}</td>
                  <td className="table-cell font-mono text-xs">{e.vehicleNo ?? ''}</td>
                  <td className="table-cell">{e.packages ?? ''}</td>
                  <td className="table-cell"><Chip status={e.status} label={e.statusLabel} /></td>
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
      {form && <GateForm entry={form === 'new' ? null : form} onClose={() => setForm(null)} onSaved={id => { setForm(null); setOpen(id) }} />}
      {open && !form && <GateView id={open} writer={writer} onClose={() => setOpen(null)} onEdit={e => setForm(e)} />}
    </div>
  )
}

function GateForm({ entry, onClose, onSaved }: { entry: GateEntry | null; onClose: () => void; onSaved: (id: string) => void }) {
  const qc = useQueryClient()
  const { data: godowns = [] } = useQuery({ queryKey: ['godowns'], queryFn: godownsApi.list, retry: false })
  const [vendor, setVendor] = useState<{ id: string; name: string } | null>(entry?.vendorId ? { id: entry.vendorId, name: entry.partyName } : null)
  const [party, setParty] = useState(entry && !entry.vendorId ? entry.partyName : '')
  const [poId, setPoId] = useState(entry?.poId ?? '')
  const [f, setF] = useState({
    docType: (entry?.docType ?? 'INVOICE') as GateEntryInput['docType'], docNumber: entry?.docNumber ?? '', docDate: entry?.docDate ?? '',
    vehicleNo: entry?.vehicleNo ?? '', driverName: entry?.driverName ?? '', driverPhone: entry?.driverPhone ?? '', transporter: entry?.transporter ?? '',
    lrNumber: entry?.lrNumber ?? '', ewayBillNo: entry?.ewayBillNo ?? '', packages: entry?.packages != null ? String(entry.packages) : '',
    weightKg: entry?.weightKg != null ? String(entry.weightKg) : '', godownId: entry?.godownId ?? '', remarks: entry?.remarks ?? '',
  })
  const set = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }))
  const save = useMutation({
    mutationFn: () => {
      const body: GateEntryInput = {
        vendorId: vendor?.id ?? null, partyName: vendor ? null : party.trim() || null, poId: poId || null, godownId: f.godownId || null,
        docType: f.docType, docNumber: f.docType === 'NONE' ? null : f.docNumber.trim() || null, docDate: f.docType === 'NONE' ? null : f.docDate || null,
        vehicleNo: f.vehicleNo.trim() || null, driverName: f.driverName.trim() || null, driverPhone: f.driverPhone.trim() || null,
        transporter: f.transporter.trim() || null, lrNumber: f.lrNumber.trim() || null, ewayBillNo: f.ewayBillNo.trim() || null,
        packages: f.packages === '' ? null : Number(f.packages), weightKg: f.weightKg === '' ? null : Number(f.weightKg), remarks: f.remarks.trim() || null,
      }
      return entry ? gateApi.update(entry.id, body) : gateApi.create(body)
    },
    onSuccess: e => { qc.invalidateQueries({ queryKey: ['gate'] }); qc.invalidateQueries({ queryKey: ['store-summary'] }); toast.success(entry ? 'Saved' : `Gate entry ${e.number} recorded — the stores are told`); onSaved(e.id) },
    onError: (e: unknown) => toast.error(apiError(e, 'The gate entry could not be saved.')),
  })
  const problem = !vendor && !party.trim() ? 'Choose the supplier, or write the name as on their papers.'
    : f.docType !== 'NONE' && !f.docNumber.trim() ? `Enter the number on their ${f.docType === 'CHALLAN' ? 'challan' : 'invoice'}.` : null
  return (
    <Modal open onClose={onClose} size="lg" title={entry ? `Gate entry ${entry.number}` : 'New gate entry'} subtitle="What has arrived at the gate">
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); if (!problem) save.mutate() }} data-testid="gate-form">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <SupplierPicker value={vendor} onChange={v => { setVendor(v); setPoId('') }} required={false} label="Supplier" testId="gate-supplier" />
            {!vendor && <input className="input h-10 mt-2" placeholder="…or the name as on their papers" value={party} onChange={e => setParty(e.target.value)} aria-label="Sender's name" data-testid="gate-party" />}
          </div>
          <OrderSelect vendorId={vendor?.id} value={poId} testId="gate-po" onChange={(id, o) => { setPoId(id); if (o && !vendor) setVendor({ id: o.vendorId, name: o.vendorName }) }} />
        </div>
        <fieldset>
          <legend className="label">Their papers</legend>
          <div className="flex flex-wrap gap-3 text-sm mb-2">
            {([['INVOICE', 'Tax invoice'], ['CHALLAN', 'Delivery challan'], ['NONE', 'No document']] as const).map(([v, l]) => (
              <label key={v} className="inline-flex items-center gap-1.5 cursor-pointer"><input type="radio" name="doc" checked={f.docType === v} onChange={() => set('docType', v)} />{l}</label>
            ))}
          </div>
          {f.docType !== 'NONE' && (
            <div className="grid grid-cols-2 gap-3">
              <input className="input h-10" placeholder={f.docType === 'CHALLAN' ? 'Challan number' : 'Invoice number'} value={f.docNumber} onChange={e => set('docNumber', e.target.value)} aria-label="Document number" data-testid="gate-doc-no" />
              <input type="date" className="input h-10" value={f.docDate} onChange={e => set('docDate', e.target.value)} aria-label="Document date" />
            </div>
          )}
        </fieldset>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div><label className="label" htmlFor="g-veh">Vehicle number</label><input id="g-veh" className="input h-10 font-mono uppercase" value={f.vehicleNo} onChange={e => set('vehicleNo', e.target.value)} placeholder="MH12AB1234" data-testid="gate-vehicle" /></div>
          <div><label className="label" htmlFor="g-drv">Driver</label><input id="g-drv" className="input h-10" value={f.driverName} onChange={e => set('driverName', e.target.value)} /></div>
          <div><label className="label" htmlFor="g-ph">Driver's phone</label><input id="g-ph" className="input h-10" inputMode="tel" value={f.driverPhone} onChange={e => set('driverPhone', e.target.value)} /></div>
          <div><label className="label" htmlFor="g-tr">Transporter</label><input id="g-tr" className="input h-10" value={f.transporter} onChange={e => set('transporter', e.target.value)} /></div>
          <div><label className="label" htmlFor="g-lr">LR / docket number</label><input id="g-lr" className="input h-10" value={f.lrNumber} onChange={e => set('lrNumber', e.target.value)} /></div>
          <div><label className="label" htmlFor="g-ew">E-way bill</label><input id="g-ew" className="input h-10 font-mono" inputMode="numeric" value={f.ewayBillNo} onChange={e => set('ewayBillNo', e.target.value)} placeholder="12 digits" /></div>
          <div><label className="label" htmlFor="g-pk">Packages</label><input id="g-pk" type="number" min={0} className="input h-10" value={f.packages} onChange={e => set('packages', e.target.value)} data-testid="gate-packages" /></div>
          <div><label className="label" htmlFor="g-wt">Weight (kg)</label><input id="g-wt" type="number" min={0} step="0.001" className="input h-10" value={f.weightKg} onChange={e => set('weightKg', e.target.value)} /></div>
          {godowns.length > 1 && (
            <div><label className="label" htmlFor="g-gd">Unloaded at</label>
              <select id="g-gd" className="input h-10" value={f.godownId} onChange={e => set('godownId', e.target.value)}>
                <option value="">—</option>{godowns.filter(g => g.active).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select></div>
          )}
        </div>
        <div><label className="label" htmlFor="g-rm">Remarks</label><input id="g-rm" className="input h-10" value={f.remarks} onChange={e => set('remarks', e.target.value)} placeholder="Seal number, condition of the packages…" /></div>
        {problem && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{problem}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary h-10" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary h-10" disabled={!!problem || save.isPending} data-testid="gate-save">{save.isPending ? 'Saving…' : entry ? 'Save' : 'Record arrival'}</button>
        </div>
      </form>
    </Modal>
  )
}

function GateView({ id, writer, onClose, onEdit }: { id: string; writer: boolean; onClose: () => void; onEdit: (e: GateEntry) => void }) {
  const qc = useQueryClient()
  const router = useRouter()
  const { canAny } = usePermissions()
  const { data: e, isLoading, isError, error } = useQuery({ queryKey: ['gate-entry', id], queryFn: () => gateApi.get(id) })
  const [asking, setAsking] = useState<'turn' | 'cancel' | null>(null)
  const [note, setNote] = useState('')
  useEffect(() => { setNote('') }, [asking])
  const done = (msg: string) => () => { qc.invalidateQueries({ queryKey: ['gate'] }); qc.invalidateQueries({ queryKey: ['gate-entry', id] }); qc.invalidateQueries({ queryKey: ['store-summary'] }); toast.success(msg); setAsking(null) }
  const fail = (m: string) => (err: unknown) => toast.error(apiError(err, m))
  const turn = useMutation({ mutationFn: () => gateApi.turnAway(id, note), onSuccess: done('Turned away'), onError: fail('It could not be turned away.') })
  const cancel = useMutation({ mutationFn: () => gateApi.cancel(id, note), onSuccess: done('Cancelled'), onError: fail('It could not be cancelled.') })
  const out = useMutation({ mutationFn: () => gateApi.vehicleOut(id), onSuccess: done('Vehicle out noted'), onError: fail('The vehicle out could not be noted.') })
  const print = async () => { if (e) printHtml(gateHtml(e, await seller())) }
  return (
    <Modal open onClose={onClose} size="lg" title={e ? `${e.number} · ${e.partyName}` : 'Gate entry'} subtitle={e ? `${time(e.arrivedAt)} · ${e.statusLabel}` : ''}>
      {isLoading ? <p className="text-sm">Loading…</p> : isError || !e ? <p className="text-sm" style={{ color: 'var(--danger-text)' }}>{apiError(error, 'It could not be opened.')}</p> : (
        <div className="space-y-4" data-testid="gate-view">
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {[['Against order', e.poNumber], ['Their papers', e.docType === 'NONE' ? 'None' : `${e.docType === 'CHALLAN' ? 'Challan' : 'Invoice'} ${e.docNumber ?? ''}${e.docDate ? ' · ' + fmtDate(e.docDate) : ''}`],
              ['Vehicle', e.vehicleNo], ['Driver', [e.driverName, e.driverPhone].filter(Boolean).join(' · ')], ['Transporter', [e.transporter, e.lrNumber && 'LR ' + e.lrNumber].filter(Boolean).join(' · ')],
              ['E-way bill', e.ewayBillNo], ['Packages', e.packages != null ? `${e.packages}${e.weightKg != null ? ` · ${e.weightKg} kg` : ''}` : (e.weightKg != null ? `${e.weightKg} kg` : '')],
              ['Unloaded at', e.godown], ['Vehicle out', time(e.leftAt)], ['Recorded by', e.createdBy]].map(([k, v]) => (
              <div key={k as string}><dt className="text-xs" style={{ color: 'var(--text-muted)' }}>{k}</dt><dd className="font-medium">{v || '—'}</dd></div>
            ))}
          </dl>
          {e.remarks && <p className="text-sm"><span style={{ color: 'var(--text-muted)' }}>Remarks:</span> {e.remarks}</p>}
          {e.statusNote && <p className="text-sm"><span style={{ color: 'var(--text-muted)' }}>{e.status === 'TURNED_AWAY' ? 'Turned away:' : 'Note:'}</span> {e.statusNote}</p>}
          {e.receipts.length > 0 && (
            <div className="text-sm"><p className="label">Goods receipts</p>
              <ul className="flex flex-wrap gap-2">{e.receipts.map(r => <li key={r.id}><Link href={`/procurement/grn/${r.id}`} className="underline font-mono" style={{ color: 'var(--gold)' }}>{r.number}</Link> <span className="text-xs" style={{ color: 'var(--text-muted)' }}>({r.status.toLowerCase()})</span></li>)}</ul>
            </div>
          )}
          {asking && (
            <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--bg-surface)' }}>
              <label className="label label-required" htmlFor="g-note">{asking === 'turn' ? 'Why is it turned away?' : 'Why is the entry cancelled?'}</label>
              <input id="g-note" className="input h-10" value={note} onChange={x => setNote(x.target.value)} autoFocus data-testid="gate-note" />
              <div className="flex justify-end gap-2">
                <button className="btn-secondary h-9" onClick={() => setAsking(null)}>Back</button>
                <button className="btn-danger h-9" disabled={!note.trim() || turn.isPending || cancel.isPending} onClick={() => (asking === 'turn' ? turn : cancel).mutate()} data-testid="gate-note-ok">
                  {asking === 'turn' ? 'Turn away' : 'Cancel the entry'}</button>
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2 justify-end">
            <button className="btn-secondary h-9" onClick={print} data-testid="gate-print"><Printer className="w-4 h-4" aria-hidden />Print gate pass</button>
            {writer && e.status !== 'CANCELLED' && !e.leftAt && <button className="btn-secondary h-9" onClick={() => out.mutate()} disabled={out.isPending} data-testid="gate-out"><LogOut className="w-4 h-4" aria-hidden />Vehicle out</button>}
            {writer && e.status === 'AT_GATE' && <>
              <button className="btn-secondary h-9" onClick={() => onEdit(e)}>Edit</button>
              <button className="btn-secondary h-9" onClick={() => setAsking('turn')} data-testid="gate-turn"><Undo2 className="w-4 h-4" aria-hidden />Turn away</button>
              <button className="btn-ghost h-9" onClick={() => setAsking('cancel')}><XCircle className="w-4 h-4" aria-hidden />Cancel entry</button>
            </>}
            {e.status === 'AT_GATE' && canAny('PROCUREMENT_RECEIVE') && (
              <button className="btn-primary h-9" onClick={() => router.push(`/procurement/grn/new?gate=${e.id}`)} data-testid="gate-receive"><PackageCheck className="w-4 h-4" aria-hidden />Count into a goods receipt</button>
            )}
          </div>
          {e.status === 'AT_GATE' && !canAny('PROCUREMENT_RECEIVE') && <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><Truck className="w-3.5 h-3.5" aria-hidden />The stores have been told; they make the goods receipt.</p>}
        </div>
      )}
    </Modal>
  )
}
