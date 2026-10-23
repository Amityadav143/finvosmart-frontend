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
import { EmptyState } from '@/components/ui/EmptyState'
import { SearchInput } from '@/components/ui/SearchInput'
import { Pagination } from '@/components/ui/Pagination'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { Customer } from '@/types'
import { useDebounce } from '@/lib/hooks'
import { useUrlParams } from '@/lib/hooks/useUrlParams'
import { inr, PLACES_OF_SUPPLY } from '@/lib/money'
import Link from 'next/link'
import { Plus, Users, AlertCircle, BellOff, FileUp, ScrollText } from 'lucide-react'
import toast from 'react-hot-toast'
import { checkGstin } from '@/lib/gstin'
import { apiError } from '@/lib/utils'

interface Form {
  name: string; email: string; phone: string; gstin: string; creditLimit: string; customerType: string
  billingAddress: string; shippingAddress: string; city: string; state: string; paymentTerms: string; notes: string; remindersEnabled: boolean
}
const BLANK_CUST: Form = { name: '', email: '', phone: '', gstin: '', creditLimit: '', customerType: 'REGULAR', billingAddress: '', shippingAddress: '',
  city: '', state: '', paymentTerms: '', notes: '', remindersEnabled: true }
const TERMS = ['Due on receipt', 'Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Net 90']

const fromCustomer = (c: Customer): Form => ({
  name: c.name ?? '', email: c.email ?? '', phone: c.phone ?? '', gstin: c.gstin ?? '', creditLimit: c.creditLimit ? String(c.creditLimit) : '',
  customerType: c.customerType ?? 'REGULAR', billingAddress: c.billingAddress ?? '', shippingAddress: c.shippingAddress ?? '', city: c.city ?? '',
  state: c.state ?? '', paymentTerms: c.paymentTerms ?? '', notes: c.notes ?? '', remindersEnabled: c.remindersEnabled !== false,
})

/** Validation shared by "add" and "edit". */
function problem(form: Form): string | null {
  if (!form.name.trim()) return 'Customer name is required'
  if (form.gstin.trim()) { const g = checkGstin(form.gstin); if (!g.valid) return `GSTIN: ${g.problems[0]}` }
  if (form.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) return 'Email address looks wrong'
  return null
}

const payload = (form: Form) => ({
  name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(),
  gstin: form.gstin.trim() ? checkGstin(form.gstin).gstin : '',
  creditLimit: form.creditLimit ? Number(form.creditLimit) : 0, customerType: form.customerType as any,
  billingAddress: form.billingAddress, shippingAddress: form.shippingAddress, city: form.city.trim(),
  // the state follows the GSTIN when there is one (its first two digits)
  state: form.gstin.trim() && checkGstin(form.gstin).valid ? (checkGstin(form.gstin).stateName ?? form.state) : form.state,
  paymentTerms: form.paymentTerms, notes: form.notes, remindersEnabled: form.remindersEnabled,
})

