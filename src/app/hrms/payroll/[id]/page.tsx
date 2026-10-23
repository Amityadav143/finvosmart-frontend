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

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  AlertTriangle, ArrowLeft, Banknote, CheckCircle2, Download, FileText, Landmark, RefreshCw, RotateCcw, Trash2, Undo2,
} from 'lucide-react'
import { payrollApi, PAYROLL_STATUS_LABEL, runKey } from '@/lib/api/payroll'
import { StatusBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { formatDate } from '@/lib/utils'
import { inr, stateName, todayIST } from '@/lib/money'
import { errText } from '@/lib/purchases'
import type { PayrollItem, PayrollItemInput, PayrollRunDetail } from '@/types/payroll'

const SEE = ['PAYROLL_PROCESS', 'PAYROLL_ADMIN', 'PAYROLL_REPORTS']
const PREPARE = ['PAYROLL_PROCESS', 'PAYROLL_ADMIN']
const n = (x: unknown) => Number(x ?? 0)
const num = (x: unknown) => { const v = n(x); return Number.isInteger(v) ? String(v) : v.toFixed(1) }

export default function PayrollRunPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const { canAny } = usePermissions()
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['payroll-run', id], queryFn: () => payrollApi.get(id), enabled: canAny(...SEE) })
  const [open, setOpen] = useState<PayrollItem | null>(null)
  const [onlyWarnings, setOnlyWarnings] = useState(false)
  const [busy, setBusy] = useState('')
  const [confirm, setConfirm] = useState<'approve' | 'reopen' | 'delete' | 'unpay' | 'pay' | null>(null)

  const update = (d: PayrollRunDetail) => {
    qc.setQueryData(['payroll-run', id], d)
    qc.invalidateQueries({ queryKey: ['payroll-runs'] })
    if (open) setOpen(d.items.find(i => i.id === open.id) ?? null)
  }
  const act = async (what: string, fn: () => Promise<PayrollRunDetail>, ok: string) => {
    setBusy(what)
    try { update(await fn()); toast.success(ok); setConfirm(null) }
    catch (e) { toast.error(errText(e, 'That didn\'t work')) }
    finally { setBusy('') }
  }
  const dl = async (what: string, fn: () => Promise<void>) => {
    setBusy(what)
    try { await fn() } catch (e: any) {
      // file downloads come back as blobs; read the message out of the blob
      let msg = 'Download failed'
      try { const t = await e?.response?.data?.text?.(); const j = t ? JSON.parse(t) : null; msg = j?.message ?? j?.error ?? msg } catch { /* keep default */ }
      toast.error(msg)
    } finally { setBusy('') }
  }

  if (!canAny(...SEE)) return <PermissionGate anyOf={SEE} showDenied><div /></PermissionGate>
  if (isLoading) return <div className="card text-sm" style={{ color: 'var(--text-muted)' }}>Loading payroll…</div>
  if (isError || !data) return <div className="card text-sm" style={{ color: '#dc2626' }}>{errText(error, 'This payroll could not be loaded.')}</div>

  const { run, items, notSetUp, blockers, dues } = data
  const draft = run.status === 'DRAFT', issued = run.status === 'APPROVED' || run.status === 'PAID'
  const ym = runKey(run)
  const shown = onlyWarnings ? items.filter(i => i.warnings.length > 0) : items
  const leftOutOfBank = items.filter(i => n(i.netPay) > 0 && !i.bankReady).length
  const noUan = items.filter(i => i.pf.member && n(i.pf.epfWages) > 0 && !(i.uan && /^\d{12}$/.test(i.uan))).length
  const otherDed = (i: PayrollItem) => i.deductions.filter(d => !['PF', 'ESI', 'PT', 'TDS'].includes(d.code)).reduce((t, d) => t + n(d.amount), 0)

  return (
    <div className="space-y-5">
      <div>
        <Link href="/hrms/payroll" className="text-xs inline-flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><ArrowLeft size={13} />Payroll</Link>
        <div className="flex items-start justify-between gap-4 flex-wrap mt-1">
          <div>
            <h1 className="page-title flex items-center gap-3">Payroll — {run.label} <StatusBadge status={run.status} label={PAYROLL_STATUS_LABEL[run.status] ?? run.status} /></h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {run.employees} employee{run.employees === 1 ? '' : 's'}
              {run.payDate && ` · pay date ${formatDate(run.payDate)}`}
              {run.status === 'PAID' && run.paidOn && ` · paid ${formatDate(run.paidOn)} from ${run.paidFrom === 'CASH' ? 'cash' : 'the bank'}${run.paymentReference ? ` (ref ${run.paymentReference})` : ''}`}
              {run.approvedAt && run.status !== 'DRAFT' && ` · approved ${formatDate(run.approvedAt)}`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {draft && (
              <>
                <PermissionGate anyOf={PREPARE}>
                  <button className="btn-secondary h-9" disabled={!!busy} onClick={() => act('recalc', () => payrollApi.recalculate(run.id), 'Recalculated with the latest salaries and attendance')}>
                    <RefreshCw size={15} className={busy === 'recalc' ? 'animate-spin' : ''} />Recalculate
                  </button>
                  <button className="btn-secondary h-9" disabled={!!busy} onClick={() => setConfirm('delete')}><Trash2 size={15} />Delete draft</button>
                </PermissionGate>
                <PermissionGate permission="PAYROLL_ADMIN">
                  <button className="btn-primary h-9" onClick={() => setConfirm('approve')} disabled={!!busy || blockers.length !== 0} title={blockers[0]}>
                    <CheckCircle2 size={15} />Approve and post
                  </button>
                </PermissionGate>
              </>
            )}
            {run.status === 'APPROVED' && (
              <>
                <PermissionGate permission="PAYROLL_ADMIN">
                  <button className="btn-secondary h-9" disabled={!!busy} onClick={() => setConfirm('reopen')}><RotateCcw size={15} />Reopen</button>
                </PermissionGate>
                <PermissionGate anyOf={['PAYROLL_ADMIN', 'FINANCE_ADMIN']}>
                  <button className="btn-primary h-9" disabled={!!busy} onClick={() => setConfirm('pay')}><Banknote size={15} />Mark as paid</button>
                </PermissionGate>
              </>
            )}
            {run.status === 'PAID' && (
              <PermissionGate anyOf={['PAYROLL_ADMIN', 'FINANCE_ADMIN']}>
                <button className="btn-secondary h-9" disabled={!!busy} onClick={() => setConfirm('unpay')}><Undo2 size={15} />Undo payment</button>
              </PermissionGate>
            )}
          </div>
        </div>
      </div>

      {blockers.length > 0 && (
        <Banner tone="red" title="Fix these before approving">
          <ul className="list-disc pl-5 space-y-0.5">{blockers.map(b => <li key={b}>{b}</li>)}</ul>
        </Banner>
      )}
      {notSetUp.length > 0 && (
        <Banner tone="amber" title={`${notSetUp.length} employee${notSetUp.length === 1 ? ' is' : 's are'} due pay this month but ${notSetUp.length === 1 ? 'has' : 'have'} no salary set-up`}>
          {notSetUp.slice(0, 8).join(', ')}{notSetUp.length > 8 ? '…' : ''}. <Link href="/hrms/payroll/setup" className="underline">Set up their salaries</Link>, then recalculate.
        </Banner>
      )}
      {draft && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          This is a draft. Unpaid days come from attendance (absent, half days) and approved leave without pay. Click an employee to adjust unpaid days,
          overtime, bonus, recoveries or TDS. Approving issues the payslips to employees and posts the payroll to your books.
        </p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Figure label="Gross pay" value={inr(run.gross)} />
        <Figure label="Deductions" value={inr(run.deductions)} sub={`PF, ESI, PT, TDS and recoveries`} />
        <Figure label="Net pay" value={inr(run.net)} strong />
        <Figure label="Cost to company" value={inr(run.employerCost)} sub="Pay plus employer PF and ESI" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card lg:col-span-2">
          <h3 className="font-semibold text-sm flex items-center gap-2"><Landmark size={15} style={{ color: 'var(--gold)' }} />Statutory payments for {run.label}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-sm">
            <Due label="PF (both shares, EDLI, admin)" amount={dues.pf} due={dues.pfDue} />
            <Due label="ESI (both shares)" amount={dues.esi} due={dues.esiDue} />
            <Due label="Professional tax" amount={dues.pt} due={null} note="By your state's due date" />
            <Due label="TDS on salaries" amount={dues.tds} due={dues.tdsDue} />
          </div>
          <ul className="mt-4 pt-3 space-y-1.5 text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <li><strong>PF:</strong> upload the ECR file on the EPFO employer portal and pay the challan it generates.</li>
            <li><strong>ESI:</strong> upload the contribution sheet on the ESIC employer portal and pay online.</li>
            <li><strong>TDS:</strong> deposit through the income-tax e-pay service, then report it in the quarterly salary TDS statement.</li>
            <li><strong>Professional tax:</strong> pay on your state's portal by its due date.</li>
          </ul>
        </div>
        <div className="card">
          <h3 className="font-semibold text-sm flex items-center gap-2"><Download size={15} style={{ color: 'var(--gold)' }} />Files</h3>
          <div className="mt-3 grid grid-cols-1 gap-2">
            <FileButton label="Salary register (CSV)" busy={busy === 'register'} onClick={() => dl('register', () => payrollApi.register(run.id, ym))} />
            <FileButton label={draft ? 'Payslips — draft (ZIP of PDFs)' : 'Payslips (ZIP of PDFs)'} busy={busy === 'zip'} onClick={() => dl('zip', () => payrollApi.payslips(run.id, ym))} />
            <FileButton label="Bank transfer file (CSV)" disabled={!issued} busy={busy === 'bank'} onClick={() => dl('bank', () => payrollApi.bankFile(run.id, ym))}
              hint={!issued ? 'After approval' : leftOutOfBank ? `${leftOutOfBank} without bank details left out` : undefined} />
            <FileButton label="PF ECR for EPFO (text)" disabled={!issued} busy={busy === 'ecr'} onClick={() => dl('ecr', () => payrollApi.ecr(run.id, ym))}
              hint={!issued ? 'After approval' : noUan ? `${noUan} without UAN left out` : undefined} />
            <FileButton label="ESI contribution sheet (CSV)" disabled={!issued} busy={busy === 'esi'} onClick={() => dl('esi', () => payrollApi.esi(run.id, ym))}
              hint={!issued ? 'After approval' : undefined} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="section-title">Employees</h2>
        {data.warnings > 0 && (
          <button className={onlyWarnings ? 'btn-primary h-8 text-xs' : 'btn-secondary h-8 text-xs'} aria-pressed={onlyWarnings} onClick={() => setOnlyWarnings(v => !v)}>
            <AlertTriangle size={13} />{data.warnings} need{data.warnings === 1 ? 's' : ''} attention
          </button>
        )}
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }} className="text-xs">
              <th className="text-left font-semibold px-4 py-3">Employee</th>
              <th className="text-right font-semibold px-3 py-3">Paid days</th>
              <th className="text-right font-semibold px-3 py-3">Gross</th>
              <th className="text-right font-semibold px-3 py-3">PF</th>
              <th className="text-right font-semibold px-3 py-3">ESI</th>
              <th className="text-right font-semibold px-3 py-3">PT</th>
              <th className="text-right font-semibold px-3 py-3">TDS</th>
              <th className="text-right font-semibold px-3 py-3">Other</th>
              <th className="text-right font-semibold px-4 py-3">Net pay</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                {onlyWarnings ? 'Nothing needs attention.' : 'Nobody in this payroll yet — set up salaries, then recalculate.'}
              </td></tr>
            )}
            {shown.map(i => (
              <tr key={i.id} className="cursor-pointer hover:opacity-90" style={{ borderBottom: '1px solid var(--border)' }}
                onClick={() => setOpen(i)} tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') setOpen(i) }}>
                <td className="px-4 py-3">
                  <p className="font-medium flex items-center gap-2">
                    {i.employeeName}
                    {i.warnings.length > 0 && <AlertTriangle size={13} style={{ color: '#d97706' }} aria-label={`${i.warnings.length} warning(s)`} />}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{[i.employeeCode, i.designation, i.department].filter(Boolean).join(' · ')}</p>
                </td>
                <td className="px-3 py-3 text-right font-mono">
                  {num(i.paidDays)}/{i.daysInMonth}
                  {n(i.lopDays) > 0 && <span className="block text-xs" style={{ color: '#d97706' }}>{num(i.lopDays)} unpaid{i.lopOverride ? ' (set)' : ''}</span>}
                </td>
                <td className="px-3 py-3 text-right font-mono">{inr(i.gross)}</td>
                <td className="px-3 py-3 text-right font-mono">{n(i.pf.employee) ? inr(i.pf.employee) : '—'}</td>
                <td className="px-3 py-3 text-right font-mono">{n(i.esi.employee) ? inr(i.esi.employee) : i.esi.covered ? inr(0) : '—'}</td>
                <td className="px-3 py-3 text-right font-mono">{n(i.pt) ? inr(i.pt) : '—'}</td>
                <td className="px-3 py-3 text-right font-mono">{n(i.tds) ? inr(i.tds) : '—'}</td>
                <td className="px-3 py-3 text-right font-mono">{otherDed(i) ? inr(otherDed(i)) : '—'}</td>
                <td className="px-4 py-3 text-right font-mono font-semibold" style={{ color: n(i.netPay) < 0 ? '#dc2626' : undefined }}>{inr(i.netPay)}</td>
              </tr>
            ))}
          </tbody>
          {items.length > 1 && !onlyWarnings && (
            <tfoot>
              <tr className="font-semibold" style={{ borderTop: '2px solid var(--border)' }}>
                <td className="px-4 py-3">Total</td>
                <td />
                <td className="px-3 py-3 text-right font-mono">{inr(run.gross)}</td>
                <td className="px-3 py-3 text-right font-mono">{inr(items.reduce((t, i) => t + n(i.pf.employee), 0))}</td>
                <td className="px-3 py-3 text-right font-mono">{inr(items.reduce((t, i) => t + n(i.esi.employee), 0))}</td>
                <td className="px-3 py-3 text-right font-mono">{inr(run.pt)}</td>
                <td className="px-3 py-3 text-right font-mono">{inr(run.tds)}</td>
                <td className="px-3 py-3 text-right font-mono">{inr(items.reduce((t, i) => t + otherDed(i), 0))}</td>
                <td className="px-4 py-3 text-right font-mono">{inr(run.net)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {open && (
        <EmployeeModal item={open} runId={run.id} draft={draft} ym={ym} onClose={() => setOpen(null)}
          onSaved={update} onDownload={() => dl('slip', () => payrollApi.payslip(run.id, open.id, `payslip_${(open.employeeCode ?? open.employeeName).replace(/[^A-Za-z0-9-]+/g, '_')}_${ym}.pdf`))} />
      )}

      <Modal open={confirm === 'approve'} onClose={() => setConfirm(null)} title={`Approve payroll for ${run.label}?`}>
        <div className="space-y-3 text-sm">
          <p>Employees will see their payslips in My Portal, and the payroll is posted to your books:</p>
          <ul className="space-y-1 pl-1" style={{ color: 'var(--text-secondary)' }}>
            <li>Dr Salaries and Wages {inr(run.gross)} and Employer PF and ESI Contributions {inr(n(run.employerCost) - n(run.gross))}</li>
            <li>Cr Salaries Payable {inr(run.net)}, PF Payable, ESI Payable, Professional Tax Payable and TDS Payable — Salaries</li>
          </ul>
          {data.warnings > 0 && <p style={{ color: '#b45309' }}>{data.warnings} employee{data.warnings === 1 ? ' has' : 's have'} warnings — you can still approve, but check them first.</p>}
          <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <button className="btn-secondary" onClick={() => setConfirm(null)}>Cancel</button>
            <button className="btn-primary" disabled={!!busy} onClick={() => act('approve', () => payrollApi.approve(run.id), 'Payroll approved and posted to your books')}>
              <CheckCircle2 size={15} />{busy === 'approve' ? 'Approving…' : 'Approve and post'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={confirm === 'reopen'} onClose={() => setConfirm(null)} title="Reopen this payroll?" size="sm">
        <div className="space-y-3 text-sm">
          <p>The payslips are withdrawn from My Portal and the posting is reversed in your books until you approve again.</p>
          <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <button className="btn-secondary" onClick={() => setConfirm(null)}>Cancel</button>
            <button className="btn-primary" disabled={!!busy} onClick={() => act('reopen', () => payrollApi.reopen(run.id), 'Payroll reopened as a draft')}>Reopen</button>
          </div>
        </div>
      </Modal>

      <Modal open={confirm === 'delete'} onClose={() => setConfirm(null)} title="Delete this draft?" size="sm">
        <div className="space-y-3 text-sm">
          <p>The draft payroll for {run.label} and any amounts entered in it are deleted. Nothing was posted to your books.</p>
          <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <button className="btn-secondary" onClick={() => setConfirm(null)}>Cancel</button>
            <button className="btn-primary" style={{ background: '#dc2626' }} disabled={!!busy} onClick={async () => {
              setBusy('delete')
              try { await payrollApi.remove(run.id); toast.success('Draft deleted'); qc.invalidateQueries({ queryKey: ['payroll-runs'] }); router.push('/hrms/payroll') }
              catch (e) { toast.error(errText(e, 'The draft could not be deleted')) }
              finally { setBusy('') }
            }}><Trash2 size={15} />Delete draft</button>
          </div>
        </div>
      </Modal>

      <Modal open={confirm === 'unpay'} onClose={() => setConfirm(null)} title="Undo the salary payment?" size="sm">
        <div className="space-y-3 text-sm">
          <p>The payment entry is reversed in your books and the payroll goes back to approved. Use this only if the payment was recorded by mistake.</p>
          <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <button className="btn-secondary" onClick={() => setConfirm(null)}>Cancel</button>
            <button className="btn-primary" disabled={!!busy} onClick={() => act('unpay', () => payrollApi.unpay(run.id), 'Payment undone')}>Undo payment</button>
          </div>
        </div>
      </Modal>

      <PayModal open={confirm === 'pay'} net={run.net} label={run.label} busy={busy === 'pay'} onClose={() => setConfirm(null)}
        onPay={p => act('pay', () => payrollApi.pay(run.id, p), 'Salaries marked as paid')} />
    </div>
  )
}

// ── one employee ──────────────────────────────────────────────────────────

function EmployeeModal({ item: i, runId, draft, ym, onClose, onSaved, onDownload }: {
  item: PayrollItem; runId: string; draft: boolean; ym: string; onClose: () => void; onSaved: (d: PayrollRunDetail) => void; onDownload: () => void
}) {
  const { canAny } = usePermissions()
  const editable = draft && canAny(...PREPARE)
  const blank = (v: unknown) => (n(v) === 0 ? '' : String(v))
  const initial = () => ({
    lopDays: String(i.lopDays ?? '0'), overtime: blank(i.overtime), bonus: blank(i.bonus), commission: blank(i.commission),
    arrears: blank(i.arrears), otherEarnings: blank(i.otherEarnings), advanceRecovery: blank(i.advanceRecovery),
    otherDeductions: blank(i.otherDeductions), tdsOverride: i.tdsOverride == null ? '' : String(i.tdsOverride), note: i.inputNote ?? '',
  })
  const [f, setF] = useState(initial)
  const [saving, setSaving] = useState(false)
  useEffect(() => { setF(initial()) }, [i])   // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k: keyof ReturnType<typeof initial>) => (e: React.ChangeEvent<HTMLInputElement>) => setF(s => ({ ...s, [k]: e.target.value }))

  const save = async (extra: Partial<PayrollItemInput> = {}) => {
    setSaving(true)
    try {
      const input: PayrollItemInput = {
        overtime: f.overtime || '0', bonus: f.bonus || '0', commission: f.commission || '0', arrears: f.arrears || '0',
        otherEarnings: f.otherEarnings || '0', advanceRecovery: f.advanceRecovery || '0', otherDeductions: f.otherDeductions || '0',
        note: f.note,
        ...(String(f.lopDays) !== String(i.lopDays) ? { lopDays: f.lopDays || '0' } : {}),
        ...(f.tdsOverride === '' ? (i.tdsOverride != null ? { clearTdsOverride: true } : {}) : { tdsOverride: f.tdsOverride }),
        ...extra,
      }
      onSaved(await payrollApi.updateItem(runId, i.id, input))
      toast.success('Recalculated')
    } catch (e) {
      toast.error(errText(e, 'Could not save'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} size="xl" title={i.employeeName}
      subtitle={[i.employeeCode, i.designation, i.department, i.workState ? stateName(i.workState) : null].filter(Boolean).join(' · ')}>
      <div className="space-y-5">
        {i.warnings.length > 0 && (
          <Banner tone="amber" title="Needs attention">
            <ul className="list-disc pl-5 space-y-0.5">{i.warnings.map(w => <li key={w}>{w}</li>)}</ul>
          </Banner>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Lines title="Earnings" lines={i.earnings} total={i.gross} totalLabel="Gross pay" />
          <Lines title="Deductions" lines={i.deductions} total={i.totalDeductions} totalLabel="Total deductions" />
        </div>
        <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: '#16794a12', border: '1px solid #16794a40' }}>
          <span className="text-sm font-semibold" style={{ color: '#16794a' }}>Net pay</span>
          <span className="font-serif text-2xl" style={{ color: n(i.netPay) < 0 ? '#dc2626' : 'var(--text-primary)' }}>{inr(i.netPay)}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Explain title="Days">
            <Row k="Days in month" v={String(i.daysInMonth)} />
            {n(i.daysEmployed) !== i.daysInMonth && <Row k="Days employed" v={num(i.daysEmployed)} />}
            <Row k="Unpaid days" v={`${num(i.lopDays)}${i.lopOverride ? ` (set by hand; attendance shows ${num(i.lopFromAttendance)})` : ''}`} />
            <Row k="Paid days" v={num(i.paidDays)} />
          </Explain>
          <Explain title="Wages under the labour codes">
            <Row k="Wages (for PF)" v={inr(i.codeWages)} />
            {n(i.wagesAddedBack) > 0 && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Includes {inr(i.wagesAddedBack)} of allowances, because allowances left out of wages are more than half of pay.</p>}
          </Explain>
          <Explain title="Provident fund">
            {i.pf.member ? (
              <>
                <Row k={`PF wages (limit ${inr(i.pf.wageLimit)})`} v={inr(i.pf.epfWages)} />
                <Row k="Employee 12%" v={inr(i.pf.employee)} />
                <Row k="Employer: pension (EPS) + PF" v={`${inr(i.pf.eps)} + ${inr(i.pf.employer)}`} />
                <Row k="EDLI + admin charges" v={`${inr(i.pf.edli)} + ${inr(i.pf.admin)}`} />
                <Row k="UAN" v={i.uan ?? '—'} />
              </>
            ) : <p style={{ color: 'var(--text-muted)' }}>Not a PF member.</p>}
          </Explain>
          <Explain title="ESI">
            {i.esi.covered ? (
              <>
                <Row k="ESI wages" v={inr(i.esi.wages)} />
                <Row k="Employee 0.75% / employer 3.25%" v={`${inr(i.esi.employee)} / ${inr(i.esi.employer)}`} />
                <Row k="IP number" v={i.esiNumber ?? '—'} />
              </>
            ) : <p style={{ color: 'var(--text-muted)' }}>Not covered (monthly pay above the ESI limit).</p>}
          </Explain>
          <Explain title="Income tax (TDS)">
            <Row k="Regime" v={i.tax.regime === 'OLD' ? 'Old' : 'New'} />
            <Row k="Projected salary for the year" v={inr(i.tax.projectedSalary)} />
            <Row k="Taxable income" v={inr(i.tax.taxableIncome)} />
            <Row k="Tax for the year" v={inr(i.tax.annualTax)} />
            <Row k="Deducted earlier" v={inr(i.tax.alreadyDeducted)} />
            <Row k={`This month${i.tax.overridden ? ' (set by hand)' : ` (${i.tax.monthsLeft} month${i.tax.monthsLeft === 1 ? '' : 's'} left)`}`} v={inr(i.tds)} />
          </Explain>
          <Explain title="Notes">
            {i.notes.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>Nothing unusual.</p>
              : <ul className="list-disc pl-5 space-y-0.5" style={{ color: 'var(--text-secondary)' }}>{i.notes.map(x => <li key={x}>{x}</li>)}</ul>}
          </Explain>
        </div>

        {editable && (
          <div className="rounded-xl p-4 space-y-3" style={{ border: '1px solid var(--border)' }}>
            <h4 className="font-semibold text-sm">Adjust for {ym}</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field id="lop" label="Unpaid days" value={f.lopDays} onChange={set('lopDays')} step="0.5" />
              <Field id="ot" label="Overtime" value={f.overtime} onChange={set('overtime')} />
              <Field id="bonus" label="Bonus" value={f.bonus} onChange={set('bonus')} />
              <Field id="comm" label="Commission / incentive" value={f.commission} onChange={set('commission')} />
              <Field id="arr" label="Arrears" value={f.arrears} onChange={set('arrears')} />
              <Field id="oe" label="Other earnings" value={f.otherEarnings} onChange={set('otherEarnings')} />
              <Field id="adv" label="Advance recovery" value={f.advanceRecovery} onChange={set('advanceRecovery')} />
              <Field id="od" label="Other deductions" value={f.otherDeductions} onChange={set('otherDeductions')} />
              <Field id="tds" label="TDS (blank = worked out)" value={f.tdsOverride} onChange={set('tdsOverride')} />
              <div className="col-span-2 md:col-span-3">
                <label className="label" htmlFor="note">Note</label>
                <input id="note" className="input h-10" value={f.note} maxLength={500} onChange={e => setF(s => ({ ...s, note: e.target.value }))} placeholder="For example: Diwali bonus" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 flex-wrap">
              {i.lopOverride && (
                <button className="btn-secondary h-9 text-sm" disabled={saving} onClick={() => save({ resetLop: true, lopDays: undefined })}>
                  Use attendance ({num(i.lopFromAttendance)} unpaid)
                </button>
              )}
              <button className="btn-primary h-9" disabled={saving} onClick={() => save()}>{saving ? 'Recalculating…' : 'Save and recalculate'}</button>
            </div>
          </div>
        )}

        <div className="flex justify-between gap-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <button className="btn-secondary" onClick={onDownload}><FileText size={15} />{draft ? 'Draft payslip (PDF)' : 'Payslip (PDF)'}</button>
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </Modal>
  )
}

function PayModal({ open, net, label, busy, onClose, onPay }: {
  open: boolean; net: number | string; label: string; busy: boolean; onClose: () => void
  onPay: (p: { paidOn: string; paidFrom: 'BANK' | 'CASH'; reference?: string }) => void
}) {
  const [paidOn, setPaidOn] = useState(todayIST())
  const [from, setFrom] = useState<'BANK' | 'CASH'>('BANK')
  const [ref, setRef] = useState('')
  return (
    <Modal open={open} onClose={onClose} title={`Salaries paid for ${label}`} subtitle={`Net pay ${inr(net)}`}>
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label" htmlFor="paid-on">Paid on</label>
            <input id="paid-on" type="date" className="input h-10" value={paidOn} max={todayIST()} onChange={e => setPaidOn(e.target.value)} /></div>
          <div><label className="label" htmlFor="paid-from">Paid from</label>
            <select id="paid-from" className="input h-10" value={from} onChange={e => setFrom(e.target.value as 'BANK' | 'CASH')}>
              <option value="BANK">Bank account</option><option value="CASH">Cash</option>
            </select></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="pay-ref">Reference (batch or UTR number)</label>
            <input id="pay-ref" className="input h-10" value={ref} maxLength={100} onChange={e => setRef(e.target.value)} /></div>
        </div>
        <p style={{ color: 'var(--text-muted)' }}>Posts Dr Salaries Payable / Cr {from === 'CASH' ? 'Cash in Hand' : 'Bank Account'} for {inr(net)}.</p>
        <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy || !paidOn} onClick={() => onPay({ paidOn, paidFrom: from, reference: ref.trim() || undefined })}>
            <Banknote size={15} />{busy ? 'Saving…' : 'Mark as paid'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── small pieces ─────────────────────────────────────────────────────────

function Banner({ tone, title, children }: { tone: 'red' | 'amber'; title: string; children: React.ReactNode }) {
  const c = tone === 'red' ? '#dc2626' : '#d97706'
  return (
    <div className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: `${c}12`, border: `1px solid ${c}50` }}>
      <AlertTriangle size={18} style={{ color: c, flexShrink: 0, marginTop: 2 }} />
      <div className="text-sm"><p className="font-semibold">{title}</p><div className="mt-0.5" style={{ color: 'var(--text-secondary)' }}>{children}</div></div>
    </div>
  )
}

function Figure({ label, value, sub, strong }: { label: string; value: string; sub?: string; strong?: boolean }) {
  return (
    <div className="card">
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="font-serif text-2xl mt-1" style={{ color: strong ? 'var(--gold)' : 'var(--text-primary)' }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  )
}

function Due({ label, amount, due, note }: { label: string; amount: number | string; due: string | null; note?: string }) {
  return (
    <div>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="font-mono mt-0.5">{inr(amount)}</p>
      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{due ? `Due ${formatDate(due)}` : note}</p>
    </div>
  )
}

function FileButton({ label, onClick, disabled, busy, hint }: { label: string; onClick: () => void; disabled?: boolean; busy?: boolean; hint?: string }) {
  return (
    <button className="btn-secondary h-auto min-h-9 py-2 text-sm text-left" style={{ justifyContent: 'flex-start' }} disabled={disabled || busy} onClick={onClick} title={hint}>
      <Download size={14} className="shrink-0" />
      <span className="flex flex-col min-w-0">
        <span>{busy ? 'Preparing…' : label}</span>
        {hint && <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>{hint}</span>}
      </span>
    </button>
  )
}

function Lines({ title, lines, total, totalLabel }: { title: string; lines: { code: string; label: string; amount: number | string }[]; total: number | string; totalLabel: string }) {
  return (
    <div className="rounded-xl" style={{ border: '1px solid var(--border)' }}>
      <p className="text-xs font-semibold uppercase tracking-wider px-4 pt-3" style={{ color: 'var(--text-muted)' }}>{title}</p>
      <div className="px-4 py-2 space-y-1 text-sm">
        {lines.length === 0 && <p style={{ color: 'var(--text-muted)' }}>None</p>}
        {lines.map(l => <div key={l.code} className="flex justify-between gap-3"><span>{l.label}</span><span className="font-mono">{inr(l.amount)}</span></div>)}
      </div>
      <div className="flex justify-between gap-3 px-4 py-2.5 text-sm font-semibold" style={{ borderTop: '1px solid var(--border)' }}>
        <span>{totalLabel}</span><span className="font-mono">{inr(total)}</span>
      </div>
    </div>
  )
}

function Explain({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl px-4 py-3" style={{ background: 'var(--bg-surface)' }}>
      <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-3"><span style={{ color: 'var(--text-secondary)' }}>{k}</span><span className="font-mono text-right">{v}</span></div>
}

function Field({ id, label, value, onChange, step }: { id: string; label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; step?: string }) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <input id={id} type="number" min="0" step={step ?? '0.01'} inputMode="decimal" className="input h-10 font-mono" value={value} onChange={onChange} />
    </div>
  )
}
