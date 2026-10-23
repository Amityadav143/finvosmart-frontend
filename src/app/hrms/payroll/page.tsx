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

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { CalendarClock, IndianRupee, Landmark, Play, Settings2, Users, Wallet } from 'lucide-react'
import { payrollApi, PAYROLL_STATUS_LABEL } from '@/lib/api/payroll'
import { DataTable } from '@/components/ui/Table'
import { StatusBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { formatDate } from '@/lib/utils'
import { inr, todayIST } from '@/lib/money'
import { errText } from '@/lib/purchases'
import type { PayrollRun } from '@/types/payroll'

const SEE = ['PAYROLL_PROCESS', 'PAYROLL_ADMIN', 'PAYROLL_REPORTS']
const PREPARE = ['PAYROLL_PROCESS', 'PAYROLL_ADMIN']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** Months payroll can be run for: next month back to 18 months ago, newest first. */
function monthOptions() {
  const [y, m] = todayIST().split('-').map(Number)
  const out: { year: number; month: number; label: string }[] = []
  for (let i = -1; i <= 18; i++) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1))
    out.push({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, label: `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}` })
  }
  return out
}

const lastDay = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10)

export default function PayrollPage() {
  const router = useRouter()
  const { canAny } = usePermissions()
  const allowed = canAny(...SEE)
  const [showRun, setShowRun] = useState(false)
  const { data: runs, isLoading, isError } = useQuery({ queryKey: ['payroll-runs'], queryFn: payrollApi.runs, enabled: allowed })

  const issued = (runs ?? []).filter(r => r.status === 'APPROVED' || r.status === 'PAID')
  const latest = issued[0]
  const recent = issued.slice(0, 6).reverse()
  const maxNet = Math.max(1, ...recent.map(r => Number(r.net)))

  if (!allowed) {
    return (
      <div className="space-y-4 max-w-xl">
        <h1 className="page-title">Payroll</h1>
        <PermissionGate anyOf={SEE} showDenied><div /></PermissionGate>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Looking for your own payslips? They are in <Link href="/self-service" className="underline">My Portal → Payslips</Link>.
        </p>
      </div>
    )
  }

  const columns = [
    {
      header: 'Month',
      render: (r: PayrollRun) => (
        <div>
          <p className="font-semibold text-sm">{r.label}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {r.status === 'PAID' && r.paidOn ? `Paid ${formatDate(r.paidOn)}` : r.payDate ? `Pay date ${formatDate(r.payDate)}` : ''}
          </p>
        </div>
      ),
    },
    { header: 'Status', render: (r: PayrollRun) => <StatusBadge status={r.status} label={PAYROLL_STATUS_LABEL[r.status] ?? r.status} /> },
    { header: 'Employees', className: 'text-right', render: (r: PayrollRun) => <span className="font-mono text-sm">{r.employees}</span> },
    { header: 'Gross pay', className: 'text-right', render: (r: PayrollRun) => <span className="font-mono text-sm">{inr(r.gross)}</span> },
    { header: 'Deductions', className: 'text-right', render: (r: PayrollRun) => <span className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>{inr(r.deductions)}</span> },
    { header: 'Net pay', className: 'text-right', render: (r: PayrollRun) => <span className="font-mono text-sm font-semibold">{inr(r.net)}</span> },
    { header: 'Cost to company', className: 'text-right', render: (r: PayrollRun) => <span className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>{inr(r.employerCost)}</span> },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Payroll</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Salaries under the new labour codes — PF, ESI, professional tax and TDS worked out, payslips for employees, and the payroll posted to your books
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <PermissionGate anyOf={PREPARE}>
            <Link href="/hrms/payroll/setup" className="btn-secondary h-9"><Settings2 size={15} />Salary set-up</Link>
            <button className="btn-primary h-9" onClick={() => setShowRun(true)}><Play size={15} />Run payroll</button>
          </PermissionGate>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Wallet} color="var(--gold)" label={latest ? `Net pay — ${latest.label}` : 'Net pay'} value={latest ? inr(latest.net) : '—'}
          sub={latest ? `${inr(latest.gross)} gross` : 'No approved payroll yet'} />
        <Stat icon={Users} color="#2563eb" label="Employees paid" value={latest ? String(latest.employees) : '—'} sub={latest ? latest.label : ''} />
        <Stat icon={IndianRupee} color="#7c3aed" label="Cost to company" value={latest ? inr(latest.employerCost) : '—'}
          sub={latest ? 'Pay plus employer PF and ESI' : ''} />
        <Stat icon={Landmark} color="#d97706" label="Statutory dues" value={latest ? inr(Number(latest.pf) + Number(latest.esi) + Number(latest.pt) + Number(latest.tds)) : '—'}
          sub={latest ? `PF ${inr(latest.pf)} · ESI ${inr(latest.esi)} · TDS ${inr(latest.tds)}` : ''} />
      </div>

      {recent.length > 1 && (
        <div className="card">
          <h3 className="font-semibold text-sm">Net pay by month</h3>
          <div className="mt-3 space-y-2">
            {recent.map(r => (
              <div key={r.id} className="flex items-center gap-3 text-sm">
                <span className="w-32 shrink-0" style={{ color: 'var(--text-secondary)' }}>{r.label}</span>
                <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
                  <div className="h-full rounded-full" style={{ width: `${(Number(r.net) / maxNet) * 100}%`, background: 'var(--gold)' }} />
                </div>
                <span className="font-mono w-32 text-right shrink-0">{inr(r.net)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isError ? (
        <div className="card text-sm" style={{ color: '#dc2626' }}>Payroll couldn't be loaded. Check your connection and try again.</div>
      ) : !isLoading && (runs ?? []).length === 0 ? (
        <div className="card">
          <h3 className="font-semibold">Run your first payroll</h3>
          <ol className="mt-3 space-y-2 text-sm list-decimal pl-5" style={{ color: 'var(--text-secondary)' }}>
            <li><Link href="/hrms/payroll/setup" className="underline">Set up salaries</Link> — monthly pay by component, PF, ESI, work state and tax regime for each employee.</li>
            <li>Run payroll for the month. Unpaid days come from attendance and approved leave without pay; PF, ESI, professional tax and TDS are worked out, and pay is checked against the labour codes' 50% wage rule.</li>
            <li>Review, adjust overtime, bonus or recoveries, then approve: employees get their payslips in My Portal and the payroll is posted to your books.</li>
            <li>Download the bank transfer file, PF ECR and ESI sheet, and mark salaries as paid.</li>
          </ol>
        </div>
      ) : (
        <DataTable columns={columns} data={runs ?? []} loading={isLoading} keyExtractor={r => r.id}
          onRowClick={r => router.push(`/hrms/payroll/${r.id}`)} emptyMessage="No payroll yet." />
      )}

      <RunPayrollModal open={showRun} onClose={() => setShowRun(false)} existing={runs ?? []}
        onCreated={id => { setShowRun(false); router.push(`/hrms/payroll/${id}`) }} />
    </div>
  )
}

function RunPayrollModal({ open, onClose, existing, onCreated }: {
  open: boolean; onClose: () => void; existing: PayrollRun[]; onCreated: (id: string) => void
}) {
  const options = useMemo(monthOptions, [])
  const [choice, setChoice] = useState(1)                       // index into options: this month
  const sel = options[choice]
  const [payDate, setPayDate] = useState('')
  const [busy, setBusy] = useState(false)
  const { data: setups } = useQuery({ queryKey: ['payroll-setups'], queryFn: payrollApi.setups, enabled: open })
  const done = existing.find(r => r.year === sel.year && r.month === sel.month)
  const ready = (setups ?? []).filter(s => s.hasSetup).length
  const notReady = (setups ?? []).filter(s => !s.hasSetup)

  const run = async () => {
    setBusy(true)
    try {
      const d = await payrollApi.create(sel.month, sel.year, payDate || lastDay(sel.year, sel.month))
      toast.success(`Payroll for ${sel.label} drafted`)
      onCreated(d.run.id)
    } catch (e) {
      toast.error(errText(e, 'Payroll could not be started'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Run payroll" subtitle="Works out every employee's pay for the month as a draft you can check before approving">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="pr-month">Month</label>
            <select id="pr-month" className="input h-10" value={choice} onChange={e => { setChoice(Number(e.target.value)); setPayDate('') }}>
              {options.map((o, i) => <option key={o.label} value={i}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="pr-date">Pay date</label>
            <input id="pr-date" type="date" className="input h-10" value={payDate || lastDay(sel.year, sel.month)} onChange={e => setPayDate(e.target.value)} />
          </div>
        </div>
        {done ? (
          <div className="rounded-xl px-4 py-3 text-sm" style={{ background: '#d9770612', border: '1px solid #d9770650' }}>
            There is already a payroll for {sel.label} ({PAYROLL_STATUS_LABEL[done.status] ?? done.status}). <Link href={`/hrms/payroll/${done.id}`} className="underline">Open it</Link>.
          </div>
        ) : (
          <div className="rounded-xl px-4 py-3 text-sm space-y-1" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <p><CalendarClock size={14} className="inline mr-1.5" style={{ color: 'var(--gold)' }} />
              {setups ? `${ready} employee${ready === 1 ? '' : 's'} with a salary set-up will be included.` : 'Checking salary set-ups…'}</p>
            {notReady.length > 0 && (
              <p style={{ color: '#b45309' }}>
                {notReady.length} without a salary set-up {notReady.length === 1 ? 'is' : 'are'} left out: {notReady.slice(0, 5).map(s => s.name).join(', ')}{notReady.length > 5 ? '…' : ''}.{' '}
                <Link href="/hrms/payroll/setup" className="underline">Set them up</Link>
              </p>
            )}
            <p style={{ color: 'var(--text-muted)' }}>Unpaid days are taken from attendance (absent, half days) and approved leave without pay — you can adjust them before approving.</p>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={run} disabled={busy || !!done}><Play size={15} />{busy ? 'Working it out…' : `Run payroll for ${sel.label}`}</button>
        </div>
      </div>
    </Modal>
  )
}

function Stat({ icon: Icon, color, label, value, sub }: { icon: any; color: string; label: string; value: string; sub?: string }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2"><Icon size={15} style={{ color }} /><span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span></div>
      <p className="font-serif text-2xl mt-1" style={{ color }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  )
}
