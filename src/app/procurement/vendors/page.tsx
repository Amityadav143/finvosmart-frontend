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

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, FileUp, ScrollText, Truck } from 'lucide-react'
import { vendorsApi, billsApi, type VendorInput } from '@/lib/api/purchases'
import { DataTable } from '@/components/ui/Table'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { SearchInput } from '@/components/ui/SearchInput'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useDebounce } from '@/lib/hooks'
import { checkGstin } from '@/lib/gstin'
import { inr, PLACES_OF_SUPPLY } from '@/lib/money'
import { MSME_ACTIVITIES, MSME_CATEGORIES, TDS_NATURES, errText, msmeCovered } from '@/lib/purchases'
import type { Vendor } from '@/types'

const BLANK: VendorInput = {
  name: '', gstin: '', pan: '', contactPerson: '', email: '', phone: '', billingAddress: '', city: '', state: '',
  paymentTerms: '', bankAccount: '', bankIfsc: '', msmeCategory: '', msmeActivity: '', udyamNumber: '',
  tdsNature: '', tdsRate: '', expenseAccountCode: '', status: 'ACTIVE',
}

function VendorsInner() {
  const qc = useQueryClient()
  const params = useSearchParams()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState<Vendor | 'new' | null>(null)
  const { canAny } = usePermissions()
  const q = useDebounce(search, 300)

  useEffect(() => {
    if (params.get('new') === '1') setEditing('new')
    if (params.get('q')) setSearch(params.get('q')!)
    const id = params.get('open')
    if (id) vendorsApi.get(id).then(v => setEditing(v)).catch(e => toast.error(errText(e, 'That supplier could not be opened')))
  }, [params])

  const { data, isLoading } = useQuery({ queryKey: ['vendors', q, page], queryFn: () => vendorsApi.list({ size: 25, page, q: q || undefined }) })
  const vendors = data?.content ?? []

  const columns = [
    { header: 'Supplier', render: (v: Vendor) => (
      <div>
        <p className="font-semibold text-sm">{v.name}{msmeCovered(v.msmeCategory, v.msmeActivity) && <span className="ml-2 badge s-amber">MSME · {String(v.msmeCategory).toLowerCase()}</span>}</p>
        <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{v.vendorCode ?? ''}</p>
      </div>
    ) },
    { header: 'GSTIN / PAN', render: (v: Vendor) => <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{v.gstin ?? v.pan ?? '—'}</span> },
    { header: 'Location', render: (v: Vendor) => <span className="text-xs">{[v.city, v.state].filter(Boolean).join(', ') || '—'}</span> },
    { header: 'TDS', render: (v: Vendor) => <span className="text-xs">{v.tdsNature ? TDS_NATURES.find(n => n.value === v.tdsNature)?.label : '—'}</span> },
    { header: 'Terms', render: (v: Vendor) => <span className="text-xs">{v.paymentTerms || '—'}</span> },
    { header: 'Balance', className: 'text-right', render: (v: Vendor) => <span className="font-mono text-sm">{Number(v.outstanding ?? 0) === 0 ? '—' : inr(v.outstanding)}</span> },
    { header: 'Status', render: (v: Vendor) => <Badge variant={(v.status ?? 'ACTIVE') === 'ACTIVE' ? 'success' : 'default'}>{(v.status ?? 'ACTIVE').toLowerCase()}</Badge> },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Suppliers</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>GSTIN, PAN for TDS, MSME status for the 45-day payment rule, and bank details</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/purchases" className="btn-secondary h-9 text-sm">Bills and payables</Link>
          <PermissionGate anyOf={['PROCUREMENT_CREATE', 'FINANCE_CREATE']}>
            <Link href="/import?kind=suppliers" className="btn-secondary h-9 text-sm"><FileUp className="w-4 h-4" />Import</Link>
            <button onClick={() => setEditing('new')} className="btn-primary h-9 text-sm"><Plus className="w-4 h-4" />Add supplier</button>
          </PermissionGate>
        </div>
      </div>

      <SearchInput value={search} onChange={v => { setSearch(v); setPage(0) }} placeholder="Search by name, email or GSTIN…" className="w-72" />
      <DataTable columns={columns} data={vendors} loading={isLoading} keyExtractor={(v: Vendor) => v.id} onRowClick={v => setEditing(v)}
        emptyMessage="No suppliers match."
        empty={search ? undefined : (
          <EmptyState compact icon={Truck} title="No suppliers yet"
            description="Add the businesses you buy from — with their Udyam (MSME) status, Finvosmart tracks the 45-day pay-by date for you. You can also add them as you enter bills."
            action={canAny('PROCUREMENT_CREATE', 'FINANCE_CREATE') ? { label: 'Add a supplier', onClick: () => setEditing('new') } : undefined}
            secondary={canAny('PROCUREMENT_CREATE', 'FINANCE_CREATE') ? { label: 'Import from Excel', href: '/import?kind=suppliers' } : undefined} />
        )} />
      {data && data.totalPages > 1 && <Pagination currentPage={data.currentPage} totalPages={data.totalPages} onPageChange={setPage} totalElements={data.totalElements} pageSize={25} />}

      {editing && <VendorModal vendor={editing === 'new' ? null : editing} onClose={() => setEditing(null)}
        onSaved={() => { qc.invalidateQueries({ queryKey: ['vendors'] }); setEditing(null) }} />}
    </div>
  )
}

