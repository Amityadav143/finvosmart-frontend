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
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { caReviewsApi, reviewLink, REVIEW_STATUS, type DocReview, type ReviewDecision, type ReviewStatus } from '@/lib/api/caReviews'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useAuthStore } from '@/lib/store/slices/authStore'
import { timeAgo } from '@/lib/notifications'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Lock, Unlock, FileCheck, ShieldCheck, UserPlus, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiError, formatDate } from '@/lib/utils'

type Tab = 'reviews' | 'periods' | 'accountant'

interface PeriodLock {
  id: string; periodStart: string; periodEnd: string; lockType: string
  status: 'LOCKED' | 'UNLOCKED'; lockReason?: string; unlockReason?: string
}

const FILTERS: { id: ReviewStatus | ''; label: string }[] = [
  { id: 'PENDING_REVIEW', label: 'Waiting' },
  { id: 'CHANGES_REQUESTED', label: 'Changes asked for' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: '', label: 'All' },
]

const DECISION: Record<ReviewDecision, { title: string; button: string; noteLabel: string; needsNote: boolean }> = {
  approve:           { title: 'Approve', button: 'Approve', noteLabel: 'Comment (optional)', needsNote: false },
  'request-changes': { title: 'Ask for changes', button: 'Send back', noteLabel: 'What needs to change', needsNote: true },
  reject:            { title: 'Reject', button: 'Reject', noteLabel: 'Why it is rejected', needsNote: true },
}

