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

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { AlertTriangle, ArrowLeftRight, Boxes, Download, FileUp, History, Pencil, Plus } from 'lucide-react'
import { inventoryApi } from '@/lib/api/inventory'
import { DataTable } from '@/components/ui/Table'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { SearchInput } from '@/components/ui/SearchInput'
import { Pagination } from '@/components/ui/Pagination'
import { Modal } from '@/components/ui/Modal'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useDebounce } from '@/lib/hooks'
import { useUrlParams } from '@/lib/hooks/useUrlParams'
import { exportToCsv } from '@/lib/utils'
import { GST_RATE_OPTIONS, inr } from '@/lib/money'
import { UNITS, qty } from '@/lib/inventory'
import { errText } from '@/lib/purchases'
import type { InventoryItem, InventoryItemInput } from '@/types'

type Form = { itemCode: string; itemName: string; category: string; hsnSacCode: string; unit: string; purchasePrice: string
  sellingPrice: string; gstRate: string; reorderLevel: string; description: string; active: boolean; openingStock: string
  /** null: decided by the HSN/SAC code (services, SAC 99…, keep no stock) until the box is ticked or cleared */
  trackStock: boolean | null }

const BLANK: Form = { itemCode: '', itemName: '', category: '', hsnSacCode: '', unit: 'NOS', purchasePrice: '', sellingPrice: '',
  gstRate: '18', reorderLevel: '', description: '', active: true, openingStock: '', trackStock: null }

/** Whether the form keeps stock: the choice made, or else goods yes and services (SAC 99…) no. */
const keepsStock = (f: Form) => f.trackStock ?? !f.hsnSacCode.trim().startsWith('99')

const num = (s: string) => (s.trim() === '' ? null : Number(s))

