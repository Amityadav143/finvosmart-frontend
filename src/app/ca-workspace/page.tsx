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
import {
  Lock, Unlock, CheckCircle2, XCircle, Clock, Users, FileCheck, ShieldCheck, Plus, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

type Tab = 'reviews' | 'periods' | 'clients'

interface ReviewEntry {
  id: string; entityType: string; entityId: string; entityLabel: string
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED'
  makerName?: string; makerNote?: string; checkerName?: string; checkerNote?: string
  createdAt: string
}
interface PeriodLock {
  id: string; periodStart: string; periodEnd: string; lockType: string
  status: 'LOCKED' | 'UNLOCKED'; lockReason?: string; unlockReason?: string
}
interface ClientMapping {
  id: string; clientCompanyName: string; accessLevel: string; status: string
}

const REVIEW_META: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  PENDING_REVIEW:    { color: '#D97706', bg: 'rgba(217,119,6,0.1)',  icon: Clock,        label: 'Pending Review' },
  APPROVED:          { color: '#059669', bg: 'rgba(5,150,105,0.1)',  icon: CheckCircle2, label: 'Approved' },
  REJECTED:          { color: '#DC2626', bg: 'rgba(220,38,38,0.1)',  icon: XCircle,      label: 'Rejected' },
  CHANGES_REQUESTED: { color: '#2563EB', bg: 'rgba(37,99,235,0.1)',  icon: RefreshCw,    label: 'Changes Requested' },
}

