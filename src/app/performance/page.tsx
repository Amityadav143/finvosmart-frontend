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
import { hrmsApi } from '@/lib/api/hrms'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { EmptyState } from '@/components/ui/EmptyState'
import { Star, TrendingUp, CheckCircle2, Clock, Plus, ChevronDown, ChevronUp, MessageSquare, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiError } from '@/lib/utils'

type ReviewStatus = 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'ACKNOWLEDGED' | 'COMPLETED'
type ReviewType = 'PROBATION' | 'MID_YEAR' | 'ANNUAL' | 'PIP'
interface Review {
  id: string; employeeId: string; employeeName: string; reviewerName?: string; reviewPeriod?: string; type: ReviewType; status: ReviewStatus
  overallScore?: number; overallRating?: string; reviewDate?: string
  scorePerformance?: number; scoreCommunication?: number; scoreTeamwork?: number
  scoreInitiative?: number; scoreTechnical?: number
  strengthsSummary?: string; areasImprovement?: string; goalsNextPeriod?: string; reviewerComments?: string; employeeComments?: string
}

/** What each step means for the people involved. */
const STATUS_META: Record<ReviewStatus, { label: string; color: string; bg: string; icon: any }> = {
  PENDING:      { label: 'To be scored',            color: '#6B7280', bg: 'rgba(107,114,128,0.1)', icon: Clock },
  IN_PROGRESS:  { label: 'Being scored',            color: '#2563EB', bg: 'rgba(37,99,235,0.1)',   icon: TrendingUp },
  SUBMITTED:    { label: 'Waiting for the employee', color: '#D97706', bg: 'rgba(217,119,6,0.1)',  icon: Star },
  ACKNOWLEDGED: { label: 'Acknowledged',            color: '#7C3AED', bg: 'rgba(124,58,237,0.1)', icon: MessageSquare },
  COMPLETED:    { label: 'Completed',               color: '#059669', bg: 'rgba(5,150,105,0.1)',   icon: CheckCircle2 },
}

const TYPE_LABEL: Record<ReviewType, string> = {
  ANNUAL: 'Annual review', MID_YEAR: 'Mid-year review', PROBATION: 'Probation review', PIP: 'Improvement plan (PIP)',
}

const RATING_META: Record<string, { color: string; label: string }> = {
  OUTSTANDING:    { color: '#059669', label: 'Outstanding' },
  EXCEEDS:        { color: '#2563EB', label: 'Exceeds expectations' },
  MEETS:          { color: '#D97706', label: 'Meets expectations' },
  BELOW:          { color: '#EA580C', label: 'Below expectations' },
  UNSATISFACTORY: { color: '#DC2626', label: 'Unsatisfactory' },
}

const WEIGHTS: [keyof Review & string, string, string][] = [
  ['scorePerformance', 'Job performance', '30%'],
  ['scoreTechnical', 'Technical skills', '25%'],
  ['scoreCommunication', 'Communication', '20%'],
  ['scoreTeamwork', 'Teamwork', '15%'],
  ['scoreInitiative', 'Initiative', '10%'],
]

/** The financial year (April–March) today falls in, e.g. FY2026-27 — the default review period. */
function currentFY(d = new Date()) {
  const start = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1
  return `FY${start}-${String((start + 1) % 100).padStart(2, '0')}`
}

const BLANK_SCORES = { scorePerformance: 3, scoreCommunication: 3, scoreTeamwork: 3, scoreInitiative: 3, scoreTechnical: 3, strengthsSummary: '', areasImprovement: '', goalsNextPeriod: '', reviewerComments: '' }

function ScoreSlider({ label, value, onChange, weight }: { label: string; value: number; onChange: (v: number) => void; weight: string }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>({weight} of the overall score)</span>
        </div>
        <span style={{ fontSize: '16px', fontWeight: 700, color: value >= 4 ? '#059669' : value >= 3 ? '#D97706' : '#DC2626' }}>
          {value.toFixed(1)} / 5
        </span>
      </div>
      <input type="range" min="1" max="5" step="0.5" value={value} aria-label={label}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--gold)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
        <span>Poor (1)</span><span>Average (3)</span><span>Excellent (5)</span>
      </div>
    </div>
  )
}

