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
import { SubscriptionGate } from '@/components/ui/SubscriptionGate'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { api } from '@/lib/api/client'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { Plus, Briefcase, Users, ArrowRight, CalendarClock, IndianRupee, UserPlus, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiError, formatDate, webLink } from '@/lib/utils'

type PostingStatus = 'DRAFT' | 'PUBLISHED' | 'ON_HOLD' | 'CLOSED' | 'CANCELLED'
type AppStage = 'APPLIED' | 'SCREENING' | 'PHONE_INTERVIEW' | 'TECHNICAL_ROUND' | 'HR_ROUND' | 'FINAL_ROUND' | 'OFFER_EXTENDED' | 'OFFER_ACCEPTED' | 'HIRED' | 'REJECTED'

interface JobPosting {
  id: string; title: string; department?: string; location?: string; status: PostingStatus; applicantCount: number
  openPositions: number; closingDate?: string; employmentType?: string; minSalary?: number; maxSalary?: number; description?: string
}
interface JobApplication {
  id: string; jobPostingId: string; candidateName: string; email: string; phone?: string; stage: AppStage
  currentCompany?: string; yearsExperience?: number; source?: string; currentCtc?: number; expectedCtc?: number; offeredCtc?: number
  noticePeriodDays?: number; interviewDate?: string; resumeUrl?: string; notes?: string; createdAt?: string
}