export default function CaWorkspacePage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('reviews')
  const [showLock, setShowLock] = useState(false)
  const [showClient, setShowClient] = useState(false)
  const [lockForm, setLockForm] = useState({ periodStart: '', periodEnd: '', lockType: 'MONTH', reason: '' })
  const [clientForm, setClientForm] = useState({ clientCompanyId: '', clientCompanyName: '', accessLevel: 'REVIEW' })

  const { data: counts } = useQuery({
    queryKey: ['ca-review-counts'],
    queryFn: () => api.get('/ca/reviews/counts').then(r => r.data.data),
  })
  const { data: reviews = [] } = useQuery({
    queryKey: ['ca-reviews'],
    queryFn: () => api.get('/ca/reviews?size=50').then(r => r.data.data?.content ?? []),
    enabled: tab === 'reviews',
  })
  const { data: locks = [] } = useQuery({
    queryKey: ['ca-locks'],
    queryFn: () => api.get('/ca/period-locks').then(r => r.data.data ?? []),
    enabled: tab === 'periods',
  })
  const { data: clients = [] } = useQuery({
    queryKey: ['ca-clients'],
    queryFn: () => api.get('/ca/clients').then(r => r.data.data ?? []),
    enabled: tab === 'clients',
  })

  const decide = useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: string; note?: string }) =>
      api.post(`/ca/reviews/${id}/${action}`, { checkerNote: note ?? '' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ca-reviews', 'ca-review-counts'] })
      toast.success('Review decision recorded')
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to record decision'),
  })

  const lockPeriod = useMutation({
    mutationFn: () => api.post('/ca/period-locks', lockForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ca-locks'] })
      setShowLock(false); setLockForm({ periodStart: '', periodEnd: '', lockType: 'MONTH', reason: '' })
      toast.success('Period locked')
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to lock period'),
  })

  const unlockPeriod = useMutation({
    mutationFn: (id: string) => api.post(`/ca/period-locks/${id}/unlock`, { reason: 'Reopened for correction' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ca-locks'] }); toast.success('Period unlocked') },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to unlock'),
  })

  const addClient = useMutation({
    mutationFn: () => api.post('/ca/clients', clientForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ca-clients'] })
      setShowClient(false); setClientForm({ clientCompanyId: '', clientCompanyName: '', accessLevel: 'REVIEW' })
      toast.success('Client linked')
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to link client'),
  })

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'reviews', label: 'Maker-Checker', icon: FileCheck },
    { id: 'periods', label: 'Period Locks',  icon: Lock },
    { id: 'clients', label: 'My Clients',    icon: Users },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ShieldCheck size={22} style={{ color: 'var(--gold)' }} /> CA Collaboration Workspace
          </h1>
          <p className="page-subtitle">Period close & lock · maker-checker review · multi-client management</p>
        </div>
      </div>

      {/* Review count tiles */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          ['pendingReview', 'Pending Review', '#D97706'],
          ['approved', 'Approved', '#059669'],
          ['changesRequested', 'Changes Requested', '#2563EB'],
          ['rejected', 'Rejected', '#DC2626'],
        ].map(([key, label, color]) => (
          <div key={key} className="card">
            <p className="font-serif text-2xl" style={{ color }}>{counts?.[key] ?? 0}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 16px',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none',
                color: tab === t.id ? 'var(--gold)' : 'var(--text-muted)',
                borderBottom: tab === t.id ? '2px solid var(--gold)' : '2px solid transparent',
              }}>
              <Icon size={15} /> {t.label}
            </button>
          )
        })}
      </div>

      {/* REVIEWS */}
      {tab === 'reviews' && (
        <div className="space-y-2">
          {(reviews as ReviewEntry[]).length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <FileCheck size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>No documents awaiting review</p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>When an accountant submits a document for review, it appears here for CA approval.</p>
            </div>
          )}
          {(reviews as ReviewEntry[]).map(r => {
            const meta = REVIEW_META[r.status]
            const Icon = meta.icon
            const pending = r.status === 'PENDING_REVIEW' || r.status === 'CHANGES_REQUESTED'
            return (
              <div key={r.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                        background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>{r.entityType}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px',
                        fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: meta.bg, color: meta.color }}>
                        <Icon size={11} /> {meta.label}
                      </span>
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{r.entityLabel}</p>
                    {r.makerNote && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>Maker note: {r.makerNote}</p>}
                    {r.checkerNote && <p style={{ fontSize: '12px', color: meta.color, marginTop: '3px' }}>Checker: {r.checkerNote}</p>}
                  </div>
                  {pending && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button className="btn-secondary h-8 text-xs"
                        onClick={() => decide.mutate({ id: r.id, action: 'request-changes', note: 'Please revise' })}>
                        Request Changes
                      </button>
                      <button className="h-8 text-xs px-3 rounded-lg font-medium"
                        style={{ background: 'rgba(220,38,38,0.1)', color: '#DC2626', border: '1px solid rgba(220,38,38,0.2)' }}
                        onClick={() => decide.mutate({ id: r.id, action: 'reject', note: 'Rejected' })}>
                        Reject
                      </button>
                      <button className="h-8 text-xs px-3 rounded-lg font-medium"
                        style={{ background: 'rgba(5,150,105,0.1)', color: '#059669', border: '1px solid rgba(5,150,105,0.2)' }}
                        onClick={() => decide.mutate({ id: r.id, action: 'approve', note: 'Approved' })}>
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* PERIODS */}
      {tab === 'periods' && (
        <div className="space-y-3">
          <button className="btn-primary h-9" onClick={() => setShowLock(true)}>
            <Lock size={15} /> Lock a Period
          </button>
          {(locks as PeriodLock[]).map(l => (
            <div key={l.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div style={{ width: '36px', height: '36px', borderRadius: '10px',
                  background: l.status === 'LOCKED' ? 'rgba(220,38,38,0.1)' : 'rgba(5,150,105,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {l.status === 'LOCKED' ? <Lock size={16} style={{ color: '#DC2626' }} /> : <Unlock size={16} style={{ color: '#059669' }} />}
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600 }}>{l.periodStart} → {l.periodEnd}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{l.lockType} · {l.lockReason}</p>
                </div>
              </div>
              {l.status === 'LOCKED' && (
                <button className="btn-secondary h-8 text-xs" onClick={() => unlockPeriod.mutate(l.id)}>
                  <Unlock size={13} /> Unlock
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CLIENTS */}
      {tab === 'clients' && (
        <div className="space-y-3">
          <button className="btn-primary h-9" onClick={() => setShowClient(true)}>
            <Plus size={15} /> Link a Client
          </button>
          {(clients as ClientMapping[]).length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <Users size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>No clients linked yet</p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Link client companies to manage their books from one CA login.</p>
            </div>
          )}
          {(clients as ClientMapping[]).map(c => (
            <div key={c.id} className="card flex items-center justify-between">
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600 }}>{c.clientCompanyName}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Access: {c.accessLevel} · {c.status}</p>
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
                background: 'rgba(5,150,105,0.1)', color: '#059669' }}>{c.accessLevel}</span>
            </div>
          ))}
        </div>
      )}

      {/* Lock modal */}
      {showLock && (
        <div className="modal-overlay" onClick={() => setShowLock(false)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e: any) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Lock a Financial Period</h3>
            <label className="label">Period Start</label>
            <input type="date" className="input h-10 mb-3" value={lockForm.periodStart}
              onChange={e => setLockForm(f => ({ ...f, periodStart: e.target.value }))} />
            <label className="label">Period End</label>
            <input type="date" className="input h-10 mb-3" value={lockForm.periodEnd}
              onChange={e => setLockForm(f => ({ ...f, periodEnd: e.target.value }))} />
            <label className="label">Lock Type</label>
            <select className="input h-10 mb-3" value={lockForm.lockType}
              onChange={e => setLockForm(f => ({ ...f, lockType: e.target.value }))}>
              <option value="MONTH">Month</option><option value="QUARTER">Quarter</option>
              <option value="YEAR">Year</option><option value="CUSTOM">Custom</option>
            </select>
            <label className="label">Reason</label>
            <input className="input h-10 mb-4" placeholder="e.g. GSTR-1 filed for the period"
              value={lockForm.reason} onChange={e => setLockForm(f => ({ ...f, reason: e.target.value }))} />
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary h-9" onClick={() => setShowLock(false)}>Cancel</button>
              <button className="btn-primary h-9" onClick={() => lockPeriod.mutate()}
                disabled={!lockForm.periodStart || !lockForm.periodEnd || lockPeriod.isPending}>
                {lockPeriod.isPending ? 'Locking...' : 'Lock Period'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client modal */}
      {showClient && (
        <div className="modal-overlay" onClick={() => setShowClient(false)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e: any) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Link a Client Company</h3>
            <label className="label">Client Company ID</label>
            <input className="input h-10 mb-3" placeholder="UUID of the client company"
              value={clientForm.clientCompanyId} onChange={e => setClientForm(f => ({ ...f, clientCompanyId: e.target.value }))} />
            <label className="label">Client Company Name</label>
            <input className="input h-10 mb-3" placeholder="e.g. Acme Traders Pvt Ltd"
              value={clientForm.clientCompanyName} onChange={e => setClientForm(f => ({ ...f, clientCompanyName: e.target.value }))} />
            <label className="label">Access Level</label>
            <select className="input h-10 mb-4" value={clientForm.accessLevel}
              onChange={e => setClientForm(f => ({ ...f, accessLevel: e.target.value }))}>
              <option value="VIEW_ONLY">View Only</option>
              <option value="REVIEW">Review (approve/reject)</option>
              <option value="FULL">Full Access</option>
            </select>
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary h-9" onClick={() => setShowClient(false)}>Cancel</button>
              <button className="btn-primary h-9" onClick={() => addClient.mutate()}
                disabled={!clientForm.clientCompanyId || !clientForm.clientCompanyName || addClient.isPending}>
                {addClient.isPending ? 'Linking...' : 'Link Client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
