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
import { AlertTriangle, ArrowLeftRight, Boxes, CalendarClock, ClipboardList, Download, FileUp, History, Pencil, Plus } from 'lucide-react'
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
import { UNITS, qty, parseExpiry, expiryText, batchNoProblem, normaliseBatch, EXPIRY_HINT, batchText } from '@/lib/inventory'
import { errText } from '@/lib/purchases'
import type { InventoryItem, InventoryItemInput, ItemBatch, BatchState } from '@/types'
import type { ItemPreset } from '@/types/industry'
import { useExtraFields, ExtraFields } from '@/components/industry/ExtraFields'
import { useIndustry } from '@/lib/hooks/useIndustry'

type Form = { itemCode: string; itemName: string; category: string; hsnSacCode: string; unit: string; purchasePrice: string
  sellingPrice: string; gstRate: string; reorderLevel: string; description: string; active: boolean; openingStock: string
  /** null: decided by the HSN/SAC code (services, SAC 99…, keep no stock) until the box is ticked or cleared */
  trackStock: boolean | null
  /** stock kept by batch and expiry; the opening stock's batch number and expiry (as typed) */
  trackBatches: boolean; openingBatchNo: string; openingExpiry: string }

const BLANK: Form = { itemCode: '', itemName: '', category: '', hsnSacCode: '', unit: 'NOS', purchasePrice: '', sellingPrice: '',
  gstRate: '18', reorderLevel: '', description: '', active: true, openingStock: '', trackStock: null,
  trackBatches: false, openingBatchNo: '', openingExpiry: '' }

/** How a batch's expiry reads, and its colour. */
const STATE: Record<BatchState, { label: string; tone: string }> = {
  EXPIRED: { label: 'Expired', tone: '#dc2626' }, EXPIRING: { label: 'Expiring soon', tone: '#d97706' },
  OK: { label: 'Good', tone: 'var(--text-secondary)' }, NO_EXPIRY: { label: 'No expiry', tone: 'var(--text-muted)' },
}

/** Whether the form keeps stock: the choice made, or else goods yes and services (SAC 99…) no. */
const keepsStock = (f: Form) => f.trackStock ?? !f.hsnSacCode.trim().startsWith('99')

const num = (s: string) => (s.trim() === '' ? null : Number(s))

