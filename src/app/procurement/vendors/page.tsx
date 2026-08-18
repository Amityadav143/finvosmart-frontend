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
import { Badge } from '@/components/ui/Badge'
import { SearchInput } from '@/components/ui/SearchInput'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'
import { Plus, Star, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'

const BLANK = { name:'', gstin:'', contactPerson:'', email:'', phone:'', city:'', state:'' }

export default function VendorsPage(){
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ ...BLANK })

  const { data, isLoading } = useQuery({
    queryKey: ['vendors', search],
    queryFn: () => procurementApi.vendors.list({ size: 100, q: search || undefined }),
  })
  const vendors = data?.content ?? []

  const createVendor = useMutation({
    mutationFn: () => procurementApi.vendors.create(form as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendors'] })
      setShowCreate(false); setForm({ ...BLANK })
      toast.success('Vendor added')
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to add vendor'),
  })

  const submit = () => {
    if (!form.name) return toast.error('Vendor name is required')
    createVendor.mutate()
  }

  const columns = [
    {header:'Vendor', render:(v:any)=>(
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold"
          style={{background:'rgba(14,165,233,.12)',color:'#0ea5e9'}}>
          {(v.name||'?').split(' ').slice(0,2).map((w:string)=>w[0]).join('')}
        </div>
        <div>
          <p className="font-semibold text-sm">{v.name}</p>
          <p className="font-mono text-xs" style={{color:'var(--gold)',fontSize:'10px'}}>{v.vendorCode ?? '—'}</p>
        </div>
      </div>
    )},
    {header:'GSTIN', render:(v:any)=><span className="font-mono text-xs" style={{color:'var(--text-secondary)'}}>{v.gstin ?? '—'}</span>},
    {header:'Location', render:(v:any)=><span className="text-xs">{[v.city,v.state].filter(Boolean).join(', ') || '—'}</span>},
    {header:'Contact', render:(v:any)=><span className="text-xs">{v.contactPerson ?? v.email ?? '—'}</span>},
    {header:'Status', render:(v:any)=><Badge variant={(v.status??'ACTIVE')==='ACTIVE'?'success':'default'}>{v.status ?? 'ACTIVE'}</Badge>},
  ]

  return(
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Vendors</h1>
          <p className="text-sm mt-0.5" style={{color:'var(--text-muted)'}}>Supplier directory & performance</p>
        </div>
        <button onClick={()=>setShowCreate(true)} className="btn-primary h-9 text-sm"><Plus className="w-4 h-4"/>Add Vendor</button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          {label:'Total Vendors', val:data?.totalElements ?? vendors.length, color:'#22c55e'},
          {label:'Active',        val:vendors.filter((v:any)=>(v.status??'ACTIVE')==='ACTIVE').length, color:'#3b82f6'},
          {label:'Showing',       val:vendors.length, color:'var(--gold)'},
        ].map(s=>(
          <div key={s.label} className="card">
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{color:'var(--text-muted)',fontSize:'9px',letterSpacing:'.07em'}}>{s.label}</p>
            <p className="font-serif text-2xl" style={{color:s.color}}>{s.val}</p>
          </div>
        ))}
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search vendors by name or GSTIN…" className="w-72"/>
      <DataTable columns={columns} data={vendors} loading={isLoading} keyExtractor={(v:any)=>v.id} emptyMessage="No vendors found"/>

      <Modal open={showCreate} onClose={()=>setShowCreate(false)} title="Add Vendor" subtitle="Register a new supplier">
        <div className="grid grid-cols-2 gap-4">
          <div style={{ gridColumn:'1/-1' }}>
            <label className="label label-required">Vendor Name</label>
            <input className="input h-10" placeholder="Acme Suppliers Pvt Ltd" value={form.name}
              onChange={e=>setForm(f=>({...f, name:e.target.value}))}/>
          </div>
          <div><label className="label">GSTIN</label>
            <input className="input h-10" placeholder="27AAAAA0000A1Z5" value={form.gstin}
              onChange={e=>setForm(f=>({...f, gstin:e.target.value.toUpperCase()}))}/></div>
          <div><label className="label">Contact Person</label>
            <input className="input h-10" placeholder="Full name" value={form.contactPerson}
              onChange={e=>setForm(f=>({...f, contactPerson:e.target.value}))}/></div>
          <div><label className="label">Email</label>
            <input type="email" className="input h-10" placeholder="vendor@example.com" value={form.email}
              onChange={e=>setForm(f=>({...f, email:e.target.value}))}/></div>
          <div><label className="label">Phone</label>
            <input className="input h-10" placeholder="9876543210" value={form.phone}
              onChange={e=>setForm(f=>({...f, phone:e.target.value}))}/></div>
          <div><label className="label">City</label>
            <input className="input h-10" placeholder="Mumbai" value={form.city}
              onChange={e=>setForm(f=>({...f, city:e.target.value}))}/></div>
          <div><label className="label">State</label>
            <input className="input h-10" placeholder="Maharashtra" value={form.state}
              onChange={e=>setForm(f=>({...f, state:e.target.value}))}/></div>
        </div>
        <div className="flex justify-end gap-3 pt-4 mt-4" style={{borderTop:'1px solid var(--border)'}}>
          <button onClick={()=>setShowCreate(false)} className="btn-secondary">Cancel</button>
          <button onClick={submit} className="btn-primary" disabled={createVendor.isPending}>
            {createVendor.isPending ? 'Saving…' : 'Save Vendor'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
