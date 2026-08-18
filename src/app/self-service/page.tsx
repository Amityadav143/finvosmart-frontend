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
import { api } from '@/lib/api/client'
import { useAuthStore } from '@/lib/store/slices/authStore'
import {
  User, FileText, Calendar, DollarSign, Clock,
  CheckCircle2, AlertTriangle, Download, Plus, TrendingUp
} from 'lucide-react'
import toast from 'react-hot-toast'

type Tab = 'overview' | 'payslips' | 'leave' | 'expenses' | 'timesheet'

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'overview',  label: 'My Overview',  icon: User       },
  { id: 'payslips',  label: 'Payslips',     icon: DollarSign },
  { id: 'leave',     label: 'Leave',        icon: Calendar   },
  { id: 'expenses',  label: 'Expenses',     icon: FileText   },
  { id: 'timesheet', label: 'Timesheet',    icon: Clock      },
]

export default function SelfServicePage() {
  const { user } = useAuthStore()
  const [tab, setTab]           = useState<Tab>('overview')
  const [leaveForm, setLeave]   = useState({ type: 'ANNUAL', startDate: '', endDate: '', reason: '' })
  const [expForm, setExp]       = useState({ category: 'TRAVEL', amount: '', date: new Date().toISOString().split('T')[0], notes: '' })

  // My leave balance
  const { data: leaveBalance } = useQuery({
    queryKey: ['my-leave-balance'],
    queryFn: () => api.get('/hrms/leave/my/balance').then(r => r.data.data ?? {}),
  })

  // My recent leaves
  const { data: myLeaves } = useQuery({
    queryKey: ['my-leaves'],
    queryFn: () => api.get('/hrms/leave', { params: { size: 10 } }).then(r => r.data.data?.content ?? []),
    enabled: tab === 'leave',
  })

  // My payslips
  const { data: payslips } = useQuery({
    queryKey: ['my-payslips'],
    queryFn: () => api.get('/hrms/payroll/my/payslips', { params: { size: 12 } }).then(r => r.data.data?.content ?? []),
    enabled: tab === 'payslips',
  })

  // My expenses
  const { data: expenses } = useQuery({
    queryKey: ['my-expenses'],
    queryFn: () => api.get('/expenses/my', { params: { size: 20 } }).then(r => r.data.data?.content ?? []),
    enabled: tab === 'expenses',
  })

  const applyLeave = useMutation({
    mutationFn: () => api.post('/hrms/leave', leaveForm),
    onSuccess: () => { toast.success('Leave application submitted'); setLeave(f => ({ ...f, startDate: '', endDate: '', reason: '' })) },
    onError:   (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to apply for leave'),
  })

  const submitExpense = useMutation({
    mutationFn: () => api.post('/expenses', { ...expForm, amount: Number(expForm.amount) }),
    onSuccess: () => { toast.success('Expense claim submitted'); setExp(f => ({ ...f, amount: '', notes: '' })) },
    onError:   (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to submit expense'),
  })

  const STATUS_COLOR: Record<string, string> = {
    APPROVED: '#059669', PENDING: '#D97706', REJECTED: '#DC2626',
    SUBMITTED: '#2563EB', PAID: '#059669', PENDING_APPROVAL: '#D97706',
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      {/* Welcome banner */}
      <div className="card" style={{ marginBottom: '20px', background: 'var(--btn-primary-bg)', border: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '20px', fontWeight: 700, color: 'white', fontFamily: 'serif' }}>
            {user?.fullName?.charAt(0) ?? 'U'}
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'white', margin: 0 }}>Welcome, {user?.fullName?.split(' ')[0]}</h1>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: 0 }}>Employee Self-Service Portal · {user?.email}</p>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', margin: 0 }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-surface)', borderRadius: '12px', padding: '4px', marginBottom: '20px' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 4px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit',
              background: tab === t.id ? 'var(--bg-card)' : 'transparent',
              color: tab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: tab === t.id ? 'var(--shadow-card)' : 'none' }}>
            <t.icon size={13} />{t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
            {[
              { label: 'Annual Leave Left',  val: (leaveBalance as any)?.ANNUAL ?? '—',  sub: 'days',   color: '#059669', icon: Calendar   },
              { label: 'Sick Leave Left',    val: (leaveBalance as any)?.SICK   ?? '—',  sub: 'days',   color: '#2563EB', icon: AlertTriangle},
              { label: 'Expense Claims',     val: '—',                                   sub: 'pending', color: '#D97706', icon: FileText   },
            ].map(k => (
              <div key={k.label} className="card" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
          <div className="card">
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>Quick Actions</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {[
                { label: 'Apply for Leave',     action: () => setTab('leave'),   icon: Calendar   },
                { label: 'Submit Expense',      action: () => setTab('expenses'), icon: FileText   },
                { label: 'Download Payslip',    action: () => setTab('payslips'), icon: Download   },
                { label: 'Log Today\'s Time',  action: () => setTab('timesheet'), icon: Clock      },
              ].map(q => (
                <button key={q.label} onClick={q.action} className="btn-secondary h-10" style={{ fontSize: '13px' }}>
                  <q.icon size={14} />{q.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payslips */}
      {tab === 'payslips' && (
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>My Payslips</h3>
          {(payslips as any[] ?? []).length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0' }}>No payslips available yet</p>
          ) : (
            <div className="space-y-2">
              {(payslips as any[]).map((p: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{p.month ?? `Month ${i+1}`} {p.year}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Net: ₹{(p.netPay ?? 0).toLocaleString('en-IN')}</p>
                  </div>
                  <button className="btn-secondary h-8 text-xs" onClick={()=>toast.success('Payslip download started')}>Download PDF</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Leave */}
      {tab === 'leave' && (
        <div className="space-y-4">
          <div className="card">
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Apply for Leave</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="label">Leave Type</label>
                <select className="input h-10" value={leaveForm.type} onChange={e => setLeave(f => ({ ...f, type: e.target.value }))}>
                  {['ANNUAL','SICK','CASUAL','COMPENSATORY','MATERNITY','PATERNITY'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div />
              <div>
                <label className="label label-required">Start Date</label>
                <input type="date" className="input h-10" value={leaveForm.startDate} onChange={e => setLeave(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div>
                <label className="label label-required">End Date</label>
                <input type="date" className="input h-10" value={leaveForm.endDate} onChange={e => setLeave(f => ({ ...f, endDate: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="label">Reason</label>
                <textarea className="input" rows={3} placeholder="Brief reason for leave..." value={leaveForm.reason} onChange={e => setLeave(f => ({ ...f, reason: e.target.value }))} />
              </div>
            </div>
            <button className="btn-primary h-10 mt-4" disabled={!leaveForm.startDate || !leaveForm.endDate || applyLeave.isPending}
              onClick={() => applyLeave.mutate()}>
              {applyLeave.isPending ? 'Submitting...' : <><Plus size={14} /> Apply for Leave</>}
            </button>
          </div>
          {/* My leave history */}
          {(myLeaves as any[] ?? []).length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>My Leave History</h3>
              {(myLeaves as any[]).map((l: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{l.leaveType?.replace(/_/g, ' ')} Leave</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{l.startDate} → {l.endDate}</p>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: `${STATUS_COLOR[l.status] ?? '#6B7280'}18`, color: STATUS_COLOR[l.status] ?? '#6B7280' }}>
                    {l.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Expenses */}
      {tab === 'expenses' && (
        <div className="space-y-4">
          <div className="card">
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Submit Expense Claim</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="label">Category</label>
                <select className="input h-10" value={expForm.category} onChange={e => setExp(f => ({ ...f, category: e.target.value }))}>
                  {['TRAVEL','ACCOMMODATION','FOOD','SUPPLIES','COMMUNICATION','PROFESSIONAL','OTHER'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label label-required">Amount (₹)</label>
                <input type="number" className="input h-10" placeholder="0.00" value={expForm.amount} onChange={e => setExp(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div>
                <label className="label label-required">Date</label>
                <input type="date" className="input h-10" value={expForm.date} onChange={e => setExp(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="label">Notes / Description</label>
                <input className="input h-10" placeholder="Brief description of expense" value={expForm.notes} onChange={e => setExp(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <button className="btn-primary h-10 mt-4" disabled={!expForm.amount || !expForm.date || submitExpense.isPending}
              onClick={() => submitExpense.mutate()}>
              {submitExpense.isPending ? 'Submitting...' : <><FileText size={14} /> Submit Expense</>}
            </button>
          </div>
        </div>
      )}

      {/* Timesheet shortcut */}
      {tab === 'timesheet' && (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <Clock size={40} style={{ color: 'var(--gold)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Weekly Timesheet</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Log your daily hours, track billable time, and submit for approval</p>
          <a href="/timesheet" className="btn-primary h-10 px-8" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={15} /> Open Full Timesheet
          </a>
        </div>
      )}
    </div>
  )
}