export default function CustomersPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [form, setForm] = useState<Form>({ ...BLANK_CUST })
  const { canAny } = usePermissions()
  const canCreate = canAny('CRM_CREATE', 'CRM_ADMIN')
  const q = useDebounce(search, 400)
  useUrlParams(p => {
    if (p.get('new') === '1') { setForm({ ...BLANK_CUST }); setShowCreate(true) }
    if (p.get('q')) setSearch(p.get('q')!)
    const id = p.get('open')
    if (id) crmApi.customers.get(id).then(c => { setEditing(c); setForm(fromCustomer(c)) }).catch(e => toast.error(apiError(e, 'That customer could not be opened')))
  })
  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, q],
    queryFn: () => crmApi.customers.list({ page, size: 20, q: q || undefined }),
  })

  const createCust = useMutation({
    mutationFn: () => crmApi.customers.create(payload(form)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      setShowCreate(false); setForm({ ...BLANK_CUST })
      toast.success('Customer added')
    },
    onError: (e: any) => toast.error(apiError(e, 'Failed to add customer')),
  })
  const updateCust = useMutation({
    mutationFn: () => crmApi.customers.update(editing!.id, payload(form)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      setEditing(null)
      toast.success('Customer updated')
    },
    onError: (e: any) => toast.error(apiError(e, 'Could not update the customer')),
  })

  const submitCust = () => {
    if (!form.name) return toast.error('Customer name is required')
    if (form.gstin.trim()) { const g = checkGstin(form.gstin); if (!g.valid) return toast.error(`GSTIN: ${g.problems[0]}`) }
    const p = problem(form); if (p) return toast.error(p)
    if (editing) updateCust.mutate(); else createCust.mutate()
  }

  const rows = data?.content ?? []
  const totalOutstanding = rows.reduce((s: number, c: Customer) => s + Number(c.outstanding ?? 0), 0)

  const columns = [
    { header: 'Customer', render: (c: Customer) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd' }}>
          {c.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-sm">{c.name}</p>
          <p className="text-xs font-mono" style={{ color: 'var(--gold)' }}>{c.customerCode ?? '—'}</p>
        </div>
      </div>
    )},
    { header: 'Contact', render: (c: Customer) => (
      <div><p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{c.email || '—'}</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.phone ?? ''}</p></div>
    )},
    { header: 'GSTIN', render: (c: Customer) => <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{c.gstin || 'Unregistered'}</span> },
    { header: 'State', render: (c: Customer) => <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{c.state || '—'}</span> },
    { header: 'Owes you', render: (c: Customer) => (
      <span className="font-mono text-sm font-semibold" style={{ color: Number(c.outstanding) > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
        {inr(c.outstanding ?? 0)}
      </span>
    )},
    { header: 'Type', render: (c: Customer) => (
      <div className="flex items-center gap-2">
        <Badge variant={c.customerType === 'PREMIUM' ? 'gold' : c.customerType === 'GOVERNMENT' ? 'info' : 'default'}>{c.customerType}</Badge>
        {c.remindersEnabled === false && <span title="Automatic reminders are off"><BellOff className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} /></span>}
      </div>
    )},
  ]

  const modalOpen = showCreate || !!editing
  const close = () => { setShowCreate(false); setEditing(null); setForm({ ...BLANK_CUST }) }
  const saving = createCust.isPending || updateCust.isPending
  const set = (k: keyof Form) => (e: any) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : k === 'gstin' ? e.target.value.toUpperCase() : e.target.value }))

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)' }}>
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div><p className="text-2xl font-display text-blue-400">{data?.totalElements ?? 0}</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Customers</p></div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.12)' }}>
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div><p className="text-xl font-display">{inr(totalOutstanding)}</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Owed by the customers on this page (unpaid invoices)</p></div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(0) }} placeholder="Search customers..." className="w-72" />
        <PermissionGate anyOf={['CRM_CREATE', 'CRM_ADMIN']}>
          <div className="flex items-center gap-2">
            <Link href="/import?kind=customers" className="btn-secondary h-9"><FileUp className="w-4 h-4" />Import</Link>
            <button className="btn-primary h-9" onClick={() => { setForm({ ...BLANK_CUST }); setShowCreate(true) }}><Plus className="w-4 h-4" />Add Customer</button>
          </div>
        </PermissionGate>
      </div>

      <DataTable columns={columns} data={rows} loading={isLoading} keyExtractor={c => c.id} emptyMessage="No customers match."
        empty={q ? undefined : (
          <EmptyState compact icon={Users} title="No customers yet"
            description="Add the people and businesses you bill. With a GSTIN, the state and the right tax split come in by themselves."
            action={canCreate ? { label: 'Add a customer', onClick: () => { setForm({ ...BLANK_CUST }); setShowCreate(true) } } : undefined}
            secondary={canCreate ? { label: 'Import from Excel', href: '/import?kind=customers' } : undefined} />
        )}
        onRowClick={c => { setEditing(c); setForm(fromCustomer(c)) }} />
      {data && <Pagination currentPage={data.currentPage} totalPages={data.totalPages} onPageChange={setPage} totalElements={data.totalElements} pageSize={20} />}

      <Modal open={modalOpen} onClose={close} title={editing ? `Edit ${editing.name}` : 'Add Customer'} size="lg">
        <div className="grid grid-cols-2 gap-3">
          <div style={{ gridColumn: '1/-1' }}>
            <label className="label label-required">Customer Name</label>
            <input className="input h-10" placeholder="Acme Industries Pvt Ltd" value={form.name} onChange={set('name')} />
          </div>
          <div><label className="label">Email (invoices and reminders go here)</label>
            <input type="email" className="input h-10" placeholder="accounts@acme.com" value={form.email} onChange={set('email')} /></div>
          <div><label className="label">Phone / WhatsApp</label>
            <input className="input h-10" placeholder="98765 43210" value={form.phone} onChange={set('phone')} /></div>
          <div><label className="label">GSTIN</label>
            <input className="input h-10 font-mono" placeholder="Leave empty if unregistered" value={form.gstin} maxLength={15} onChange={set('gstin')} /></div>
          <div><label className="label">State</label>
            <select className="input h-10" value={form.state} onChange={set('state')} disabled={!!form.gstin.trim() && checkGstin(form.gstin).valid}>
              <option value="">{form.gstin.trim() && checkGstin(form.gstin).valid ? (checkGstin(form.gstin).stateName ?? '') + ' (from GSTIN)' : '—'}</option>
              {PLACES_OF_SUPPLY.map(p => <option key={p.code} value={p.name}>{p.name}</option>)}
            </select></div>
          <div style={{ gridColumn: '1/-1' }}><label className="label">Billing address</label>
            <textarea className="input" rows={2} placeholder="Street, city, PIN" value={form.billingAddress} onChange={set('billingAddress')} /></div>
          <div style={{ gridColumn: '1/-1' }}><label className="label">Delivery address (if different)</label>
            <textarea className="input" rows={2} value={form.shippingAddress} onChange={set('shippingAddress')} /></div>
          <div><label className="label">Payment terms</label>
            <select className="input h-10" value={form.paymentTerms} onChange={set('paymentTerms')}>
              <option value="">Company default</option>
              {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select></div>
          <div><label className="label">Credit limit (₹)</label>
            <input type="number" min={0} className="input h-10" placeholder="0 = no limit" value={form.creditLimit} onChange={set('creditLimit')} /></div>
          <div><label className="label">Type</label>
            <select className="input h-10" value={form.customerType} onChange={set('customerType')}>
              <option value="REGULAR">Regular</option>
              <option value="PREMIUM">Premium</option>
              <option value="GOVERNMENT">Government</option>
              <option value="INSTITUTIONAL">Institutional</option>
            </select></div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.remindersEnabled} onChange={set('remindersEnabled')} />
              Send automatic payment reminders
            </label>
          </div>
          <div style={{ gridColumn: '1/-1' }}><label className="label">Notes</label>
            <input className="input h-10" value={form.notes} onChange={set('notes')} /></div>
        </div>
        <div className="flex gap-2 justify-end mt-5">
          {editing && (
            <Link href={`/statements/customer/${editing.id}`} className="btn-ghost h-10 mr-auto" data-testid="customer-statement">
              <ScrollText className="w-4 h-4" />Statement of account
            </Link>
          )}
          <button className="btn-secondary h-10" onClick={close}>Cancel</button>
          <button className="btn-primary h-10" onClick={submitCust} disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add Customer'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
