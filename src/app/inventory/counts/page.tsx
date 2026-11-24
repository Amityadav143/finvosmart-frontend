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

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, Plus, Printer, ScanBarcode } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { countsApi, godownsApi } from '@/lib/api/store'
import { apiError } from '@/lib/apiError'
import { inr, todayIST } from '@/lib/money'
import { qty } from '@/lib/inventory'
import { printHtml } from '@/lib/storeHelpers'
import { DocStatus, GodownItemPicker, fmtDate } from '@/components/godown/GodownParts'
import type { StockCount } from '@/types/store'

/** Physical stock counts: count a godown (or one category in it), see the differences, post them to the stock. */
export default function CountsPage() {
  const { canAny } = usePermissions()
  const allowed = canAny('INVENTORY_VIEW', 'INVENTORY_ADJUST', 'INVENTORY_ADMIN')
  const counter = canAny('INVENTORY_ADJUST', 'INVENTORY_ADMIN')
  const [page, setPage] = useState(0)
  const [starting, setStarting] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const { data, isLoading } = useQuery({ queryKey: ['stock-counts', page], queryFn: () => countsApi.list({ page, size: 20 }), enabled: allowed })
  if (!allowed) return <PermissionGate anyOf={['INVENTORY_VIEW', 'INVENTORY_ADJUST', 'INVENTORY_ADMIN']} showDenied><span /></PermissionGate>
  const rows = data?.content ?? []
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link href="/inventory/godowns" className="text-xs inline-flex items-center gap-1 mb-1" style={{ color: 'var(--text-muted)' }}><ArrowLeft className="w-3 h-3" aria-hidden />Godowns</Link>
          <h1 className="page-title">Stock counts</h1>
          <p className="page-subtitle">Count what is on the shelves, compare it with the books, and post the differences — short or over — as adjustments.</p>
        </div>
        {counter && <button className="btn-primary h-10" onClick={() => setStarting(true)} data-testid="count-new"><Plus className="w-4 h-4" aria-hidden />Start a count</button>}
      </div>
      <div className="table-wrap">
        <table className="w-full text-sm" data-testid="count-list">
          <thead><tr>{['Number', 'Date', 'Godown', 'Lines', 'By', 'Status'].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
          <tbody>
            {isLoading ? <tr><td className="table-cell" colSpan={6}>Loading…</td></tr>
              : rows.length === 0 ? <tr><td className="table-cell" colSpan={6} style={{ color: 'var(--text-muted)' }}>No stock counts yet.</td></tr>
              : rows.map(c => (
                <tr key={c.id} className="table-row cursor-pointer" onClick={() => setOpen(c.id)}>
                  <td className="table-cell font-mono">{c.number}</td><td className="table-cell">{fmtDate(c.date)}</td><td className="table-cell">{c.from}{c.to ? ` · ${c.to}` : ''}</td>
                  <td className="table-cell">{c.lines}</td><td className="table-cell text-xs">{c.by ?? ''}</td><td className="table-cell"><DocStatus status={c.status} /></td>
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
      {starting && <StartCount onClose={() => setStarting(false)} onMade={id => { setStarting(false); setOpen(id) }} />}
      {open && <CountView id={open} counter={counter} onClose={() => setOpen(null)} />}
    </div>
  )
}

function StartCount({ onClose, onMade }: { onClose: () => void; onMade: (id: string) => void }) {
  const qc = useQueryClient()
  const { data: godowns = [] } = useQuery({ queryKey: ['godowns'], queryFn: godownsApi.list })
  const active = godowns.filter(g => g.active)
  const [f, setF] = useState({ godownId: active.find(g => g.main)?.id ?? active[0]?.id ?? '', category: '', date: todayIST(), notes: '' })
  const save = useMutation({
    mutationFn: () => countsApi.start({ godownId: f.godownId, category: f.category.trim() || null, date: f.date, notes: f.notes.trim() || undefined }),
    onSuccess: c => { toast.success(`Count ${c.number} started with ${c.lines.length} line${c.lines.length === 1 ? '' : 's'}`); qc.invalidateQueries({ queryKey: ['stock-counts'] }); onMade(c.id) },
    onError: (e: any) => toast.error(apiError(e, 'The count could not be started')),
  })
  return (
    <Modal open onClose={onClose} title="Start a stock count" subtitle="The sheet lists every item (and batch) the books say is in the godown. Items found that aren't listed can be added." size="md">
      <form className="space-y-3" onSubmit={e => { e.preventDefault(); if (f.godownId) save.mutate() }}>
        <div><label className="label label-required">Godown</label>
          <select className="input h-10" value={f.godownId} onChange={e => setF({ ...f, godownId: e.target.value })} aria-label="Godown">
            {active.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Only the category</label><input className="input h-10" maxLength={100} value={f.category} onChange={e => setF({ ...f, category: e.target.value })} placeholder="All items" /></div>
          <div><label className="label">Date</label><input className="input h-10" type="date" max={todayIST()} value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></div>
        </div>
        <div><label className="label">Notes</label><input className="input h-10" maxLength={500} value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} /></div>
        <div className="flex justify-end gap-2 pt-2"><button type="button" className="btn-secondary h-10" onClick={onClose}>Cancel</button>
          <button className="btn-primary h-10" disabled={!f.godownId || save.isPending} data-testid="count-start">{save.isPending ? 'Starting…' : 'Start'}</button></div>
      </form>
    </Modal>
  )
}

const sheetHtml = (c: StockCount) => `<!doctype html><html><head><meta charset="utf-8"><title>Count ${c.number}</title><style>
  @page { size: A4; margin: 12mm } body { font: 12px/1.4 -apple-system, "Segoe UI", Roboto, Arial, sans-serif; margin: 0 }
  table { width: 100%; border-collapse: collapse } th, td { border: 1px solid #999; padding: 5px 6px } th { background: #f0f0f0; text-align: left } .w { width: 22% }
</style></head><body><h2 style="margin:0">Stock count ${c.number}</h2><p>${esc(c.godown)}${c.category ? ` · ${esc(c.category)}` : ''} · ${esc(fmtDate(c.date))}</p>
<table><thead><tr><th>#</th><th>Item</th><th>Code</th><th>Batch</th><th>Unit</th><th class="w">Counted</th></tr></thead><tbody>
${c.lines.map((l, i) => `<tr><td>${i + 1}</td><td>${esc(l.itemName)}</td><td>${esc(l.itemCode)}</td><td>${esc(l.batchNo ?? '')}</td><td>${esc(l.unit ?? '')}</td><td></td></tr>`).join('')}
</tbody></table><p style="margin-top:40px">Counted by: ____________________ &nbsp; Checked by: ____________________</p></body></html>`
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!))

function CountView({ id, counter, onClose }: { id: string; counter: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const { data: c, isLoading } = useQuery({ queryKey: ['stock-count', id], queryFn: () => countsApi.get(id) })
  const [typed, setTyped] = useState<Record<string, string>>({})
  const [scan, setScan] = useState('')
  const [filter, setFilter] = useState<'all' | 'left' | 'diff'>('all')
  const [posting, setPosting] = useState(false)
  const scanRef = useRef<HTMLInputElement>(null)
  const editable = counter && c?.status === 'OPEN'
  const valueOf = (lineId: string, counted?: number | null) => typed[lineId] ?? (counted == null ? '' : String(counted))
  const dirty = Object.keys(typed).length
  const refresh = (n: StockCount) => { qc.setQueryData(['stock-count', id], n); qc.invalidateQueries({ queryKey: ['stock-counts'] }) }
  const record = useMutation({
    mutationFn: () => countsApi.record(id, Object.entries(typed).map(([lineId, v]) => ({ lineId, counted: v.trim() === '' ? null : Number(v) }))),
    onSuccess: n => { setTyped({}); refresh(n); toast.success('Counts saved') },
    onError: (e: any) => toast.error(apiError(e, 'The counts could not be saved')),
  })
  const addLine = useMutation({
    mutationFn: (itemId: string) => countsApi.addLine(id, itemId),
    onSuccess: n => { refresh(n); toast.success('Added to the sheet') },
    onError: (e: any) => toast.error(apiError(e, 'The item could not be added')),
  })
  const post = useMutation({
    mutationFn: async () => { if (dirty) await countsApi.record(id, Object.entries(typed).map(([lineId, v]) => ({ lineId, counted: v.trim() === '' ? null : Number(v) }))); return countsApi.post(id) },
    onSuccess: n => { setTyped({}); setPosting(false); refresh(n); qc.invalidateQueries({ queryKey: ['godown-stock'] }); toast.success('Posted — the stock now matches the count') },
    onError: (e: any) => toast.error(apiError(e, 'The count could not be posted')),
  })
  const cancel = useMutation({
    mutationFn: () => countsApi.cancel(id),
    onSuccess: n => { refresh(n); toast.success('Count cancelled') },
    onError: (e: any) => toast.error(apiError(e, 'The count could not be cancelled')),
  })
  const lines = useMemo(() => (c?.lines ?? []).filter(l => {
    const v = valueOf(l.id, l.counted)
    if (filter === 'left') return v === ''
    if (filter === 'diff') return v !== '' && Number(v) !== Number(l.book)
    return true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [c, typed, filter])
  /** A scanned or typed code adds one to its line (the first batch of it on the sheet). */
  const onScan = () => {
    const code = scan.trim().toLowerCase()
    if (!code || !c) return
    const l = c.lines.find(x => x.itemCode.toLowerCase() === code)
    if (!l) { toast.error(`${scan.trim()} isn't on this sheet — add it below`); return }
    const now = Number(valueOf(l.id, l.counted) || 0) + 1
    setTyped(t => ({ ...t, [l.id]: String(now) }))
    setScan('')
    toast.success(`${l.itemName}${l.batchNo ? ` (${l.batchNo})` : ''}: ${qty(now)}`, { duration: 1200 })
  }
  return (
    <Modal open onClose={onClose} title={c ? `Stock count ${c.number}` : 'Stock count'} subtitle={c ? `${c.godown}${c.category ? ` · ${c.category}` : ''} · ${fmtDate(c.date)}` : undefined} size="xl">
      {isLoading || !c ? <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p> : (
        <div className="space-y-4" data-testid="count-view">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[['Counted', `${c.summary.counted} of ${c.summary.lines}`], ['Matched', String(c.summary.matched)], ['Short', `${c.summary.shortLines} · ${inr(c.summary.shortValue)}`], ['Over', `${c.summary.overLines} · ${inr(c.summary.overValue)}`]].map(([k, v]) => (
              <div key={k} className="rounded-xl p-3" style={{ border: '1px solid var(--border)' }}><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{k}</p><p className="font-semibold font-mono text-sm">{v}</p></div>
            ))}
          </div>
          {editable && (
            <form className="flex gap-2" onSubmit={e => { e.preventDefault(); onScan() }}>
              <div className="relative flex-1"><ScanBarcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} aria-hidden />
                <input ref={scanRef} className="input h-10 pl-9" placeholder="Scan or type an item code — each one adds 1" aria-label="Scan an item code" value={scan} onChange={e => setScan(e.target.value)} /></div>
              <button type="submit" className="btn-secondary h-10">Add 1</button>
            </form>
          )}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex gap-1 p-1 rounded-xl" role="tablist" style={{ border: '1px solid var(--border)' }}>
              {([['all', 'All'], ['left', 'Not counted'], ['diff', 'Different']] as const).map(([k, v]) => (
                <button key={k} role="tab" aria-selected={filter === k} onClick={() => setFilter(k)} className="px-3 h-8 rounded-lg text-sm" style={{ background: filter === k ? 'var(--gold-muted)' : 'transparent' }}>{v}</button>
              ))}
            </div>
            <button className="btn-ghost h-9" onClick={() => printHtml(sheetHtml(c))}><Printer className="w-4 h-4" aria-hidden />Print the count sheet</button>
          </div>
          <div className="table-wrap max-h-[50vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead><tr>{['Item', 'Batch', 'Books', 'Counted', 'Difference', 'Value'].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
              <tbody>
                {lines.length === 0 ? <tr><td className="table-cell" colSpan={6} style={{ color: 'var(--text-muted)' }}>Nothing here.</td></tr> : lines.map(l => {
                  const v = valueOf(l.id, l.counted)
                  const diff = c.status === 'POSTED' ? Number(l.adjusted ?? l.difference ?? 0) : v === '' ? null : Number(v) - Number(l.book)
                  const val = diff == null ? null : diff * Number(l.unitCost ?? 0)
                  return (
                    <tr key={l.id} className="table-row">
                      <td className="table-cell"><span className="font-medium">{l.itemName}</span><span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{l.itemCode}</span></td>
                      <td className="table-cell text-xs font-mono">{l.batchNo ?? '—'}</td>
                      <td className="table-cell font-mono">{qty(l.book)} <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{l.unit ?? ''}</span></td>
                      <td className="table-cell">{editable
                        ? <input className="input h-8 w-24 font-mono" type="number" min="0" step="any" aria-label={`Counted ${l.itemName}${l.batchNo ? ` ${l.batchNo}` : ''}`} value={v}
                            onChange={e => setTyped(t => ({ ...t, [l.id]: e.target.value }))} />
                        : <span className="font-mono">{l.counted != null ? qty(l.counted) : '—'}</span>}</td>
                      <td className="table-cell font-mono" style={{ color: diff == null || diff === 0 ? 'var(--text-muted)' : diff < 0 ? '#b91c1c' : '#15803d' }}>{diff == null ? '—' : diff === 0 ? '0' : `${diff > 0 ? '+' : ''}${qty(diff)}`}</td>
                      <td className="table-cell font-mono text-xs">{val == null || val === 0 ? '' : inr(val)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {editable && (
            <div className="space-y-1"><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Found something that isn&apos;t on the sheet? Add it:</p>
              <GodownItemPicker godownId={c.godownId} onPick={r => addLine.mutate(r.itemId)} placeholder="Item name or code" /></div>
          )}
          {c.status === 'POSTED' && <p className="text-sm" style={{ color: '#15803d' }}>Posted{c.postedBy ? ` by ${c.postedBy}` : ''}{c.postedAt ? ` on ${fmtDate(c.postedAt)}` : ''}: the stock in {c.godown} was set to what was counted.</p>}
          {editable && (posting ? (
            <div className="rounded-xl p-3 space-y-2" style={{ border: '1px solid var(--gold)' }}>
              <p className="text-sm">Posting sets the stock of every counted line to what was counted, as an adjustment of the difference from the books at that moment. Post soon after counting: stock sold or received after you counted isn't in the count. Lines not counted are left as they are.</p>
              <div className="flex justify-end gap-2"><button className="btn-secondary h-9" onClick={() => setPosting(false)}>Not yet</button>
                <button className="btn-primary h-9" disabled={post.isPending} onClick={() => post.mutate()} data-testid="count-post-confirm">{post.isPending ? 'Posting…' : 'Post the differences'}</button></div>
            </div>
          ) : (
            <div className="flex justify-between gap-2 flex-wrap">
              <button className="btn-ghost h-10" disabled={cancel.isPending} onClick={() => cancel.mutate()}>Cancel the count</button>
              <div className="flex gap-2">
                <button className="btn-secondary h-10" disabled={!dirty || record.isPending} onClick={() => record.mutate()} data-testid="count-save">{record.isPending ? 'Saving…' : `Save counts${dirty ? ` (${dirty})` : ''}`}</button>
                <button className="btn-primary h-10" disabled={c.summary.counted === 0 && !dirty} onClick={() => setPosting(true)} data-testid="count-post">Post…</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
