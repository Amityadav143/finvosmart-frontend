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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hrmsApi } from '@/lib/api/hrms'
import { DataTable } from '@/components/ui/Table'
import { StatusBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { apiError, formatDate } from '@/lib/utils'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useUrlParams } from '@/lib/hooks/useUrlParams'
import type { LeaveApplication } from '@/types'
import { CheckCircle, XCircle, Clock, Calendar, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

const TYPES = ['Annual Leave', 'Casual Leave', 'Sick Leave', 'Compensatory Off', 'Maternity Leave', 'Paternity Leave', 'Leave without pay']
const BLANK = { leaveTypeName: 'Annual Leave', fromDate: '', toDate: '', reason: '' }

/** Calendar days, both ends included — the same count the server records (LeaveRules.days). */
function leaveDays(from: string, to: string): number {
  if (!from || !to) return 0
  const a = Date.parse(from + 'T00:00:00Z'), b = Date.parse(to + 'T00:00:00Z')
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return 0
  return Math.round((b - a) / 86400000) + 1
}
const days = (n: number) => `${n % 1 === 0 ? n : n.toFixed(1)} day${n === 1 ? '' : 's'}`
const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

type Tab = 'waiting' | 'decided' | 'mine'

export default function LeavePage() {
  const qc = useQueryClient()
  const { canAny } = usePermissions()
  const approver = canAny('LEAVE_APPROVE', 'LEAVE_ADMIN')
  const canApply = canAny('LEAVE_APPLY', 'LEAVE_ADMIN')
  const [tab, setTab] = useState<Tab>(approver ? 'waiting' : 'mine')
  const [showApply, setShowApply] = useState(false)
  const [form, setForm] = useState({ ...BLANK })
  const [rejecting, setRejecting] = useState<LeaveApplication | null>(null)
  const [note, setNote] = useState('')
  useUrlParams(p => { if (p.get('new') === '1' && canApply) setShowApply(true) })

  const pending = useQuery({ queryKey: ['leaves', 'pending'], queryFn: hrmsApi.leave.pending, enabled: approver })
  const decided = useQuery({ queryKey: ['leaves', 'decided'], queryFn: () => hrmsApi.leave.decided(100), enabled: approver })
  const mine = useQuery({ queryKey: ['leaves', 'mine'], queryFn: hrmsApi.leave.my, retry: false })
  const noEmployeeRecord = mine.isError
  const refresh = () => qc.invalidateQueries({ queryKey: ['leaves'] })

  const decide = useMutation({
    mutationFn: ({ id, action, remarks }: { id: string; action: 'APPROVED' | 'REJECTED'; remarks?: string }) => hrmsApi.leave.process(id, action, remarks),
    onSuccess: (_: any, v) => { refresh(); setRejecting(null); setNote(''); toast.success(v.action === 'APPROVED' ? 'Leave approved — the employee has been told' : 'Leave not approved — the employee has been told') },
    onError: (e: any) => toast.error(apiError(e, 'The request could not be updated')),
  })
  const apply = useMutation({
    mutationFn: () => hrmsApi.leave.apply({ ...form, reason: form.reason.trim() }),
    onSuccess: () => { refresh(); setShowApply(false); setForm({ ...BLANK }); setTab('mine'); toast.success('Leave request sent for approval') },
    onError: (e: any) => toast.error(apiError(e, 'The leave request could not be sent')),
  })

  const decidedList = decided.data ?? []
  const today = isoDay(new Date()), in30 = isoDay(new Date(Date.now() + 30 * 86400000))
  const stats = useMemo(() => approver ? [
    { label: 'Waiting for a decision', value: pending.data?.length ?? 0, color: '#d97706', icon: Clock },
    { label: 'Away today', value: decidedList.filter(l => l.status === 'APPROVED' && l.fromDate <= today && l.toDate >= today).length, color: '#7c3aed', icon: Calendar },
    { label: 'Approved leave in the next 30 days', value: decidedList.filter(l => l.status === 'APPROVED' && l.fromDate > today && l.fromDate <= in30).length, color: '#16a34a', icon: CheckCircle },
  ] : [
    { label: 'My requests waiting', value: (mine.data ?? []).filter(l => l.status === 'PENDING').length, color: '#d97706', icon: Clock },
    { label: 'Days approved this year', value: (mine.data ?? []).filter(l => l.status === 'APPROVED' && l.fromDate?.startsWith(String(new Date().getFullYear()))).reduce((s, l) => s + Number(l.totalDays || 0), 0), color: '#16a34a', icon: CheckCircle },
    { label: 'Requests this year', value: (mine.data ?? []).filter(l => l.fromDate?.startsWith(String(new Date().getFullYear()))).length, color: '#2563eb', icon: Calendar },
  ], [approver, pending.data, decidedList, mine.data, today, in30])

  const who = { header: 'Employee', render: (l: LeaveApplication) => (
    <div>
      <p className="font-semibold text-sm">{l.employeeName ?? 'Employee'}</p>
      <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{l.employeeCode ?? ''}</p>
    </div>
  )}
  const what = [
    { header: 'Leave', render: (l: LeaveApplication) => (
      <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(139,92,246,0.12)', color: '#7c3aed' }}>{l.leaveTypeName ?? 'Leave'}</span>
    )},
    { header: 'Dates', render: (l: LeaveApplication) => (
      <div>
        <p className="text-xs">{formatDate(l.fromDate)}{l.toDate !== l.fromDate ? ` – ${formatDate(l.toDate)}` : ''}</p>
        <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--gold)' }}>{days(Number(l.totalDays))}</p>
      </div>
    )},
    { header: 'Reason', render: (l: LeaveApplication) => <p className="text-xs max-w-xs" style={{ color: 'var(--text-secondary)', overflowWrap: 'anywhere' }}>{l.reason || '—'}</p> },
  ]
  const status = { header: 'Status', render: (l: LeaveApplication) => (
    <div>
      <StatusBadge status={l.status} label={l.status === 'REJECTED' ? 'Not approved' : undefined} />
      {l.approvalRemarks && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', maxWidth: '220px' }}>“{l.approvalRemarks}”</p>}
    </div>
  )}
  const actions = { header: '', render: (l: LeaveApplication) => (
    <div className="flex items-center gap-2 justify-end">
      <button onClick={() => decide.mutate({ id: l.id, action: 'APPROVED' })} disabled={decide.isPending}
        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold"
        style={{ background: 'rgba(22,163,74,0.1)', color: '#15803d', border: '1px solid rgba(22,163,74,0.25)' }}>
        <CheckCircle className="w-3.5 h-3.5" />Approve
      </button>
      <button onClick={() => { setRejecting(l); setNote('') }} disabled={decide.isPending}
        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold"
        style={{ background: 'rgba(220,38,38,0.08)', color: '#b91c1c', border: '1px solid rgba(220,38,38,0.22)' }}>
        <XCircle className="w-3.5 h-3.5" />Reject
      </button>
    </div>
  )}

  const tabs: { id: Tab; label: string; show: boolean; count?: number }[] = [
    { id: 'waiting', label: 'Waiting for you', show: approver, count: pending.data?.length },
    { id: 'decided', label: 'Decided', show: approver },
    { id: 'mine', label: 'My requests', show: !noEmployeeRecord || !approver },
  ]
  const n = leaveDays(form.fromDate, form.toDate)
  const formProblem = !form.fromDate || !form.toDate ? 'Choose the first and last day.' : n === 0 ? 'The leave can’t end before it starts.' : !form.reason.trim() ? 'Add a short reason for your approver.' : null

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="page-title">Leave</h1>
          <p className="page-subtitle">{approver ? 'Decide requests from your team and see what was decided.' : 'Ask for time off and follow your requests.'}</p>
        </div>
        {canApply && !noEmployeeRecord && (
          <button onClick={() => setShowApply(true)} className="btn-primary h-9"><Plus className="w-4 h-4" />Ask for leave</button>
        )}
      </div>

      {(approver || !noEmployeeRecord) && <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div><p className="text-2xl font-display" style={{ color }}>{value}</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p></div>
          </div>
        ))}
      </div>}

      <div className="flex items-center gap-1 flex-wrap" role="tablist" aria-label="Leave lists">
        {tabs.filter(t => t.show).map(t => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className="h-9 px-4 rounded-lg text-sm font-semibold"
            style={{ background: tab === t.id ? 'var(--gold-muted)' : 'transparent', color: tab === t.id ? 'var(--gold)' : 'var(--text-secondary)', border: '1px solid ' + (tab === t.id ? 'var(--gold)' : 'var(--border)') }}>
            {t.label}{t.count ? ` (${t.count})` : ''}
          </button>
        ))}
      </div>

      {tab === 'waiting' && approver && (
        <DataTable columns={[who, ...what, actions]} data={pending.data ?? []} loading={pending.isLoading} keyExtractor={l => l.id}
          emptyMessage={pending.isError ? apiError(pending.error, 'Requests could not be loaded') : 'Nothing is waiting for a decision.'} />
      )}
      {tab === 'decided' && approver && (
        <DataTable columns={[who, ...what, status]} data={decidedList} loading={decided.isLoading} keyExtractor={l => l.id}
          emptyMessage={decided.isError ? apiError(decided.error, 'Requests could not be loaded') : 'No requests decided yet.'} />
      )}
      {tab === 'mine' && (
        noEmployeeRecord ? (
          <div className="card" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {apiError(mine.error, 'Your login isn’t linked to an employee record yet.')}
          </div>
        ) : (
          <DataTable columns={[...what, status]} data={mine.data ?? []} loading={mine.isLoading} keyExtractor={l => l.id}
            emptyMessage="You haven't asked for leave yet." />
        )
      )}

      <Modal open={showApply} onClose={() => setShowApply(false)} title="Ask for leave" subtitle="Your approvers are told straight away; you hear back here and in your notifications.">
        <form onSubmit={e => { e.preventDefault(); if (!formProblem) apply.mutate() }} className="space-y-4">
          <div><label className="label" htmlFor="lv-type">Leave type</label>
            <select id="lv-type" className="input h-10" value={form.leaveTypeName} onChange={e => setForm(f => ({ ...f, leaveTypeName: e.target.value }))}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label label-required" htmlFor="lv-from">First day</label>
              <input id="lv-from" className="input h-10" type="date" required value={form.fromDate}
                onChange={e => setForm(f => ({ ...f, fromDate: e.target.value, toDate: f.toDate && f.toDate < e.target.value ? e.target.value : f.toDate || e.target.value }))} /></div>
            <div><label className="label label-required" htmlFor="lv-to">Last day</label>
              <input id="lv-to" className="input h-10" type="date" required min={form.fromDate || undefined} value={form.toDate} onChange={e => setForm(f => ({ ...f, toDate: e.target.value }))} /></div>
          </div>
          {n > 0 && <p className="text-xs" style={{ color: 'var(--text-secondary)', margin: 0 }}>{days(n)}, both days included.</p>}
          <div><label className="label label-required" htmlFor="lv-reason">Reason</label>
            <textarea id="lv-reason" className="input resize-none" rows={3} maxLength={500} required value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowApply(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={apply.isPending || !!formProblem} title={formProblem ?? undefined} className="btn-primary">{apply.isPending ? 'Sending…' : 'Send request'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!rejecting} onClose={() => setRejecting(null)} size="sm" title="Not approve this leave?"
        subtitle={rejecting ? `${rejecting.employeeName ?? 'Employee'} · ${formatDate(rejecting.fromDate)}${rejecting.toDate !== rejecting.fromDate ? ' – ' + formatDate(rejecting.toDate) : ''}` : undefined}
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-secondary h-10" onClick={() => setRejecting(null)}>Cancel</button>
            <button className="btn-danger h-10" disabled={decide.isPending} onClick={() => rejecting && decide.mutate({ id: rejecting.id, action: 'REJECTED', remarks: note.trim() || undefined })}>
              {decide.isPending ? 'Saving…' : 'Reject'}
            </button>
          </div>
        }>
        <label className="label" htmlFor="lv-note">Note for the employee (optional)</label>
        <textarea id="lv-note" className="input resize-none" rows={3} maxLength={500} placeholder="e.g. Quarter-end close — could you take the week after?" value={note} onChange={e => setNote(e.target.value)} />
      </Modal>
    </div>
  )
}
