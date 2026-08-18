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

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hrmsApi } from '@/lib/api/hrms'
import { DataTable } from '@/components/ui/Table'
import { StatusBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils'
import { LeaveApplication } from '@/types'
import { CheckCircle, XCircle, Clock, Calendar, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LeavePage() {
  const qc = useQueryClient()
  const [showApply, setShowApply] = useState(false)
  const [form, setForm] = useState({ leaveTypeName: 'Annual Leave', fromDate: '', toDate: '', reason: '' })

  const { data: pending, isLoading } = useQuery({ queryKey: ['leaves-pending'], queryFn: hrmsApi.leave.pending })

  const approveMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'APPROVED'|'REJECTED' }) => hrmsApi.leave.process(id, action),
    onSuccess: (_: any, v: any) => { qc.invalidateQueries({ queryKey: ['leaves-pending'] }); toast.success(v.action === 'APPROVED' ? '✓ Leave approved' : '✗ Leave rejected') },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Could not process leave request'),
  })

  const applyMutation = useMutation({
    mutationFn: (d: any) => hrmsApi.leave.apply(d),
    onSuccess: () => { setShowApply(false); toast.success('Leave application submitted') },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed'),
  })

  const columns = [
    { header: 'Employee', render: (l: LeaveApplication) => (
      <div>
        <p className="font-semibold text-sm">{l.employeeName ?? 'Employee'}</p>
        <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{l.employeeCode ?? ''}</p>
      </div>
    )},
    { header: 'Leave Type', render: (l: LeaveApplication) => (
      <span className="text-xs px-2.5 py-1 rounded-full font-medium"
        style={{ background: 'rgba(139,92,246,0.1)', color: '#c4b5fd' }}>{l.leaveTypeName}</span>
    )},
    { header: 'Period', render: (l: LeaveApplication) => (
      <div>
        <p className="text-xs">{formatDate(l.fromDate)} → {formatDate(l.toDate)}</p>
        <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--gold)' }}>{l.totalDays} day{l.totalDays !== 1 ? 's' : ''}</p>
      </div>
    )},
    { header: 'Reason',   render: (l: LeaveApplication) => <p className="text-xs max-w-xs truncate" style={{ color: 'var(--text-secondary)' }}>{l.reason}</p> },
    { header: 'Status',   render: (l: LeaveApplication) => <StatusBadge status={l.status} /> },
    { header: 'Actions',  render: (l: LeaveApplication) => l.status === 'PENDING' ? (
      <div className="flex items-center gap-2">
        <button onClick={() => approveMutation.mutate({ id: l.id, action: 'APPROVED' })}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium"
          style={{ background: 'rgba(34,197,94,0.1)', color: '#86efac', border: '1px solid rgba(34,197,94,0.2)' }}>
          <CheckCircle className="w-3.5 h-3.5" />Approve
        </button>
        <button onClick={() => approveMutation.mutate({ id: l.id, action: 'REJECTED' })}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium"
          style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>
          <XCircle className="w-3.5 h-3.5" />Reject
        </button>
      </div>
    ) : null },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending Approvals', value: pending?.filter((l: any) => l.status === 'PENDING').length ?? 0, color: '#f59e0b', icon: Clock },
          { label: 'Approved This Month', value: pending?.filter((l: any) => l.status === 'APPROVED').length ?? 0, color: '#22c55e', icon: CheckCircle },
          { label: 'Total Applications', value: pending?.length ?? 0, color: '#3b82f6', icon: Calendar },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div><p className="text-2xl font-display" style={{ color }}>{value}</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p></div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-base">Leave Applications</h2>
        <button onClick={() => setShowApply(true)} className="btn-primary h-9"><Plus className="w-4 h-4" />Apply Leave</button>
      </div>

      <DataTable columns={columns} data={pending ?? []} loading={isLoading} keyExtractor={l => l.id} emptyMessage="No pending leave applications" />

      <Modal open={showApply} onClose={() => setShowApply(false)} title="Apply for Leave">
        <form onSubmit={e => { e.preventDefault(); applyMutation.mutate({ ...form, leaveTypeId: '00000000-0000-0000-0000-000000000001' }) }} className="space-y-4">
          <div><label className="label">Leave Type</label>
            <select className="input h-10" value={form.leaveTypeName} onChange={e => setForm(f => ({...f, leaveTypeName: e.target.value}))}>
              <option>Annual Leave</option><option>Sick Leave</option><option>Casual Leave</option><option>Maternity Leave</option>
            </select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">From Date *</label><input className="input h-10" type="date" required value={form.fromDate} onChange={e => setForm(f => ({...f, fromDate: e.target.value}))} /></div>
            <div><label className="label">To Date *</label><input className="input h-10" type="date" required value={form.toDate} onChange={e => setForm(f => ({...f, toDate: e.target.value}))} /></div>
          </div>
          <div><label className="label">Reason *</label><textarea className="input resize-none" rows={3} required value={form.reason} onChange={e => setForm(f => ({...f, reason: e.target.value}))} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowApply(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={applyMutation.isPending} className="btn-primary">{applyMutation.isPending ? 'Submitting...' : 'Submit Application'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
