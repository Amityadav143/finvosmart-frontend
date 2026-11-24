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
import { ArrowLeft, ArrowRight, Plus, Printer } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { godownsApi, transfersApi } from '@/lib/api/store'
import { apiError } from '@/lib/apiError'
import { inr, todayIST } from '@/lib/money'
import { printHtml } from '@/lib/storeHelpers'
import { DocLinesTable, DocStatus, DraftLines, fmtDate, linesOut, type DraftLine } from '@/components/godown/GodownParts'
import { seller, transferHtml } from '@/components/godown/print'

/** Stock moved from one godown to another, with a delivery challan to go with the goods. */
export default function TransfersPage() {
  const { canAny } = usePermissions()
  const allowed = canAny('INVENTORY_VIEW', 'INVENTORY_ADJUST', 'INVENTORY_ADMIN')
  const mover = canAny('INVENTORY_ADJUST', 'INVENTORY_ADMIN')
  const [godownId, setGodownId] = useState('')
  const [page, setPage] = useState(0)
  const [making, setMaking] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const { data: godowns = [] } = useQuery({ queryKey: ['godowns'], queryFn: godownsApi.list, enabled: allowed })
  const { data, isLoading } = useQuery({ queryKey: ['transfers', godownId, page], queryFn: () => transfersApi.list({ godownId: godownId || undefined, page, size: 20 }), enabled: allowed })
  if (!allowed) return <PermissionGate anyOf={['INVENTORY_VIEW', 'INVENTORY_ADJUST', 'INVENTORY_ADMIN']} showDenied><span /></PermissionGate>
  const rows = data?.content ?? []
  const active = godowns.filter(g => g.active)
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link href="/inventory/godowns" className="text-xs inline-flex items-center gap-1 mb-1" style={{ color: 'var(--text-muted)' }}><ArrowLeft className="w-3 h-3" aria-hidden />Godowns</Link>
          <h1 className="page-title">Stock transfers</h1>
          <p className="page-subtitle">Goods moved between your godowns. The stock leaves one and arrives in the other at once; print the challan to send with them.</p>
        </div>
        <div className="flex gap-2">
          <select className="input h-10 w-52" aria-label="Godown" value={godownId} onChange={e => { setGodownId(e.target.value); setPage(0) }}>
            <option value="">All godowns</option>{godowns.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          {mover && <button className="btn-primary h-10" disabled={active.length < 2} title={active.length < 2 ? 'Add a second godown first' : undefined} onClick={() => setMaking(true)} data-testid="transfer-new"><Plus className="w-4 h-4" aria-hidden />New transfer</button>}
        </div>
      </div>
      {active.length < 2 && <p className="text-sm rounded-xl px-4 py-3" style={{ background: 'var(--gold-muted)' }}>Transfers need two godowns. <Link href="/inventory/godowns" className="underline">Add a godown</Link> first.</p>}
      <div className="table-wrap">
        <table className="w-full text-sm" data-testid="transfer-list">
          <thead><tr>{['Number', 'Date', 'From', 'To', 'Lines', 'Value', 'By', 'Status'].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
          <tbody>
            {isLoading ? <tr><td className="table-cell" colSpan={8}>Loading…</td></tr>
              : rows.length === 0 ? <tr><td className="table-cell" colSpan={8} style={{ color: 'var(--text-muted)' }}>No transfers yet.</td></tr>
              : rows.map(t => (
                <tr key={t.id} className="table-row cursor-pointer" onClick={() => setOpen(t.id)}>
                  <td className="table-cell font-mono">{t.number}</td><td className="table-cell">{fmtDate(t.date)}</td>
                  <td className="table-cell">{t.from}</td><td className="table-cell">{t.to}</td><td className="table-cell">{t.lines}</td>
                  <td className="table-cell font-mono">{t.value != null ? inr(t.value) : ''}</td><td className="table-cell text-xs">{t.by ?? ''}</td>
                  <td className="table-cell"><DocStatus status={t.status} /></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {(data?.totalPages ?? 0) > 1 && (
        <div className="flex justify-between items-center text-sm">
          <button className="btn-secondary h-9" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Newer</button>
          <span style={{ color: 'var(--text-muted)' }}>Page {page + 1} of {data?.totalPages}</span>
          <button className="btn-secondary h-9" disabled={page + 1 >= (data?.totalPages ?? 1)} onClick={() => setPage(p => p + 1)}>Older</button>
        </div>
      )}
      {making && <NewTransfer onClose={() => setMaking(false)} onMade={id => { setMaking(false); setOpen(id) }} />}
      {open && <TransferView id={open} mover={mover} onClose={() => setOpen(null)} />}
    </div>
  )
}

function NewTransfer({ onClose, onMade }: { onClose: () => void; onMade: (id: string) => void }) {
  const qc = useQueryClient()
  const { data: godowns = [] } = useQuery({ queryKey: ['godowns'], queryFn: godownsApi.list })
  const active = godowns.filter(g => g.active)
  const [from, setFrom] = useState(active.find(g => g.main)?.id ?? active[0]?.id ?? '')
  const [to, setTo] = useState(active.find(g => g.id !== from)?.id ?? '')
  const [date, setDate] = useState(todayIST())
  const [vehicleNo, setVehicleNo] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<DraftLine[]>([])
  const out = linesOut(lines)
  const problem = !from || !to ? 'Choose both godowns.' : from === to ? 'Choose two different godowns.' : out.problem
  const save = useMutation({
    mutationFn: () => transfersApi.create({ fromGodownId: from, toGodownId: to, date, vehicleNo: vehicleNo.trim().toUpperCase() || undefined, notes: notes.trim() || undefined, lines: out.lines }),
    onSuccess: t => { toast.success(`Transfer ${t.number} done`); qc.invalidateQueries({ queryKey: ['transfers'] }); qc.invalidateQueries({ queryKey: ['godown-stock'] }); qc.invalidateQueries({ queryKey: ['godowns'] }); onMade(t.id) },
    onError: (e: any) => toast.error(apiError(e, 'The transfer could not be made')),
  })
  return (
    <Modal open onClose={onClose} title="New stock transfer" subtitle="What leaves one godown arrives in the other. Batches go first-to-expire unless you choose one." size="xl">
      <div className="space-y-4" data-testid="transfer-form">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
          <div><label className="label label-required">From</label>
            <select className="input h-10" value={from} onChange={e => { setFrom(e.target.value); setLines(ls => ls.map(l => ({ ...l, batchId: '', inSource: null }))) }} aria-label="From godown">
              {active.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
          <ArrowRight className="w-5 h-5 mb-2.5 hidden sm:block" style={{ color: 'var(--text-muted)' }} aria-hidden />
          <div><label className="label label-required">To</label>
            <select className="input h-10" value={to} onChange={e => setTo(e.target.value)} aria-label="To godown">
              <option value="">Choose…</option>{active.filter(g => g.id !== from).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><label className="label">Date</label><input className="input h-10" type="date" max={todayIST()} value={date} onChange={e => setDate(e.target.value)} /></div>
          <div><label className="label">Vehicle number</label><input className="input h-10 font-mono uppercase" maxLength={20} value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} placeholder="WB 02 AB 1234" /></div>
          <div><label className="label">Notes</label><input className="input h-10" maxLength={500} value={notes} onChange={e => setNotes(e.target.value)} /></div>
        </div>
        <DraftLines lines={lines} onChange={setLines} godownId={from} />
        <div className="flex items-center justify-between gap-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-sm" style={{ color: problem ? '#b91c1c' : 'var(--text-muted)' }}>{problem ?? `${lines.length} item${lines.length === 1 ? '' : 's'} to move`}</p>
          <div className="flex gap-2"><button className="btn-secondary h-10" onClick={onClose}>Cancel</button>
            <button className="btn-primary h-10" disabled={!!problem || save.isPending} onClick={() => save.mutate()} data-testid="transfer-save">{save.isPending ? 'Moving…' : 'Move the stock'}</button></div>
        </div>
      </div>
    </Modal>
  )
}

function TransferView({ id, mover, onClose }: { id: string; mover: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const { data: t, isLoading } = useQuery({ queryKey: ['transfer', id], queryFn: () => transfersApi.get(id) })
  const [cancelling, setCancelling] = useState(false)
  const [reason, setReason] = useState('')
  const cancel = useMutation({
    mutationFn: () => transfersApi.cancel(id, reason.trim()),
    onSuccess: () => { toast.success('Transfer cancelled — the stock is back'); qc.invalidateQueries({ queryKey: ['transfer', id] }); qc.invalidateQueries({ queryKey: ['transfers'] }); qc.invalidateQueries({ queryKey: ['godown-stock'] }); setCancelling(false) },
    onError: (e: any) => toast.error(apiError(e, 'The transfer could not be cancelled')),
  })
  const print = async () => { if (t) printHtml(transferHtml(t, await seller())) }
  return (
    <Modal open onClose={onClose} title={t ? `Transfer ${t.number}` : 'Transfer'} subtitle={t ? `${t.fromGodown} → ${t.toGodown} · ${fmtDate(t.date)}` : undefined} size="xl">
      {isLoading || !t ? <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p> : (
        <div className="space-y-4" data-testid="transfer-view">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span><DocStatus status={t.status} /></span>
            {t.vehicleNo && <span>Vehicle <b className="font-mono">{t.vehicleNo}</b></span>}
            {t.createdBy && <span style={{ color: 'var(--text-muted)' }}>by {t.createdBy}</span>}
            <span className="font-mono">{inr(t.value)}</span>
          </div>
          {t.notes && <p className="text-sm">{t.notes}</p>}
          {t.status === 'CANCELLED' && <p className="text-sm" style={{ color: '#b91c1c' }}>Cancelled{t.cancelReason ? `: ${t.cancelReason}` : ''}</p>}
          <DocLinesTable lines={t.lines} value />
          {cancelling ? (
            <div className="rounded-xl p-3 space-y-2" style={{ border: '1px solid #fca5a5' }}>
              <p className="text-sm">Cancelling takes the stock back out of {t.toGodown} and returns it to {t.fromGodown}.</p>
              <input className="input h-10" maxLength={300} autoFocus placeholder="Why" aria-label="Why it is cancelled" value={reason} onChange={e => setReason(e.target.value)} />
              <div className="flex justify-end gap-2"><button className="btn-secondary h-9" onClick={() => setCancelling(false)}>Keep it</button>
                <button className="btn-danger h-9" disabled={!reason.trim() || cancel.isPending} onClick={() => cancel.mutate()}>Cancel the transfer</button></div>
            </div>
          ) : (
            <div className="flex justify-between gap-2">
              {mover && t.status === 'DONE' ? <button className="btn-ghost h-10" onClick={() => setCancelling(true)}>Cancel transfer</button> : <span />}
              <button className="btn-primary h-10" onClick={print} data-testid="transfer-print"><Printer className="w-4 h-4" aria-hidden />Print challan</button>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
