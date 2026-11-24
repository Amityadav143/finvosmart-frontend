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
import { ArrowLeftRight, ClipboardCheck, ListChecks, MapPin, Plus, Warehouse } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useDebounce } from '@/lib/hooks'
import { godownsApi } from '@/lib/api/store'
import { apiError } from '@/lib/apiError'
import { inr } from '@/lib/money'
import { EXPIRY_HINT, parseExpiry, qty } from '@/lib/inventory'
import { KIND_LABEL } from '@/lib/storeHelpers'
import { fmtDate } from '@/components/godown/GodownParts'
import type { Godown, GodownKind, GodownStockRow } from '@/types/store'

const KINDS: GodownKind[] = ['WAREHOUSE', 'SHOP', 'FACTORY', 'SITE', 'OTHER']

/** The company's godowns — warehouses, shops, factories, sites — and the stock in each. */
export default function GodownsPage() {
  const { canAny, can } = usePermissions()
  const allowed = canAny('INVENTORY_VIEW', 'INVENTORY_ADMIN')
  const admin = can('INVENTORY_ADMIN')
  const adjuster = canAny('INVENTORY_ADJUST', 'INVENTORY_ADMIN')
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const dq = useDebounce(q.trim(), 300)
  const [page, setPage] = useState(0)
  const [edit, setEdit] = useState<Godown | 'new' | null>(null)
  const [item, setItem] = useState<GodownStockRow | null>(null)
  const { data: godowns = [], isLoading } = useQuery({ queryKey: ['godowns'], queryFn: godownsApi.list, enabled: allowed })
  const { data: stock, isFetching } = useQuery({ queryKey: ['godown-stock', dq, page], queryFn: () => godownsApi.stock({ q: dq || undefined, page, size: 25 }), enabled: allowed })
  const toggle = useMutation({
    mutationFn: (g: Godown) => godownsApi.setActive(g.id, !g.active),
    onSuccess: g => { toast.success(g.active ? `${g.name} reopened` : `${g.name} closed`); qc.invalidateQueries({ queryKey: ['godowns'] }); qc.invalidateQueries({ queryKey: ['godown-stock'] }) },
    onError: (e: any) => toast.error(apiError(e, 'The godown could not be changed')),
  })
  if (!allowed) return <PermissionGate anyOf={['INVENTORY_VIEW', 'INVENTORY_ADMIN']} showDenied><span /></PermissionGate>
  const shown = (stock?.godowns ?? godowns).filter(g => g.active)
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="page-title">Godowns</h1>
          <p className="page-subtitle">Each warehouse, shop, factory or site keeps its own stock. Sales, purchases and counters take stock from the godown they name; the main godown is the one used when none is chosen.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/inventory/transfers" className="btn-secondary h-10"><ArrowLeftRight className="w-4 h-4" aria-hidden />Transfers</Link>
          <Link href="/inventory/requests" className="btn-secondary h-10"><ClipboardCheck className="w-4 h-4" aria-hidden />Requests</Link>
          <Link href="/inventory/counts" className="btn-secondary h-10"><ListChecks className="w-4 h-4" aria-hidden />Counts</Link>
          {admin && <button className="btn-primary h-10" onClick={() => setEdit('new')} data-testid="godown-add"><Plus className="w-4 h-4" aria-hidden />Add godown</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3" data-testid="godown-list">
        {isLoading ? <div className="card p-4 text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</div> : godowns.map(g => (
          <div key={g.id} className="card p-4 space-y-2" style={{ opacity: g.active ? 1 : 0.65 }}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0"><Warehouse className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--gold)' }} aria-hidden />
                <h2 className="font-semibold truncate">{g.name}</h2></div>
              <span className="badge">{g.main ? 'Main' : KIND_LABEL[g.kind]}</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{g.code}{g.address ? <> · <MapPin className="w-3 h-3 inline" aria-hidden /> {g.address}</> : ''}</p>
            <p className="text-sm">{g.items} item{g.items === 1 ? '' : 's'} in stock{g.value != null ? <> · <span className="font-mono">{inr(g.value)}</span></> : ''}</p>
            {g.usedBy.length > 0 && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Used by {g.usedBy.join(', ')}</p>}
            {!g.active && <p className="text-xs" style={{ color: '#b45309' }}>Closed — nothing moves in or out.</p>}
            {admin && (
              <div className="flex gap-2 pt-1">
                <button className="btn-ghost h-8 text-xs" onClick={() => setEdit(g)}>Edit</button>
                {!g.main && <button className="btn-ghost h-8 text-xs" disabled={toggle.isPending} onClick={() => toggle.mutate(g)}>{g.active ? 'Close' : 'Reopen'}</button>}
              </div>
            )}
          </div>
        ))}
      </div>

      <section className="space-y-3" aria-label="Stock by godown">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-semibold text-lg">Stock by godown</h2>
          <input className="input h-10 w-72" placeholder="Find an item" aria-label="Find an item" value={q} onChange={e => { setQ(e.target.value); setPage(0) }} />
        </div>
        <div className="table-wrap">
          <table className="w-full text-sm" data-testid="godown-stock">
            <thead><tr><th className="table-header">Item</th>{shown.map(g => <th key={g.id} className="table-header text-right">{g.name}</th>)}<th className="table-header text-right">Total</th></tr></thead>
            <tbody>
              {(stock?.rows ?? []).length === 0 ? <tr><td className="table-cell" colSpan={shown.length + 2} style={{ color: 'var(--text-muted)' }}>{isFetching ? 'Loading…' : dq ? 'No stock item matches.' : 'No items that keep stock yet.'}</td></tr>
                : stock!.rows.map(r => (
                  <tr key={r.itemId} className="table-row cursor-pointer" onClick={() => setItem(r)}>
                    <td className="table-cell"><span className="font-medium">{r.itemName}</span><span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{r.itemCode}{r.batches ? ' · by batch' : ''}</span></td>
                    {shown.map(g => { const n = Number(r.byGodown[g.id] ?? 0); return <td key={g.id} className="table-cell text-right font-mono" style={{ color: n < 0 ? '#b91c1c' : n === 0 ? 'var(--text-muted)' : undefined }}>{n === 0 ? '—' : qty(n)}</td> })}
                    <td className="table-cell text-right font-mono font-semibold">{qty(r.total)} <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>{r.unit ?? ''}</span></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {(stock?.totalPages ?? 0) > 1 && (
          <div className="flex justify-between items-center text-sm">
            <button className="btn-secondary h-9" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button>
            <span style={{ color: 'var(--text-muted)' }}>Page {page + 1} of {stock?.totalPages}</span>
            <button className="btn-secondary h-9" disabled={page + 1 >= (stock?.totalPages ?? 1)} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        )}
      </section>

      {edit && <GodownForm godown={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />}
      {item && <ItemPlacesModal row={item} godowns={godowns.filter(g => g.active)} adjuster={adjuster} onClose={() => setItem(null)} />}
    </div>
  )
}

function GodownForm({ godown, onClose }: { godown: Godown | null; onClose: () => void }) {
  const qc = useQueryClient()
  const [f, setF] = useState({ code: godown?.code ?? '', name: godown?.name ?? '', kind: godown?.kind ?? 'WAREHOUSE' as GodownKind, address: godown?.address ?? '' })
  const save = useMutation({
    mutationFn: () => {
      const body = { code: f.code.trim().toUpperCase(), name: f.name.trim(), kind: f.kind, address: f.address.trim() }
      return godown ? godownsApi.update(godown.id, body) : godownsApi.create(body)
    },
    onSuccess: () => { toast.success(godown ? 'Godown saved' : 'Godown added'); qc.invalidateQueries({ queryKey: ['godowns'] }); qc.invalidateQueries({ queryKey: ['godown-stock'] }); onClose() },
    onError: (e: any) => toast.error(apiError(e, 'The godown could not be saved')),
  })
  return (
    <Modal open onClose={onClose} title={godown ? `Edit ${godown.name}` : 'Add a godown'} subtitle="A place that keeps stock: a warehouse, a shop, a factory store or a site." size="md">
      <form className="space-y-3" onSubmit={e => { e.preventDefault(); save.mutate() }}>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="label label-required">Code</label><input className="input h-10 font-mono uppercase" maxLength={20} value={f.code} onChange={e => setF({ ...f, code: e.target.value })} placeholder="WH2" autoFocus /></div>
          <div className="col-span-2"><label className="label label-required">Name</label><input className="input h-10" maxLength={100} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Howrah warehouse" /></div>
        </div>
        <div><label className="label">What it is</label>
          <select className="input h-10" value={f.kind} disabled={godown?.main} onChange={e => setF({ ...f, kind: e.target.value as GodownKind })} aria-label="What it is">
            {KINDS.map(k => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
          </select></div>
        <div><label className="label">Address</label><textarea className="input min-h-[70px] py-2" maxLength={500} value={f.address} onChange={e => setF({ ...f, address: e.target.value })} /></div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary h-10" onClick={onClose}>Cancel</button>
          <button className="btn-primary h-10" disabled={!f.code.trim() || !f.name.trim() || save.isPending}>{save.isPending ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  )
}

/** One item in every godown, batch by batch; stock brought in or taken out of one godown by hand. */
function ItemPlacesModal({ row, godowns, adjuster, onClose }: { row: GodownStockRow; godowns: Godown[]; adjuster: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['godown-item', row.itemId], queryFn: () => godownsApi.item(row.itemId) })
  const [f, setF] = useState({ godownId: godowns.find(g => g.main)?.id ?? godowns[0]?.id ?? '', type: 'IN' as 'IN' | 'OUT', quantity: '', batchId: '', batchNo: '', expiry: '', remarks: '' })
  const lots = (data?.places ?? []).filter(p => p.godownId === f.godownId && p.batchId && Number(p.quantity) > 0)
  const expiry = parseExpiry(f.expiry)
  const save = useMutation({
    mutationFn: () => godownsApi.adjust(f.godownId, {
      itemId: row.itemId, type: f.type, quantity: Number(f.quantity), batchId: f.batchId || null,
      batchNo: f.type === 'IN' && !f.batchId ? f.batchNo.trim() || undefined : undefined,
      expiry: f.type === 'IN' && !f.batchId ? expiry ?? null : null, remarks: f.remarks.trim() || undefined,
    }),
    onSuccess: () => {
      toast.success('Stock updated')
      setF(x => ({ ...x, quantity: '', batchNo: '', expiry: '', remarks: '' }))
      qc.invalidateQueries({ queryKey: ['godown-item', row.itemId] }); qc.invalidateQueries({ queryKey: ['godown-stock'] }); qc.invalidateQueries({ queryKey: ['godowns'] })
    },
    onError: (e: any) => toast.error(apiError(e, 'The stock could not be updated')),
  })
  const needsBatchNo = row.batches && f.type === 'IN' && !f.batchId && !f.batchNo.trim()
  return (
    <Modal open onClose={onClose} title={row.itemName} subtitle={`${row.itemCode} · ${qty(data?.total ?? row.total)} ${row.unit ?? ''} in all`} size="lg">
      <div className="space-y-4" data-testid="godown-item">
        <div className="table-wrap">
          <table className="w-full text-sm">
            <thead><tr>{['Godown', ...(row.batches ? ['Batch', 'Expiry'] : []), 'Quantity'].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
            <tbody>
              {isLoading ? <tr><td className="table-cell" colSpan={4}>Loading…</td></tr>
                : (data?.places ?? []).length === 0 ? <tr><td className="table-cell" colSpan={4} style={{ color: 'var(--text-muted)' }}>None in any godown.</td></tr>
                : data!.places.map((p, i) => (
                  <tr key={i} className="table-row">
                    <td className="table-cell">{p.godownName}</td>
                    {row.batches && <><td className="table-cell font-mono text-xs">{p.batchNo ?? 'Without a batch'}</td><td className="table-cell text-xs">{fmtDate(p.expiry)}</td></>}
                    <td className="table-cell font-mono">{qty(p.quantity)} {row.unit ?? ''}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {adjuster && (
          <form className="rounded-xl p-4 space-y-3" style={{ border: '1px solid var(--border)' }} onSubmit={e => { e.preventDefault(); save.mutate() }}>
            <p className="font-semibold text-sm">Stock in or out of one godown</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select className="input h-10" aria-label="Godown" value={f.godownId} onChange={e => setF({ ...f, godownId: e.target.value, batchId: '' })}>
                {godowns.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <select className="input h-10" aria-label="In or out" value={f.type} onChange={e => setF({ ...f, type: e.target.value as 'IN' | 'OUT', batchId: '' })}>
                <option value="IN">Stock in</option><option value="OUT">Stock out</option>
              </select>
              <input className="input h-10 font-mono" type="number" min="0" step="any" placeholder="Quantity" aria-label="Quantity" value={f.quantity} onChange={e => setF({ ...f, quantity: e.target.value })} />
            </div>
            {row.batches && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select className="input h-10" aria-label="Batch" value={f.batchId} onChange={e => setF({ ...f, batchId: e.target.value })}>
                  <option value="">{f.type === 'IN' ? 'A new batch' : 'First to expire'}</option>
                  {lots.map(l => <option key={l.batchId!} value={l.batchId!}>{l.batchNo}{l.expiry ? ` · exp ${fmtDate(l.expiry)}` : ''} · {qty(l.quantity)}</option>)}
                </select>
                {f.type === 'IN' && !f.batchId && <>
                  <input className="input h-10 font-mono uppercase" maxLength={40} placeholder="Batch number" aria-label="Batch number" value={f.batchNo} onChange={e => setF({ ...f, batchNo: e.target.value })} />
                  <input className="input h-10" placeholder="Expiry, e.g. 03/2028" aria-label="Expiry" title={EXPIRY_HINT} value={f.expiry} onChange={e => setF({ ...f, expiry: e.target.value })} />
                </>}
              </div>
            )}
            {f.expiry && expiry === undefined && <p className="text-xs" style={{ color: '#b91c1c' }}>{EXPIRY_HINT}</p>}
            <input className="input h-10" maxLength={300} placeholder="Why (damaged, found in a count, opening stock…)" aria-label="Remarks" value={f.remarks} onChange={e => setF({ ...f, remarks: e.target.value })} />
            <div className="flex justify-end">
              <button className="btn-primary h-10" disabled={!f.godownId || !(Number(f.quantity) > 0) || needsBatchNo || (!!f.expiry && expiry === undefined) || save.isPending}>{save.isPending ? 'Saving…' : 'Save'}</button>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>To move stock between godowns, make a <Link href="/inventory/transfers" className="underline">transfer</Link> instead.</p>
          </form>
        )}
      </div>
    </Modal>
  )
}
