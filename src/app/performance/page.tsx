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
import { PermissionGate } from '@/components/ui/PermissionGate'
import { Star, TrendingUp, CheckCircle2, Clock, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'

type ReviewStatus = 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'ACKNOWLEDGED' | 'COMPLETED'
type ReviewType = 'PROBATION' | 'MID_YEAR' | 'ANNUAL' | 'PIP'
interface Review {
  id: string; employeeName: string; reviewPeriod: string; type: ReviewType; status: ReviewStatus
  overallScore?: number; overallRating?: string; reviewDate?: string
  scorePerformance?: number; scoreCommunication?: number; scoreTeamwork?: number
  scoreInitiative?: number; scoreTechnical?: number
  strengthsSummary?: string; areasImprovement?: string; reviewerComments?: string
}

const STATUS_META: Record<ReviewStatus, { color: string; bg: string; icon: any }> = {
  PENDING:      { color: '#6B7280', bg: 'rgba(107,114,128,0.1)', icon: Clock },
  IN_PROGRESS:  { color: '#2563EB', bg: 'rgba(37,99,235,0.1)',   icon: TrendingUp },
  SUBMITTED:    { color: '#D97706', bg: 'rgba(217,119,6,0.1)',   icon: Star },
  ACKNOWLEDGED: { color: '#7C3AED', bg: 'rgba(124,58,237,0.1)', icon: CheckCircle2 },
  COMPLETED:    { color: '#059669', bg: 'rgba(5,150,105,0.1)',   icon: CheckCircle2 },
}

const RATING_META: Record<string, { color: string; label: string }> = {
  OUTSTANDING:    { color: '#059669', label: '⭐ Outstanding' },
  EXCEEDS:        { color: '#2563EB', label: '✅ Exceeds Expectations' },
  MEETS:          { color: '#D97706', label: '👍 Meets Expectations' },
  BELOW:          { color: '#EA580C', label: '⚠️ Below Expectations' },
  UNSATISFACTORY: { color: '#DC2626', label: '❌ Unsatisfactory' },
}

function ScoreSlider({ label, value, onChange, weight }: { label: string; value: number; onChange: (v: number) => void; weight: string }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>({weight} weight)</span>
        </div>
        <span style={{ fontSize: '16px', fontWeight: 700, color: value >= 4 ? '#059669' : value >= 3 ? '#D97706' : '#DC2626', fontFamily: 'serif' }}>
          {value.toFixed(1)} / 5
        </span>
      </div>
      <input type="range" min="1" max="5" step="0.5" value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--gold)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
        <span>Poor (1)</span><span>Average (3)</span><span>Excellent (5)</span>
      </div>
    </div>
  )
}