function VendorModal({ vendor, onClose, onSaved }: { vendor: Vendor | null; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<VendorInput>(() => vendor ? {
    ...BLANK, ...Object.fromEntries(Object.entries(vendor).map(([k, v]) => [k, v ?? ''])),
    tdsRate: vendor.tdsRate == null ? '' : String(vendor.tdsRate),
  } as VendorInput : { ...BLANK })
  const { data: accounts = [] } = useQuery({ queryKey: ['bill-accounts'], queryFn: billsApi.accounts })
  const set = (k: keyof VendorInput, v: any) => setF(x => ({ ...x, [k]: v }))
  const g = f.gstin ? checkGstin(String(f.gstin)) : null

  const save = useMutation({
    mutationFn: () => {
      const body: VendorInput = { ...f, tdsRate: f.tdsRate === '' ? null : f.tdsRate, gstin: g?.gstin || '' }
      return vendor ? vendorsApi.update(vendor.id, body) : vendorsApi.create(body)
    },
    onSuccess: v => { toast.success(vendor ? 'Supplier saved' : `${v.name} added`); onSaved() },
    onError: (e: any) => toast.error(errText(e, 'The supplier could not be saved')),
  })

  const problems: string[] = []
  if (!String(f.name ?? '').trim()) problems.push('Enter the name')
  if (g && !g.valid) problems.push(`GSTIN: ${g.problems[0]}`)
  if (f.udyamNumber && !/^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/i.test(String(f.udyamNumber).trim())) problems.push('A Udyam number looks like UDYAM-MH-19-0012345')
  if (f.udyamNumber && !f.msmeCategory) problems.push('Choose the MSME category on their Udyam certificate')

  return (
    <Modal open onClose={onClose} title={vendor ? vendor.name : 'Add a supplier'} subtitle={vendor?.vendorCode} size="lg">
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2"><label className="label label-required">Name</label><input className="input h-10" value={String(f.name ?? '')} maxLength={200} onChange={e => set('name', e.target.value)} placeholder="As on their GST registration" /></div>
          <div><label className="label">GSTIN</label>
            <input className="input h-10 font-mono uppercase" value={String(f.gstin ?? '')} maxLength={15} onChange={e => set('gstin', e.target.value.toUpperCase().replace(/\s/g, ''))} placeholder="Unregistered supplier" />
            {g && !g.valid && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{g.problems[0]}</p>}
            {g?.valid && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{g.stateName} · PAN {g.pan} ({g.panHolder})</p>}</div>
          <div><label className="label">PAN</label>
            <input className="input h-10 font-mono uppercase" value={String(f.pan ?? '')} maxLength={10} onChange={e => set('pan', e.target.value.toUpperCase())} placeholder={g?.valid ? g.pan : 'Needed for TDS'} /></div>
          <div><label className="label">Contact person</label><input className="input h-10" value={String(f.contactPerson ?? '')} onChange={e => set('contactPerson', e.target.value)} /></div>
          <div><label className="label">Email</label><input className="input h-10" type="email" value={String(f.email ?? '')} onChange={e => set('email', e.target.value)} /></div>
          <div><label className="label">Phone</label><input className="input h-10" value={String(f.phone ?? '')} maxLength={15} onChange={e => set('phone', e.target.value)} /></div>
          <div><label className="label">City</label><input className="input h-10" value={String(f.city ?? '')} onChange={e => set('city', e.target.value)} /></div>
          {!g?.valid && (
            <div><label className="label">State</label>
              <select className="input h-10" value={String(f.state ?? '')} onChange={e => set('state', e.target.value)}>
                <option value="">—</option>
                {PLACES_OF_SUPPLY.map(p => <option key={p.code} value={p.name}>{p.name}</option>)}
              </select></div>
          )}
          <div><label className="label">Payment terms</label><input className="input h-10" value={String(f.paymentTerms ?? '')} maxLength={50} onChange={e => set('paymentTerms', e.target.value)} placeholder="Net 30" /></div>
          <div className="md:col-span-2"><label className="label">Address</label><textarea className="input" rows={2} value={String(f.billingAddress ?? '')} onChange={e => set('billingAddress', e.target.value)} /></div>
        </div>

        <div className="rounded-xl p-3 space-y-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <p className="text-sm font-semibold">MSME (Udyam) registration</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><label className="label">Category</label>
              <select className="input h-10" value={String(f.msmeCategory ?? '')} onChange={e => set('msmeCategory', e.target.value)}>
                <option value="">Not an MSME / not known</option>
                {MSME_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select></div>
            <div><label className="label">Activity</label>
              <select className="input h-10" value={String(f.msmeActivity ?? '')} onChange={e => set('msmeActivity', e.target.value)} disabled={!f.msmeCategory}>
                <option value="">—</option>
                {MSME_ACTIVITIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select></div>
            <div><label className="label">Udyam number</label><input className="input h-10 font-mono uppercase" value={String(f.udyamNumber ?? '')} maxLength={19} onChange={e => set('udyamNumber', e.target.value.toUpperCase())} placeholder="UDYAM-MH-19-0012345" disabled={!f.msmeCategory} /></div>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {msmeCovered(String(f.msmeCategory ?? ''), String(f.msmeActivity ?? ''))
              ? 'Their bills must be paid within the agreed period, and never later than 45 days after you accept the goods or services (15 days if no period is agreed). Bills show the date to pay by.'
              : f.msmeCategory ? 'Medium enterprises and traders aren’t covered by the 45-day rule.' : 'Ask the supplier for their Udyam certificate. Micro and small suppliers must be paid within 45 days.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2"><label className="label">TDS on their bills</label>
            <select className="input h-10" value={String(f.tdsNature ?? '')} onChange={e => set('tdsNature', e.target.value)}>
              {TDS_NATURES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
            </select>
            {f.tdsNature && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{TDS_NATURES.find(n => n.value === f.tdsNature)?.hint}</p>}</div>
          <div><label className="label">Fixed TDS rate % (optional)</label>
            <input className="input h-10 text-right" inputMode="decimal" value={String(f.tdsRate ?? '')} onChange={e => set('tdsRate', e.target.value)} disabled={!f.tdsNature} placeholder="Lower-deduction certificate" /></div>
          <div className="md:col-span-2"><label className="label">Book their bills to</label>
            <select className="input h-10" value={String(f.expenseAccountCode ?? '')} onChange={e => set('expenseAccountCode', e.target.value)}>
              <option value="">Purchases (default)</option>
              {accounts.map(a => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
            </select></div>
          <div><label className="label">Status</label>
            <select className="input h-10" value={String(f.status ?? 'ACTIVE')} onChange={e => set('status', e.target.value)}>
              <option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="BLACKLISTED">Blacklisted</option>
            </select></div>
          <div><label className="label">Bank account no.</label><input className="input h-10 font-mono" value={String(f.bankAccount ?? '')} maxLength={18} inputMode="numeric" onChange={e => set('bankAccount', e.target.value.replace(/\D/g, ''))} /></div>
          <div><label className="label">IFSC</label><input className="input h-10 font-mono uppercase" value={String(f.bankIfsc ?? '')} maxLength={11} onChange={e => set('bankIfsc', e.target.value.toUpperCase())} /></div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-sm" style={{ color: '#d97706' }}>{problems[0] ?? ''}</p>
          <div className="flex gap-2">
            {vendor && <Link href={`/statements/supplier/${vendor.id}`} className="btn-ghost h-10" data-testid="supplier-statement"><ScrollText className="w-4 h-4" />Statement</Link>}
            <button className="btn-secondary h-10" onClick={onClose}>Cancel</button>
            <PermissionGate anyOf={['PROCUREMENT_CREATE', 'FINANCE_CREATE']}>
              <button className="btn-primary h-10" onClick={() => save.mutate()} disabled={problems.length !== 0 || save.isPending}>{save.isPending ? 'Saving…' : vendor ? 'Save' : 'Add supplier'}</button>
            </PermissionGate>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default function VendorsPage() {
  return <Suspense fallback={null}><VendorsInner /></Suspense>
}
