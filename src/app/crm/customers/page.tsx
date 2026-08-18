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
import { crmApi } from '@/lib/api/crm'
import { DataTable } from '@/components/ui/Table'
import { SearchInput } from '@/components/ui/SearchInput'
import { Pagination } from '@/components/ui/Pagination'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import { Customer } from '@/types'
import { useDebounce } from '@/lib/hooks'
import { Plus, Users, TrendingUp, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const BLANK_CUST = { name:'', email:'', phone:'', gstin:'', creditLimit:'', customerType:'REGULAR', billingAddress:'' }

export default function CustomersPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ ...BLANK_CUST })
  const q = useDebounce(search, 400)
  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, q],
    queryFn: () => crmApi.customers.list({ page, size: 20, q: q || undefined }),
  })

  const createCust = useMutation({
    mutationFn: () => crmApi.customers.create({
      name: form.name, email: form.email, phone: form.phone, gstin: form.gstin,
      creditLimit: form.creditLimit ? Number(form.creditLimit) : 0,
      customerType: form.customerType, billingAddress: form.billingAddress,
    } as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      setShowCreate(false); setForm({ ...BLANK_CUST })
      toast.success('Customer added')
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to add customer'),
  })

  const submitCust = () => {
    if (!form.name) return toast.error('Customer name is required')
    createCust.mutate()
  }

  const totalOutstanding = (data?.content ?? []).reduce((s: any, c: any) => s + (c.outstanding ?? 0), 0)
  const premiumCount = (data?.content ?? []).filter((c: any) => c.customerType === 'PREMIUM').length

  const columns = [
    { header: 'Customer', render: (c: Customer) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd' }}>
          {c.name?.[0]?.toUpperCase()}
        </div>
        <div><p className="font-semibold text-sm">{c.name}</p><p className="text-xs font-mono" style={{ color: 'var(--gold)' }}>{c.customerCode ?? '—'}</p></div>
      </div>
    )},
    { header: 'Contact', render: (c: Customer) => (
      <div><p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{c.email ?? '—'}</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.phone ?? ''}</p></div>
    )},
    { header: 'GSTIN', render: (c: Customer) => <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{c.gstin ?? '—'}</span> },
    { header: 'Credit Limit', render: (c: Customer) => <span className="font-mono text-sm">{formatCurrency(c.creditLimit)}</span> },
    { header: 'Outstanding', render: (c: Customer) => (
      <span className={`font-mono text-sm font-bold ${c.outstanding > 0 ? 'text-red-400' : 'text-green-400'}`}>
        {formatCurrency(c.outstanding)}
      </span>
    )},
    { header: 'Type', render: (c: Customer) => (
      <Badge variant={c.customerType === 'PREMIUM' ? 'gold' : c.customerType === 'GOVERNMENT' ? 'info' : 'default'}>
        {c.customerType}
      </Badge>
    )},
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)' }}>
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div><p className="text-2xl font-display text-blue-400">{data?.totalElements ?? 0}</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Customers</p></div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)' }}>
            <TrendingUp className="w-5 h-5" style={{ color: 'var(--gold)' }} />
          </div>
          <div><p className="text-2xl font-display" style={{ color: 'var(--gold)' }}>{premiumCount}</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Premium Customers</p></div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.12)' }}>
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div><p className="text-xl font-display text-red-400">{formatCurrency(totalOutstanding)}</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Outstanding</p></div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search customers..." className="w-72" />
        <button className="btn-primary h-9" onClick={()=>setShowCreate(true)}><Plus className="w-4 h-4" />Add Customer</button>
      </div>

      <DataTable columns={columns} data={data?.content ?? []} loading={isLoading} keyExtractor={c => c.id} emptyMessage="No customers found" />
      {data && <Pagination currentPage={data.currentPage} totalPages={data.totalPages} onPageChange={setPage} totalElements={data.totalElements} pageSize={20} />}

      {showCreate && (
        <div className="modal-overlay" onClick={()=>setShowCreate(false)}>
          <div className="modal-content" style={{ maxWidth:'520px' }} onClick={(e: any) =>e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Add Customer</h3>
            <div className="grid grid-cols-2 gap-3">
              <div style={{ gridColumn:'1/-1' }}>
                <label className="label label-required">Customer Name</label>
                <input className="input h-10" placeholder="Acme Industries Pvt Ltd" value={form.name}
                  onChange={e=>setForm(f=>({...f, name:e.target.value}))}/>
              </div>
              <div><label className="label">Email</label>
                <input type="email" className="input h-10" placeholder="contact@acme.com" value={form.email}
                  onChange={e=>setForm(f=>({...f, email:e.target.value}))}/></div>
              <div><label className="label">Phone</label>
                <input className="input h-10" placeholder="9876543210" value={form.phone}
                  onChange={e=>setForm(f=>({...f, phone:e.target.value}))}/></div>
              <div><label className="label">GSTIN</label>
                <input className="input h-10" placeholder="27AAAAA0000A1Z5" value={form.gstin}
                  onChange={e=>setForm(f=>({...f, gstin:e.target.value.toUpperCase()}))}/></div>
              <div><label className="label">Credit Limit (₹)</label>
                <input type="number" className="input h-10" placeholder="100000" value={form.creditLimit}
                  onChange={e=>setForm(f=>({...f, creditLimit:e.target.value}))}/></div>
              <div><label className="label">Type</label>
                <select className="input h-10" value={form.customerType}
                  onChange={e=>setForm(f=>({...f, customerType:e.target.value}))}>
                  <option value="REGULAR">Regular</option>
                  <option value="PREMIUM">Premium</option>
                  <option value="GOVERNMENT">Government</option>
                </select></div>
              <div style={{ gridColumn:'1/-1' }}><label className="label">Billing Address</label>
                <input className="input h-10" placeholder="Street, city, state, PIN" value={form.billingAddress}
                  onChange={e=>setForm(f=>({...f, billingAddress:e.target.value}))}/></div>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button className="btn-secondary h-10" onClick={()=>setShowCreate(false)}>Cancel</button>
              <button className="btn-primary h-10" onClick={submitCust} disabled={createCust.isPending}>
                {createCust.isPending ? 'Adding…' : 'Add Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