export default function InventoryItemsPage() {
  const qc = useQueryClient()
  const { canAny } = usePermissions()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [editing, setEditing] = useState<InventoryItem | 'new' | null>(null)
  const [moving, setMoving] = useState<InventoryItem | null>(null)
  const q = useDebounce(search, 300)
  useUrlParams(p => {
    if (p.get('q')) setSearch(p.get('q')!)
    if (p.get('new') === '1' && canAny('INVENTORY_CREATE', 'INVENTORY_ADMIN')) setEditing('new')
  })

  const { data, isLoading } = useQuery({
    queryKey: ['inv-items', page, q, category],
    queryFn: () => inventoryApi.items.list({ page, size: 20, q: q || undefined, category: category || undefined }),
  })
  const { data: alerts } = useQuery({ queryKey: ['low-stock'], queryFn: inventoryApi.alerts.lowStock })
  const { data: summary } = useQuery({ queryKey: ['stock-summary'], queryFn: inventoryApi.summary })
  // Categories seen so far, for the filter and the form.
  useEffect(() => {
    const seen = (data?.content ?? []).map(i => i.category).filter((c): c is string => !!c)
    if (seen.length) setCategories(prev => Array.from(new Set([...prev, ...seen])).sort((a, b) => a.localeCompare(b)))
  }, [data])

  const canMove = canAny('INVENTORY_ADJUST', 'INVENTORY_ADMIN')
  const canEdit = canAny('INVENTORY_EDIT', 'INVENTORY_ADMIN')
  const low = (i: InventoryItem) => Number(i.reorderLevel) > 0 && Number(i.currentStock) <= Number(i.reorderLevel)

  const columns = [
    { header: 'Item', render: (i: InventoryItem) => (
      <div>
        <p className="font-semibold text-sm">{i.itemName}</p>
        <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{i.itemCode}{i.hsnSacCode ? ` · ${i.hsnSacCode.startsWith('99') ? 'SAC' : 'HSN'} ${i.hsnSacCode}` : ''}</p>
      </div>
    ) },
    { header: 'Category', render: (i: InventoryItem) => <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{i.category || '—'}</span> },
    { header: 'GST', render: (i: InventoryItem) => <span className="font-mono text-xs">{Number(i.gstRate)}%</span> },
    { header: 'Purchase price', render: (i: InventoryItem) => <span className="font-mono text-sm">{i.purchasePrice == null ? '—' : inr(i.purchasePrice)}</span> },
    { header: 'Selling price', render: (i: InventoryItem) => <span className="font-mono text-sm font-semibold">{i.sellingPrice == null ? '—' : inr(i.sellingPrice)}</span> },
    { header: 'In stock', render: (i: InventoryItem) => i.trackStock === false && Number(i.currentStock) === 0 ? (
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No stock kept</span>
    ) : (
      <span className="inline-flex items-center gap-1.5 font-mono text-sm font-semibold" style={{ color: low(i) || Number(i.currentStock) < 0 ? '#dc2626' : 'var(--text-primary)' }}>
        {qty(i.currentStock)} <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>{i.unit}</span>
        {Number(i.currentStock) < 0
          ? <span className="inline-flex items-center gap-0.5 text-xs font-sans" title="More was sold than the stock records show — record the stock received, or correct it after a count"><AlertTriangle className="w-3.5 h-3.5" aria-hidden />below zero</span>
          : low(i) && <span className="inline-flex items-center gap-0.5 text-xs font-sans"><AlertTriangle className="w-3.5 h-3.5" aria-hidden />low</span>}
      </span>
    ) },
    { header: 'Reorder at', render: (i: InventoryItem) => <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{Number(i.reorderLevel) > 0 ? `${qty(i.reorderLevel)} ${i.unit}` : '—'}</span> },
    { header: 'Status', render: (i: InventoryItem) => <Badge variant={i.active ? 'success' : 'default'}>{i.active ? 'Active' : 'Inactive'}</Badge> },
    { header: '', render: (i: InventoryItem) => (
      <div className="flex items-center justify-end gap-1">
        {canMove && i.trackStock !== false && <button className="btn-icon w-8 h-8" aria-label={`Stock in or out for ${i.itemName}`} title="Stock in / out" onClick={() => setMoving(i)}><ArrowLeftRight size={14} /></button>}
        <Link className="btn-icon w-8 h-8" aria-label={`Stock ledger of ${i.itemName}`} title="Stock ledger" href={`/inventory/stock?item=${i.id}`}><History size={14} /></Link>
        {canEdit && <button className="btn-icon w-8 h-8" aria-label={`Edit ${i.itemName}`} title="Edit" onClick={() => setEditing(i)}><Pencil size={14} /></button>}
      </div>
    ) },
  ]

  const exportCsv = () => exportToCsv('inventory-items', (data?.content ?? []).map(i => ({
    Code: i.itemCode, Name: i.itemName, Category: i.category ?? '', 'HSN/SAC': i.hsnSacCode ?? '', Unit: i.unit, 'GST %': i.gstRate,
    'Purchase price': i.purchasePrice ?? '', 'Selling price': i.sellingPrice ?? '', 'In stock': i.currentStock, 'Reorder level': i.reorderLevel,
  })))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Items and stock</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {data?.totalElements ?? 0} items{(alerts?.length ?? 0) > 0 ? ` · ${alerts?.length} at or below reorder level` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn-secondary h-9 text-sm" onClick={exportCsv} disabled={!data?.content?.length}><Download className="w-4 h-4" />Export</button>
          <Link href="/inventory/stock" className="btn-secondary h-9 text-sm"><History className="w-4 h-4" />Stock ledger</Link>
          <PermissionGate anyOf={['INVENTORY_CREATE', 'INVENTORY_ADMIN']}>
            <Link href="/import?kind=items" className="btn-secondary h-9 text-sm"><FileUp className="w-4 h-4" />Import</Link>
            <button onClick={() => setEditing('new')} className="btn-primary h-9 text-sm"><Plus className="w-4 h-4" />Add item</button>
          </PermissionGate>
        </div>
      </div>

      {summary && summary.items > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Stock value (at purchase price)', val: inr(summary.stockValue), tone: 'var(--text-primary)' },
            { label: 'Items keeping stock', val: `${summary.tracked} of ${summary.items}`, tone: 'var(--text-primary)' },
            { label: 'At or below reorder level', val: String(summary.lowStock), tone: summary.lowStock > 0 ? '#dc2626' : 'var(--text-primary)' },
            { label: 'Below zero', val: String(summary.belowZero), tone: summary.belowZero > 0 ? '#dc2626' : 'var(--text-primary)', hint: 'Sold more than the records show — record stock received, or correct after a count' },
          ].map(t => (
            <div key={t.label} className="card" title={t.hint}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.label}</p>
              <p className="text-xl font-semibold mt-1 font-mono" style={{ color: t.tone }}>{t.val}</p>
            </div>
          ))}
        </div>
      )}

      {(alerts?.length ?? 0) > 0 && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.18)' }}>
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" aria-hidden />
          <p className="text-sm flex-1 min-w-0" style={{ color: 'var(--text-primary)' }}>
            <strong>{alerts?.length} item{alerts?.length === 1 ? '' : 's'}</strong> at or below the reorder level: {alerts?.slice(0, 4).map(a => a.itemName).join(', ')}{(alerts?.length ?? 0) > 4 ? '…' : ''}
          </p>
          {canAny('PROCUREMENT_CREATE', 'PROCUREMENT_EDIT') && (
            <Link href="/procurement/orders?new=1&reorder=1" className="btn-secondary h-9 text-sm">Order these</Link>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(0) }} placeholder="Search by name or code…" className="w-72" />
        {categories.length > 0 && (
          <select className="input h-9 text-sm w-48" value={category} onChange={e => { setCategory(e.target.value); setPage(0) }} aria-label="Category">
            <option value="">All categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      <DataTable columns={columns} data={data?.content ?? []} loading={isLoading} keyExtractor={i => i.id}
        emptyMessage="No items match."
        empty={q || category ? undefined : (
          <EmptyState compact icon={Boxes} title="No items yet"
            description="Add what you sell or keep in stock, with its HSN code and GST rate — invoices then fill in prices and tax for you, stock moves with your invoices and bills, and low stock is flagged."
            action={canAny('INVENTORY_CREATE', 'INVENTORY_ADMIN') ? { label: 'Add an item', onClick: () => setEditing('new') } : undefined}
            secondary={canAny('INVENTORY_CREATE', 'INVENTORY_ADMIN') ? { label: 'Import from Excel', href: '/import?kind=items' } : undefined} />
        )} />
      {data && <Pagination currentPage={data.currentPage} totalPages={data.totalPages} onPageChange={setPage} totalElements={data.totalElements} pageSize={20} />}

      {editing && <ItemModal item={editing === 'new' ? null : editing} categories={categories} onClose={() => setEditing(null)}
        onSaved={() => { qc.invalidateQueries({ queryKey: ['inv-items'] }); qc.invalidateQueries({ queryKey: ['low-stock'] }); qc.invalidateQueries({ queryKey: ['stock-summary'] }); setEditing(null) }} />}
      {moving && <MoveModal item={moving} onClose={() => setMoving(null)}
        onSaved={() => { qc.invalidateQueries({ queryKey: ['inv-items'] }); qc.invalidateQueries({ queryKey: ['low-stock'] }); qc.invalidateQueries({ queryKey: ['stock-summary'] }); qc.invalidateQueries({ queryKey: ['stock-ledger'] }); setMoving(null) }} />}
    </div>
  )
}