function Dialog({ label, onClose, width = 480, children }: { label: string; onClose: () => void; width?: number; children: React.ReactNode }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={label} onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: `${width}px`, maxHeight: '90vh', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  )
}

export default function PerformancePage() {
  const qc = useQueryClient()
  const p = usePermissions()
  // The server lets managers, HR and administrators start and score reviews; HR and administrators complete them.
  const reviewer = p.isSuperAdmin || p.hasRole('COMPANY_ADMIN') || p.hasRole('HR_ADMIN') || p.hasRole('MANAGER')
  const hr = p.isSuperAdmin || p.hasRole('COMPANY_ADMIN') || p.hasRole('HR_ADMIN')
  const fy = currentFY()

  const [expanded, setExpanded] = useState<string | null>(null)
  const [scoring, setScoring] = useState<Review | null>(null)
  const [scores, setScores] = useState({ ...BLANK_SCORES })
  const [acking, setAcking] = useState<Review | null>(null)
  const [ackNote, setAckNote] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newReview, setNewReview] = useState({ employeeId: '', reviewPeriod: fy, type: 'ANNUAL' as ReviewType })

  const mine = useQuery({
    queryKey: ['performance-reviews', 'mine'],
    queryFn: () => api.get('/performance/reviews/mine').then(r => (r.data.data ?? []) as Review[]),
  })
  const team = useQuery({
    queryKey: ['performance-reviews', 'team'],
    queryFn: () => api.get('/performance/reviews', { params: { size: 100 } }).then(r => (r.data.data?.content ?? []) as Review[]),
    enabled: reviewer,
  })
  const { data: stats } = useQuery({
    queryKey: ['perf-stats', fy],
    queryFn: () => api.get('/performance/stats', { params: { period: fy } }).then(r => r.data.data),
    enabled: hr,
  })
  const { data: people } = useQuery({
    queryKey: ['employees', 'active-for-review'],
    queryFn: () => hrmsApi.employees.list({ page: 0, size: 500, status: 'ACTIVE' }),
    enabled: showCreate,
  })

  const refresh = () => { qc.invalidateQueries({ queryKey: ['performance-reviews'] }); qc.invalidateQueries({ queryKey: ['perf-stats'] }) }

  const createReview = useMutation({
    mutationFn: (d: typeof newReview) => api.post('/performance/reviews', { ...d, reviewPeriod: d.reviewPeriod.trim() || undefined }),
    onSuccess: () => { refresh(); setShowCreate(false); setNewReview({ employeeId: '', reviewPeriod: fy, type: 'ANNUAL' }); toast.success('Review started — score it when you are ready') },
    onError: (e: any) => toast.error(apiError(e, 'The review could not be started')),
  })
  const submitScores = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof scores }) => api.patch(`/performance/reviews/${id}/scores`, data),
    onSuccess: () => { refresh(); setScoring(null); toast.success('Scores saved — the employee has been told') },
    onError: (e: any) => toast.error(apiError(e, 'The scores could not be saved')),
  })
  const acknowledge = useMutation({
    mutationFn: ({ id, comments }: { id: string; comments: string }) => api.patch(`/performance/reviews/${id}/acknowledge`, { comments }),
    onSuccess: () => { refresh(); setAcking(null); toast.success('Thanks — your reviewer has been told') },
    onError: (e: any) => toast.error(apiError(e, 'Your acknowledgement could not be saved')),
  })
  const completeReview = useMutation({
    mutationFn: (id: string) => api.patch(`/performance/reviews/${id}/complete`),
    onSuccess: () => { refresh(); toast.success('Review completed') },
    onError: (e: any) => toast.error(apiError(e, 'The review could not be completed')),
  })

  const openScoring = (r: Review) => {
    setScores({
      scorePerformance: r.scorePerformance ?? 3, scoreCommunication: r.scoreCommunication ?? 3, scoreTeamwork: r.scoreTeamwork ?? 3,
      scoreInitiative: r.scoreInitiative ?? 3, scoreTechnical: r.scoreTechnical ?? 3,
      strengthsSummary: r.strengthsSummary ?? '', areasImprovement: r.areasImprovement ?? '', goalsNextPeriod: r.goalsNextPeriod ?? '', reviewerComments: r.reviewerComments ?? '',
    })
    setScoring(r)
  }
  const overall = () => {
    const s = scores
    return (s.scorePerformance * 0.30 + s.scoreTechnical * 0.25 + s.scoreCommunication * 0.20 + s.scoreTeamwork * 0.15 + s.scoreInitiative * 0.10).toFixed(2)
  }

  const myIds = new Set((mine.data ?? []).map(r => r.id))
  const teamReviews = (team.data ?? []).filter(r => !myIds.has(r.id))
  const waiting = teamReviews.filter(r => r.status === 'PENDING' || r.status === 'IN_PROGRESS').length

  const card = (review: Review, own: boolean) => {
    const meta = STATUS_META[review.status] ?? STATUS_META.PENDING
    const Icon = meta.icon
    const open = expanded === review.id
    const scored = review.scorePerformance != null
    const canScore = !own && reviewer && (review.status === 'PENDING' || review.status === 'IN_PROGRESS' || review.status === 'SUBMITTED')
    const canComplete = !own && hr && (review.status === 'SUBMITTED' || review.status === 'ACKNOWLEDGED')
    return (
      <div key={review.id} className="card" style={{ padding: 0, overflow: 'hidden' }} data-testid="review-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px' }}>
          <button onClick={() => setExpanded(e => e === review.id ? null : review.id)} aria-expanded={open}
            style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', padding: 0, minWidth: 0 }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={18} style={{ color: meta.color }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{own ? 'Your review' : review.employeeName}</span>
                <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: meta.bg, color: meta.color }}>{own && review.status === 'SUBMITTED' ? 'Waiting for you' : meta.label}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{TYPE_LABEL[review.type] ?? review.type}{review.reviewPeriod ? ` · ${review.reviewPeriod}` : ''}{review.reviewerName ? ` · by ${review.reviewerName}` : ''}</span>
              </div>
              {review.overallRating && (
                <p style={{ fontSize: '12.5px', color: RATING_META[review.overallRating]?.color, margin: 0 }}>
                  {RATING_META[review.overallRating]?.label ?? review.overallRating} · {review.overallScore?.toFixed(2)} out of 5
                </p>
              )}
            </div>
            {open ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
          </button>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
            {own && review.status === 'SUBMITTED' && (
              <button className="btn-primary h-8 text-xs" onClick={() => { setAckNote(''); setAcking(review) }}>Read and acknowledge</button>
            )}
            {canScore && (
              <button className={review.status === 'SUBMITTED' ? 'btn-secondary h-8 text-xs' : 'btn-primary h-8 text-xs'} onClick={() => openScoring(review)}>
                {review.status === 'SUBMITTED' ? 'Change scores' : 'Score'}
              </button>
            )}
            {canComplete && (
              <button className="btn-primary h-8 text-xs" onClick={() => completeReview.mutate(review.id)} disabled={completeReview.isPending}>Complete</button>
            )}
          </div>
        </div>

        {open && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px' }}>
            {!scored ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                {own ? 'Your reviewer hasn’t scored this yet. You’ll get a notification when it is ready.' : 'Not scored yet.'}
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px 24px' }}>
                {WEIGHTS.map(([key, label, weight]) => {
                  const v = Number(review[key as keyof Review])
                  return (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{label} <span style={{ color: 'var(--text-muted)' }}>({weight})</span></span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: v >= 4 ? '#059669' : v >= 3 ? '#D97706' : '#DC2626' }}>{v.toFixed(1)}</span>
                    </div>
                  )
                })}
                {([['Strengths', review.strengthsSummary], ['To work on', review.areasImprovement], ['Goals for the next period', review.goalsNextPeriod],
                   ['Reviewer’s comments', review.reviewerComments], [own ? 'Your comments' : 'Employee’s comments', review.employeeComments]] as [string, string | undefined][])
                  .filter(([, text]) => text).map(([title, text]) => (
                    <div key={title} style={{ gridColumn: '1/-1' }}>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{title}</p>
                      <p style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', margin: 0 }}>{text}</p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const loading = mine.isLoading || (reviewer && team.isLoading)
  const nothing = !loading && (mine.data ?? []).length === 0 && teamReviews.length === 0

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Performance reviews</h1>
          <p className="page-subtitle">
            {reviewer ? `Score your team on five weighted areas; each person reads their review and adds comments.${waiting ? ` ${waiting} waiting to be scored.` : ''}`
                      : 'Your reviews, with the scores and comments from your reviewer.'}
          </p>
        </div>
        {reviewer && (
          <button className="btn-primary h-9" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> Start a review
          </button>
        )}
      </div>

      {hr && stats && !stats.message && (
        <div className="card" data-testid="review-stats">
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
            {fy} · completed reviews
          </h3>
          <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--gold)', margin: 0 }}>{Number(stats.averageScore ?? 0).toFixed(2)}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Average score out of 5</p>
            </div>
            <div>
              <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{stats.totalReviews ?? 0}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Reviews completed</p>
            </div>
            {stats.ratingDistribution && Object.entries(stats.ratingDistribution as Record<string, number>).filter(([, n]) => n > 0).map(([rating, count]) => (
              <div key={rating}>
                <p style={{ fontSize: '20px', fontWeight: 700, color: RATING_META[rating]?.color ?? 'var(--text-primary)', margin: '6px 0 0' }}>{count}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{RATING_META[rating]?.label ?? rating}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && <div className="card text-sm" style={{ color: 'var(--text-muted)' }}>Loading reviews…</div>}

      {(mine.data ?? []).length > 0 && (
        <section className="space-y-3" aria-label="Your reviews">
          {reviewer && <h2 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Your reviews</h2>}
          {(mine.data ?? []).map(r => card(r, true))}
        </section>
      )}

      {reviewer && teamReviews.length > 0 && (
        <section className="space-y-3" aria-label="Team reviews">
          <h2 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Team reviews</h2>
          {teamReviews.map(r => card(r, false))}
        </section>
      )}

      {nothing && (
        <div className="card" style={{ padding: 0 }}>
          {reviewer
            ? <EmptyState icon={Users} title="No reviews yet"
                description={`Start a review for anyone in your team: score five areas from 1 to 5, add strengths and what to work on, and they read it and reply. Reviews for ${fy} are summed up here once completed.`}
                action={{ label: 'Start a review', onClick: () => setShowCreate(true) }} />
            : <EmptyState icon={Star} title="No reviews for you yet"
                description="When your manager or HR reviews you, it appears here and you get a notification to read it and add your comments." />}
        </div>
      )}

      {scoring && (
        <Dialog label="Score the review" onClose={() => setScoring(null)} width={560}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)' }}>Score {scoring.employeeName}</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            {TYPE_LABEL[scoring.type]}{scoring.reviewPeriod ? ` · ${scoring.reviewPeriod}` : ''} · overall <b style={{ color: 'var(--gold)', fontSize: '16px' }}>{overall()} / 5</b>
          </p>
          {WEIGHTS.map(([key, label, weight]) => (
            <ScoreSlider key={key} label={label} weight={weight} value={(scores as any)[key]} onChange={v => setScores(s => ({ ...s, [key]: v }))} />
          ))}
          {[
            { key: 'strengthsSummary', label: 'Strengths' },
            { key: 'areasImprovement', label: 'What to work on' },
            { key: 'goalsNextPeriod', label: 'Goals for the next period' },
            { key: 'reviewerComments', label: 'Overall comments' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: '12px' }}>
              <label className="label" htmlFor={`pr-${f.key}`}>{f.label}</label>
              <textarea id={`pr-${f.key}`} className="input" rows={3} value={(scores as any)[f.key]}
                onChange={e => setScores(s => ({ ...s, [f.key]: e.target.value }))} />
            </div>
          ))}
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Saving sends the review to {scoring.employeeName.split(' ')[0]} to read and acknowledge. You can change the scores until they do.</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button className="btn-secondary h-10" onClick={() => setScoring(null)}>Cancel</button>
            <button className="btn-primary h-10" onClick={() => submitScores.mutate({ id: scoring.id, data: scores })} disabled={submitScores.isPending}>
              {submitScores.isPending ? 'Saving…' : 'Save and send'}
            </button>
          </div>
        </Dialog>
      )}

      {acking && (
        <Dialog label="Acknowledge your review" onClose={() => setAcking(null)}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>Acknowledge your review</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            You have read it: {acking.overallScore != null ? `${acking.overallScore.toFixed(2)} out of 5` : ''}{acking.overallRating ? ` (${RATING_META[acking.overallRating]?.label ?? acking.overallRating})` : ''}.
            Add anything you want on record — agreement, context or questions. Acknowledging doesn’t mean you agree with every point.
          </p>
          <label className="label" htmlFor="pr-ack">Your comments (optional)</label>
          <textarea id="pr-ack" className="input" rows={4} value={ackNote} maxLength={2000} onChange={e => setAckNote(e.target.value)} />
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '18px' }}>
            <button className="btn-secondary h-10" onClick={() => setAcking(null)}>Not now</button>
            <button className="btn-primary h-10" disabled={acknowledge.isPending} onClick={() => acknowledge.mutate({ id: acking.id, comments: ackNote })}>
              {acknowledge.isPending ? 'Saving…' : 'Acknowledge'}
            </button>
          </div>
        </Dialog>
      )}

      {showCreate && (
        <Dialog label="Start a review" onClose={() => setShowCreate(false)} width={460}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '18px', color: 'var(--text-primary)' }}>Start a review</h2>
          <div className="space-y-3">
            <div>
              <label className="label label-required" htmlFor="pr-emp">Employee</label>
              <select id="pr-emp" className="input h-10" value={newReview.employeeId} onChange={e => setNewReview(r => ({ ...r, employeeId: e.target.value }))}>
                <option value="">{people ? 'Choose…' : 'Loading…'}</option>
                {(people?.content ?? []).map(e => <option key={e.id} value={e.id}>{e.fullName}{e.employeeCode ? ` (${e.employeeCode})` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="pr-period">Period</label>
              <input id="pr-period" className="input h-10" maxLength={20} list="pr-periods" value={newReview.reviewPeriod}
                onChange={e => setNewReview(r => ({ ...r, reviewPeriod: e.target.value }))} />
              <datalist id="pr-periods">
                {[fy, `${fy} H1`, `${fy} H2`, `${fy} Q1`, `${fy} Q2`, `${fy} Q3`, `${fy} Q4`].map(x => <option key={x} value={x} />)}
              </datalist>
            </div>
            <div>
              <label className="label" htmlFor="pr-type">Kind of review</label>
              <select id="pr-type" className="input h-10" value={newReview.type} onChange={e => setNewReview(r => ({ ...r, type: e.target.value as ReviewType }))}>
                {(Object.keys(TYPE_LABEL) as ReviewType[]).map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button className="btn-secondary h-10" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn-primary h-10" onClick={() => createReview.mutate(newReview)} disabled={!newReview.employeeId || createReview.isPending}>
              {createReview.isPending ? 'Starting…' : 'Start review'}
            </button>
          </div>
        </Dialog>
      )}
    </div>
  )
}
