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
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, Plus } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { godownsApi, posApi } from '@/lib/api/store'
import { apiError } from '@/lib/apiError'
import type { PosRegister } from '@/types/store'

/** The counters (billing desks): each sells from one godown and prints 58 or 80 mm receipts with its own footer. */
export default function PosCountersPage() {
  const { can } = usePermissions()
  const allowed = can('POS_MANAGE')
  const { data: registers = [], isLoading } = useQuery({ queryKey: ['pos-registers'], queryFn: posApi.registers, enabled: allowed })
  const [edit, setEdit] = useState<PosRegister | 'new' | null>(null)
  if (!allowed) return <PermissionGate permission="POS_MANAGE" showDenied><span /></PermissionGate>
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link href="/pos" className="text-xs inline-flex items-center gap-1 mb-1" style={{ color: 'var(--text-muted)' }}><ArrowLeft className="w-3 h-3" aria-hidden />Counter billing</Link>
          <h1 className="page-title">Counters</h1>
          <p className="page-subtitle">A counter is a billing desk with its own cash drawer and shifts. It sells from the godown you choose.</p>
        </div>
        <button className="btn-primary h-10" onClick={() => setEdit('new')} data-testid="pos-counter-add"><Plus className="w-4 h-4" aria-hidden />Add counter</button>
      </div>
      <div className="table-wrap">
        <table className="w-full text-sm" data-testid="pos-counters">
          <thead><tr>{['Counter', 'Sells from', 'Receipt', 'Shift', ''].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
          <tbody>
            {isLoading ? <tr><td className="table-cell" colSpan={5}>Loading…</td></tr>
              : registers.length === 0 ? <tr><td className="table-cell" colSpan={5} style={{ color: 'var(--text-muted)' }}>No counters yet — add the first.</td></tr>
              : registers.map(r => (
                <tr key={r.id} className="table-row">
                  <td className="table-cell font-medium">{r.name}{!r.active && <span className="badge ml-2">Switched off</span>}</td>
                  <td className="table-cell">{r.godown}</td>
                  <td className="table-cell">{r.receiptWidth} mm{r.receiptFooter ? <span className="block text-xs truncate max-w-xs" style={{ color: 'var(--text-muted)' }}>{r.receiptFooter}</span> : null}</td>
                  <td className="table-cell">{r.openSession ? `Open — ${r.openSession.openedBy ?? ''}` : 'Closed'}</td>
                  <td className="table-cell"><button className="btn-ghost h-8 text-xs" onClick={() => setEdit(r)}>Edit</button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {edit && <CounterForm counter={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />}
    </div>
  )
}

function CounterForm({ counter, onClose }: { counter: PosRegister | null; onClose: () => void }) {
  const qc = useQueryClient()
  const { data: godowns = [] } = useQuery({ queryKey: ['godowns'], queryFn: godownsApi.list })
  const [f, setF] = useState({
    name: counter?.name ?? '', godownId: counter?.godownId ?? '', receiptWidth: counter?.receiptWidth ?? 80,
    receiptFooter: counter?.receiptFooter ?? '', active: counter?.active ?? true,
  })
  const save = useMutation({
    mutationFn: () => {
      const body = { name: f.name.trim(), godownId: f.godownId || null, receiptWidth: f.receiptWidth, receiptFooter: f.receiptFooter.trim(), active: f.active }
      return counter ? posApi.saveRegister(counter.id, body) : posApi.addRegister(body)
    },
    onSuccess: () => {
      toast.success(counter ? 'Counter saved' : 'Counter added')
      qc.invalidateQueries({ queryKey: ['pos-registers'] }); qc.invalidateQueries({ queryKey: ['pos-state'] })
      onClose()
    },
    onError: (e: any) => toast.error(apiError(e, 'The counter could not be saved')),
  })
  const usable = godowns.filter(g => g.active || g.id === counter?.godownId)
  return (
    <Modal open onClose={onClose} title={counter ? `Edit ${counter.name}` : 'Add a counter'} size="md">
      <form className="space-y-3" onSubmit={e => { e.preventDefault(); if (f.name.trim()) save.mutate() }}>
        <div><label className="label label-required">Name</label><input className="input h-10" maxLength={60} autoFocus value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Counter 1" /></div>
        <div><label className="label">Sells from the godown</label>
          <select className="input h-10" value={f.godownId} onChange={e => setF({ ...f, godownId: e.target.value })} aria-label="Godown">
            {!counter && <option value="">The main godown</option>}
            {usable.map(g => <option key={g.id} value={g.id}>{g.name}{g.main ? ' (main)' : ''}</option>)}
          </select>
          {counter?.openSession && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>A shift is open: bills from now on take stock from the godown chosen here.</p>}</div>
        <div><label className="label">Receipt printer paper</label>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Receipt width">
            {([80, 58] as const).map(w => (
              <button type="button" key={w} role="radio" aria-checked={f.receiptWidth === w} onClick={() => setF({ ...f, receiptWidth: w })} className="rounded-xl px-2 py-2 text-sm"
                style={{ border: `1px solid ${f.receiptWidth === w ? 'var(--gold)' : 'var(--border)'}`, background: f.receiptWidth === w ? 'var(--gold-muted)' : 'transparent' }}>{w} mm</button>
            ))}
          </div></div>
        <div><label className="label">Receipt footer</label><textarea className="input min-h-[70px] py-2" maxLength={300} value={f.receiptFooter} onChange={e => setF({ ...f, receiptFooter: e.target.value })}
          placeholder="Thank you! Goods once sold are exchanged within 7 days with the bill." /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={e => setF({ ...f, active: e.target.checked })} />Billing is on at this counter</label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary h-10" onClick={onClose}>Cancel</button>
          <button className="btn-primary h-10" disabled={!f.name.trim() || save.isPending}>{save.isPending ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  )
}