export default function CaWorkspacePage() {
  const qc = useQueryClient()
  const { can } = usePermissions()
  const me = useAuthStore(s => s.user?.userId)
  const checker = can('FINANCE_APPROVE')
  const [tab, setTab] = useState<Tab>('reviews')
  const [filter, setFilter] = useState<ReviewStatus | ''>('PENDING_REVIEW')
  const [deciding, setDeciding] = useState<{ review: DocReview; decision: ReviewDecision } | null>(null)
  const [note, setNote] = useState('')
  const [showLock, setShowLock] = useState(false)
  const [lockForm, setLockForm] = useState({ periodStart: '', periodEnd: '', lockType: 'MONTH', reason: '' })

  const { data: counts } = useQuery({ queryKey: ['ca-reviews', 'counts'], queryFn: caReviewsApi.counts })
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['ca-reviews', 'list', filter],
    queryFn: () => caReviewsApi.list(filter || undefined),
    enabled: tab === 'reviews',
  })
  const { data: locks = [] } = useQuery({
    queryKey: ['ca-locks'],
    queryFn: () => api.get('/ca/period-locks').then(r => (r.data.data ?? []) as PeriodLock[]),
    enabled: tab === 'periods',
  })

  const decide = useMutation({
    mutationFn: ({ id, decision, text }: { id: string; decision: ReviewDecision; text: string }) => caReviewsApi.decide(id, decision, text),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['ca-reviews'] })
      qc.invalidateQueries({ queryKey: ['doc-review'] })
      setDeciding(null); setNote('')
      toast.success(v.decision === 'approve' ? 'Approved — the sender has been told' : v.decision === 'reject' ? 'Rejected — the sender has been told' : 'Sent back with your note')
    },
    onError: (e: any) => toast.error(apiError(e, 'The decision could not be saved')),
  })

  const lockPeriod = useMutation({
    mutationFn: () => api.post('/ca/period-locks', lockForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ca-locks'] })
      setShowLock(false); setLockForm({ periodStart: '', periodEnd: '', lockType: 'MONTH', reason: '' })
      toast.success('Period locked — nothing dated in it can be added or changed')
    },
    onError: (e: any) => toast.error(apiError(e, 'The period could not be locked')),
  })
  const unlockPeriod = useMutation({
    mutationFn: (id: string) => api.post(`/ca/period-locks/${id}/unlock`, { reason: 'Reopened for correction' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ca-locks'] }); toast.success('Period unlocked') },
    onError: (e: any) => toast.error(apiError(e, 'The period could not be unlocked')),
  })

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'reviews', label: 'Reviews', icon: FileCheck },
    { id: 'periods', label: 'Locked periods', icon: Lock },
    { id: 'accountant', label: 'Your accountant', icon: UserPlus },
  ]
  const tiles: [keyof NonNullable<typeof counts>, string, ReviewStatus][] = [
    ['pendingReview', 'Waiting for review', 'PENDING_REVIEW'],
    ['changesRequested', 'Sent back for changes', 'CHANGES_REQUESTED'],
    ['approved', 'Approved', 'APPROVED'],
    ['rejected', 'Rejected', 'REJECTED'],
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <ShieldCheck size={22} style={{ color: 'var(--gold)' }} /> CA workspace
        </h1>
        <p className="page-subtitle">
          Invoices, bills and journal entries sent to your accountant for review — and periods locked once returns are filed.
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {tiles.map(([key, label, status]) => (
          <button key={key} className="card" style={{ textAlign: 'left', cursor: 'pointer', border: filter === status && tab === 'reviews' ? '1px solid var(--gold)' : undefined }}
            onClick={() => { setTab('reviews'); setFilter(status) }}>
            <p style={{ fontSize: '24px', fontWeight: 700, color: REVIEW_STATUS[status].color, margin: 0 }}>{counts?.[key] ?? 0}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
          </button>
        ))}
      </div>

      <div role="tablist" style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
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

      {tab === 'reviews' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(f => (
              <button key={f.label} onClick={() => setFilter(f.id)} className="text-xs"
                style={{ padding: '6px 12px', borderRadius: '100px', fontWeight: 600, cursor: 'pointer',
                  border: `1px solid ${filter === f.id ? 'var(--gold)' : 'var(--border)'}`,
                  background: filter === f.id ? 'var(--gold-muted)' : 'var(--bg-card)', color: filter === f.id ? 'var(--gold)' : 'var(--text-secondary)' }}>
                {f.label}
              </button>
            ))}
          </div>

          {isLoading && <div className="card text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</div>}
          {!isLoading && reviews.length === 0 && (
            <div className="card" style={{ padding: 0 }}>
              <EmptyState icon={FileCheck} compact
                title={filter === 'PENDING_REVIEW' ? 'Nothing waiting for review' : 'Nothing here'}
                description="Open an invoice, a supplier bill or a journal entry and choose “Send for review”. It lands here for whoever approves accounts — your CA, or a senior accountant — who approves it, sends it back with a note, or rejects it. The sender is notified either way." />
            </div>
          )}
          {reviews.map(r => {
            const meta = REVIEW_STATUS[r.status] ?? REVIEW_STATUS.PENDING_REVIEW
            const own = !!me && r.makerId === me
            const canDecide = checker && r.status === 'PENDING_REVIEW' && !own
            return (
              <div key={r.id} className="card" data-testid="review-row">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div style={{ flex: 1, minWidth: '260px' }}>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 9px', borderRadius: '100px', background: meta.bg, color: meta.color }}>{meta.label}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {r.makerName ? `sent by ${r.makerName}` : 'sent'}{r.updatedAt || r.createdAt ? ` · ${timeAgo((r.updatedAt || r.createdAt)!)}` : ''}
                      </span>
                    </div>
                    <Link href={reviewLink(r.entityType, r.entityId)} style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}>
                      {r.entityLabel || r.entityType} <ArrowRight size={13} style={{ display: 'inline', verticalAlign: '-2px', color: 'var(--text-muted)' }} />
                    </Link>
                    {r.makerNote && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>“{r.makerNote}”</p>}
                    {r.checkerNote && r.status !== 'PENDING_REVIEW' && (
                      <p style={{ fontSize: '13px', color: meta.color, margin: '4px 0 0' }}>{r.checkerName ?? 'Reviewer'}: {r.checkerNote}</p>
                    )}
                    {own && r.status === 'PENDING_REVIEW' && <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>You sent this — someone else reviews it.</p>}
                  </div>
                  {canDecide && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button className="btn-secondary h-8 text-xs" onClick={() => { setNote(''); setDeciding({ review: r, decision: 'request-changes' }) }}>Ask for changes</button>
                      <button className="h-8 text-xs px-3 rounded-lg font-medium" onClick={() => { setNote(''); setDeciding({ review: r, decision: 'reject' }) }}
                        style={{ background: 'rgba(220,38,38,0.1)', color: '#DC2626', border: '1px solid rgba(220,38,38,0.2)' }}>Reject</button>
                      <button className="h-8 text-xs px-3 rounded-lg font-medium" onClick={() => { setNote(''); setDeciding({ review: r, decision: 'approve' }) }}
                        style={{ background: 'rgba(5,150,105,0.1)', color: '#059669', border: '1px solid rgba(5,150,105,0.2)' }}>Approve</button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'periods' && (
        <div className="space-y-3">
          <div className="card text-sm" style={{ color: 'var(--text-secondary)' }}>
            Lock a month, quarter or year once its GST returns or audit are done: invoices, bills and journal entries dated in it can&apos;t then be
            added, changed or cancelled until someone with approval rights unlocks it.
          </div>
          {can('FINANCE_APPROVE') && (
            <button className="btn-primary h-9" onClick={() => setShowLock(true)}>
              <Lock size={15} /> Lock a period
            </button>
          )}
          {locks.length === 0 && <div className="card text-sm" style={{ color: 'var(--text-muted)' }}>No periods locked yet.</div>}
          {locks.map(l => (
            <div key={l.id} className="card flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div style={{ width: '36px', height: '36px', borderRadius: '10px',
                  background: l.status === 'LOCKED' ? 'rgba(220,38,38,0.1)' : 'rgba(5,150,105,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {l.status === 'LOCKED' ? <Lock size={16} style={{ color: '#DC2626' }} /> : <Unlock size={16} style={{ color: '#059669' }} />}
                </div>
                <div>
                  <p style={{ fontSize: '13.5px', fontWeight: 600, margin: 0 }}>{formatDate(l.periodStart)} – {formatDate(l.periodEnd)}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                    {l.status === 'LOCKED' ? 'Locked' : 'Unlocked'}{l.lockReason ? ` · ${l.lockReason}` : ''}{l.status === 'UNLOCKED' && l.unlockReason ? ` · reopened: ${l.unlockReason}` : ''}
                  </p>
                </div>
              </div>
              {l.status === 'LOCKED' && can('FINANCE_APPROVE') && (
                <button className="btn-secondary h-8 text-xs" onClick={() => unlockPeriod.mutate(l.id)}>
                  <Unlock size={13} /> Unlock
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'accountant' && (
        <div className="card space-y-3" style={{ maxWidth: '760px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Working with your CA</h2>
          <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <li>Invite your accountant as a user under Settings → Users, with a role that can approve accounts (Company Admin, or a role with “Approve entries”).</li>
            <li>They sign in with your company code — one login per client company; anyone working for several clients picks the company at sign-in.</li>
            <li>Your team sends invoices, bills and journal entries for review from the document itself; your accountant decides here, and the sender is notified.</li>
            <li>Once returns are filed, lock the period so nothing in it changes by accident.</li>
          </ol>
          {can('SETTINGS_USERS') && (
            <Link href="/settings/users" className="btn-primary h-9" style={{ display: 'inline-flex', textDecoration: 'none' }}>
              <UserPlus size={15} /> Invite your accountant
            </Link>
          )}
        </div>
      )}

      <Modal open={!!deciding} onClose={() => setDeciding(null)} title={deciding ? DECISION[deciding.decision].title : ''}
        subtitle={deciding?.review.entityLabel}>
        {deciding && (
          <>
            {deciding.review.makerNote && <p className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>{deciding.review.makerName ?? 'The sender'} wrote: “{deciding.review.makerNote}”</p>}
            <label className="label" htmlFor="ca-decision-note">{DECISION[deciding.decision].noteLabel}</label>
            <textarea id="ca-decision-note" className="input" rows={3} maxLength={500} value={note} onChange={e => setNote(e.target.value)} />
            <div className="flex justify-end gap-2" style={{ marginTop: '16px' }}>
              <button className="btn-secondary" onClick={() => setDeciding(null)}>Cancel</button>
              <button className={deciding.decision === 'reject' ? 'btn-danger' : 'btn-primary'}
                disabled={decide.isPending || (DECISION[deciding.decision].needsNote && !note.trim())}
                onClick={() => decide.mutate({ id: deciding.review.id, decision: deciding.decision, text: note.trim() })}>
                {decide.isPending ? 'Saving…' : DECISION[deciding.decision].button}
              </button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={showLock} onClose={() => setShowLock(false)} title="Lock a period" subtitle="Nothing dated in it can be added, changed or cancelled until it is unlocked.">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="lock-from">First day</label>
            <input id="lock-from" type="date" className="input h-10" value={lockForm.periodStart} onChange={e => setLockForm(f => ({ ...f, periodStart: e.target.value }))} />
          </div>
          <div>
            <label className="label" htmlFor="lock-to">Last day</label>
            <input id="lock-to" type="date" className="input h-10" value={lockForm.periodEnd} onChange={e => setLockForm(f => ({ ...f, periodEnd: e.target.value }))} />
          </div>
        </div>
        <label className="label" htmlFor="lock-kind" style={{ marginTop: '10px' }}>Kind of period</label>
        <select id="lock-kind" className="input h-10" value={lockForm.lockType} onChange={e => setLockForm(f => ({ ...f, lockType: e.target.value }))}>
          <option value="MONTH">Month</option><option value="QUARTER">Quarter</option>
          <option value="YEAR">Year</option><option value="CUSTOM">Other dates</option>
        </select>
        <label className="label" htmlFor="lock-why" style={{ marginTop: '10px' }}>Reason</label>
        <input id="lock-why" className="input h-10" placeholder="e.g. GSTR-1 and GSTR-3B filed for September"
          value={lockForm.reason} onChange={e => setLockForm(f => ({ ...f, reason: e.target.value }))} />
        <div className="flex gap-2 justify-end" style={{ marginTop: '16px' }}>
          <button className="btn-secondary" onClick={() => setShowLock(false)}>Cancel</button>
          <button className="btn-primary" onClick={() => lockPeriod.mutate()} disabled={!lockForm.periodStart || !lockForm.periodEnd || lockPeriod.isPending}>
            {lockPeriod.isPending ? 'Locking…' : 'Lock period'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
