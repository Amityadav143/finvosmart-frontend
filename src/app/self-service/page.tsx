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

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { hrmsApi } from '@/lib/api/hrms'
import { payrollApi } from '@/lib/api/payroll'
import { inr } from '@/lib/money'
import { formatDate, apiError } from '@/lib/utils'
import { shown } from '@/lib/previews'
import { useAuthStore } from '@/lib/store/slices/authStore'
import type { LeaveApplication } from '@/types'
import { User, FileText, Calendar, IndianRupee, Clock, AlertTriangle, Download, Plus, Info } from 'lucide-react'
import toast from 'react-hot-toast'

type Tab = 'overview' | 'payslips' | 'leave' | 'expenses' | 'timesheet'

const TABS: { id: Tab; label: string; icon: any; show: () => boolean }[] = [
  { id: 'overview',  label: 'Overview',  icon: User,        show: () => true },
  { id: 'payslips',  label: 'Payslips',  icon: IndianRupee, show: () => true },
  { id: 'leave',     label: 'Leave',     icon: Calendar,    show: () => true },
  { id: 'expenses',  label: 'Expenses',  icon: FileText,    show: () => shown('/expense-claims') },
  { id: 'timesheet', label: 'Timesheet', icon: Clock,       show: () => shown('/timesheet') },
]
const LEAVE_TYPES = ['Annual Leave', 'Casual Leave', 'Sick Leave', 'Compensatory Off', 'Maternity Leave', 'Paternity Leave', 'Leave without pay']
const STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Waiting for approval', color: '#B45309' }, APPROVED: { label: 'Approved', color: '#047857' },
  REJECTED: { label: 'Not approved', color: '#B91C1C' }, CANCELLED: { label: 'Cancelled', color: '#6B7280' }, WITHDRAWN: { label: 'Withdrawn', color: '#6B7280' },
}
const BLANK = { type: 'Annual Leave', startDate: '', endDate: '', reason: '' }

function days(from: string, to: string) {
  if (!from || !to) return 0
  const a = Date.parse(from + 'T00:00:00Z'), b = Date.parse(to + 'T00:00:00Z')
  return Number.isNaN(a) || Number.isNaN(b) || b < a ? 0 : Math.round((b - a) / 86400000) + 1
}

