'use client'
/*
 * FINVOSMART — Finvosmart by Navgrow
 *
 * Copyright (c) 2025-2026 Navgrow Engineering Service Pvt. Ltd.
 * CIN: U29302WB2025PTC281015
 *
 * All rights reserved. This source code is proprietary and confidential.
 * Unauthorized copying, distribution, modification, or use of this file,
 * via any medium, is strictly prohibited without prior written permission.
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { UserPlus, Users } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { posApi } from '@/lib/api/store'
import { useDebounce } from '@/lib/hooks'
import { inr } from '@/lib/money'

/** The customer on a counter bill: one of the company's (id), or a new one by mobile number (the server adds them). */
export interface BillCustomer { id?: string; name: string; phone?: string | null; gstin?: string | null; outstanding?: number | null }

const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/

/** Find the customer by mobile number or name, add a new one by mobile number, or go back to a walk-in bill. */
export function CustomerPicker({ current, onPick, onClose }: {
  current: BillCustomer | null; onPick: (c: BillCustomer | null) => void; onClose: () => void
}) {
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', gstin: '' })
  const dq = useDebounce(q.trim(), 250)
  const { data: found = [], isFetching } = useQuery({
    queryKey: ['pos-customers', dq], queryFn: () => posApi.customers(dq), enabled: dq.length >= 2, staleTime: 30_000,
  })
  const digits = form.phone.replace(/\D/g, '')
  const phoneOk = digits.length === 10 && digits[0] >= '6'
  const gstin = form.gstin.trim().toUpperCase()
  const gstinOk = !gstin || GSTIN.test(gstin)
  const startAdding = () => {
    const d = q.replace(/\D/g, '')
    setForm({ name: d.length >= 6 ? '' : q.trim(), phone: d.length >= 6 ? d.slice(-10) : '', gstin: '' })
    setAdding(true)
  }
  return (
    <Modal open onClose={onClose} title="Customer" subtitle="Find them by mobile number or name — or add them. A bill with no customer is a walk-in sale." size="md">
      {!adding ? (
        <div className="space-y-3" data-testid="pos-customer-picker">
          <input className="input h-11" autoFocus placeholder="Mobile number or name" aria-label="Find a customer" value={q} onChange={e => setQ(e.target.value)} />
          <div className="max-h-72 overflow-y-auto space-y-1">
            {dq.length >= 2 && !isFetching && found.length === 0 && <p className="text-sm py-2" style={{ color: 'var(--text-muted)' }}>No customer matches “{dq}”.</p>}
            {found.map(c => (
              <button key={c.id} className="w-full text-left rounded-xl px-3 py-2.5 flex items-center justify-between gap-3 hover:opacity-90"
                style={{ border: '1px solid var(--border)' }} onClick={() => onPick({ id: c.id, name: c.name, phone: c.phone, gstin: c.gstin, outstanding: c.outstanding })}>
                <span><span className="font-medium">{c.name}</span>
                  <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>{[c.phone, c.gstin].filter(Boolean).join(' · ') || 'No mobile number'}</span></span>
                {Number(c.outstanding) > 0 && <span className="text-xs font-mono" style={{ color: '#b45309' }}>Owes {inr(c.outstanding)}</span>}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <button className="btn-secondary h-10" onClick={startAdding} data-testid="pos-customer-new"><UserPlus className="w-4 h-4" aria-hidden />New customer</button>
            {current && <button className="btn-ghost h-10" onClick={() => onPick(null)}><Users className="w-4 h-4" aria-hidden />Walk-in instead</button>}
          </div>
        </div>
      ) : (
        <form className="space-y-3" onSubmit={e => {
          e.preventDefault()
          if (!phoneOk || !gstinOk) return
          onPick({ name: form.name.trim() || `Customer ${digits}`, phone: digits, gstin: gstin || null })
        }}>
          <div><label className="label label-required">Mobile number</label>
            <input className="input h-10 font-mono" inputMode="numeric" maxLength={14} autoFocus value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} aria-label="Mobile number" />
            {form.phone && !phoneOk && <p className="text-xs mt-1" style={{ color: '#b91c1c' }}>Enter a 10-digit Indian mobile number.</p>}</div>
          <div><label className="label">Name</label><input className="input h-10" maxLength={200} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} aria-label="Name" /></div>
          <div><label className="label">GSTIN (for a business buying)</label>
            <input className="input h-10 font-mono uppercase" maxLength={15} value={form.gstin} onChange={e => setForm({ ...form, gstin: e.target.value })} aria-label="GSTIN" />
            {!gstinOk && <p className="text-xs mt-1" style={{ color: '#b91c1c' }}>That isn&apos;t a valid GSTIN.</p>}</div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>If this number is already a customer of yours, the bill goes to them; otherwise they are added when the bill is made.</p>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary h-10" onClick={() => setAdding(false)}>Back</button>
            <button className="btn-primary h-10" disabled={!phoneOk || !gstinOk}>Use this customer</button>
          </div>
        </form>
      )}
    </Modal>
  )
}