function ItemModal({ item, categories, onClose, onSaved }: { item: InventoryItem | null; categories: string[]; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<Form>(() => item ? {
    itemCode: item.itemCode ?? '', itemName: item.itemName ?? '', category: item.category ?? '', hsnSacCode: item.hsnSacCode ?? '',
    unit: item.unit ?? 'NOS', purchasePrice: item.purchasePrice == null ? '' : String(item.purchasePrice),
    sellingPrice: item.sellingPrice == null ? '' : String(item.sellingPrice), gstRate: String(Number(item.gstRate ?? 0)),
    reorderLevel: Number(item.reorderLevel) ? String(item.reorderLevel) : '', description: item.description ?? '', active: item.active !== false, openingStock: '',
    trackStock: item.trackStock !== false,
  } : { ...BLANK })
  const set = (k: keyof Form, v: string | boolean) => setF(p => ({ ...p, [k]: v }))
  const keeps = keepsStock(f)
  const save = useMutation({
    mutationFn: () => {
      const body: InventoryItemInput = {
        itemCode: f.itemCode.trim() || undefined, itemName: f.itemName.trim(), category: f.category.trim() || undefined,
        hsnSacCode: f.hsnSacCode.trim() || undefined, unit: f.unit, purchasePrice: num(f.purchasePrice), sellingPrice: num(f.sellingPrice),
        gstRate: Number(f.gstRate), reorderLevel: num(f.reorderLevel), description: f.description.trim() || undefined,
        trackStock: keeps,
        ...(item ? { active: f.active } : { openingStock: keeps ? num(f.openingStock) : null }),
      }
      return item ? inventoryApi.items.update(item.id, body) : inventoryApi.items.create(body)
    },
    onSuccess: i => { toast.success(item ? 'Item saved' : `${i.itemName} added${Number(i.currentStock) > 0 ? ` with ${qty(i.currentStock)} ${i.unit} in stock` : ''}`); onSaved() },
    onError: (e: any) => toast.error(errText(e, 'The item could not be saved')),
  })
  const problem = !f.itemName.trim() ? 'Enter the item name.'
    : [f.purchasePrice, f.sellingPrice, f.reorderLevel, f.openingStock].some(v => v.trim() !== '' && !(Number(v) >= 0)) ? 'Prices and quantities must be numbers, not below zero.'
    : f.hsnSacCode.trim() && !/^\d{4}(\d{2}){0,2}$/.test(f.hsnSacCode.trim()) ? 'HSN/SAC codes have 4, 6 or 8 digits.' : null
  const unitKnown = UNITS.some(u => u.value === f.unit)
  return (
    <Modal open onClose={onClose} title={item ? `Edit ${item.itemName}` : 'Add an item'} subtitle={item ? 'Stock changes through stock in / out, not here.' : 'A product you buy or sell, or a service.'}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label label-required">Item name</label><input className="input h-10" value={f.itemName} maxLength={200} onChange={e => set('itemName', e.target.value)} autoFocus /></div>
          <div><label className="label">Item code</label><input className="input h-10 font-mono" value={f.itemCode} maxLength={30} onChange={e => set('itemCode', e.target.value)} placeholder={item ? '' : 'Left blank: ITM-0001…'} /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><label className="label">HSN / SAC</label><input className="input h-10 font-mono" inputMode="numeric" value={f.hsnSacCode} maxLength={8} onChange={e => set('hsnSacCode', e.target.value.replace(/\D/g, ''))} placeholder="e.g. 8302" /></div>
          <div><label className="label">Unit</label>
            <select className="input h-10" value={f.unit} onChange={e => set('unit', e.target.value)}>
              {!unitKnown && <option value={f.unit}>{f.unit}</option>}
              {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select></div>
          <div><label className="label">GST rate</label>
            <select className="input h-10" value={f.gstRate} onChange={e => set('gstRate', e.target.value)}>
              {!GST_RATE_OPTIONS.some(o => o.value === f.gstRate) && <option value={f.gstRate}>{f.gstRate}%</option>}
              {GST_RATE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><label className="label">Purchase price (₹)</label><input className="input h-10" type="number" step="0.01" min="0" value={f.purchasePrice} onChange={e => set('purchasePrice', e.target.value)} /></div>
          <div><label className="label">Selling price (₹)</label><input className="input h-10" type="number" step="0.01" min="0" value={f.sellingPrice} onChange={e => set('sellingPrice', e.target.value)} /></div>
          <div><label className="label">Reorder level</label><input className="input h-10" type="number" step="any" min="0" value={f.reorderLevel} onChange={e => set('reorderLevel', e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">Category</label>
            <input className="input h-10" list="item-categories" value={f.category} maxLength={100} onChange={e => set('category', e.target.value)} />
            <datalist id="item-categories">{categories.map(c => <option key={c} value={c} />)}</datalist></div>
          {item ? (
            <label className="flex items-center gap-2 text-sm mt-7"><input type="checkbox" checked={f.active} onChange={e => set('active', e.target.checked)} />Active (offered on invoices and orders)</label>
          ) : keeps ? (
            <div><label className="label">Opening stock ({f.unit})</label><input className="input h-10" type="number" step="any" min="0" value={f.openingStock} onChange={e => set('openingStock', e.target.value)} placeholder="Quantity in hand today" /></div>
          ) : <div />}
        </div>
        <label className="flex items-start gap-2 text-sm cursor-pointer">
          <input type="checkbox" className="mt-0.5" checked={keeps} onChange={e => setF(p => ({ ...p, trackStock: e.target.checked }))} />
          <span>Keep stock for this item
            <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>Invoices take it out of stock and supplier bills bring it in. Leave it off for services{f.trackStock === null && f.hsnSacCode.trim().startsWith('99') ? ' — a SAC code, so off' : ''}.</span>
          </span>
        </label>
        <div><label className="label">Description</label><textarea className="input resize-none" rows={2} maxLength={2000} value={f.description} onChange={e => set('description', e.target.value)} /></div>
        <div className="flex items-center justify-between gap-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: problem ? '#dc2626' : 'var(--text-muted)' }}>{problem ?? ''}</p>
          <div className="flex gap-2">
            <button className="btn-secondary h-10" onClick={onClose}>Cancel</button>
            <button className="btn-primary h-10" disabled={!!problem || save.isPending} onClick={() => save.mutate()}>{save.isPending ? 'Saving…' : item ? 'Save' : 'Add item'}</button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

const MOVES = [
  { type: 'IN', label: 'Stock in', hint: 'Made in-house, received without a bill, a sample or gift' },
  { type: 'OUT', label: 'Stock out', hint: 'Used up, damaged, given away, sent for job work' },
  { type: 'ADJUSTMENT', label: 'Count correction', hint: 'After a physical count: + for extra found, − for a shortage' },
] as const

function MoveModal({ item, onClose, onSaved }: { item: InventoryItem; onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState<'IN' | 'OUT' | 'ADJUSTMENT'>('IN')
  const [q, setQ] = useState('')
  const [reference, setReference] = useState('')
  const [remarks, setRemarks] = useState('')
  const n = Number(q)
  const change = type === 'OUT' ? -Math.abs(n) : type === 'IN' ? Math.abs(n) : n
  const after = Number(item.currentStock) + (isFinite(change) ? change : 0)
  const problem = q.trim() === '' || !isFinite(n) || n === 0 ? 'Enter the quantity.'
    : type !== 'ADJUSTMENT' && n < 0 ? 'Enter the quantity without a minus sign.'
    : change < 0 && after < 0 ? (Number(item.currentStock) <= 0 ? 'There is no stock to take out.' : `Only ${qty(item.currentStock)} ${item.unit} in stock.`) : null
  const save = useMutation({
    mutationFn: () => inventoryApi.items.adjust(item.id, type === 'ADJUSTMENT' ? n : Math.abs(n), type, { reference: reference.trim() || undefined, remarks: remarks.trim() || undefined }),
    onSuccess: () => { toast.success(`${item.itemName}: ${qty(after)} ${item.unit} in stock`); onSaved() },
    onError: (e: any) => toast.error(errText(e, 'The stock could not be updated')),
  })
  return (
    <Modal open onClose={onClose} title={item.itemName} subtitle={`${qty(item.currentStock)} ${item.unit} in stock now`} size="sm">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Kind of movement">
          {MOVES.map(m => (
            <button key={m.type} role="radio" aria-checked={type === m.type} onClick={() => setType(m.type)} title={m.hint}
              className="rounded-xl px-2 py-2 text-xs font-semibold" style={{ border: `1px solid ${type === m.type ? 'var(--gold)' : 'var(--border)'}`, background: type === m.type ? 'var(--gold-muted)' : 'transparent', color: type === m.type ? 'var(--gold)' : 'var(--text-secondary)' }}>
              {m.label}
            </button>
          ))}
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{MOVES.find(m => m.type === type)?.hint}</p>
        <p className="text-xs rounded-lg px-2.5 py-2" style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>
          Sales, customer returns and supplier bills move stock by themselves when an invoice, credit note or bill is linked to this item — don&apos;t enter those here too.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label label-required">Quantity ({item.unit})</label><input className="input h-10" type="number" step="any" value={q} onChange={e => setQ(e.target.value)} autoFocus /></div>
          <div><label className="label">Reference</label><input className="input h-10" maxLength={30} value={reference} onChange={e => setReference(e.target.value)} placeholder="Challan, GRN, invoice…" /></div>
        </div>
        <div><label className="label">Note</label><input className="input h-10" maxLength={500} value={remarks} onChange={e => setRemarks(e.target.value)} /></div>
        <div className="flex items-center justify-between gap-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: problem ? '#dc2626' : 'var(--text-secondary)' }}>{problem ?? `After this: ${qty(after)} ${item.unit}`}</p>
          <div className="flex gap-2">
            <button className="btn-secondary h-10" onClick={onClose}>Cancel</button>
            <button className="btn-primary h-10" disabled={!!problem || save.isPending} onClick={() => save.mutate()}>{save.isPending ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