export default function SelfServicePage() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [tab, setTab] = useState<Tab>('overview')
  const [leaveForm, setLeave] = useState({ ...BLANK })

  // ?tab=payslips / ?tab=leave — where notifications point
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab') as Tab | null
    if (t && TABS.some(x => x.id === t && x.show())) setTab(t)
  }, [])

  const summary = useQuery({
    queryKey: ['leaves', 'my-summary'],
    queryFn: () => api.get('/leaves/my/summary').then(r => r.data.data ?? {}),
    retry: false,
  })
  const notLinked = summary.isError
  const myLeaves = useQuery({ queryKey: ['leaves', 'mine'], queryFn: hrmsApi.leave.my, enabled: tab === 'leave' && !notLinked, retry: false })
  const payslips = useQuery({ queryKey: ['my-payslips'], queryFn: payrollApi.myPayslips, enabled: (tab === 'payslips' || tab === 'overview') && !notLinked, retry: false })

  const [downloading, setDownloading] = useState('')
  const downloadPayslip = async (p: { id: string; year: number; month: number }) => {
    setDownloading(p.id)
    try { await payrollApi.myPayslip(p.id, `payslip_${p.year}-${String(p.month).padStart(2, '0')}.pdf`) }
    catch (e) { toast.error(apiError(e, 'The payslip could not be downloaded')) }
    finally { setDownloading('') }
  }

  const n = days(leaveForm.startDate, leaveForm.endDate)
  const formProblem = !leaveForm.startDate || !leaveForm.endDate ? 'Choose the first and last day.' : n === 0 ? 'The leave can’t end before it starts.' : !leaveForm.reason.trim() ? 'Add a short reason for your approver.' : null
  const applyLeave = useMutation({
    mutationFn: () => hrmsApi.leave.apply({ leaveTypeName: leaveForm.type, fromDate: leaveForm.startDate, toDate: leaveForm.endDate, reason: leaveForm.reason.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaves'] })
      toast.success('Request sent — you will be notified of the decision')
      setLeave({ ...BLANK })
    },
    onError: (e: any) => toast.error(apiError(e, 'The leave request could not be sent')),
  })

  const s = (summary.data ?? {}) as { totalTaken?: number; pending?: number }
  const latest = payslips.data?.[0]
  const tabs = TABS.filter(t => t.show())

  return (
    <div style={{ maxWidth: '820px' }}>
      <div className="card" style={{ marginBottom: '20px', background: 'var(--btn-primary-bg)', border: 'none' }}>
        <div className="flex items-center gap-4 flex-wrap">
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '20px', fontWeight: 700, color: 'white', fontFamily: 'serif' }}>
            {user?.fullName?.charAt(0) ?? 'U'}
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'white', margin: 0 }}>Welcome, {user?.fullName?.split(' ')[0]}</h1>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', margin: 0 }}>Your payslips and leave in one place · {user?.email}</p>
          </div>
          <p className="hidden sm:block" style={{ marginLeft: 'auto', fontSize: '11px', color: 'rgba(255,255,255,0.7)', margin: '0 0 0 auto' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {notLinked && (
        <div className="card flex items-start gap-3" style={{ marginBottom: '16px', border: '1px solid rgba(217,119,6,0.4)', background: 'rgba(217,119,6,0.06)' }}>
          <Info size={18} style={{ color: '#B45309', flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
            {apiError(summary.error, 'Your login isn’t linked to an employee record yet.')} Payslips and leave appear here once HR adds you as an employee with your work email ({user?.email}).
          </p>
        </div>
      )}

      <div role="tablist" aria-label="My portal" style={{ display: 'flex', gap: '4px', background: 'var(--bg-surface)', borderRadius: '12px', padding: '4px', marginBottom: '20px' }}>
        {tabs.map(t => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 4px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '12.5px', fontWeight: 600, fontFamily: 'inherit',
              background: tab === t.id ? 'var(--bg-card)' : 'transparent', color: tab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: tab === t.id ? 'var(--shadow-card)' : 'none' }}>
            <t.icon size={13} />{t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Leave days taken this year', val: notLinked ? '—' : s.totalTaken ?? 0, color: '#047857', icon: Calendar },
              { label: 'Requests waiting for approval', val: notLinked ? '—' : s.pending ?? 0, color: '#2563EB', icon: AlertTriangle },
              { label: latest ? `Net pay — ${latest.label}` : 'Latest payslip', val: latest ? inr(latest.net) : '—', color: '#B45309', icon: IndianRupee },
            ].map(k => (
              <div key={k.label} className="card flex gap-3 items-center">
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${k.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <k.icon size={20} style={{ color: k.color }} />
                </div>
                <div>
                  <p style={{ fontSize: '22px', fontWeight: 700, color: k.color, fontFamily: 'serif', margin: 0 }}>{k.val}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>{k.label}</p>
                </div>
              </div>
            ))}
          </div>
          {!notLinked && (
            <div className="card">
              <h2 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Quick actions</h2>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setTab('leave')} className="btn-secondary h-10"><Calendar size={14} />Ask for leave</button>
                <button onClick={() => setTab('payslips')} className="btn-secondary h-10"><Download size={14} />Download a payslip</button>
                {shown('/expense-claims') && <button onClick={() => setTab('expenses')} className="btn-secondary h-10"><FileText size={14} />Submit an expense</button>}
                {shown('/timesheet') && <button onClick={() => setTab('timesheet')} className="btn-secondary h-10"><Clock size={14} />Log today&apos;s time</button>}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'payslips' && (
        <div className="card">
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>My payslips</h2>
          {notLinked ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>Payslips appear here once you are added as an employee.</p>
          ) : payslips.isLoading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0' }}>Loading…</p>
          ) : payslips.isError ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0' }}>{apiError(payslips.error, 'Payslips could not be loaded.')}</p>
          ) : (payslips.data ?? []).length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0' }}>No payslips yet. They appear here — and you get a notification — as soon as the month&apos;s payroll is approved.</p>
          ) : (
            <div>
              {(payslips.data ?? []).map(p => (
                <div key={p.id} className="flex items-center justify-between gap-3" style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{p.label}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                      Net {inr(p.net)} · gross {inr(p.gross)} · {Number(p.paidDays)} paid day{Number(p.paidDays) === 1 ? '' : 's'}
                      {p.status === 'PAID' && p.paidOn ? ` · paid ${formatDate(p.paidOn)}` : ''}
                    </p>
                  </div>
                  <button className="btn-secondary h-8 text-xs" disabled={downloading === p.id} onClick={() => downloadPayslip(p)}>
                    <Download size={13} />{downloading === p.id ? 'Preparing…' : 'Download PDF'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'leave' && (
        <div className="space-y-4">
          {!notLinked && (
            <form className="card" onSubmit={e => { e.preventDefault(); if (!formProblem) applyLeave.mutate() }}>
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Ask for leave</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="ss-type">Leave type</label>
                  <select id="ss-type" className="input h-10" value={leaveForm.type} onChange={e => setLeave(f => ({ ...f, type: e.target.value }))}>
                    {LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="hidden sm:block" />
                <div>
                  <label className="label label-required" htmlFor="ss-from">First day</label>
                  <input id="ss-from" type="date" className="input h-10" value={leaveForm.startDate}
                    onChange={e => setLeave(f => ({ ...f, startDate: e.target.value, endDate: f.endDate && f.endDate >= e.target.value ? f.endDate : e.target.value }))} />
                </div>
                <div>
                  <label className="label label-required" htmlFor="ss-to">Last day</label>
                  <input id="ss-to" type="date" className="input h-10" min={leaveForm.startDate || undefined} value={leaveForm.endDate} onChange={e => setLeave(f => ({ ...f, endDate: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label label-required" htmlFor="ss-reason">Reason</label>
                  <textarea id="ss-reason" className="input" rows={3} maxLength={500} placeholder="A line for your approver" value={leaveForm.reason} onChange={e => setLeave(f => ({ ...f, reason: e.target.value }))} />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                <button type="submit" className="btn-primary h-10" disabled={!!formProblem || applyLeave.isPending} title={formProblem ?? undefined}>
                  {applyLeave.isPending ? 'Sending…' : <><Plus size={14} /> Send request</>}
                </button>
                {n > 0 && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{n} day{n === 1 ? '' : 's'}, both days included</span>}
              </div>
            </form>
          )}
          {(myLeaves.data ?? []).length > 0 && (
            <div className="card">
              <h2 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>My requests</h2>
              {(myLeaves.data ?? []).map((l: LeaveApplication) => {
                const st = STATUS[l.status] ?? { label: l.status, color: '#6B7280' }
                return (
                  <div key={l.id} className="flex items-start justify-between gap-3" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{l.leaveTypeName ?? 'Leave'}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                        {formatDate(l.fromDate)}{l.toDate !== l.fromDate ? ` – ${formatDate(l.toDate)}` : ''} · {Number(l.totalDays)} day{Number(l.totalDays) === 1 ? '' : 's'}
                      </p>
                      {l.approvalRemarks && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '3px 0 0' }}>Note: “{l.approvalRemarks}”</p>}
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: `${st.color}18`, color: st.color, whiteSpace: 'nowrap' }}>{st.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'expenses' && (
        <div className="card text-center" style={{ padding: '40px 24px' }}>
          <FileText size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Expense claims</h2>
          <Link href="/expense-claims" className="btn-primary h-10 px-6" style={{ textDecoration: 'none' }}>Open expense claims</Link>
        </div>
      )}

      {tab === 'timesheet' && (
        <div className="card text-center" style={{ padding: '40px' }}>
          <Clock size={36} style={{ color: 'var(--gold)', margin: '0 auto 14px' }} />
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Weekly timesheet</h2>
          <Link href="/timesheet" className="btn-primary h-10 px-8" style={{ textDecoration: 'none' }}>Open the timesheet</Link>
        </div>
      )}
    </div>
  )
}