export default function InventoryItemsPage() {
  const qc = useQueryClient()
  const { canAny } = usePermissions()
  const ind = useIndustry()
  const things = ind.name('/inventory/items', 'Items'), thing = ind.one('/inventory/items', 'Item')
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [editing, setEditing] = useState<InventoryItem | 'new' | null>(null)
  const [moving, setMoving] = useState<InventoryItem | null>(null)
  /** the batches that have expired or expire within 90 days, opened from the dashboard (?expiry=soon|expired) */
  const [expiryOpen, setExpiryOpen] = useState<'soon' | 'expired' | null>(null)
  const q = useDebounce(search, 300)
  useUrlParams(p => {
    if (p.get('q')) setSearch(p.get('q')!)
    const ex = p.get('expiry')
    if (ex === 'soon' || ex === 'expired') setExpiryOpen(ex)
    if (p.get('new') === '1' && canAny('INVENTORY_CREATE', 'INVENTORY_ADMIN')) setEditing('new')
  })

  const { data, isLoading } = useQuery({
    queryKey: ['inv-items', page, q, category],
    queryFn: () => inventoryApi.items.list({ page, size: 20, q: q || undefined, category: category || undefined }),
  })
  const { data: alerts } = useQuery({ queryKey: ['low-stock'], queryFn: inventoryApi.alerts.lowStock })
  const { data: summary } = useQuery({ queryKey: ['stock-summary'], queryFn: inventoryApi.summary })
  const { data: expiring } = useQuery({ queryKey: ['expiring-batches'], queryFn: () => inventoryApi.expiring(90) })
  const expired = (expiring ?? []).filter(b => b.state === 'EXPIRED'), soon = (expiring ?? []).filter(b => b.state !== 'EXPIRED')
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
        <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{i.itemCode}{i.hsnSacCode ? ` · ${i.hsnSacCode.startsWith('99') ? 'SAC' : 'HSN'} ${i.hsnSacCode}` : ''}{i.trackBatchNumbers ? <span className="font-sans"> · by batch</span> : null}</p>
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
    'By batch': i.trackBatchNumbers ? 'Yes' : 'No',
  })))
  /** The expired and soon-to-expire batches, for the supplier (returns) or a check of the shelves. */
  const exportExpiry = () => exportToCsv('expiring-batches', (expiring ?? []).map(b => ({
    [thing]: b.itemName, Code: b.itemCode ?? '', Batch: b.batchNo, Expiry: b.expiryDate, 'In stock': b.quantity, Unit: b.unit ?? '',
    'Worth at purchase price': b.value, State: b.state === 'EXPIRED' ? 'Expired' : 'Expiring within 90 days',
  })))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">{things} and stock</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {data?.totalElements ?? 0} {things.toLowerCase()}{(alerts?.length ?? 0) > 0 ? ` · ${alerts?.length} at or below reorder level` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn-secondary h-9 text-sm" onClick={exportCsv} disabled={!data?.content?.length}><Download className="w-4 h-4" />Export</button>
          <Link href="/inventory/stock" className="btn-secondary h-9 text-sm"><History className="w-4 h-4" />Stock ledger</Link>
          {ind.current?.drugRegister && canAny('INVOICE_VIEW') && (
            <Link href="/invoicing/h1-register" className="btn-secondary h-9 text-sm"><ClipboardList className="w-4 h-4" />Schedule H1 register</Link>
          )}
          <PermissionGate anyOf={['INVENTORY_CREATE', 'INVENTORY_ADMIN']}>
            <Link href="/import?kind=items" className="btn-secondary h-9 text-sm"><FileUp className="w-4 h-4" />Import</Link>
            <button onClick={() => setEditing('new')} className="btn-primary h-9 text-sm"><Plus className="w-4 h-4" />Add {thing.toLowerCase()}</button>
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

      {(expiring?.length ?? 0) > 0 && (
        <div className="rounded-xl" data-testid="expiry-panel" style={{ background: 'rgba(217,119,6,.07)', border: '1px solid rgba(217,119,6,.22)' }}>
          <div className="flex flex-wrap items-center gap-3 px-4 py-3">
            <CalendarClock className="w-4 h-4 flex-shrink-0" style={{ color: '#d97706' }} aria-hidden />
            <p className="text-sm flex-1 min-w-0" style={{ color: 'var(--text-primary)' }}>
              {expired.length > 0 && <><strong>{expired.length} batch{expired.length === 1 ? '' : 'es'} expired</strong> and still in stock{soon.length > 0 ? '; ' : '.'}</>}
              {soon.length > 0 && <><strong>{soon.length} batch{soon.length === 1 ? '' : 'es'}</strong> expire{soon.length === 1 ? 's' : ''} within 90 days.</>}
              {' '}<span style={{ color: 'var(--text-muted)' }}>Worth {inr((expiring ?? []).reduce((t, b) => t + Number(b.value), 0))} at purchase price.</span>
            </p>
            <button className="btn-secondary h-9 text-sm" aria-expanded={!!expiryOpen} onClick={() => setExpiryOpen(o => o ? null : expired.length ? 'expired' : 'soon')}>
              {expiryOpen ? 'Hide' : 'Show them'}
            </button>
            <button className="btn-secondary h-9 text-sm" onClick={exportExpiry} title="Expired and expiring batches, for the supplier or a shelf check"><Download className="w-4 h-4" />Export</button>
          </div>
          {expiryOpen && (
            <div className="px-4 pb-3 overflow-x-auto">
              <div className="flex gap-2 mb-2" role="tablist" aria-label="Which batches">
                {([['expired', `Expired (${expired.length})`], ['soon', `Within 90 days (${soon.length})`]] as const).map(([k, label]) => (
                  <button key={k} role="tab" aria-selected={expiryOpen === k} onClick={() => setExpiryOpen(k)} className="rounded-lg px-2.5 py-1 text-xs font-semibold"
                    style={{ border: `1px solid ${expiryOpen === k ? 'var(--gold)' : 'var(--border)'}`, color: expiryOpen === k ? 'var(--gold)' : 'var(--text-secondary)', background: expiryOpen === k ? 'var(--gold-muted)' : 'transparent' }}>
                    {label}
                  </button>
                ))}
              </div>
              <table className="w-full text-sm" data-testid="expiry-table">
                <thead><tr className="text-xs text-left" style={{ color: 'var(--text-muted)' }}>
                  <th className="py-1.5 pr-3 font-medium">{thing}</th><th className="py-1.5 pr-3 font-medium">Batch</th><th className="py-1.5 pr-3 font-medium">Expiry</th>
                  <th className="py-1.5 pr-3 font-medium text-right">In stock</th><th className="py-1.5 font-medium text-right">Worth</th>
                </tr></thead>
                <tbody>
                  {(expiryOpen === 'expired' ? expired : soon).map(b => (
                    <tr key={b.id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td className="py-1.5 pr-3"><Link href={`/inventory/stock?item=${b.itemId}`} className="font-medium hover:underline">{b.itemName}</Link></td>
                      <td className="py-1.5 pr-3 font-mono text-xs">{b.batchNo}</td>
                      <td className="py-1.5 pr-3 font-mono text-xs" style={{ color: STATE[b.state].tone }}>{expiryText(b.expiryDate)}</td>
                      <td className="py-1.5 pr-3 font-mono text-xs text-right">{qty(b.quantity)} {b.unit}</td>
                      <td className="py-1.5 font-mono text-xs text-right">{inr(b.value)}</td>
                    </tr>
                  ))}
                  {(expiryOpen === 'expired' ? expired : soon).length === 0 && (
                    <tr><td colSpan={5} className="py-2 text-xs" style={{ color: 'var(--text-muted)' }}>{expiryOpen === 'expired' ? 'Nothing expired is in stock.' : 'Nothing expires within 90 days.'}</td></tr>
                  )}
                </tbody>
              </table>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Expired batches can&apos;t be billed. Send them back to the supplier with a supplier credit note, or record them as stock out once disposed of.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(0) }} placeholder="Search by name, code or details…" className="w-72" />
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
          <EmptyState compact icon={Boxes} title={`No ${things.toLowerCase()} yet`}
            description="Add what you sell or keep in stock, with its HSN code and GST rate — invoices then fill in prices and tax for you, stock moves with your invoices and bills, and low stock is flagged."
            action={canAny('INVENTORY_CREATE', 'INVENTORY_ADMIN') ? { label: thing === 'Item' ? 'Add an item' : `Add a ${thing.toLowerCase()}`, onClick: () => setEditing('new') } : undefined}
            secondary={canAny('INVENTORY_CREATE', 'INVENTORY_ADMIN') ? { label: 'Import from Excel', href: '/import?kind=items' } : undefined} />
        )} />
      {data && <Pagination currentPage={data.currentPage} totalPages={data.totalPages} onPageChange={setPage} totalElements={data.totalElements} pageSize={20} />}

      {editing && <ItemModal item={editing === 'new' ? null : editing} categories={categories} thing={thing} presets={ind.current?.presets ?? []}
        batchesByDefault={!!ind.current?.batches} onClose={() => setEditing(null)}
        onSaved={() => { qc.invalidateQueries({ queryKey: ['inv-items'] }); qc.invalidateQueries({ queryKey: ['low-stock'] }); qc.invalidateQueries({ queryKey: ['stock-summary'] }); qc.invalidateQueries({ queryKey: ['expiring-batches'] }); setEditing(null) }} />}
      {moving && <MoveModal item={moving} onClose={() => setMoving(null)}
        onSaved={() => { qc.invalidateQueries({ queryKey: ['inv-items'] }); qc.invalidateQueries({ queryKey: ['low-stock'] }); qc.invalidateQueries({ queryKey: ['stock-summary'] }); qc.invalidateQueries({ queryKey: ['stock-ledger'] }); qc.invalidateQueries({ queryKey: ['expiring-batches'] }); qc.invalidateQueries({ queryKey: ['item-batches', moving.id] }); setMoving(null) }} />}
    </div>
  )
}

