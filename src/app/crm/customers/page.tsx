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
import { inr } from '@/lib/money'
import { AddressFields, AddressText } from '@/components/ui/AddressFields'
import { EMPTY_ADDRESS, EMPTY_SHIP_TO, addressEmpty, addressProblem, customerBilling, customerShipping, customerShipsToBilling, type AddressParts, type ShipToParts } from '@/lib/address'
import Link from 'next/link'
import { Plus, Users, AlertCircle, BellOff, FileUp, ScrollText } from 'lucide-react'
import toast from 'react-hot-toast'
import { checkGstin } from '@/lib/gstin'
import { apiError } from '@/lib/utils'
import { useExtraFields, ExtraFields } from '@/components/industry/ExtraFields'
import { useIndustry } from '@/lib/hooks/useIndustry'

interface Form {
  name: string; email: string; phone: string; gstin: string; creditLimit: string; customerType: string
  /** the billing address in parts (its state is the customer's state); whether goods go there; where they go when not */
  billing: AddressParts; shipSame: boolean; shipping: ShipToParts
  paymentTerms: string; notes: string; remindersEnabled: boolean
}
const BLANK_CUST: Form = { name: '', email: '', phone: '', gstin: '', creditLimit: '', customerType: 'REGULAR', billing: { ...EMPTY_ADDRESS },
  shipSame: true, shipping: { ...EMPTY_SHIP_TO }, paymentTerms: '', notes: '', remindersEnabled: true }
const TERMS = ['Due on receipt', 'Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Net 90']

const fromCustomer = (c: Customer): Form => ({
  name: c.name ?? '', email: c.email ?? '', phone: c.phone ?? '', gstin: c.gstin ?? '', creditLimit: c.creditLimit ? String(c.creditLimit) : '',
  customerType: c.customerType ?? 'REGULAR', billing: customerBilling(c), shipSame: customerShipsToBilling(c), shipping: customerShipping(c),
  paymentTerms: c.paymentTerms ?? '', notes: c.notes ?? '', remindersEnabled: c.remindersEnabled !== false,
})

/** Validation shared by "add" and "edit". */
function problem(form: Form): string | null {
  if (!form.name.trim()) return 'Customer name is required'
  if (form.gstin.trim()) { const g = checkGstin(form.gstin); if (!g.valid) return `GSTIN: ${g.problems[0]}` }
  if (form.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) return 'Email address looks wrong'
  const bad = addressProblem(form.billing, 'billing') ?? (form.shipSame ? null : addressProblem(form.shipping, 'shipping'))
  if (bad) return bad
  if (!form.shipSame && addressEmpty(form.shipping)) return 'Enter the shipping address, or tick “Same as billing address”.'
  if (!form.shipSame && form.shipping.gstin?.trim()) { const g = checkGstin(form.shipping.gstin); if (!g.valid) return `Shipping GSTIN: ${g.problems[0]}` }
  return null
}

