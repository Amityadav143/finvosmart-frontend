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
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { CheckCircle2, LogIn, Monitor, Play, Printer, Settings2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { posApi } from '@/lib/api/store'
import { apiError } from '@/lib/apiError'
import { inr } from '@/lib/money'
import { PAY_LABEL, printHtml, shiftReportHtml } from '@/lib/storeHelpers'
import type { PosRegister, PosSession, PosState, ShiftReport } from '@/types/store'

const at = (iso: string) => new Date(/([zZ]|[+-]\d{2}:?\d{2})$/.test(iso) ? iso : iso + '+05:30')
  .toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

/**
 * Before billing: the counters, each closed or with its shift open. Open a shift with the cash in the drawer, carry
 * on with your own, or bill on a colleague's open shift (closing it stays theirs, or a manager's).
 */
export function PosStart({ state, onJoin }: { state: PosState; onJoin: (s: PosSession) => void }) {
  const qc = useQueryClient()
  const counters = state.registers.filter(r => r.active || state.admin)
  const [cash, setCash] = useState<Record<string, string>>({})
  const open = useMutation({
    mutationFn: (r: PosRegister) => posApi.open(r.id, Number(cash[r.id] || 0)),
    onSuccess: s => { toast.success(`Shift opened at ${s.register}`); qc.invalidateQueries({ queryKey: ['pos-state'] }); onJoin(s) },
    onError: (e: any) => toast.error(apiError(e, 'The shift could not be opened')),
  })
  const [name, setName] = useState('Counter 1')
  const add = useMutation({
    mutationFn: () => posApi.addRegister({ name: name.trim(), receiptWidth: 80 }),
    onSuccess: () => { toast.success('Counter added'); qc.invalidateQueries({ queryKey: ['pos-state'] }) },
    onError: (e: any) => toast.error(apiError(e, 'The counter could not be added')),
  })
  return (
    <div className="space-y-5" data-testid="pos-start">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="page-title">Counter billing</h1>
          <p className="page-subtitle">Scan, take cash, UPI or card, print the receipt. Every bill is a GST tax invoice, and the stock comes out of the counter&apos;s godown.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/pos/shifts" className="btn-secondary h-9">Shifts</Link>
          {state.admin && <Link href="/pos/counters" className="btn-secondary h-9"><Settings2 className="w-4 h-4" aria-hidden />Counters</Link>}
        </div>
      </div>

      {counters.length === 0 ? (
        <div className="card p-6 max-w-lg space-y-3">
          <Monitor className="w-8 h-8" style={{ color: 'var(--gold)' }} aria-hidden />
          <h2 className="font-semibold text-lg">Set up your first counter</h2>
          {state.admin ? (
            <>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>A counter is a billing desk with its own cash drawer and shifts. It sells from your main godown; choose another godown, the receipt width and its footer under Counters.</p>
              <form className="flex gap-2" onSubmit={e => { e.preventDefault(); if (name.trim()) add.mutate() }}>
                <input className="input h-10 flex-1" maxLength={60} value={name} onChange={e => setName(e.target.value)} aria-label="Counter's name" />
                <button className="btn-primary h-10" disabled={!name.trim() || add.isPending} data-testid="pos-add-first">{add.isPending ? 'Adding…' : 'Add counter'}</button>
              </form>
            </>
          ) : <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No counter is set up yet. Ask a manager to add one under Store → Counters.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {counters.map(r => {
            const s = r.openSession
            const yours = !!s && state.mine?.id === s.id
            return (
              <div key={r.id} className="card p-4 space-y-3" data-testid={`pos-register-${r.name}`}>
                <div className="flex items-start justify-between gap-2">
                  <div><h2 className="font-semibold">{r.name}</h2><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.godown} · {r.receiptWidth} mm receipts</p></div>
                  <span className="badge" style={s ? { background: 'rgba(22,163,74,0.12)', color: '#15803d' } : { background: 'var(--bg-subtle, rgba(0,0,0,0.05))', color: 'var(--text-muted)' }}>
                    {!r.active ? 'Switched off' : s ? 'Open' : 'Closed'}</span>
                </div>
                {s ? (
                  <>
                    <p className="text-sm">{yours ? 'Your shift' : `${s.openedBy ?? 'Someone'}'s shift`}, since {at(s.openedAt)} · {s.bills} bill{s.bills === 1 ? '' : 's'}, {inr(s.sales)}</p>
                    <button className="btn-primary h-10 w-full" onClick={() => onJoin(s)} data-testid={`pos-continue-${r.name}`}>
                      {yours ? <><Play className="w-4 h-4" aria-hidden />Carry on billing</> : <><LogIn className="w-4 h-4" aria-hidden />Bill on this shift</>}
                    </button>
                  </>
                ) : r.active ? (
                  <form className="space-y-2" onSubmit={e => { e.preventDefault(); open.mutate(r) }}>
                    <label className="label" htmlFor={`open-${r.id}`}>Cash in the drawer to start (₹)</label>
                    <div className="flex gap-2">
                      <input id={`open-${r.id}`} className="input h-10 flex-1 font-mono" type="number" min="0" step="0.01" placeholder="0"
                        value={cash[r.id] ?? ''} onChange={e => setCash({ ...cash, [r.id]: e.target.value })} />
                      <button className="btn-primary h-10" disabled={open.isPending} data-testid={`pos-open-${r.name}`}>Open shift</button>
                    </div>
                  </form>
                ) : <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Switch it on under Counters to bill here.</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** A shift just closed: the drawer's result, and its report to print (the day-end "Z report"). */
export function ShiftClosed({ report, company, width, onDone }: { report: ShiftReport; company: string; width: 58 | 80; onDone: () => void }) {
  const diff = Number(report.session.difference ?? 0)
  return (
    <Modal open onClose={onDone} title="Shift closed" subtitle={`${report.session.register} · ${report.bills} bill${report.bills === 1 ? '' : 's'} · net ${inr(report.net)}`} size="sm">
      <div className="space-y-4" data-testid="pos-closed">
        <div className="rounded-xl p-4 text-center" style={{ background: diff === 0 ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)' }}>
          <CheckCircle2 className="w-6 h-6 mx-auto mb-1" style={{ color: diff === 0 ? '#15803d' : '#b91c1c' }} aria-hidden />
          <p className="text-sm">{diff === 0 ? 'The drawer matched.' : `The drawer was ${inr(Math.abs(diff))} ${diff < 0 ? 'short' : 'over'}.`}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Expected {inr(report.expectedCash)} · counted {inr(report.session.countedCash ?? 0)}</p>
        </div>
        <table className="w-full text-sm"><tbody>
          {report.byMode.filter(m => Number(m.in) > 0 || Number(m.out) > 0).map(m => (
            <tr key={m.mode}><td>{PAY_LABEL[m.mode]}</td><td className="text-right font-mono">{inr(Number(m.in) - Number(m.out))}</td></tr>
          ))}
        </tbody></table>
        <div className="flex gap-2">
          <button className="btn-secondary h-10 flex-1" onClick={() => printHtml(shiftReportHtml(report, company, width))}><Printer className="w-4 h-4" aria-hidden />Print the report</button>
          <button className="btn-primary h-10 flex-1" onClick={onDone} autoFocus>Done</button>
        </div>
      </div>
    </Modal>
  )
}
