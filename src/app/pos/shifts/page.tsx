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
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Printer } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { posApi } from '@/lib/api/store'
import { inr } from '@/lib/money'
import { PAY_LABEL, printHtml, shiftReportHtml } from '@/lib/storeHelpers'
import type { PosSession } from '@/types/store'

const at = (iso?: string | null) => !iso ? '' : new Date(/([zZ]|[+-]\d{2}:?\d{2})$/.test(iso) ? iso : iso + '+05:30')
  .toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

/** Shifts at the counters, newest first — your own, or everyone's for a manager — with each shift's report. */
export default function PosShiftsPage() {
  const { canAny } = usePermissions()
  const allowed = canAny('POS_SELL', 'POS_MANAGE')
  const [registerId, setRegisterId] = useState('')
  const [page, setPage] = useState(0)
  const [open, setOpen] = useState<PosSession | null>(null)
  const { data: registers = [] } = useQuery({ queryKey: ['pos-registers'], queryFn: posApi.registers, enabled: allowed })
  const { data, isLoading } = useQuery({
    queryKey: ['pos-sessions', registerId, page],
    queryFn: () => posApi.sessions({ registerId: registerId || undefined, page, size: 20 }),
    enabled: allowed,
  })
  if (!allowed) return <PermissionGate anyOf={['POS_SELL', 'POS_MANAGE']} showDenied><span /></PermissionGate>
  const rows = data?.content ?? []
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link href="/pos" className="text-xs inline-flex items-center gap-1 mb-1" style={{ color: 'var(--text-muted)' }}><ArrowLeft className="w-3 h-3" aria-hidden />Counter billing</Link>
          <h1 className="page-title">Shifts</h1>
          <p className="page-subtitle">Each shift's bills, money by way of payment, and the cash drawer at closing.</p>
        </div>
        <select className="input h-10 w-56" aria-label="Counter" value={registerId} onChange={e => { setRegisterId(e.target.value); setPage(0) }}>
          <option value="">All counters</option>
          {registers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>
      <div className="table-wrap">
        <table className="w-full text-sm" data-testid="pos-shifts">
          <thead><tr>{['Counter', 'Opened', 'Closed', 'Bills', 'Sales', 'Cash expected', 'Counted', 'Difference', ''].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
          <tbody>
            {isLoading ? <tr><td className="table-cell" colSpan={9}>Loading…</td></tr>
              : rows.length === 0 ? <tr><td className="table-cell" colSpan={9} style={{ color: 'var(--text-muted)' }}>No shifts yet.</td></tr>
              : rows.map(s => {
                const d = Number(s.difference ?? 0)
                return (
                  <tr key={s.id} className="table-row">
                    <td className="table-cell font-medium">{s.register}</td>
                    <td className="table-cell">{at(s.openedAt)}<span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{s.openedBy}</span></td>
                    <td className="table-cell">{s.status === 'OPEN' ? <span className="badge" style={{ background: 'rgba(22,163,74,0.12)', color: '#15803d' }}>Open</span>
                      : <>{at(s.closedAt)}<span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{s.closedBy}</span></>}</td>
                    <td className="table-cell font-mono">{s.bills}</td>
                    <td className="table-cell font-mono">{inr(s.sales)}</td>
                    <td className="table-cell font-mono">{s.expectedCash != null ? inr(s.expectedCash) : '—'}</td>
                    <td className="table-cell font-mono">{s.countedCash != null ? inr(s.countedCash) : '—'}</td>
                    <td className="table-cell font-mono" style={{ color: s.status === 'CLOSED' ? (d === 0 ? '#15803d' : '#b91c1c') : undefined }}>{s.status === 'CLOSED' ? (d === 0 ? 'Matched' : `${d < 0 ? '−' : '+'}${inr(Math.abs(d))}`) : '—'}</td>
                    <td className="table-cell"><button className="btn-ghost h-8 text-xs" onClick={() => setOpen(s)}>Report</button></td>
                  </tr>
                )
              })}
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
      {open && <ShiftReportModal session={open} width={registers.find(r => r.id === open.registerId)?.receiptWidth ?? 80} onClose={() => setOpen(null)} />}
    </div>
  )
}

function ShiftReportModal({ session, width, onClose }: { session: PosSession; width: 58 | 80; onClose: () => void }) {
  const { data: rep, isLoading } = useQuery({ queryKey: ['pos-report', session.id], queryFn: () => posApi.report(session.id) })
  const { data: state } = useQuery({ queryKey: ['pos-state'], queryFn: posApi.state, staleTime: 60_000 })
  return (
    <Modal open onClose={onClose} title={`${session.register} · ${at(session.openedAt)}`} subtitle={session.status === 'OPEN' ? 'Still open — the report so far' : `Closed ${at(session.closedAt)}`} size="lg">
      {isLoading || !rep ? <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p> : (
        <div className="space-y-4" data-testid="pos-shift-report">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[['Bills', String(rep.bills)], ['Sales', inr(rep.sales)], [`Returns (${rep.returns})`, inr(rep.returnsTotal)], ['Net', inr(rep.net)]].map(([k, v]) => (
              <div key={k} className="rounded-xl p-3" style={{ border: '1px solid var(--border)' }}><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{k}</p><p className="font-semibold font-mono">{v}</p></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <table className="w-full text-sm"><tbody>
              <tr><td className="font-semibold pb-1" colSpan={3}>By way of payment</td></tr>
              {rep.byMode.filter(m => Number(m.in) > 0 || Number(m.out) > 0).map(m => (
                <tr key={m.mode}><td>{PAY_LABEL[m.mode]}</td><td className="text-right font-mono">{inr(m.in)}</td><td className="text-right font-mono" style={{ color: 'var(--text-muted)' }}>{Number(m.out) > 0 ? `−${inr(m.out)}` : ''}</td></tr>
              ))}
              <tr><td className="pt-2">GST in the sales</td><td className="pt-2 text-right font-mono" colSpan={2}>{inr(rep.tax)}</td></tr>
            </tbody></table>
            <table className="w-full text-sm"><tbody>
              <tr><td className="font-semibold pb-1" colSpan={2}>The cash drawer</td></tr>
              <tr><td>Opened with</td><td className="text-right font-mono">{inr(rep.session.openingCash)}</td></tr>
              {rep.cashMoves.map(m => <tr key={m.id}><td>{m.direction === 'IN' ? 'Put in' : 'Taken out'}: {m.reason}</td><td className="text-right font-mono">{m.direction === 'IN' ? '' : '−'}{inr(m.amount)}</td></tr>)}
              <tr><td>Expected</td><td className="text-right font-mono">{inr(rep.expectedCash)}</td></tr>
              {rep.session.countedCash != null && <tr><td>Counted</td><td className="text-right font-mono">{inr(rep.session.countedCash)}</td></tr>}
              {rep.session.closeNote && <tr><td colSpan={2} className="text-xs" style={{ color: 'var(--text-muted)' }}>{rep.session.closeNote}</td></tr>}
            </tbody></table>
          </div>
          {rep.billRows.length > 0 && (
            <details>
              <summary className="text-sm cursor-pointer">The latest bills ({rep.billRows.length}{rep.bills + rep.returns > rep.billRows.length ? ` of ${rep.bills + rep.returns}` : ''})</summary>
              <div className="table-wrap mt-2"><table className="w-full text-xs"><tbody>
                {rep.billRows.map(b => <tr key={b.saleId} className="table-row"><td className="table-cell font-mono">{b.number}</td><td className="table-cell">{at(b.at)}</td><td className="table-cell">{b.customer}</td><td className="table-cell">{b.modes}</td><td className="table-cell font-mono text-right">{b.kind === 'RETURN' ? '−' : ''}{inr(b.total)}</td></tr>)}
              </tbody></table></div>
            </details>
          )}
          <div className="flex justify-end"><button className="btn-secondary h-10" onClick={() => printHtml(shiftReportHtml(rep, state?.company ?? '', width))}><Printer className="w-4 h-4" aria-hidden />Print the report</button></div>
        </div>
      )}
    </Modal>
  )
}
