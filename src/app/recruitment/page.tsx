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
import { SubscriptionGate } from '@/components/ui/SubscriptionGate'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { api } from '@/lib/api/client'
import { Plus, Briefcase, Users, Calendar, ChevronRight, Search, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

type PostingStatus = 'DRAFT' | 'PUBLISHED' | 'ON_HOLD' | 'CLOSED'
type AppStage = 'APPLIED' | 'SCREENING' | 'PHONE_INTERVIEW' | 'TECHNICAL_ROUND' | 'HR_ROUND' | 'FINAL_ROUND' | 'OFFER_EXTENDED' | 'OFFER_ACCEPTED' | 'HIRED' | 'REJECTED'

interface JobPosting { id: string; title: string; department: string; location: string; status: PostingStatus; applicantCount: number; openPositions: number; closingDate?: string; employmentType: string }
interface JobApplication { id: string; candidateName: string; email: string; phone?: string; stage: AppStage; currentCompany?: string; yearsExperience?: number; source: string; expectedCtc?: number; interviewDate?: string; notes?: string; createdAt: string }

const STAGE_META: Record<AppStage, { label: string; color: string; bg: string }> = {
  APPLIED:          { label: 'Applied',          color: '#6B7280', bg: 'rgba(107,114,128,0.1)'  },
  SCREENING:        { label: 'Screening',         color: '#2563EB', bg: 'rgba(37,99,235,0.1)'   },
  PHONE_INTERVIEW:  { label: 'Phone Interview',   color: '#7C3AED', bg: 'rgba(124,58,237,0.1)'  },
  TECHNICAL_ROUND:  { label: 'Technical Round',   color: '#0D9488', bg: 'rgba(13,148,136,0.1)'  },
  HR_ROUND:         { label: 'HR Round',          color: '#D97706', bg: 'rgba(217,119,6,0.1)'   },
  FINAL_ROUND:      { label: 'Final Round',       color: '#EA580C', bg: 'rgba(234,88,12,0.1)'   },
  OFFER_EXTENDED:   { label: 'Offer Extended',    color: '#059669', bg: 'rgba(5,150,105,0.1)'   },
  OFFER_ACCEPTED:   { label: 'Offer Accepted',    color: '#059669', bg: 'rgba(5,150,105,0.15)'  },
  HIRED:            { label: 'Hired',             color: '#059669', bg: 'rgba(5,150,105,0.2)'   },
  REJECTED:         { label: 'Rejected',          color: '#DC2626', bg: 'rgba(220,38,38,0.1)'   },
}

const STATUS_META: Record<PostingStatus, { color: string; bg: string }> = {
  DRAFT:     { color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
  PUBLISHED: { color: '#059669', bg: 'rgba(5,150,105,0.1)'   },
  ON_HOLD:   { color: '#D97706', bg: 'rgba(217,119,6,0.1)'   },
  CLOSED:    { color: '#DC2626', bg: 'rgba(220,38,38,0.1)'   },
}

const PIPELINE_STAGES: AppStage[] = ['APPLIED','SCREENING','PHONE_INTERVIEW','TECHNICAL_ROUND','HR_ROUND','FINAL_ROUND','OFFER_EXTENDED','HIRED']
const NEXT_STAGE: Partial<Record<AppStage, AppStage>> = {
  APPLIED: 'SCREENING', SCREENING: 'PHONE_INTERVIEW',
  PHONE_INTERVIEW: 'TECHNICAL_ROUND', TECHNICAL_ROUND: 'HR_ROUND',
  HR_ROUND: 'FINAL_ROUND', FINAL_ROUND: 'OFFER_EXTENDED', OFFER_EXTENDED: 'HIRED',
}

export default function RecruitmentPage() {
  const qc = useQueryClient()
  const [selectedPosting, setSelectedPosting] = useState<string | null>(null)
  const [view, setView] = useState<'postings' | 'pipeline'>('postings')
  const [showNewPosting, setShowNewPosting] = useState(false)
  const [newPosting, setNewPosting] = useState({ title: '', department: '', location: '', employmentType: 'FULL_TIME', openPositions: 1 })
  const [stageFilter, setStageFilter] = useState<AppStage | ''>('')

  const { data: postings } = useQuery({
    queryKey: ['job-postings'],
    queryFn: () => api.get('/recruitment/postings').then(r => r.data.data?.content ?? []),
  })

  const { data: applications } = useQuery({
    queryKey: ['applications', selectedPosting, stageFilter],
    queryFn: () => api.get('/recruitment/applications', {
      params: { postingId: selectedPosting || undefined, stage: stageFilter || undefined }
    }).then(r => r.data.data?.content ?? []),
    enabled: view === 'pipeline',
  })

  const { data: pipeline } = useQuery({
    queryKey: ['pipeline', selectedPosting],
    queryFn: () => api.get('/recruitment/pipeline', {
      params: { postingId: selectedPosting || undefined }
    }).then(r => r.data.data),
    enabled: view === 'pipeline',
  })

  const createPosting = useMutation({
    mutationFn: (data: typeof newPosting) => api.post('/recruitment/postings', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['job-postings'] }); setShowNewPosting(false); toast.success('Job posting created') },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to create posting'),
  })

  const publishPosting = useMutation({
    mutationFn: (id: string) => api.patch(`/recruitment/postings/${id}/publish`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['job-postings'] }); toast.success('Job posted publicly') },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to publish'),
  })

  const moveStage = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: AppStage }) =>
      api.patch(`/recruitment/applications/${id}/stage`, { stage }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['applications'] }); qc.invalidateQueries({ queryKey: ['pipeline'] }); toast.success('Candidate moved') },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to move candidate'),
  })

  const formatCTC = (ctc?: number) => ctc ? `₹${(ctc/100000).toFixed(1)}L` : '—'

  return (
    <SubscriptionGate feature="HRMS" minPlan="STARTER">
      <PermissionGate permission="EMPLOYEE_VIEW" showDenied>
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">Recruitment</h1>
              <p className="page-subtitle">Manage job postings, applications, and the hiring pipeline</p>
            </div>
            <div className="flex gap-2">
              {[
                { id: 'postings' as const, label: 'Job Postings' },
                { id: 'pipeline' as const, label: 'Pipeline' },
              ].map(t => (
                <button key={t.id} onClick={() => setView(t.id)}
                  style={{ padding: '7px 16px', borderRadius: '10px', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit',
                    background: view === t.id ? 'var(--btn-primary-bg)' : 'var(--bg-card)',
                    color: view === t.id ? 'var(--text-on-gold)' : 'var(--text-secondary)' }}>
                  {t.label}
                </button>
              ))}
              <PermissionGate permission="EMPLOYEE_CREATE">
                <button className="btn-primary h-9" onClick={() => setShowNewPosting(true)}>
                  <Plus size={15} /> New Posting
                </button>
              </PermissionGate>
            </div>
          </div>

          {/* Job Postings view */}
          {view === 'postings' && (
            <div className="space-y-3">
              {(postings as JobPosting[] ?? []).length === 0 && (
                <div className="card text-center" style={{ padding: '48px' }}>
                  <Briefcase size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No job postings yet. Create your first one to start hiring.</p>
                </div>
              )}
              {(postings as JobPosting[] ?? []).map(p => {
                const meta = STATUS_META[p.status]
                return (
                  <div key={p.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Briefcase size={20} style={{ color: 'var(--text-secondary)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{p.title}</span>
                        <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: meta.bg, color: meta.color }}>{p.status}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {p.department} · {p.location} · {p.employmentType?.replace('_', ' ')} · {p.openPositions} open
                        {p.closingDate ? ` · Closes ${p.closingDate}` : ''}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--gold)', fontFamily: 'serif' }}>{p.applicantCount}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>applicants</p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      {p.status === 'DRAFT' && (
                        <button className="btn-primary h-8 text-xs" onClick={() => publishPosting.mutate(p.id)}>Publish</button>
                      )}
                      <button className="btn-secondary h-8 text-xs" onClick={() => { setSelectedPosting(p.id); setView('pipeline') }}>
                        Pipeline <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pipeline view */}
          {view === 'pipeline' && (
            <div>
              {/* Pipeline counts */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px' }}>
                {PIPELINE_STAGES.map(stage => {
                  const meta = STAGE_META[stage]
                  const count = (pipeline as any)?.pipeline?.[stage] ?? 0
                  return (
                    <button key={stage} onClick={() => setStageFilter(s => s === stage ? '' : stage)}
                      style={{ padding: '8px 12px', borderRadius: '10px', border: `1px solid ${stageFilter === stage ? meta.color : 'var(--border)'}`,
                        background: stageFilter === stage ? meta.bg : 'var(--bg-card)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      <span style={{ fontSize: '18px', fontWeight: 700, color: meta.color, fontFamily: 'serif', display: 'block' }}>{count}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{meta.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Applications list */}
              <div className="space-y-2">
                {(applications as JobApplication[] ?? []).map(app => {
                  const meta = STAGE_META[app.stage]
                  const next = NEXT_STAGE[app.stage]
                  return (
                    <div key={app.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--btn-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-on-gold)' }}>
                        {app.candidateName.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{app.candidateName}</span>
                          <span style={{ padding: '2px 7px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: meta.bg, color: meta.color }}>{meta.label}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {app.email} · {app.currentCompany || 'Fresher'} · {app.yearsExperience ? `${app.yearsExperience} yrs` : ''} · Exp: {formatCTC(app.expectedCtc)} · {app.source}
                          {app.interviewDate ? ` · Interview: ${app.interviewDate}` : ''}
                        </p>
                      </div>
                      {next && app.stage !== 'HIRED' && app.stage !== 'REJECTED' && (
                        <button className="btn-primary h-8 text-xs" style={{ flexShrink: 0 }}
                          onClick={() => moveStage.mutate({ id: app.id, stage: next })}>
                          Move to {STAGE_META[next].label} <ArrowRight size={11} />
                        </button>
                      )}
                      <button className="btn-ghost h-8 text-xs" style={{ color: '#DC2626', flexShrink: 0 }}
                        onClick={() => moveStage.mutate({ id: app.id, stage: 'REJECTED' })}>
                        Reject
                      </button>
                    </div>
                  )
                })}
                {(applications as any[] ?? []).length === 0 && (
                  <div className="card text-center" style={{ padding: '40px' }}>
                    <Users size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No applications {stageFilter ? `in ${STAGE_META[stageFilter as AppStage].label}` : 'yet'}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* New Posting Modal */}
          {showNewPosting && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
              onClick={() => setShowNewPosting(false)}>
              <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '520px' }} onClick={(e: any) => e.stopPropagation()}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>Create Job Posting</h2>
                <div className="space-y-3">
                  {[
                    { label: 'Job Title', key: 'title', placeholder: 'e.g. Senior Software Engineer' },
                    { label: 'Department', key: 'department', placeholder: 'e.g. Engineering' },
                    { label: 'Location', key: 'location', placeholder: 'e.g. Mumbai, Remote' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="label">{field.label}</label>
                      <input className="input h-10" placeholder={field.placeholder}
                        value={(newPosting as any)[field.key]}
                        onChange={e => setNewPosting(p => ({ ...p, [field.key]: e.target.value }))} />
                    </div>
                  ))}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="label">Employment Type</label>
                      <select className="input h-10" value={newPosting.employmentType}
                        onChange={e => setNewPosting(p => ({ ...p, employmentType: e.target.value }))}>
                        {['FULL_TIME','PART_TIME','CONTRACT','INTERNSHIP'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Open Positions</label>
                      <input type="number" min={1} className="input h-10" value={newPosting.openPositions}
                        onChange={e => setNewPosting(p => ({ ...p, openPositions: Number(e.target.value) }))} />
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button className="btn-secondary h-10" onClick={() => setShowNewPosting(false)}>Cancel</button>
                  <button className="btn-primary h-10" onClick={() => createPosting.mutate(newPosting)}
                    disabled={!newPosting.title || createPosting.isPending}>
                    {createPosting.isPending ? 'Creating...' : 'Create Posting'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </PermissionGate>
    </SubscriptionGate>
  )
}
