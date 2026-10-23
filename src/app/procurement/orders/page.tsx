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

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { procurementApi } from '@/lib/api/procurement'
import { DataTable } from '@/components/ui/Table'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { Modal } from '@/components/ui/Modal'
import { formatDate, apiError } from '@/lib/utils'
import { useUrlParams } from '@/lib/hooks/useUrlParams'
import { inr, todayIST } from '@/lib/money'
import { purchaseOrderTotals } from '@/lib/invoiceMath'
import { errText } from '@/lib/purchases'
import { usePermissions } from '@/lib/hooks/usePermissions'
import type { PurchaseOrder, PurchaseOrderStatus } from '@/types'
import { ItemPicker } from '@/components/inventory/ItemPicker'
import { inventoryApi } from '@/lib/api/inventory'
import { reorderQty } from '@/lib/inventory'
import { Plus, ShoppingCart, CheckCircle, Clock, FileText, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_CONFIG: Record<string,[string,string]> = {
  DRAFT:             ['var(--text-muted)',   'rgba(100,116,139,.1)'],
  SUBMITTED:         ['#3b82f6',             'rgba(59,130,246,.1)'],
  APPROVED:          ['#22c55e',             'rgba(34,197,94,.1)'],
  ORDERED:           ['#8b5cf6',             'rgba(139,92,246,.1)'],
  PARTIALLY_RECEIVED:['#f59e0b',             'rgba(245,158,11,.1)'],
  RECEIVED:          ['#22c55e',             'rgba(34,197,94,.08)'],
  CANCELLED:         ['#64748b',             'rgba(100,116,139,.1)'],
}

const STATUS_LABEL: Record<PurchaseOrderStatus, string> = {
  DRAFT: 'Draft', SUBMITTED: 'Awaiting approval', APPROVED: 'Approved', ORDERED: 'Ordered',
  PARTIALLY_RECEIVED: 'Partly received', RECEIVED: 'Received', CANCELLED: 'Cancelled',
}

/** Where an order can go next — the same rules the server enforces (PoRules.java). */
const NEXT: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['APPROVED', 'DRAFT', 'CANCELLED'],
  APPROVED: ['ORDERED', 'CANCELLED'],
  ORDERED: ['PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'],
  PARTIALLY_RECEIVED: ['RECEIVED'],
  RECEIVED: [],
  CANCELLED: [],
}

/** Who may move an order to each status (any one permission is enough). */
const MOVE_PERMS: Record<PurchaseOrderStatus, string[]> = {
  APPROVED: ['PROCUREMENT_APPROVE'],
  PARTIALLY_RECEIVED: ['PROCUREMENT_RECEIVE', 'PROCUREMENT_EDIT'],
  RECEIVED: ['PROCUREMENT_RECEIVE', 'PROCUREMENT_EDIT'],
  SUBMITTED: ['PROCUREMENT_CREATE', 'PROCUREMENT_EDIT'],
  DRAFT: ['PROCUREMENT_CREATE', 'PROCUREMENT_EDIT', 'PROCUREMENT_APPROVE'],
  ORDERED: ['PROCUREMENT_CREATE', 'PROCUREMENT_EDIT', 'PROCUREMENT_APPROVE'],
  CANCELLED: ['PROCUREMENT_CREATE', 'PROCUREMENT_EDIT', 'PROCUREMENT_APPROVE'],
}

/** The button for moving an order to a status, and what to say when it's done. */
const ACTION: Record<PurchaseOrderStatus, { label: string; done: string }> = {
  SUBMITTED: { label: 'Submit for approval', done: 'submitted for approval' },
  APPROVED: { label: 'Approve', done: 'approved' },
  DRAFT: { label: 'Send back', done: 'sent back to draft' },
  ORDERED: { label: 'Mark ordered', done: 'marked as ordered' },
  PARTIALLY_RECEIVED: { label: 'Partly received', done: 'marked partly received' },
  RECEIVED: { label: 'Received', done: 'marked received' },
  CANCELLED: { label: 'Cancel', done: 'cancelled' },
}