function ItemModal({ item, categories, thing, presets, batchesByDefault, onClose, onSaved }: { item: InventoryItem | null; categories: string[]; thing: string; presets: ItemPreset[]; batchesByDefault: boolean; onClose: () => void; onSaved: () => void }) {
  const extra = useExtraFields('ITEM', item?.id)
  const [preset, setPreset] = useState<ItemPreset | null>(null)
  /** A starting point from the sector template: category, HSN/SAC, unit and — only when checked — the GST rate. */
  const applyPreset = (name: string) => {
    const x = presets.find(p => p.name === name) ?? null
    setPreset(x)
    if (!x) return
    setF(p => ({ ...p, category: x.category || p.category, hsnSacCode: x.hsn ?? p.hsnSacCode, unit: x.unit ?? p.unit, gstRate: x.gstRate ?? p.gstRate,
      itemName: p.itemName.trim() ? p.itemName : x.name }))
  }
  const [f, setF] = useState<Form>(() => item ? {
    itemCode: item.itemCode ?? '', itemName: item.itemName ?? '', category: item.category ?? '', hsnSacCode: item.hsnSacCode ?? '',
    unit: item.unit ?? 'NOS', purchasePrice: item.purchasePrice == null ? '' : String(item.purchasePrice),
    sellingPrice: item.sellingPrice == null ? '' : String(item.sellingPrice), gstRate: String(Number(item.gstRate ?? 0)),
    reorderLevel: Number(item.reorderLevel) ? String(item.reorderLevel) : '', description: item.description ?? '', active: item.active !== false, openingStock: '',
    trackStock: item.trackStock !== false, trackBatches: !!item.trackBatchNumbers, openingBatchNo: '', openingExpiry: '',
  } : { ...BLANK, trackBatches: batchesByDefault })
  const { data: batches } = useQuery({ queryKey: ['item-batches', item?.id], queryFn: () => inventoryApi.items.batches(item!.id),
    enabled: !!item?.trackBatchNumbers })
  const set = (k: keyof Form, v: string | boolean) => setF(p => ({ ...p, [k]: v }))
  const keeps = keepsStock(f)
  const byBatch = keeps && f.trackBatches
  const opening = !item && keeps && Number(f.openingStock) > 0
  const openingExpiry = parseExpiry(f.openingExpiry)
  const save = useMutation({
    mutationFn: () => {
      const body: InventoryItemInput = {
        itemCode: f.itemCode.trim() || undefined, itemName: f.itemName.trim(), category: f.category.trim() || undefined,
        hsnSacCode: f.hsnSacCode.trim() || undefined, unit: f.unit, purchasePrice: num(f.purchasePrice), sellingPrice: num(f.sellingPrice),
        gstRate: Number(f.gstRate), reorderLevel: num(f.reorderLevel), description: f.description.trim() || undefined,
        trackStock: keeps, trackBatches: byBatch,
        ...(item ? { active: f.active } : { openingStock: keeps ? num(f.openingStock) : null }),
        ...(opening && byBatch ? { openingBatchNo: normaliseBatch(f.openingBatchNo), openingExpiry: openingExpiry ?? null } : {}),
      }
      return (item ? inventoryApi.items.update(item.id, body) : inventoryApi.items.create(body))
        .then(async i => ({ i, warn: await extra.save(i.id) }))
    },
    onSuccess: ({ i, warn }) => {
      toast.success(item ? `${thing} saved` : `${i.itemName} added${Number(i.currentStock) > 0 ? ` with ${qty(i.currentStock)} ${i.unit} in stock` : ''}`)
      if (warn) toast.error(`Saved, but not the extra details: ${warn}`)
      onSaved()
    },
    onError: (e: any) => toast.error(errText(e, 'The item could not be saved')),
  })
  const problem = !f.itemName.trim() ? 'Enter the item name.'
    : [f.purchasePrice, f.sellingPrice, f.reorderLevel, f.openingStock].some(v => v.trim() !== '' && !(Number(v) >= 0)) ? 'Prices and quantities must be numbers, not below zero.'
    : f.hsnSacCode.trim() && !/^\d{4}(\d{2}){0,2}$/.test(f.hsnSacCode.trim()) ? 'HSN/SAC codes have 4, 6 or 8 digits.'
    : opening && byBatch && batchNoProblem(f.openingBatchNo) ? `Opening stock: ${batchNoProblem(f.openingBatchNo)}`
    : opening && byBatch && openingExpiry === undefined ? EXPIRY_HINT : extra.problem()
  const unitKnown = UNITS.some(u => u.value === f.unit)
  return (
    <Modal open onClose={onClose} title={item ? `Edit ${item.itemName}` : thing === 'Item' ? 'Add an item' : `Add a ${thing.toLowerCase()}`} subtitle={item ? 'Stock changes through stock in / out, not here.' : 'A product you buy or sell, or a service.'}>
      <div className="space-y-4">
        {!item && presets.length > 0 && (
          <div data-testid="item-presets">
            <label className="label" htmlFor="item-preset">Start from</label>
            <select id="item-preset" className="input h-10" value={preset?.name ?? ''} onChange={e => applyPreset(e.target.value)}>
              <option value="">Nothing — fill it in myself</option>
              {presets.map(x => <option key={x.name} value={x.name}>{x.name}{x.gstRate != null ? ` · GST ${x.gstRate}%` : ''}</option>)}
            </select>
            {preset && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {preset.gstRate != null
                  ? <>{preset.note} (<a href={preset.source ?? '#'} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)' }}>source</a>). Check the rate for your exact item with your accountant.</>
                  : 'Category and unit filled in; choose the HSN code and GST rate for your exact item.'}
              </p>
            )}
          </div>
        )}
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
        {keeps && (
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="mt-0.5" checked={f.trackBatches} onChange={e => set('trackBatches', e.target.checked)} data-testid="track-batches" />
            <span>Keep stock by batch and expiry
              <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>
                {item?.trackBatchNumbers && !f.trackBatches
                  ? 'Its batches will no longer be kept up to date: bills and invoices stop asking for them.'
                  : 'Supplier bills say which batch comes in, with its expiry; invoices bill the first to expire, never an expired one, and print the batch and expiry.'}
              </span>
            </span>
          </label>
        )}
        {opening && byBatch && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="opening-batch">
            <div><label className="label label-required" htmlFor="opening-batch-no">Batch number of the opening stock</label>
              <input id="opening-batch-no" className="input h-10 font-mono uppercase" maxLength={40} value={f.openingBatchNo} onChange={e => set('openingBatchNo', e.target.value)} placeholder="As on the pack" /></div>
            <div><label className="label" htmlFor="opening-expiry">Expiry</label>
              <input id="opening-expiry" className="input h-10 font-mono" maxLength={10} value={f.openingExpiry} onChange={e => set('openingExpiry', e.target.value)} placeholder="MM/YYYY" />
              {openingExpiry && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Expires {expiryText(openingExpiry)}</p>}</div>
            <p className="text-xs sm:col-span-2" style={{ color: 'var(--text-muted)' }}>Stock of other batches comes in with the supplier&apos;s bill, or as stock in.</p>
          </div>
        )}
        {item?.trackBatchNumbers && (batches?.length ?? 0) > 0 && (
          <div data-testid="item-batches">
            <p className="label">Batches</p>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full text-sm">
                <thead><tr className="text-xs text-left" style={{ color: 'var(--text-muted)', background: 'var(--bg-surface)' }}>
                  <th className="px-3 py-1.5 font-medium">Batch</th><th className="px-3 py-1.5 font-medium">Expiry</th>
                  <th className="px-3 py-1.5 font-medium text-right">MRP</th><th className="px-3 py-1.5 font-medium text-right">In stock</th>
                </tr></thead>
                <tbody>{batches!.map(b => (
                  <tr key={b.id} style={{ borderTop: '1px solid var(--border)', opacity: Number(b.quantity) > 0 ? 1 : 0.6 }}>
                    <td className="px-3 py-1.5 font-mono text-xs">{b.batchNo}</td>
                    <td className="px-3 py-1.5 text-xs" style={{ color: STATE[b.state].tone }}>{b.expiryDate ? expiryText(b.expiryDate) : '—'}{b.state === 'EXPIRED' || b.state === 'EXPIRING' ? ` · ${STATE[b.state].label.toLowerCase()}` : ''}</td>
                    <td className="px-3 py-1.5 font-mono text-xs text-right">{b.mrp == null ? '—' : inr(b.mrp)}</td>
                    <td className="px-3 py-1.5 font-mono text-xs text-right">{qty(b.quantity)} {f.unit}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><ExtraFields state={extra} /></div>
        <div><label className="label">Description</label><textarea className="input resize-none" rows={2} maxLength={2000} value={f.description} onChange={e => set('description', e.target.value)} /></div>
        <div className="flex items-center justify-between gap-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: problem ? '#dc2626' : 'var(--text-muted)' }}>{problem ?? ''}</p>
          <div className="flex gap-2">
            <button className="btn-secondary h-10" onClick={onClose}>Cancel</button>
            <button className="btn-primary h-10" disabled={!!problem || save.isPending} onClick={() => save.mutate()}>{save.isPending ? 'Saving…' : item ? 'Save' : `Add ${thing.toLowerCase()}`}</button>
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
  // an item kept by batch: stock in names its batch; out and corrections say which batch ('' = stock held without one)
  const byBatch = !!item.trackBatchNumbers
  const [batchNo, setBatchNo] = useState('')
  const [expiry, setExpiry] = useState('')
  const [mrp, setMrp] = useState('')
  const [batchId, setBatchId] = useState<string | null>(null)
  const { data: batches } = useQuery({ queryKey: ['item-batches', item.id], queryFn: () => inventoryApi.items.batches(item.id), enabled: byBatch })
  const unbatched = Number(item.currentStock) - (batches ?? []).reduce((t, b) => t + Number(b.quantity), 0)
  const choices: ItemBatch[] = (batches ?? []).filter(b => type === 'ADJUSTMENT' || Number(b.quantity) > 0)
  // stock out: the first batch with stock, soonest expiry first (expired ones are what usually goes out)
  const chosenId = batchId ?? (choices[0]?.id ?? '')
  const chosen = choices.find(b => b.id === chosenId) ?? null
  const n = Number(q)
  const change = type === 'OUT' ? -Math.abs(n) : type === 'IN' ? Math.abs(n) : n
  const after = Number(item.currentStock) + (isFinite(change) ? change : 0)
  const parsedExpiry = parseExpiry(expiry)
  const knownBatch = (batches ?? []).find(b => b.batchNo === normaliseBatch(batchNo))
  const problem = q.trim() === '' || !isFinite(n) || n === 0 ? 'Enter the quantity.'
    : type !== 'ADJUSTMENT' && n < 0 ? 'Enter the quantity without a minus sign.'
    : change < 0 && after < 0 ? (Number(item.currentStock) <= 0 ? 'There is no stock to take out.' : `Only ${qty(item.currentStock)} ${item.unit} in stock.`)
    : byBatch && type === 'IN' && batchNoProblem(batchNo) ? batchNoProblem(batchNo)
    : byBatch && type === 'IN' && parsedExpiry === undefined ? EXPIRY_HINT
    : byBatch && type === 'IN' && mrp.trim() !== '' && !(Number(mrp) >= 0) ? 'The MRP must be a number, not below zero.'
    : byBatch && type === 'IN' && knownBatch?.expiryDate && parsedExpiry && knownBatch.expiryDate !== parsedExpiry
      ? `Batch ${knownBatch.batchNo} expires ${expiryText(knownBatch.expiryDate)} in your records — check the batch number or the expiry.`
    : byBatch && type !== 'IN' && chosen && change < 0 && Number(chosen.quantity) + change < 0 ? `Only ${qty(chosen.quantity)} ${item.unit} of batch ${chosen.batchNo} in stock.`
    : byBatch && type !== 'IN' && !chosen && change < 0 && unbatched + change < 0 ? `Only ${qty(Math.max(unbatched, 0))} ${item.unit} held without a batch — choose the batch.` : null
  const save = useMutation({
    mutationFn: () => inventoryApi.items.adjust(item.id, type === 'ADJUSTMENT' ? n : Math.abs(n), type, {
      reference: reference.trim() || undefined, remarks: remarks.trim() || undefined,
      ...(byBatch && type === 'IN' ? { batchNo: normaliseBatch(batchNo), expiry: parsedExpiry ?? undefined, mrp: mrp.trim() ? Number(mrp) : undefined } : {}),
      ...(byBatch && type !== 'IN' && chosen ? { batchId: chosen.id } : {}),
    }),
    onSuccess: () => { toast.success(`${item.itemName}: ${qty(after)} ${item.unit} in stock`); onSaved() },
    onError: (e: any) => toast.error(errText(e, 'The stock could not be updated')),
  })
  return (
    <Modal open onClose={onClose} title={item.itemName} subtitle={`${qty(item.currentStock)} ${item.unit} in stock now`} size="sm">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Kind of movement">
          {MOVES.map(m => (
            <button key={m.type} role="radio" aria-checked={type === m.type} onClick={() => { setType(m.type); setBatchId(null) }} title={m.hint}
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
        {byBatch && type === 'IN' && (
          <div className="grid grid-cols-3 gap-3" data-testid="move-batch-in">
            <div><label className="label label-required" htmlFor="move-batch-no">Batch</label>
              <input id="move-batch-no" className="input h-10 font-mono uppercase" maxLength={40} value={batchNo} onChange={e => setBatchNo(e.target.value)} list="move-batches" />
              <datalist id="move-batches">{(batches ?? []).map(b => <option key={b.id} value={b.batchNo}>{batchText(b, item.unit)}</option>)}</datalist></div>
            <div><label className="label" htmlFor="move-expiry">Expiry</label>
              <input id="move-expiry" className="input h-10 font-mono" maxLength={10} value={expiry} onChange={e => setExpiry(e.target.value)} placeholder={knownBatch?.expiryDate ? expiryText(knownBatch.expiryDate) : 'MM/YYYY'} /></div>
            <div><label className="label" htmlFor="move-mrp">MRP (₹)</label>
              <input id="move-mrp" className="input h-10" type="number" step="0.01" min="0" value={mrp} onChange={e => setMrp(e.target.value)} placeholder={knownBatch?.mrp != null ? String(knownBatch.mrp) : ''} /></div>
          </div>
        )}
        {byBatch && type !== 'IN' && (
          <div data-testid="move-batch-out">
            <label className="label" htmlFor="move-batch">Batch</label>
            <select id="move-batch" className="input h-10" value={chosenId} onChange={e => setBatchId(e.target.value)}>
              {choices.map(b => <option key={b.id} value={b.id}>{batchText(b, item.unit)}{b.state === 'EXPIRED' ? ' · expired' : ''}</option>)}
              {(unbatched > 0 || type === 'ADJUSTMENT' || choices.length === 0) && <option value="">Without a batch{unbatched > 0 ? ` · ${qty(unbatched)} ${item.unit}` : ''}</option>}
            </select>
          </div>
        )}
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