const STAGE_META: Record<AppStage, { label: string; color: string; bg: string }> = {
  APPLIED:         { label: 'Applied',         color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
  SCREENING:       { label: 'Screening',       color: '#2563EB', bg: 'rgba(37,99,235,0.1)' },
  PHONE_INTERVIEW: { label: 'Phone interview', color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
  TECHNICAL_ROUND: { label: 'Technical round', color: '#0D9488', bg: 'rgba(13,148,136,0.1)' },
  HR_ROUND:        { label: 'HR round',        color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
  FINAL_ROUND:     { label: 'Final round',     color: '#EA580C', bg: 'rgba(234,88,12,0.1)' },
  OFFER_EXTENDED:  { label: 'Offer made',      color: '#059669', bg: 'rgba(5,150,105,0.1)' },
  OFFER_ACCEPTED:  { label: 'Offer accepted',  color: '#047857', bg: 'rgba(5,150,105,0.16)' },
  HIRED:           { label: 'Hired',           color: '#065F46', bg: 'rgba(5,150,105,0.22)' },
  REJECTED:        { label: 'Not selected',    color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
}
const STATUS_META: Record<PostingStatus, { label: string; color: string; bg: string }> = {
  DRAFT:     { label: 'Draft',                  color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
  PUBLISHED: { label: 'Open for applications',  color: '#059669', bg: 'rgba(5,150,105,0.1)' },
  ON_HOLD:   { label: 'On hold',                color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
  CLOSED:    { label: 'Closed',                 color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
  CANCELLED: { label: 'Cancelled',              color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
}
const TYPES: Record<string, string> = { FULL_TIME: 'Full time', PART_TIME: 'Part time', CONTRACT: 'Contract', INTERNSHIP: 'Internship' }
const SOURCES = ['Referral', 'LinkedIn', 'Naukri', 'Indeed', 'Company website', 'Walk-in', 'Campus', 'Agency', 'Direct', 'Other']
const STAGES: AppStage[] = ['APPLIED', 'SCREENING', 'PHONE_INTERVIEW', 'TECHNICAL_ROUND', 'HR_ROUND', 'FINAL_ROUND', 'OFFER_EXTENDED', 'OFFER_ACCEPTED', 'HIRED', 'REJECTED']
/** The next interview step; after the final round the next step is an offer (with the pay), then acceptance, then hiring. */
const NEXT: Partial<Record<AppStage, AppStage>> = {
  APPLIED: 'SCREENING', SCREENING: 'PHONE_INTERVIEW', PHONE_INTERVIEW: 'TECHNICAL_ROUND', TECHNICAL_ROUND: 'HR_ROUND', HR_ROUND: 'FINAL_ROUND',
  OFFER_EXTENDED: 'OFFER_ACCEPTED', OFFER_ACCEPTED: 'HIRED',
}
const ACTIVE = (s: AppStage) => s !== 'HIRED' && s !== 'REJECTED'
const lakh = (v?: number) => v ? `₹${(v / 100000).toLocaleString('en-IN', { maximumFractionDigits: 2 })} L` : '—'

const BLANK_POSTING = { title: '', department: '', location: '', employmentType: 'FULL_TIME', openPositions: 1, minSalary: '', maxSalary: '', closingDate: '', description: '' }
const BLANK_CANDIDATE = { candidateName: '', email: '', phone: '', currentCompany: '', yearsExperience: '', currentCtc: '', expectedCtc: '', noticePeriodDays: '30', source: 'Referral', resumeUrl: '', coverLetter: '' }
const num = (v: string) => v.trim() === '' ? undefined : Number(v)

export default function RecruitmentPage() {
  const qc = useQueryClient()
  const { can, canAny, isAdmin, isHR, isSuperAdmin } = usePermissions()
  const canPost = can('EMPLOYEE_CREATE')
  const canAddCandidate = canAny('EMPLOYEE_CREATE', 'EMPLOYEE_EDIT')
  const canMove = can('EMPLOYEE_EDIT')
  const canHire = isAdmin || isHR || isSuperAdmin

  const [view, setView] = useState<'postings' | 'candidates'>('postings')
  const [posting, setPosting] = useState<string>('')          // '' = every posting
  const [stage, setStage] = useState<AppStage | ''>('')
  const [open, setOpen] = useState<string | null>(null)
  const [newPosting, setNewPosting] = useState<typeof BLANK_POSTING | null>(null)
  const [candidateFor, setCandidateFor] = useState<string | null>(null)
  const [cand, setCand] = useState({ ...BLANK_CANDIDATE })
  const [act, setAct] = useState<{ kind: 'interview' | 'offer' | 'reject'; app: JobApplication } | null>(null)
  const [actForm, setActForm] = useState({ date: '', amount: '', notes: '' })

  const { data: postings = [], isLoading: loadingPostings } = useQuery({
    queryKey: ['job-postings'],
    queryFn: () => api.get('/recruitment/postings', { params: { size: 100 } }).then(r => (r.data.data?.content ?? []) as JobPosting[]),
  })
  const { data: apps = [], isLoading: loadingApps } = useQuery({
    queryKey: ['applications', posting, stage],
    queryFn: () => api.get('/recruitment/applications', { params: { postingId: posting || undefined, stage: stage || undefined, size: 100 } })
      .then(r => (r.data.data?.content ?? []) as JobApplication[]),
    enabled: view === 'candidates',
  })
  const { data: pipeline } = useQuery({
    queryKey: ['pipeline', posting],
    queryFn: () => api.get('/recruitment/pipeline', { params: { postingId: posting || undefined } }).then(r => r.data.data as { pipeline: Record<string, number>; total: number }),
    enabled: view === 'candidates',
  })
  const title = (id: string) => postings.find(p => p.id === id)?.title ?? 'a posting'
  const refresh = () => ['job-postings', 'applications', 'pipeline'].forEach(k => qc.invalidateQueries({ queryKey: [k] }))

  const createPosting = useMutation({
    mutationFn: (d: typeof BLANK_POSTING) => api.post('/recruitment/postings', {
      title: d.title.trim(), department: d.department.trim() || undefined, location: d.location.trim() || undefined, employmentType: d.employmentType,
      openPositions: d.openPositions, minSalary: num(d.minSalary), maxSalary: num(d.maxSalary), closingDate: d.closingDate || undefined,
      description: d.description.trim() || undefined,
    }),
    onSuccess: () => { refresh(); setNewPosting(null); toast.success('Saved as a draft — open it for applications when ready') },
    onError: (e: any) => toast.error(apiError(e, 'The posting could not be created')),
  })
  const setPostingStatus = useMutation({
    mutationFn: ({ id, to }: { id: string; to: 'publish' | 'close' }) => api.patch(`/recruitment/postings/${id}/${to}`),
    onSuccess: (_d, v) => { refresh(); toast.success(v.to === 'publish' ? 'Open for applications' : 'Posting closed') },
    onError: (e: any) => toast.error(apiError(e, 'The posting could not be changed')),
  })
  const addCandidate = useMutation({
    mutationFn: () => api.post(`/recruitment/postings/${candidateFor}/apply`, {
      candidateName: cand.candidateName.trim(), email: cand.email.trim(), phone: cand.phone.trim() || undefined,
      currentCompany: cand.currentCompany.trim() || undefined, yearsExperience: num(cand.yearsExperience), currentCtc: num(cand.currentCtc),
      expectedCtc: num(cand.expectedCtc), noticePeriodDays: num(cand.noticePeriodDays) ?? 30, source: cand.source,
      resumeUrl: cand.resumeUrl.trim() || undefined, coverLetter: cand.coverLetter.trim() || undefined,
    }),
    onSuccess: () => { refresh(); toast.success(`${cand.candidateName.trim()} added`); setCandidateFor(null); setCand({ ...BLANK_CANDIDATE }) },
    onError: (e: any) => toast.error(apiError(e, 'The candidate could not be added')),
  })
  const move = useMutation({
    mutationFn: ({ id, to, notes }: { id: string; to: AppStage; notes?: string }) => api.patch(`/recruitment/applications/${id}/stage`, { stage: to, notes }),
    onSuccess: (_d, v) => { refresh(); setAct(null); toast.success(v.to === 'REJECTED' ? 'Marked not selected' : `Moved to ${STAGE_META[v.to].label.toLowerCase()}`) },
    onError: (e: any) => toast.error(apiError(e, 'The candidate could not be moved')),
  })
  const interview = useMutation({
    mutationFn: ({ id }: { id: string }) => api.patch(`/recruitment/applications/${id}/interview`, { date: actForm.date, notes: actForm.notes.trim() || undefined }),
    onSuccess: () => { refresh(); setAct(null); toast.success('Interview date saved') },
    onError: (e: any) => toast.error(apiError(e, 'The interview could not be scheduled')),
  })
  const offer = useMutation({
    mutationFn: ({ id }: { id: string }) => api.patch(`/recruitment/applications/${id}/offer`, { offeredCtc: Number(actForm.amount), notes: actForm.notes.trim() || undefined }),
    onSuccess: () => { refresh(); setAct(null); toast.success('Offer recorded') },
    onError: (e: any) => toast.error(apiError(e, 'The offer could not be recorded')),
  })

  const startAct = (kind: 'interview' | 'offer' | 'reject', app: JobApplication) => {
    setActForm({ date: app.interviewDate ?? '', amount: app.offeredCtc ? String(app.offeredCtc) : app.expectedCtc ? String(app.expectedCtc) : '', notes: '' })
    setAct({ kind, app })
  }
  const hireLink = (a: JobApplication) => {
    const q = new URLSearchParams({ new: '1', name: a.candidateName, email: a.email })
    if (a.phone) q.set('phone', a.phone)
    if (a.offeredCtc) q.set('ctc', String(a.offeredCtc))
    return `/hrms/employees?${q.toString()}`
  }
  const openPostings = postings.filter(p => p.status === 'PUBLISHED')

  return (
    <SubscriptionGate feature="HRMS" minPlan="STARTER">
      <PermissionGate permission="EMPLOYEE_VIEW" showDenied>
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="page-title">Recruitment</h1>
              <p className="page-subtitle">Job postings, the candidates for each, and every step from first call to joining.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div role="tablist" className="flex gap-1" style={{ padding: '3px', borderRadius: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                {([['postings', 'Job postings'], ['candidates', 'Candidates']] as const).map(([id, label]) => (
                  <button key={id} role="tab" aria-selected={view === id} onClick={() => setView(id)}
                    style={{ padding: '6px 14px', borderRadius: '9px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit',
                      background: view === id ? 'var(--bg-card)' : 'transparent', color: view === id ? 'var(--text-primary)' : 'var(--text-muted)',
                      boxShadow: view === id ? 'var(--shadow-card)' : 'none' }}>{label}</button>
                ))}
              </div>
              {view === 'candidates' && canAddCandidate && openPostings.length > 0 && (
                <button className="btn-secondary h-9" onClick={() => { setCand({ ...BLANK_CANDIDATE }); setCandidateFor(posting && openPostings.some(p => p.id === posting) ? posting : openPostings[0].id) }}>
                  <UserPlus size={15} /> Add candidate
                </button>
              )}
              {canPost && <button className="btn-primary h-9" onClick={() => setNewPosting({ ...BLANK_POSTING })}><Plus size={15} /> New posting</button>}
            </div>
          </div>

          {view === 'postings' && (
            <div className="space-y-3">
              {loadingPostings && <div className="card text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</div>}
              {!loadingPostings && postings.length === 0 && (
                <div className="card" style={{ padding: 0 }}>
                  <EmptyState icon={Briefcase} title="Hire your next team member"
                    description="Create a posting for the role, open it for applications, then add candidates as they come in — from referrals, Naukri, LinkedIn or walk-ins — and move them through your interview rounds to an offer."
                    action={canPost ? { label: 'Create a posting', onClick: () => setNewPosting({ ...BLANK_POSTING }) } : undefined} />
                </div>
              )}
              {postings.map(p => {
                const meta = STATUS_META[p.status] ?? STATUS_META.DRAFT
                return (
                  <div key={p.id} className="card flex flex-wrap items-center gap-4" data-testid="posting-card">
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Briefcase size={20} style={{ color: 'var(--text-secondary)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <div className="flex flex-wrap items-center gap-2" style={{ marginBottom: '4px' }}>
                        <span style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-primary)' }}>{p.title}</span>
                        <span style={{ padding: '2px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: meta.bg, color: meta.color }}>{meta.label}</span>
                      </div>
                      <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
                        {[p.department, p.location, TYPES[p.employmentType ?? ''] ?? p.employmentType, `${p.openPositions} opening${p.openPositions === 1 ? '' : 's'}`,
                          p.minSalary || p.maxSalary ? `${lakh(p.minSalary)} – ${lakh(p.maxSalary)} a year` : null,
                          p.closingDate ? `closes ${formatDate(p.closingDate)}` : null].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <button className="text-right" style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => { setPosting(p.id); setStage(''); setView('candidates') }}>
                      <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--gold)', margin: 0 }}>{p.applicantCount}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>candidate{p.applicantCount === 1 ? '' : 's'}</p>
                    </button>
                    <div className="flex gap-2" style={{ flexShrink: 0 }}>
                      {canPost && (p.status === 'DRAFT' || p.status === 'CLOSED' || p.status === 'ON_HOLD') && (
                        <button className="btn-primary h-8 text-xs" onClick={() => setPostingStatus.mutate({ id: p.id, to: 'publish' })}>{p.status === 'DRAFT' ? 'Open for applications' : 'Re-open'}</button>
                      )}
                      {canAddCandidate && p.status === 'PUBLISHED' && (
                        <button className="btn-secondary h-8 text-xs" onClick={() => { setCand({ ...BLANK_CANDIDATE }); setCandidateFor(p.id) }}><UserPlus size={13} /> Add candidate</button>
                      )}
                      {canPost && p.status === 'PUBLISHED' && (
                        <button className="btn-ghost h-8 text-xs" onClick={() => setPostingStatus.mutate({ id: p.id, to: 'close' })}>Close</button>
                      )}
                      <button className="btn-secondary h-8 text-xs" onClick={() => { setPosting(p.id); setStage(''); setView('candidates') }}>Candidates <ArrowRight size={12} /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {view === 'candidates' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <label className="sr-only" htmlFor="rc-posting">Posting</label>
                <select id="rc-posting" className="input h-9 text-sm" style={{ width: 'auto', minWidth: '220px' }} value={posting} onChange={e => { setPosting(e.target.value); setStage('') }}>
                  <option value="">Every posting</option>
                  {postings.map(p => <option key={p.id} value={p.id}>{p.title}{p.status !== 'PUBLISHED' ? ` (${STATUS_META[p.status]?.label.toLowerCase()})` : ''}</option>)}
                </select>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{pipeline?.total ?? 0} candidate{pipeline?.total === 1 ? '' : 's'}</span>
              </div>
              <div className="flex gap-2" style={{ overflowX: 'auto', paddingBottom: '4px' }}>
                {STAGES.map(st => {
                  const meta = STAGE_META[st]
                  const count = pipeline?.pipeline?.[st] ?? 0
                  return (
                    <button key={st} onClick={() => setStage(s => s === st ? '' : st)} aria-pressed={stage === st}
                      style={{ padding: '8px 12px', borderRadius: '10px', border: `1px solid ${stage === st ? meta.color : 'var(--border)'}`,
                        background: stage === st ? meta.bg : 'var(--bg-card)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, textAlign: 'left' }}>
                      <span style={{ fontSize: '17px', fontWeight: 700, color: meta.color, display: 'block' }}>{count}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{meta.label}</span>
                    </button>
                  )
                })}
              </div>

              {loadingApps && <div className="card text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</div>}
              {!loadingApps && apps.length === 0 && (
                <div className="card" style={{ padding: 0 }}>
                  <EmptyState icon={Users} compact title={stage ? `No one at ${STAGE_META[stage].label.toLowerCase()}` : 'No candidates yet'}
                    description={openPostings.length ? 'Add candidates to an open posting as their CVs come in; each one then moves through your rounds here.'
                      : 'Open a posting for applications first — then add candidates to it.'}
                    action={canAddCandidate && openPostings.length ? { label: 'Add a candidate', onClick: () => { setCand({ ...BLANK_CANDIDATE }); setCandidateFor(posting && openPostings.some(p => p.id === posting) ? posting : openPostings[0].id) } } : undefined} />
                </div>
              )}
              {apps.map(a => {
                const meta = STAGE_META[a.stage] ?? STAGE_META.APPLIED
                const next = NEXT[a.stage]
                const isOpen = open === a.id
                return (
                  <div key={a.id} className="card" style={{ padding: '14px 18px' }} data-testid="candidate-row">
                    <div className="flex flex-wrap items-center gap-3">
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--btn-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-on-gold)' }}>
                        {a.candidateName.charAt(0).toUpperCase()}
                      </div>
                      <button onClick={() => setOpen(isOpen ? null : a.id)} aria-expanded={isOpen}
                        style={{ flex: 1, minWidth: '220px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                        <div className="flex flex-wrap items-center gap-2" style={{ marginBottom: '3px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{a.candidateName}</span>
                          <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: meta.bg, color: meta.color }}>{meta.label}</span>
                          {!posting && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>for {title(a.jobPostingId)}</span>}
                          {isOpen ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
                        </div>
                        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
                          {[a.currentCompany || 'Not working now', a.yearsExperience != null ? `${a.yearsExperience} yrs` : null,
                            a.expectedCtc ? `expects ${lakh(a.expectedCtc)}` : null, a.offeredCtc ? `offered ${lakh(a.offeredCtc)}` : null,
                            a.source, a.interviewDate ? `interview ${formatDate(a.interviewDate)}` : null].filter(Boolean).join(' · ')}
                        </p>
                      </button>
                      {canMove && (
                        <div className="flex flex-wrap gap-2" style={{ flexShrink: 0 }}>
                          {ACTIVE(a.stage) && a.stage !== 'OFFER_EXTENDED' && a.stage !== 'OFFER_ACCEPTED' && (
                            <button className="btn-ghost h-8 text-xs" onClick={() => startAct('interview', a)}><CalendarClock size={13} /> Interview date</button>
                          )}
                          {next && (
                            <button className="btn-primary h-8 text-xs" onClick={() => move.mutate({ id: a.id, to: next })}>
                              {next === 'HIRED' ? 'Mark hired' : next === 'OFFER_ACCEPTED' ? 'Offer accepted' : `Move to ${STAGE_META[next].label.toLowerCase()}`}
                            </button>
                          )}
                          {ACTIVE(a.stage) && !next && (
                            <button className="btn-primary h-8 text-xs" onClick={() => startAct('offer', a)}><IndianRupee size={13} /> Make an offer</button>
                          )}
                          {ACTIVE(a.stage) && next && a.stage !== 'APPLIED' && a.stage !== 'OFFER_EXTENDED' && a.stage !== 'OFFER_ACCEPTED' && (
                            <button className="btn-secondary h-8 text-xs" onClick={() => startAct('offer', a)}><IndianRupee size={13} /> Offer</button>
                          )}
                          {ACTIVE(a.stage) && (
                            <button className="btn-ghost h-8 text-xs" style={{ color: '#DC2626' }} onClick={() => startAct('reject', a)}>Not selected</button>
                          )}
                          {a.stage === 'REJECTED' && (
                            <button className="btn-ghost h-8 text-xs" onClick={() => move.mutate({ id: a.id, to: 'SCREENING', notes: 'Reconsidered' })}>Reconsider</button>
                          )}
                        </div>
                      )}
                      {a.stage === 'HIRED' && canHire && (
                        <Link href={hireLink(a)} className="btn-primary h-8 text-xs" style={{ textDecoration: 'none' }}><UserPlus size={13} /> Add as employee</Link>
                      )}
                    </div>
                    {isOpen && (
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-secondary)' }} className="space-y-1">
                        <p style={{ margin: 0 }}>{a.email}{a.phone ? ` · ${a.phone}` : ''}{a.noticePeriodDays != null ? ` · notice ${a.noticePeriodDays} days` : ''}{a.currentCtc ? ` · now ${lakh(a.currentCtc)}` : ''}</p>
                        {webLink(a.resumeUrl) && <p style={{ margin: 0 }}><a href={webLink(a.resumeUrl)!} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)', fontWeight: 600 }}>Open résumé</a></p>}
                        {a.notes && <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'var(--text-muted)' }}>{a.notes}</p>}
                        {a.createdAt && <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Added {formatDate(a.createdAt)}</p>}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <Modal open={!!newPosting} onClose={() => setNewPosting(null)} title="New job posting" subtitle="Saved as a draft; open it for applications when it's ready.">
            {newPosting && (
              <div className="space-y-3">
                <div><label className="label label-required" htmlFor="jp-title">Job title</label>
                  <input id="jp-title" className="input h-10" placeholder="e.g. Accounts executive" value={newPosting.title} onChange={e => setNewPosting(p => p && ({ ...p, title: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label" htmlFor="jp-dept">Department</label>
                    <input id="jp-dept" className="input h-10" placeholder="e.g. Finance" value={newPosting.department} onChange={e => setNewPosting(p => p && ({ ...p, department: e.target.value }))} /></div>
                  <div><label className="label" htmlFor="jp-loc">Location</label>
                    <input id="jp-loc" className="input h-10" placeholder="e.g. Pune, or Remote" value={newPosting.location} onChange={e => setNewPosting(p => p && ({ ...p, location: e.target.value }))} /></div>
                  <div><label className="label" htmlFor="jp-type">Type</label>
                    <select id="jp-type" className="input h-10" value={newPosting.employmentType} onChange={e => setNewPosting(p => p && ({ ...p, employmentType: e.target.value }))}>
                      {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select></div>
                  <div><label className="label" htmlFor="jp-open">Openings</label>
                    <input id="jp-open" type="number" min={1} className="input h-10" value={newPosting.openPositions} onChange={e => setNewPosting(p => p && ({ ...p, openPositions: Math.max(1, Number(e.target.value) || 1) }))} /></div>
                  <div><label className="label" htmlFor="jp-min">Pay from (₹ a year)</label>
                    <input id="jp-min" inputMode="numeric" className="input h-10" placeholder="e.g. 360000" value={newPosting.minSalary} onChange={e => setNewPosting(p => p && ({ ...p, minSalary: e.target.value.replace(/\D/g, '') }))} /></div>
                  <div><label className="label" htmlFor="jp-max">Pay up to (₹ a year)</label>
                    <input id="jp-max" inputMode="numeric" className="input h-10" placeholder="e.g. 480000" value={newPosting.maxSalary} onChange={e => setNewPosting(p => p && ({ ...p, maxSalary: e.target.value.replace(/\D/g, '') }))} /></div>
                </div>
                <div><label className="label" htmlFor="jp-close">Applications close on (optional)</label>
                  <input id="jp-close" type="date" className="input h-10" value={newPosting.closingDate} onChange={e => setNewPosting(p => p && ({ ...p, closingDate: e.target.value }))} /></div>
                <div><label className="label" htmlFor="jp-desc">About the role (optional)</label>
                  <textarea id="jp-desc" className="input" rows={3} value={newPosting.description} onChange={e => setNewPosting(p => p && ({ ...p, description: e.target.value }))} /></div>
                <div className="flex justify-end gap-2" style={{ paddingTop: '6px' }}>
                  <button className="btn-secondary" onClick={() => setNewPosting(null)}>Cancel</button>
                  <button className="btn-primary" disabled={!newPosting.title.trim() || createPosting.isPending} onClick={() => createPosting.mutate(newPosting)}>
                    {createPosting.isPending ? 'Saving…' : 'Save as draft'}
                  </button>
                </div>
              </div>
            )}
          </Modal>

          <Modal open={!!candidateFor} onClose={() => setCandidateFor(null)} title="Add a candidate" subtitle={candidateFor ? `For ${title(candidateFor)}` : undefined}>
            <div className="space-y-3">
              {openPostings.length > 1 && (
                <div><label className="label" htmlFor="ca-posting">Posting</label>
                  <select id="ca-posting" className="input h-10" value={candidateFor ?? ''} onChange={e => setCandidateFor(e.target.value)}>
                    {openPostings.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select></div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label label-required" htmlFor="ca-name">Name</label>
                  <input id="ca-name" className="input h-10" value={cand.candidateName} onChange={e => setCand(c => ({ ...c, candidateName: e.target.value }))} /></div>
                <div><label className="label label-required" htmlFor="ca-email">Email</label>
                  <input id="ca-email" type="email" className="input h-10" value={cand.email} onChange={e => setCand(c => ({ ...c, email: e.target.value }))} /></div>
                <div><label className="label" htmlFor="ca-phone">Mobile</label>
                  <input id="ca-phone" inputMode="tel" className="input h-10" placeholder="98765 43210" value={cand.phone} onChange={e => setCand(c => ({ ...c, phone: e.target.value }))} /></div>
                <div><label className="label" htmlFor="ca-source">Came through</label>
                  <select id="ca-source" className="input h-10" value={cand.source} onChange={e => setCand(c => ({ ...c, source: e.target.value }))}>
                    {SOURCES.map(s => <option key={s}>{s}</option>)}
                  </select></div>
                <div><label className="label" htmlFor="ca-company">Works at now</label>
                  <input id="ca-company" className="input h-10" value={cand.currentCompany} onChange={e => setCand(c => ({ ...c, currentCompany: e.target.value }))} /></div>
                <div><label className="label" htmlFor="ca-exp">Experience (years)</label>
                  <input id="ca-exp" inputMode="decimal" className="input h-10" value={cand.yearsExperience} onChange={e => setCand(c => ({ ...c, yearsExperience: e.target.value.replace(/[^\d.]/g, '') }))} /></div>
                <div><label className="label" htmlFor="ca-ctc">Pay now (₹ a year)</label>
                  <input id="ca-ctc" inputMode="numeric" className="input h-10" value={cand.currentCtc} onChange={e => setCand(c => ({ ...c, currentCtc: e.target.value.replace(/\D/g, '') }))} /></div>
                <div><label className="label" htmlFor="ca-exp-ctc">Expects (₹ a year)</label>
                  <input id="ca-exp-ctc" inputMode="numeric" className="input h-10" value={cand.expectedCtc} onChange={e => setCand(c => ({ ...c, expectedCtc: e.target.value.replace(/\D/g, '') }))} /></div>
                <div><label className="label" htmlFor="ca-notice">Notice period (days)</label>
                  <input id="ca-notice" inputMode="numeric" className="input h-10" value={cand.noticePeriodDays} onChange={e => setCand(c => ({ ...c, noticePeriodDays: e.target.value.replace(/\D/g, '') }))} /></div>
                <div><label className="label" htmlFor="ca-cv">Résumé link (optional)</label>
                  <input id="ca-cv" className="input h-10" placeholder="https://…" value={cand.resumeUrl} onChange={e => setCand(c => ({ ...c, resumeUrl: e.target.value }))} /></div>
              </div>
              <div><label className="label" htmlFor="ca-note">Notes (optional)</label>
                <textarea id="ca-note" className="input" rows={2} value={cand.coverLetter} onChange={e => setCand(c => ({ ...c, coverLetter: e.target.value }))} /></div>
              <div className="flex justify-end gap-2" style={{ paddingTop: '6px' }}>
                <button className="btn-secondary" onClick={() => setCandidateFor(null)}>Cancel</button>
                <button className="btn-primary" disabled={!cand.candidateName.trim() || !cand.email.trim() || addCandidate.isPending} onClick={() => addCandidate.mutate()}>
                  {addCandidate.isPending ? 'Adding…' : 'Add candidate'}
                </button>
              </div>
            </div>
          </Modal>

          <Modal open={!!act} onClose={() => setAct(null)}
            title={act?.kind === 'interview' ? 'Interview date' : act?.kind === 'offer' ? 'Make an offer' : 'Not selected'}
            subtitle={act?.app.candidateName}>
            {act && (
              <div className="space-y-3">
                {act.kind === 'interview' && (
                  <div><label className="label label-required" htmlFor="rc-date">Date</label>
                    <input id="rc-date" type="date" className="input h-10" value={actForm.date} onChange={e => setActForm(f => ({ ...f, date: e.target.value }))} /></div>
                )}
                {act.kind === 'offer' && (
                  <div><label className="label label-required" htmlFor="rc-ctc">Pay offered (₹ a year, CTC)</label>
                    <input id="rc-ctc" inputMode="numeric" className="input h-10" value={actForm.amount} onChange={e => setActForm(f => ({ ...f, amount: e.target.value.replace(/\D/g, '') }))} />
                    {act.app.expectedCtc ? <p className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '4px' }}>They expect {lakh(act.app.expectedCtc)} a year.</p> : null}
                  </div>
                )}
                <div><label className="label" htmlFor="rc-note">{act.kind === 'reject' ? 'Why (kept with the candidate, optional)' : 'Note (optional)'}</label>
                  <textarea id="rc-note" className="input" rows={2} value={actForm.notes} onChange={e => setActForm(f => ({ ...f, notes: e.target.value }))} /></div>
                <div className="flex justify-end gap-2" style={{ paddingTop: '6px' }}>
                  <button className="btn-secondary" onClick={() => setAct(null)}>Cancel</button>
                  {act.kind === 'interview' && <button className="btn-primary" disabled={!actForm.date || interview.isPending} onClick={() => interview.mutate({ id: act.app.id })}>Save date</button>}
                  {act.kind === 'offer' && <button className="btn-primary" disabled={!Number(actForm.amount) || offer.isPending} onClick={() => offer.mutate({ id: act.app.id })}>Record offer</button>}
                  {act.kind === 'reject' && <button className="btn-danger" disabled={move.isPending} onClick={() => move.mutate({ id: act.app.id, to: 'REJECTED', notes: actForm.notes.trim() || undefined })}>Mark not selected</button>}
                </div>
              </div>
            )}
          </Modal>
        </div>
      </PermissionGate>
    </SubscriptionGate>
  )
}
