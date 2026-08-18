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
import { inventoryApi } from '@/lib/api/inventory'
import { DataTable } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { SearchInput } from '@/components/ui/SearchInput'
import { Pagination } from '@/components/ui/Pagination'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, exportToCsv } from '@/lib/utils'
import type { InventoryItem } from '@/types'
import { Plus, AlertTriangle, Package, TrendingUp, Download } from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIES = ['Electronics','Office Supplies','Raw Materials','Packaging','Machinery','Furniture']

export default function InventoryItemsPage(){
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({itemCode:'',itemName:'',category:'Electronics',unit:'PCS',
    purchasePrice:'',sellingPrice:'',gstRate:'18',reorderLevel:'10',description:''})

  const {data, isLoading} = useQuery({
    queryKey:['inv-items',page,search,category],
    queryFn:()=>inventoryApi.items.list({page,size:20,q:search||undefined,category:category||undefined}),
  })
  const {data:alerts} = useQuery({queryKey:['low-stock'],queryFn:inventoryApi.alerts.lowStock})

  const createMutation = useMutation({
    mutationFn:(d:any)=>inventoryApi.items.create({...d,purchasePrice:parseFloat(d.purchasePrice)||0,sellingPrice:parseFloat(d.sellingPrice)||0,gstRate:parseFloat(d.gstRate)||0,reorderLevel:parseFloat(d.reorderLevel)||0}),
    onSuccess:()=>{qc.invalidateQueries({queryKey:['inv-items']});setShowCreate(false);toast.success('Item added to inventory')},
    onError:(e:any)=>toast.error(e?.response?.data?.error??'Failed'),
  })

  const stockColor=(s:number,r:number)=>s<=r?'#ef4444':s<=r*1.5?'#f59e0b':'#22c55e'

  const columns = [
    {header:'Item', render:(i:InventoryItem)=>(
      <div>
        <p className="font-semibold text-sm">{i.itemName}</p>
        <p className="font-mono text-xs" style={{color:'var(--gold)',fontSize:'10px'}}>{i.itemCode}</p>
      </div>
    )},
    {header:'Category', render:(i:InventoryItem)=>(
      <span className="text-xs px-2.5 py-1 rounded-full font-medium"
        style={{background:'rgba(139,92,246,.1)',color:'#8b5cf6',border:'1px solid rgba(139,92,246,.18)'}}>
        {i.category||'—'}
      </span>
    )},
    {header:'GST', render:(i:InventoryItem)=><span className="font-mono text-xs">{i.gstRate}%</span>},
    {header:'Purchase Price', render:(i:InventoryItem)=><span className="font-mono text-sm">{formatCurrency(i.purchasePrice)}</span>},
    {header:'Selling Price',  render:(i:InventoryItem)=><span className="font-mono text-sm font-semibold">{formatCurrency(i.sellingPrice)}</span>},
    {header:'Stock', render:(i:InventoryItem)=>(
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-bold" style={{color:stockColor(i.currentStock,i.reorderLevel)}}>{i.currentStock}</span>
        <span className="text-xs" style={{color:'var(--text-muted)'}}>{i.unit}</span>
        {i.currentStock<=i.reorderLevel&&<AlertTriangle className="w-3.5 h-3.5 text-red-500"/>}
      </div>
    )},
    {header:'Reorder At', render:(i:InventoryItem)=><span className="font-mono text-xs" style={{color:'var(--text-muted)'}}>{i.reorderLevel} {i.unit}</span>},
    {header:'Status', render:(i:InventoryItem)=><Badge variant={i.isActive?'success':'default'}>{i.isActive?'Active':'Inactive'}</Badge>},
  ]

  return(
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Inventory Items</h1>
          <p className="text-sm mt-0.5" style={{color:'var(--text-muted)'}}>
            {data?.totalElements??0} items · <span style={{color:'#ef4444'}}>{alerts?.length??0} below reorder level</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary h-9 text-sm" onClick={()=>exportToCsv('inventory-items', (data?.content??[]).map((i:any)=>({ Code:i.itemCode, Name:i.name, Category:i.category, Unit:i.unit, Stock:i.currentStock, ReorderLevel:i.reorderLevel, Price:i.sellingPrice })))}><Download className="w-4 h-4"/>Export</button>
          <button onClick={()=>setShowCreate(true)} className="btn-primary h-9 text-sm"><Plus className="w-4 h-4"/>Add Item</button>
        </div>
      </div>

      {/* Alert banner */}
      {(alerts?.length??0)>0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{background:'rgba(239,68,68,.07)',border:'1px solid rgba(239,68,68,.18)'}}>
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0"/>
          <p className="text-sm" style={{color:'#ef4444'}}>
            <strong>{alerts?.length} items</strong> are below reorder level and need restocking
          </p>
        </div>
      )}

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {['', ...CATEGORIES].map(cat=>(
          <button key={cat} onClick={()=>setCategory(cat)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{background:category===cat?'var(--gold-muted)':'var(--bg-hover)',
                    color:category===cat?'var(--gold)':'var(--text-muted)',
                    border:`1px solid ${category===cat?'rgba(245,158,11,.2)':'var(--border)'}`}}>
            {cat||'All Categories'}
          </button>
        ))}
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search by name or item code…" className="w-72"/>

      <DataTable columns={columns} data={data?.content??[]} loading={isLoading}
        keyExtractor={i=>i.id} emptyMessage="No items found. Add your first inventory item."/>
      {data&&<Pagination currentPage={data.currentPage} totalPages={data.totalPages}
        onPageChange={setPage} totalElements={data.totalElements} pageSize={20}/>}

      <Modal open={showCreate} onClose={()=>setShowCreate(false)} title="Add Inventory Item" subtitle="Register a new product or material">
        <form onSubmit={e=>{e.preventDefault();createMutation.mutate(form)}} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Item Code *</label>
              <input className="input h-10" required value={form.itemCode} onChange={e=>setForm(f=>({...f,itemCode:e.target.value}))} placeholder="e.g. ELEC-001"/></div>
            <div><label className="label">Item Name *</label>
              <input className="input h-10" required value={form.itemName} onChange={e=>setForm(f=>({...f,itemName:e.target.value}))}/></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Category</label>
              <select className="input h-10" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select></div>
            <div><label className="label">Unit</label>
              <select className="input h-10" value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))}>
                {['PCS','KG','LTR','MTR','BOX','SET','NOS'].map(u=><option key={u} value={u}>{u}</option>)}
              </select></div>
            <div><label className="label">GST Rate %</label>
              <select className="input h-10" value={form.gstRate} onChange={e=>setForm(f=>({...f,gstRate:e.target.value}))}>
                {['0','5','12','18','28'].map(r=><option key={r} value={r}>{r}%</option>)}
              </select></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Purchase Price ₹</label>
              <input className="input h-10" type="number" step="0.01" min="0" value={form.purchasePrice} onChange={e=>setForm(f=>({...f,purchasePrice:e.target.value}))}/></div>
            <div><label className="label">Selling Price ₹</label>
              <input className="input h-10" type="number" step="0.01" min="0" value={form.sellingPrice} onChange={e=>setForm(f=>({...f,sellingPrice:e.target.value}))}/></div>
            <div><label className="label">Reorder Level</label>
              <input className="input h-10" type="number" min="0" value={form.reorderLevel} onChange={e=>setForm(f=>({...f,reorderLevel:e.target.value}))}/></div>
          </div>
          <div><label className="label">Description</label>
            <textarea className="input resize-none" rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></div>
          <div className="flex justify-end gap-3 pt-2" style={{borderTop:'1px solid var(--border)'}}>
            <button type="button" onClick={()=>setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending?'Adding…':'Add Item'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
