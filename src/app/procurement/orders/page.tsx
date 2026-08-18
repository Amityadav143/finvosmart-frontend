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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { procurementApi } from '@/lib/api/procurement'
import { DataTable } from '@/components/ui/Table'
import { StatusBadge } from '@/components/ui/Badge'
import { SearchInput } from '@/components/ui/SearchInput'
import { Pagination } from '@/components/ui/Pagination'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { PurchaseOrder } from '@/types'
import { Plus, ShoppingCart, CheckCircle, Clock, Package, Trash2 } from 'lucide-react'
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

interface POLine { description:string; hsnSacCode:string; quantity:string; unit:string; unitPrice:string; gstRate:string }
const BLANK_LINE: POLine = { description:'', hsnSacCode:'', quantity:'1', unit:'Nos', unitPrice:'', gstRate:'18' }

export default function PurchaseOrdersPage(){
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [po, setPo] = useState({ vendorId:'', vendorName:'', poDate:new Date().toISOString().split('T')[0], expectedDeliveryDate:'', paymentTerms:'Net 30', remarks:'' })
  const [lines, setLines] = useState<POLine[]>([{ ...BLANK_LINE }])

  const {data, isLoading} = useQuery({
    queryKey:['purchase-orders', page, statusFilter],
    queryFn:()=>procurementApi.purchaseOrders.list({page,size:20,status:statusFilter||undefined}),
  })

  const { data: vendorData } = useQuery({
    queryKey: ['vendors-for-po'],
    queryFn: () => procurementApi.vendors.list({ size: 100 }),
    enabled: showCreate,
  })
  const vendors = vendorData?.content ?? []

  const createPO = useMutation({
    mutationFn: () => procurementApi.purchaseOrders.create({
      vendorId: po.vendorId,
      vendorName: po.vendorName,
      poDate: po.poDate,
      expectedDeliveryDate: po.expectedDeliveryDate || undefined,
      paymentTerms: po.paymentTerms,
      remarks: po.remarks,
      lineItems: lines.filter(l => l.description && l.unitPrice).map(l => ({
        description: l.description, hsnSacCode: l.hsnSacCode,
        quantity: Number(l.quantity), unit: l.unit,
        unitPrice: Number(l.unitPrice), gstRate: Number(l.gstRate),
      })),
    } as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] })
      setShowCreate(false)
      setPo({ vendorId:'', vendorName:'', poDate:new Date().toISOString().split('T')[0], expectedDeliveryDate:'', paymentTerms:'Net 30', remarks:'' })
      setLines([{ ...BLANK_LINE }])
      toast.success('Purchase Order created')
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to create PO'),
  })

  const addLine = () => setLines(ls => [...ls, { ...BLANK_LINE }])
  const removeLine = (i: number) => setLines(ls => ls.filter((_, idx) => idx !== i))
  const updateLine = (i: number, k: keyof POLine, v: string) =>
    setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [k]: v } : l))

  const lineTotal = lines.reduce((s, l) => s + (Number(l.quantity || 0) * Number(l.unitPrice || 0)), 0)

  const submitPO = () => {
    if (!po.vendorId) return toast.error('Select a vendor')
    if (!lines.some(l => l.description && l.unitPrice)) return toast.error('Add at least one line item')
    createPO.mutate()
  }

  const mockSummary = [
    {label:'Open POs',     val:14, icon:ShoppingCart, color:'#3b82f6'},
    {label:'Pending Appvl',val:3,  icon:Clock,        color:'#f59e0b'},
    {label:'In Transit',   val:7,  icon:Package,      color:'#8b5cf6'},
    {label:'Received',     val:31, icon:CheckCircle,  color:'#22c55e'},
  ]

  const columns = [
    {header:'PO Number', render:(p:PurchaseOrder)=>(
      <span className="font-mono text-sm font-semibold" style={{color:'var(--gold)'}}>{p.poNumber}</span>
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
        <p className="font-mono text-sm font-semibold">{formatCurrency(p.totalAmount)}</p>
        <p className="text-xs" style={{color:'var(--text-muted)'}}>+{formatCurrency(p.taxAmount)} tax</p>
      </div>
    )},
    {header:'Status', render:(p:PurchaseOrder)=><StatusBadge status={p.status}/>},
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Purchase Orders</h1>
          <p className="text-sm mt-0.5" style={{color:'var(--text-muted)'}}>Manage procurement from draft to receipt</p>
        </div>
        <button className="btn-primary h-9 text-sm" onClick={()=>setShowCreate(true)}>
          <Plus className="w-4 h-4"/>Create PO
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {mockSummary.map(s=>(
          <div key={s.label} className="card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:`${s.color}15`}}>
              <s.icon className="w-5 h-5" style={{color:s.color}}/>
            </div>
            <div>
              <p className="font-serif text-2xl" style={{color:s.color}}>{s.val}</p>
              <p className="text-xs" style={{color:'var(--text-muted)'}}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        {['','DRAFT','SUBMITTED','APPROVED','ORDERED','PARTIALLY_RECEIVED','RECEIVED','CANCELLED'].map(s=>(
          <button key={s} onClick={()=>setStatusFilter(s)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{background:statusFilter===s?`${STATUS_CONFIG[s]?.[1]??'var(--gold-muted)'}`:' var(--bg-hover)',
                    color:statusFilter===s?(STATUS_CONFIG[s]?.[0]??'var(--gold)'):'var(--text-muted)',
                    border:`1px solid ${statusFilter===s?'var(--border-strong)':'var(--border)'}`}}>
            {s||'All'}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search PO number or vendor…" className="w-72"/>
      </div>

      <DataTable columns={columns} data={data?.content??[]} loading={isLoading}
        keyExtractor={p=>p.id} emptyMessage="No purchase orders found"/>
      {data&&<Pagination currentPage={data.currentPage} totalPages={data.totalPages}
        onPageChange={setPage} totalElements={data.totalElements} pageSize={20}/>}

      {showCreate && (
        <div className="modal-overlay" onClick={()=>setShowCreate(false)}>
          <div className="modal-content" style={{ maxWidth:'720px' }} onClick={(e: any) =>e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Create Purchase Order</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="label label-required">Vendor</label>
                <select className="input h-10" value={po.vendorId}
                  onChange={e=>{
                    const v = vendors.find((x:any)=>x.id===e.target.value)
                    setPo(p=>({...p, vendorId:e.target.value, vendorName:v?.vendorName ?? v?.name ?? ''}))
                  }}>
                  <option value="">Select vendor…</option>
                  {vendors.map((v:any)=><option key={v.id} value={v.id}>{v.vendorName ?? v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">PO Date</label>
                <input type="date" className="input h-10" value={po.poDate}
                  onChange={e=>setPo(p=>({...p, poDate:e.target.value}))}/>
              </div>
              <div>
                <label className="label">Expected Delivery</label>
                <input type="date" className="input h-10" value={po.expectedDeliveryDate}
                  onChange={e=>setPo(p=>({...p, expectedDeliveryDate:e.target.value}))}/>
              </div>
              <div>
                <label className="label">Payment Terms</label>
                <input className="input h-10" value={po.paymentTerms}
                  onChange={e=>setPo(p=>({...p, paymentTerms:e.target.value}))}/>
              </div>
            </div>

            <label className="label">Line Items</label>
            <div className="space-y-2 mb-3">
              {lines.map((l,i)=>(
                <div key={i} className="flex gap-2 items-center">
                  <input className="input h-9 flex-1" placeholder="Description" value={l.description}
                    onChange={e=>updateLine(i,'description',e.target.value)}/>
                  <input className="input h-9 w-16" placeholder="Qty" type="number" value={l.quantity}
                    onChange={e=>updateLine(i,'quantity',e.target.value)}/>
                  <input className="input h-9 w-20" placeholder="Unit" value={l.unit}
                    onChange={e=>updateLine(i,'unit',e.target.value)}/>
                  <input className="input h-9 w-24" placeholder="Price" type="number" value={l.unitPrice}
                    onChange={e=>updateLine(i,'unitPrice',e.target.value)}/>
                  <input className="input h-9 w-16" placeholder="GST%" type="number" value={l.gstRate}
                    onChange={e=>updateLine(i,'gstRate',e.target.value)}/>
                  <button className="btn-icon w-8 h-8" onClick={()=>removeLine(i)} disabled={lines.length===1}>
                    <Trash2 size={13}/>
                  </button>
                </div>
              ))}
            </div>
            <button aria-label="Add" className="btn-ghost text-xs h-8 mb-3" onClick={addLine}><Plus size={13}/> Add line item
            </button>

            <div className="flex items-center justify-between pt-3" style={{ borderTop:'1px solid var(--border)' }}>
              <p className="text-sm" style={{ color:'var(--text-muted)' }}>
                Subtotal: <b style={{ color:'var(--text-primary)' }}>{formatCurrency(lineTotal)}</b> (before GST)
              </p>
              <div className="flex gap-2">
                <button className="btn-secondary h-10" onClick={()=>setShowCreate(false)}>Cancel</button>
                <button className="btn-primary h-10" onClick={submitPO} disabled={createPO.isPending}>
                  {createPO.isPending ? 'Creating…' : 'Create PO'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