interface POLine { itemId?: string; description:string; hsnSacCode:string; quantity:string; unit:string; unitPrice:string; gstRate:string }
const BLANK_LINE: POLine = { description:'', hsnSacCode:'', quantity:'1', unit:'Nos', unitPrice:'', gstRate:'18' }
/** Orders whose supplier bill can be entered: approved and later, not cancelled. */
const BILLABLE: PurchaseOrderStatus[] = ['APPROVED', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED']
const BILL_STATUS: Record<string, string> = { DRAFT: 'draft', OPEN: 'recorded', PARTIAL: 'part paid', PAID: 'paid', CANCELLED: 'cancelled' }
const blankPo = () => ({ vendorId:'', vendorName:'', poDate:todayIST(), expectedDeliveryDate:'', paymentTerms:'Net 30', remarks:'' })

export default function PurchaseOrdersPage(){
  const qc = useQueryClient()
  const { can, canAny } = usePermissions()
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | ''>('')
  const [showCreate, setShowCreate] = useState(false)
  const [po, setPo] = useState(blankPo)
  const [lines, setLines] = useState<POLine[]>([{ ...BLANK_LINE }])
  const [open, setOpen] = useState<PurchaseOrder | null>(null)
  const [cancelling, setCancelling] = useState<PurchaseOrder | null>(null)
  const [reordering, setReordering] = useState(0)
  useUrlParams(p => {
    if (p.get('new') === '1') setShowCreate(true)
    // "Order these" from the items list: one line per item at or below its reorder level.
    if (p.get('reorder') === '1') inventoryApi.alerts.lowStock().then(items => {
      const ls = items.filter(i => i.trackStock !== false).map(i => ({ itemId: i.id, description: i.itemName, hsnSacCode: i.hsnSacCode ?? '',
        quantity: String(reorderQty(i)), unit: i.unit || 'Nos', unitPrice: i.purchasePrice != null ? String(Number(i.purchasePrice)) : '',
        gstRate: String(Number(i.gstRate ?? 18)) }))
      if (ls.length) { setLines(ls); setReordering(ls.length); setShowCreate(true) }
    }).catch(e => toast.error(apiError(e, 'The items to reorder could not be loaded')))
    const id = p.get('open')
    if (id) procurementApi.purchaseOrders.get(id).then(o => setOpen(o)).catch(e => toast.error(apiError(e, 'That order could not be opened')))
  })

  const {data, isLoading, isError, refetch} = useQuery({
    queryKey:['purchase-orders', page, statusFilter],
    queryFn:()=>procurementApi.purchaseOrders.list({page,size:20,status:statusFilter||undefined}),
  })
  const { data: counts } = useQuery({ queryKey: ['purchase-orders-summary'], queryFn: procurementApi.purchaseOrders.summary })

  const { data: vendorData } = useQuery({
    queryKey: ['vendors-for-po'],
    queryFn: () => procurementApi.vendors.list({ size: 100 }),
    enabled: showCreate,
  })
  const vendors = vendorData?.content ?? []

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['purchase-orders'] })
    qc.invalidateQueries({ queryKey: ['purchase-orders-summary'] })
  }

  const createPO = useMutation({
    mutationFn: () => procurementApi.purchaseOrders.create({
      vendorId: po.vendorId,
      vendorName: po.vendorName,
      poDate: po.poDate,
      expectedDeliveryDate: po.expectedDeliveryDate || undefined,
      paymentTerms: po.paymentTerms,
      remarks: po.remarks,
      lineItems: lines.filter(l => l.description && l.unitPrice).map(l => ({
        itemId: l.itemId, description: l.description, hsnSacCode: l.hsnSacCode,
        quantity: Number(l.quantity), unit: l.unit,
        unitPrice: Number(l.unitPrice), gstRate: Number(l.gstRate),
      })),
    } as any),
    onSuccess: (created) => {
      refresh()
      setShowCreate(false)
      setPo(blankPo())
      setLines([{ ...BLANK_LINE }])
      setReordering(0)
      toast.success(`${created?.poNumber ?? 'Purchase order'} saved as a draft`)
    },
    onError: (e: any) => toast.error(errText(e, "Couldn't create the purchase order")),
  })

  const move = useMutation({
    mutationFn: ({ order, to }: { order: PurchaseOrder; to: PurchaseOrderStatus }) => procurementApi.purchaseOrders.updateStatus(order.id, to),
    onSuccess: (updated, { order, to }) => {
      refresh()
      setCancelling(null)
      setOpen(o => (o && o.id === order.id ? { ...o, ...updated, status: updated?.status ?? to } : o))
      toast.success(`${order.poNumber} ${ACTION[to].done}`)
    },
    onError: (e: any) => toast.error(errText(e, "Couldn't update the purchase order")),
  })

  // The open order in full: its lines with their items, and the supplier bills entered for it.
  const { data: openFull } = useQuery({ queryKey: ['purchase-order', open?.id], queryFn: () => procurementApi.purchaseOrders.get(open!.id), enabled: !!open })
  const openBills = openFull?.id === open?.id ? (openFull?.bills ?? []) : []
  const canBill = canAny('PROCUREMENT_CREATE', 'FINANCE_CREATE')

  const actionsFor = (o: PurchaseOrder) => (NEXT[o.status] ?? []).filter(to => canAny(...MOVE_PERMS[to]))
  const go = (o: PurchaseOrder, to: PurchaseOrderStatus) => (to === 'CANCELLED' ? setCancelling(o) : move.mutate({ order: o, to }))

  const addLine = () => setLines(ls => [...ls, { ...BLANK_LINE }])
  const removeLine = (i: number) => setLines(ls => ls.filter((_, idx) => idx !== i))
  const updateLine = (i: number, k: keyof POLine, v: string) =>
    setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [k]: v } : l))

  const filled = lines.filter(l => l.description && l.unitPrice)
  const totals = purchaseOrderTotals(filled.map(l => ({ quantity: l.quantity || '0', unitPrice: l.unitPrice || '0', gstRate: l.gstRate || '0' })))

  const submitPO = () => {
    if (!po.vendorId) return toast.error('Select a vendor')
    if (!filled.length) return toast.error('Add at least one line with a description and price')
    if (filled.some(l => !(Number(l.quantity) > 0) || !(Number(l.unitPrice) > 0))) return toast.error('Quantities and prices must be more than zero')
    if (po.expectedDeliveryDate && po.expectedDeliveryDate < po.poDate) return toast.error('Expected delivery can’t be before the PO date')
    createPO.mutate()
  }

  const n = (k: PurchaseOrderStatus) => counts?.[k] ?? 0
  const summary = [
    { label: 'Drafts', val: n('DRAFT'), icon: FileText, color: '#64748b' },
    { label: 'Awaiting approval', val: n('SUBMITTED'), icon: Clock, color: '#f59e0b' },
    { label: 'Open with suppliers', val: n('APPROVED') + n('ORDERED') + n('PARTIALLY_RECEIVED'), icon: ShoppingCart, color: '#8b5cf6' },
    { label: 'Received', val: n('RECEIVED'), icon: CheckCircle, color: '#22c55e' },
  ]
  const total = counts ? Object.values(counts).reduce((a, b) => a + (Number(b) || 0), 0) : undefined

  const columns = [
    {header:'PO Number', render:(p:PurchaseOrder)=>(
      <span className="font-mono text-sm font-semibold whitespace-nowrap" style={{color:'var(--gold)'}}>{p.poNumber}</span>
    )},
    {header:'Vendor', render:(p:PurchaseOrder)=>(
      <div>
        <p className="font-semibold text-sm">{p.vendorName}</p>
        <p className="text-xs" style={{color:'var(--text-muted)'}}>{formatDate(p.poDate)}</p>
      </div>
    )},
    {header:'Delivery', render:(p:PurchaseOrder)=>(
      <span className="text-xs">{p.expectedDeliveryDate?formatDate(p.expectedDeliveryDate):'—'}</span>
    )},
    {header:'Amount', render:(p:PurchaseOrder)=>(
      <div>
        <p className="font-mono text-sm font-semibold">{inr(p.totalAmount)}</p>
        <p className="text-xs" style={{color:'var(--text-muted)'}}>incl. {inr(p.taxAmount)} GST</p>
      </div>
    )},
    {header:'Status', render:(p:PurchaseOrder)=><StatusBadge status={p.status} label={STATUS_LABEL[p.status]}/>},
    {header:'Next step', render:(p:PurchaseOrder)=>{
      const acts = actionsFor(p)
      if (!acts.length) return <span className="text-xs" style={{color:'var(--text-muted)'}}>—</span>
      return (
        <div className="flex flex-wrap gap-1.5" onClick={e => e.stopPropagation()}>
          {acts.map(to => (
            <button key={to} type="button" disabled={move.isPending}
              className={to === 'CANCELLED' ? 'btn-ghost h-7 px-2 text-xs' : 'btn-secondary h-7 px-2 text-xs'}
              style={to === 'CANCELLED' ? { color: 'var(--danger, #ef4444)' } : undefined}
              aria-label={`${ACTION[to].label}: ${p.poNumber}`}
              onClick={() => go(p, to)}>
              {ACTION[to].label}
            </button>
          ))}
        </div>
      )
    }},
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Purchase Orders</h1>
          <p className="text-sm mt-0.5" style={{color:'var(--text-muted)'}}>Draft → approval → order → receipt</p>
        </div>
        {can('PROCUREMENT_CREATE') && (
          <button className="btn-primary h-9 text-sm" onClick={()=>setShowCreate(true)}>
            <Plus className="w-4 h-4"/>Create PO
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summary.map(s=>(
          <div key={s.label} className="card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:`${s.color}15`}}>
              <s.icon className="w-5 h-5" style={{color:s.color}} aria-hidden/>
            </div>
            <div>
              <p className="font-serif text-2xl" style={{color:'var(--text-primary)'}}>{counts ? s.val : '—'}</p>
              <p className="text-xs" style={{color:'var(--text-muted)'}}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {(['','DRAFT','SUBMITTED','APPROVED','ORDERED','PARTIALLY_RECEIVED','RECEIVED','CANCELLED'] as const).map(s=>(
          <button key={s} onClick={()=>{ setStatusFilter(s); setPage(0) }} aria-pressed={statusFilter===s}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{background:statusFilter===s?`${STATUS_CONFIG[s]?.[1]??'var(--gold-muted)'}`:'var(--bg-hover)',
                    color:statusFilter===s?(STATUS_CONFIG[s]?.[0]??'var(--gold)'):'var(--text-muted)',
                    border:`1px solid ${statusFilter===s?'var(--border-strong)':'var(--border)'}`}}>
            {s ? STATUS_LABEL[s] : 'All'}
            {counts && <span style={{opacity:.7}}> · {s ? n(s) : total}</span>}
          </button>
        ))}
      </div>

      {isError ? (
        <div className="card flex items-center justify-between gap-3" role="alert">
          <p className="text-sm" style={{color:'var(--text-secondary)'}}>Couldn&apos;t load purchase orders.</p>
          <button className="btn-secondary h-8" onClick={()=>refetch()}>Try again</button>
        </div>
      ) : (
        <DataTable columns={columns} data={data?.content??[]} loading={isLoading}
          keyExtractor={p=>p.id} onRowClick={setOpen}
          emptyMessage={statusFilter ? `No purchase orders ${STATUS_LABEL[statusFilter].toLowerCase()}` : 'No purchase orders yet'}
          empty={statusFilter ? undefined : (
            <EmptyState compact icon={ShoppingCart} title="No purchase orders yet"
              description="Raise an order, send it for approval, and mark the goods received when they arrive. The supplier's bill then goes under Bills & expenses."
              action={can('PROCUREMENT_CREATE') ? { label: 'Create a purchase order', onClick: () => setShowCreate(true) } : undefined} />
          )}/>
      )}
      {data&&<Pagination currentPage={data.currentPage} totalPages={data.totalPages}
        onPageChange={setPage} totalElements={data.totalElements} pageSize={20}/>}

      {/* One order: its lines and what can happen next */}
      <Modal open={!!open} onClose={()=>setOpen(null)} size="lg"
        title={open ? `${open.poNumber} · ${open.vendorName}` : ''}
        subtitle={open ? `${formatDate(open.poDate)} · ${STATUS_LABEL[open.status]}${open.expectedDeliveryDate ? ` · delivery by ${formatDate(open.expectedDeliveryDate)}` : ''}` : ''}>
        {open && (
          <div className="space-y-4">
            <div className="table-wrap">
              <table className="w-full border-collapse text-sm">
                <thead><tr>
                  <th className="table-header">Item</th><th className="table-header text-right">Qty</th>
                  <th className="table-header text-right">Rate</th><th className="table-header text-right">GST</th>
                  <th className="table-header text-right">Amount</th>
                </tr></thead>
                <tbody>
                  {(open.lineItems ?? []).map((l, i) => (
                    <tr key={l.id ?? i} className="table-row">
                      <td className="table-cell">{l.description}{l.hsnSacCode ? <span className="text-xs" style={{color:'var(--text-muted)'}}> · HSN {l.hsnSacCode}</span> : null}</td>
                      <td className="table-cell text-right">{Number(l.quantity)} {l.unit}</td>
                      <td className="table-cell text-right font-mono">{inr(l.unitPrice)}</td>
                      <td className="table-cell text-right">{Number(l.gstRate ?? 0)}%</td>
                      <td className="table-cell text-right font-mono">{inr(l.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-sm text-right space-y-0.5">
              <p style={{color:'var(--text-muted)'}}>Before GST <span className="font-mono">{inr(open.subtotal)}</span></p>
              <p style={{color:'var(--text-muted)'}}>GST <span className="font-mono">{inr(open.taxAmount)}</span></p>
              <p className="font-semibold">Total <span className="font-mono">{inr(open.totalAmount)}</span></p>
            </div>
            {(open.paymentTerms || open.remarks) && (
              <p className="text-xs" style={{color:'var(--text-muted)'}}>
                {open.paymentTerms ? `Payment terms: ${open.paymentTerms}` : ''}{open.paymentTerms && open.remarks ? ' · ' : ''}{open.remarks ?? ''}
              </p>
            )}
            {openBills.length > 0 && (
              <div className="text-sm">
                <p className="font-semibold mb-1">Supplier bills for this order</p>
                <ul className="space-y-1">
                  {openBills.map(b => (
                    <li key={b.id} className="flex items-center justify-between gap-3">
                      <Link href={`/purchases/bills/${b.id}`} className="font-mono text-xs underline" style={{ color: 'var(--gold)' }}>{b.referenceNumber}</Link>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{b.billNumber ? `their no. ${b.billNumber} · ` : ''}{formatDate(b.billDate)} · {BILL_STATUS[b.status] ?? b.status.toLowerCase()}</span>
                      <span className="font-mono text-xs">{inr(b.totalAmount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {BILLABLE.includes(open.status) && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2.5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <p className="text-xs" style={{color:'var(--text-muted)'}}>
                  {openBills.some(b => b.status !== 'CANCELLED') ? 'Bill recorded. Enter another if the supplier billed in parts.' : 'When the supplier’s invoice arrives, record it from this order — its lines are filled in, and recording it brings the items into stock.'}
                </p>
                {canBill && <Link href={`/purchases/bills/new?fromPo=${open.id}`} className="btn-secondary h-9 text-sm">Record the supplier&apos;s bill</Link>}
              </div>
            )}
            {actionsFor(open).length > 0 && (
              <div className="flex flex-wrap justify-end gap-2 pt-3" style={{borderTop:'1px solid var(--border)'}}>
                {actionsFor(open).map(to => (
                  <button key={to} type="button" disabled={move.isPending}
                    className={to === 'CANCELLED' ? 'btn-ghost h-9' : 'btn-secondary h-9'}
                    style={to === 'CANCELLED' ? { color: 'var(--danger, #ef4444)' } : undefined}
                    onClick={() => go(open, to)}>
                    {ACTION[to].label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={!!cancelling} onClose={()=>setCancelling(null)} size="sm"
        title={cancelling ? `Cancel ${cancelling.poNumber}?` : ''}
        subtitle="A cancelled order can't be reopened. You can create a new one later.">
        {cancelling && (
          <div className="flex justify-end gap-2">
            <button className="btn-secondary h-9" onClick={()=>setCancelling(null)}>Keep it</button>
            <button className="btn-primary h-9" disabled={move.isPending}
              style={{ background: 'var(--danger, #ef4444)' }}
              onClick={()=>move.mutate({ order: cancelling, to: 'CANCELLED' })}>
              {move.isPending ? 'Cancelling…' : 'Cancel order'}
            </button>
          </div>
        )}
      </Modal>

      {showCreate && (
        <div className="modal-overlay" onClick={()=>setShowCreate(false)}>
          <div className="modal-content" style={{ maxWidth:'720px' }} onClick={(e: any) =>e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Create Purchase Order</h3>
            {reordering > 0 && (
              <p className="text-sm rounded-xl px-3 py-2.5 mb-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                Filled in from the {reordering} item{reordering === 1 ? '' : 's'} at or below the reorder level. Each quantity brings the item to twice its reorder level (at least its minimum order) — choose the supplier and adjust as needed.
              </p>
            )}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="label label-required" htmlFor="po-vendor">Vendor</label>
                <select id="po-vendor" className="input h-10" value={po.vendorId}
                  onChange={e=>{
                    const v = vendors.find((x:any)=>x.id===e.target.value)
                    setPo(p=>({...p, vendorId:e.target.value, vendorName:v?.name ?? ''}))
                  }}>
                  <option value="">Select vendor…</option>
                  {vendors.map((v:any)=><option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="po-date">PO Date</label>
                <input id="po-date" type="date" className="input h-10" value={po.poDate}
                  onChange={e=>setPo(p=>({...p, poDate:e.target.value}))}/>
              </div>
              <div>
                <label className="label" htmlFor="po-delivery">Expected Delivery</label>
                <input id="po-delivery" type="date" className="input h-10" value={po.expectedDeliveryDate} min={po.poDate}
                  onChange={e=>setPo(p=>({...p, expectedDeliveryDate:e.target.value}))}/>
              </div>
              <div>
                <label className="label" htmlFor="po-terms">Payment Terms</label>
                <input id="po-terms" className="input h-10" value={po.paymentTerms}
                  onChange={e=>setPo(p=>({...p, paymentTerms:e.target.value}))}/>
              </div>
            </div>

            <label className="label">Line Items</label>
            <div className="space-y-2 mb-3">
              {lines.map((l,i)=>(
                <div key={i} className="flex gap-2 items-center">
                  <div className="flex-1 min-w-0">
                    <ItemPicker value={l.description} price="purchase" placeholder="Item or description" label={`Line ${i+1} description`} inputClassName="input h-9"
                      onChange={v=>updateLine(i,'description',v)}
                      onPick={it=>setLines(ls=>ls.map((x,idx)=>idx===i ? { ...x, itemId: it.id, description: it.itemName, hsnSacCode: it.hsnSacCode ?? '',
                        unit: it.unit || x.unit, unitPrice: it.purchasePrice != null ? String(it.purchasePrice) : x.unitPrice, gstRate: String(it.gstRate ?? x.gstRate) } : x))}/>
                  </div>
                  <input className="input h-9 w-16" placeholder="Qty" aria-label={`Line ${i+1} quantity`} type="number" min="0" step="any" value={l.quantity}
                    onChange={e=>updateLine(i,'quantity',e.target.value)}/>
                  <input className="input h-9 w-20" placeholder="Unit" aria-label={`Line ${i+1} unit`} value={l.unit}
                    onChange={e=>updateLine(i,'unit',e.target.value)}/>
                  <input className="input h-9 w-24" placeholder="Price" aria-label={`Line ${i+1} price`} type="number" min="0" step="0.01" value={l.unitPrice}
                    onChange={e=>updateLine(i,'unitPrice',e.target.value)}/>
                  <input className="input h-9 w-16" placeholder="GST%" aria-label={`Line ${i+1} GST rate`} type="number" min="0" max="40" step="0.01" value={l.gstRate}
                    onChange={e=>updateLine(i,'gstRate',e.target.value)}/>
                  <button className="btn-icon w-8 h-8" aria-label={`Remove line ${i+1}`} onClick={()=>removeLine(i)} disabled={lines.length===1}>
                    <Trash2 size={13}/>
                  </button>
                </div>
              ))}
            </div>
            <button className="btn-ghost text-xs h-8 mb-3" onClick={addLine}><Plus size={13}/> Add line item
            </button>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3" style={{ borderTop:'1px solid var(--border)' }}>
              <p className="text-sm" style={{ color:'var(--text-muted)' }}>
                {inr(totals.subtotal)} + GST {inr(totals.tax)} = <b style={{ color:'var(--text-primary)' }}>{inr(totals.total)}</b>
              </p>
              <div className="flex gap-2">
                <button className="btn-secondary h-10" onClick={()=>setShowCreate(false)}>Cancel</button>
                <button className="btn-primary h-10" onClick={submitPO} disabled={createPO.isPending}>
                  {createPO.isPending ? 'Saving…' : 'Save as draft'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