const payload = (form: Form) => ({
  name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(),
  gstin: form.gstin.trim() ? checkGstin(form.gstin).gstin : '',
  creditLimit: form.creditLimit ? Number(form.creditLimit) : 0, customerType: form.customerType as any,
  // the billing address in parts; its city and state are the customer's (the state follows the GSTIN when there is one)
  billingLine1: form.billing.line1?.trim() ?? '', billingLine2: form.billing.line2?.trim() ?? '', city: form.billing.city?.trim() ?? '',
  state: form.gstin.trim() && checkGstin(form.gstin).valid ? (checkGstin(form.gstin).stateName ?? form.billing.state ?? '') : form.billing.state ?? '',
  billingPincode: (form.billing.pincode ?? '').replace(/\s/g, ''), billingCountry: form.billing.country?.trim() || 'India',
  shipSameAsBilling: form.shipSame,
  // ticked: no shipping address of its own (the server clears it); not ticked: the address the goods go to
  ...(form.shipSame ? {} : {
    shippingName: form.shipping.name?.trim() ?? '', shippingLine1: form.shipping.line1?.trim() ?? '', shippingLine2: form.shipping.line2?.trim() ?? '',
    shippingCity: form.shipping.city?.trim() ?? '', shippingState: form.shipping.state?.trim() ?? '', shippingPincode: (form.shipping.pincode ?? '').replace(/\s/g, ''),
    shippingCountry: form.shipping.country?.trim() || 'India', shippingGstin: (form.shipping.gstin ?? '').trim().toUpperCase(),
  }),
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
  // the sector's words ("Patient" in a clinic) and its extra fields (date of birth, insurer…)
  const ind = useIndustry()
  const one = ind.one('/crm/customers', 'Customer'), many = ind.name('/crm/customers', 'Customers')
  const extra = useExtraFields('CUSTOMER', editing?.id)
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
    mutationFn: async () => { const c = await crmApi.customers.create(payload(form)); return { c, warn: await extra.save(c.id) } },
    onSuccess: ({ warn }) => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      setShowCreate(false); setForm({ ...BLANK_CUST })
      toast.success(`${one} added`)
      if (warn) toast.error(`${one} added, but not the extra details: ${warn}`)
    },
    onError: (e: any) => toast.error(apiError(e, 'Failed to add customer')),
  })
  const updateCust = useMutation({
    mutationFn: async () => { const c = await crmApi.customers.update(editing!.id, payload(form)); return { c, warn: await extra.save(editing!.id) } },
    onSuccess: ({ warn }) => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      setEditing(null)
      if (warn) toast.error(`${one} saved, but not the extra details: ${warn}`)
      else toast.success(`${one} updated`)
    },
    onError: (e: any) => toast.error(apiError(e, 'Could not update the customer')),
  })

  const submitCust = () => {
    if (!form.name) return toast.error(`${one} name is required`)
    if (form.gstin.trim()) { const g = checkGstin(form.gstin); if (!g.valid) return toast.error(`GSTIN: ${g.problems[0]}`) }
    const p = problem(form); if (p) return toast.error(p)
    const xp = extra.problem(); if (xp) return toast.error(xp)
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
          <div><p className="text-2xl font-display text-blue-400">{data?.totalElements ?? 0}</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{many}</p></div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.12)' }}>
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div><p className="text-xl font-display">{inr(totalOutstanding)}</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Owed by the customers on this page (unpaid invoices)</p></div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(0) }} placeholder={`Search ${many.toLowerCase()}...`} className="w-72" />
        <PermissionGate anyOf={['CRM_CREATE', 'CRM_ADMIN']}>
          <div className="flex items-center gap-2">
            <Link href="/import?kind=customers" className="btn-secondary h-9"><FileUp className="w-4 h-4" />Import</Link>
            <button className="btn-primary h-9" onClick={() => { setForm({ ...BLANK_CUST }); setShowCreate(true) }}><Plus className="w-4 h-4" />Add {one}</button>
          </div>
        </PermissionGate>
      </div>

      <DataTable columns={columns} data={rows} loading={isLoading} keyExtractor={c => c.id} emptyMessage="No customers match."
        empty={q ? undefined : (
          <EmptyState compact icon={Users} title={`No ${many.toLowerCase()} yet`}
            description="Add the people and businesses you bill. With a GSTIN, the state and the right tax split come in by themselves."
            action={canCreate ? { label: `Add a ${one.toLowerCase()}`, onClick: () => { setForm({ ...BLANK_CUST }); setShowCreate(true) } } : undefined}
            secondary={canCreate ? { label: 'Import from Excel', href: '/import?kind=customers' } : undefined} />
        )}
        onRowClick={c => { setEditing(c); setForm(fromCustomer(c)) }} />
      {data && <Pagination currentPage={data.currentPage} totalPages={data.totalPages} onPageChange={setPage} totalElements={data.totalElements} pageSize={20} />}

      <Modal open={modalOpen} onClose={close} title={editing ? `Edit ${editing.name}` : `Add ${one}`} size="lg">
        <div className="grid grid-cols-2 gap-3">
          <div style={{ gridColumn: '1/-1' }}>
            <label className="label label-required">{one} name</label>
            <input className="input h-10" placeholder="Acme Industries Pvt Ltd" value={form.name} onChange={set('name')} />
          </div>
          <div><label className="label">Email (invoices and reminders go here)</label>
            <input type="email" className="input h-10" placeholder="accounts@acme.com" value={form.email} onChange={set('email')} /></div>
          <div><label className="label">Phone / WhatsApp</label>
            <input className="input h-10" placeholder="98765 43210" value={form.phone} onChange={set('phone')} /></div>
          <div><label className="label">GSTIN</label>
            <input className="input h-10 font-mono" placeholder="Leave empty if unregistered" value={form.gstin} maxLength={15} onChange={set('gstin')} /></div>
          <div><label className="label">Type</label>
            <select className="input h-10" value={form.customerType} onChange={set('customerType')}>
              <option value="REGULAR">Regular</option>
              <option value="PREMIUM">Premium</option>
              <option value="GOVERNMENT">Government</option>
              <option value="INSTITUTIONAL">Institutional</option>
            </select></div>
          <fieldset style={{ gridColumn: '1/-1' }} className="space-y-2" data-testid="billing-address">
            <legend className="text-sm font-semibold mb-1">Billing address</legend>
            <AddressFields idPrefix="cust-bill" which="billing" value={form.billing} onChange={b => setForm(f => ({ ...f, billing: b }))}
              stateFromGstin={form.gstin.trim() && checkGstin(form.gstin).valid ? checkGstin(form.gstin).stateName ?? null : null} />
          </fieldset>
          <fieldset style={{ gridColumn: '1/-1' }} className="space-y-2" data-testid="shipping-address">
            <legend className="text-sm font-semibold mb-1">Shipping address</legend>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" id="cust-ship-same" checked={form.shipSame}
                onChange={e => setForm(f => ({ ...f, shipSame: e.target.checked,
                  // unticked for the first time: start from the billing address, to change what differs
                  shipping: !e.target.checked && addressEmpty(f.shipping) ? { ...f.shipping, ...f.billing } : f.shipping }))} />
              Same as billing address
            </label>
            {form.shipSame
              ? <div className="rounded-lg px-3 py-2" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <AddressText value={{ ...form.billing, state: form.gstin.trim() && checkGstin(form.gstin).valid ? checkGstin(form.gstin).stateName ?? form.billing.state : form.billing.state }}
                    empty="The billing address above" testId="cust-ship-summary" />
                </div>
              : <AddressFields idPrefix="cust-ship" which="shipping" withName withGstin value={form.shipping} onChange={v => setForm(f => ({ ...f, shipping: v }))} />}
          </fieldset>
          <div><label className="label">Payment terms</label>
            <select className="input h-10" value={form.paymentTerms} onChange={set('paymentTerms')}>
              <option value="">Company default</option>
              {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select></div>
          <div><label className="label">Credit limit (₹)</label>
            <input type="number" min={0} className="input h-10" placeholder="0 = no limit" value={form.creditLimit} onChange={set('creditLimit')} /></div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.remindersEnabled} onChange={set('remindersEnabled')} />
              Send automatic payment reminders
            </label>
          </div>
          <ExtraFields state={extra} />
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
            {saving ? 'Saving…' : editing ? 'Save changes' : `Add ${one}`}
          </button>
        </div>
      </Modal>
    </div>
  )
}