export default function PerformancePage() {
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [scoring, setScoring] = useState<string | null>(null)
  const [scores, setScores] = useState({ scorePerformance: 3, scoreCommunication: 3, scoreTeamwork: 3, scoreInitiative: 3, scoreTechnical: 3, strengthsSummary: '', areasImprovement: '', reviewerComments: '' })
  const [showCreate, setShowCreate] = useState(false)
  const [newReview, setNewReview] = useState({ employeeName: '', reviewPeriod: 'FY2025-26', type: 'ANNUAL' as ReviewType })

  const { data: reviews } = useQuery({
    queryKey: ['performance-reviews'],
    queryFn: () => api.get('/performance/reviews').then(r => r.data.data?.content ?? []),
  })

  const { data: stats } = useQuery({
    queryKey: ['perf-stats'],
    queryFn: () => api.get('/performance/stats', { params: { period: 'FY2025-26' } }).then(r => r.data.data),
  })

  const createReview = useMutation({
    mutationFn: (d: typeof newReview) => api.post('/performance/reviews', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['performance-reviews'] }); setShowCreate(false); toast.success('Review created') },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to create review'),
  })

  const submitScores = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof scores }) => api.patch(`/performance/reviews/${id}/scores`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['performance-reviews'] }); setScoring(null); toast.success('Scores submitted') },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to submit scores'),
  })

  const completeReview = useMutation({
    mutationFn: (id: string) => api.patch(`/performance/reviews/${id}/complete`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['performance-reviews'] }); toast.success('Review completed') },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to complete review'),
  })

  const calcOverall = () => {
    const s = scores
    return ((s.scorePerformance * 0.30) + (s.scoreTechnical * 0.25) + (s.scoreCommunication * 0.20) + (s.scoreTeamwork * 0.15) + (s.scoreInitiative * 0.10)).toFixed(2)
  }

  return (
    <PermissionGate permission="EMPLOYEE_VIEW" showDenied>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Performance Reviews</h1>
            <p className="page-subtitle">KPI scoring, review cycles, and team performance analytics</p>
          </div>
          <PermissionGate permission="EMPLOYEE_CREATE">
            <button className="btn-primary h-9" onClick={() => setShowCreate(true)}>
              <Plus size={15} /> Initiate Review
            </button>
          </PermissionGate>
        </div>

        {/* Team stats */}
        {stats && !stats.message && (
          <div className="card">
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
              FY2025-26 · Team Overview
            </h3>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--gold)', fontFamily: 'serif' }}>{stats.averageScore}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Average score / 5</p>
              </div>
              <div>
                <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'serif' }}>{stats.totalReviews}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Completed reviews</p>
              </div>
              {stats.ratingDistribution && Object.entries(stats.ratingDistribution as Record<string, number>).map(([rating, count]) => (
                count > 0 && (
                  <div key={rating}>
                    <p style={{ fontSize: '20px', fontWeight: 700, color: RATING_META[rating]?.color ?? 'var(--text-primary)', fontFamily: 'serif' }}>{count}</p>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{rating}</p>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* Reviews list */}
        <div className="space-y-3">
          {(reviews as Review[] ?? []).map(review => {
            const meta = STATUS_META[review.status]
            const Icon = meta.icon
            const isExpanded = expanded === review.id
            const isScoring = scoring === review.id
            return (
              <div key={review.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <button onClick={() => setExpanded(e => e === review.id ? null : review.id)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} style={{ color: meta.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{review.employeeName}</span>
                      <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: meta.bg, color: meta.color }}>{review.status}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{review.type} · {review.reviewPeriod}</span>
                    </div>
                    {review.overallRating && (
                      <p style={{ fontSize: '12px', color: RATING_META[review.overallRating]?.color }}>
                        {RATING_META[review.overallRating]?.label} · {review.overallScore?.toFixed(2)} / 5
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {review.status === 'PENDING' && (
                      <button className="btn-primary h-8 text-xs" onClick={e => { e.stopPropagation(); setScoring(review.id) }}>
                        Score
                      </button>
                    )}
                    {review.status === 'ACKNOWLEDGED' && (
                      <button className="btn-primary h-8 text-xs" onClick={e => { e.stopPropagation(); completeReview.mutate(review.id) }}>
                        Complete
                      </button>
                    )}
                    {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                  </div>
                </button>

                {isExpanded && review.scorePerformance && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {[
                      ['Performance', review.scorePerformance, '30%'],
                      ['Technical', review.scoreTechnical, '25%'],
                      ['Communication', review.scoreCommunication, '20%'],
                      ['Teamwork', review.scoreTeamwork, '15%'],
                      ['Initiative', review.scoreInitiative, '10%'],
                    ].map(([label, score, weight]) => (
                      <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label} <span style={{ color: 'var(--text-muted)' }}>({weight})</span></span>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: Number(score) >= 4 ? '#059669' : Number(score) >= 3 ? '#D97706' : '#DC2626' }}>{Number(score)?.toFixed(1)}</span>
                      </div>
                    ))}
                    {review.strengthsSummary && (
                      <div style={{ gridColumn: '1/-1' }}>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>STRENGTHS</p>
                        <p style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{review.strengthsSummary}</p>
                      </div>
                    )}
                    {review.areasImprovement && (
                      <div style={{ gridColumn: '1/-1' }}>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>AREAS FOR IMPROVEMENT</p>
                        <p style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{review.areasImprovement}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Scoring Panel */}
        {scoring && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
            onClick={() => setScoring(null)}>
            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e: any) => e.stopPropagation()}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)' }}>Submit KPI Scores</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Projected overall: <b style={{ color: 'var(--gold)', fontSize: '16px' }}>{calcOverall()} / 5</b>
              </p>
              <ScoreSlider label="Job Performance" value={scores.scorePerformance} onChange={v => setScores(s => ({ ...s, scorePerformance: v }))} weight="30%" />
              <ScoreSlider label="Technical Skills" value={scores.scoreTechnical} onChange={v => setScores(s => ({ ...s, scoreTechnical: v }))} weight="25%" />
              <ScoreSlider label="Communication" value={scores.scoreCommunication} onChange={v => setScores(s => ({ ...s, scoreCommunication: v }))} weight="20%" />
              <ScoreSlider label="Teamwork & Collaboration" value={scores.scoreTeamwork} onChange={v => setScores(s => ({ ...s, scoreTeamwork: v }))} weight="15%" />
              <ScoreSlider label="Initiative & Innovation" value={scores.scoreInitiative} onChange={v => setScores(s => ({ ...s, scoreInitiative: v }))} weight="10%" />
              {[
                { key: 'strengthsSummary', label: 'Key Strengths' },
                { key: 'areasImprovement', label: 'Areas for Improvement' },
                { key: 'reviewerComments', label: 'Overall Comments' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: '12px' }}>
                  <label className="label">{f.label}</label>
                  <textarea className="input" rows={3} value={(scores as any)[f.key]}
                    onChange={e => setScores(s => ({ ...s, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button className="btn-secondary h-10" onClick={() => setScoring(null)}>Cancel</button>
                <button className="btn-primary h-10" onClick={() => submitScores.mutate({ id: scoring, data: scores })}
                  disabled={submitScores.isPending}>
                  {submitScores.isPending ? 'Submitting...' : 'Submit Scores'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create review modal */}
        {showCreate && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
            onClick={() => setShowCreate(false)}>
            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '440px' }} onClick={(e: any) => e.stopPropagation()}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>Initiate Performance Review</h2>
              <div className="space-y-3">
                <div><label className="label">Employee Name</label><input className="input h-10" placeholder="Full name" value={newReview.employeeName} onChange={e => setNewReview(p => ({ ...p, employeeName: e.target.value }))} /></div>
                <div><label className="label">Review Period</label><input className="input h-10" placeholder="FY2025-26" value={newReview.reviewPeriod} onChange={e => setNewReview(p => ({ ...p, reviewPeriod: e.target.value }))} /></div>
                <div><label className="label">Review Type</label>
                  <select className="input h-10" value={newReview.type} onChange={e => setNewReview(p => ({ ...p, type: e.target.value as ReviewType }))}>
                    {['ANNUAL','MID_YEAR','PROBATION','PIP'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button className="btn-secondary h-10" onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="btn-primary h-10" onClick={() => createReview.mutate(newReview)} disabled={!newReview.employeeName}>Create Review</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGate>
  )
}
