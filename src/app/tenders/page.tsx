'use client'
/*
 * FINVOSMART — Finvosmart by Navgrow
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
import { tendersApi, type Tender } from '@/lib/api/tenders'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { SkeletonStats, SkeletonTable } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import toast from 'react-hot-toast'
import { FileText, Plus, Clock, AlertTriangle, Trophy, Wallet, X, Trash2, ExternalLink, Landmark } from 'lucide-react'

const fmt = (n?: number) => {
  if (n == null) return '—'
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)}Cr`
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`
  return `₹${n}`
}
const SOURCES = ['GEM', 'RAILWAY', 'CPWD', 'STATE', 'DEFENCE', 'PSU', 'OTHER']
const STATUSES = ['TRACKING', 'PREPARING', 'SUBMITTED', 'WON', 'LOST', 'CANCELLED']
const urgencyColor = (u: string) => u === 'OVERDUE' ? '#DC2626' : u === 'URGENT' ? '#EA580C' : u === 'SOON' ? '#D97706' : u === 'CLOSED' ? '#6b7280' : '#3B82F6'
const statusColor = (s: string) => s === 'WON' ? '#22C55E' : s === 'SUBMITTED' ? '#3B82F6' : s === 'PREPARING' ? '#D97706' : s === 'LOST' || s === 'CANCELLED' ? '#6b7280' : '#8B5CF6'

export default function TendersPage() {
  const qc = useQueryClient()
  const { data: tenders, isLoading } = useQuery({ queryKey: ['tenders'], queryFn: tendersApi.list })
  const { data: summary } = useQuery({ queryKey: ['tenders-summary'], queryFn: tendersApi.summary })
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<Partial<Tender>>({ source: 'GEM', status: 'TRACKING' })

  const createMut = useMutation({
    mutationFn: (d: Partial<Tender>) => tendersApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenders'] }); qc.invalidateQueries({ queryKey: ['tenders-summary'] })
      setShowAdd(false); setForm({ source: 'GEM', status: 'TRACKING' }); toast.success('Tender added')
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Could not add tender'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => tendersApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenders'] }); qc.invalidateQueries({ queryKey: ['tenders-summary'] })
      toast.success('Tender removed')
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Could not remove tender'),
  })

  const submit = () => {
    if (!form.title?.trim()) return toast.error('Tender title is required')
    if (!form.submissionDeadline) return toast.error('Submission deadline is required')
    createMut.mutate(form)
  }

  return (
    <PermissionGate permission="TENDER_VIEW">
      <div className="space-y-5">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Landmark size={22} color="#fff" />
            </div>
            <div>
              <h1 className="page-title" style={{ margin: 0 }}>Tender Management</h1>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>Track GeM, Railway, CPWD & state tenders — never miss a deadline or lose track of EMD.</p>
            </div>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
            <Plus size={16} /> Add Tender
          </button>
        </div>

        {/* Alerts */}
        {summary?.alerts && summary.alerts.length > 0 && (
          <div className="card" style={{ padding: '16px 20px', background: 'rgba(234,88,12,0.05)', border: '1px solid rgba(234,88,12,0.2)' }}>
            {summary.alerts.map((a: string, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: 'var(--text-primary)', padding: '3px 0' }}>
                <AlertTriangle size={15} style={{ color: '#EA580C', flexShrink: 0 }} /> {a}
              </div>
            ))}
          </div>
        )}

        {/* Summary stats */}
        {isLoading ? <SkeletonStats count={4} /> : summary ? (
          <div className="auto-grid-4">
            <SummaryCard icon={FileText} label="Tracking" value={summary.totalTracking} color="#8B5CF6" />
            <SummaryCard icon={Clock} label="Closing this week" value={summary.closingThisWeek} color="#EA580C" />
            <SummaryCard icon={Wallet} label="EMD blocked" value={fmt(summary.emdBlocked)} color="#D97706" />
            <SummaryCard icon={Trophy} label="Won" value={summary.won} color="#22C55E" />
          </div>
        ) : null}

        {/* Pipeline value */}
        {summary && summary.totalPipelineValue > 0 && (
          <div className="card" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Total live pipeline value</span>
            <span style={{ fontSize: '22px', fontWeight: 700, color: 'var(--gold)' }}>{fmt(summary.totalPipelineValue)}</span>
          </div>
        )}

        {/* Tender list */}
        {isLoading ? (
          <SkeletonTable rows={4} cols={5} />
        ) : !tenders || tenders.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No tenders tracked yet"
            description="Add a government or PSU tender to track its deadline, EMD and status — so you never miss a submission."
            action={{ label: 'Add your first tender', onClick: () => setShowAdd(true) }}
          />
        ) : (
          <div className="space-y-3">
            {tenders.map((t: Tender) => (
              <div key={t.id} className="card" style={{ padding: '18px', borderLeft: `3px solid ${urgencyColor(t.urgency)}` }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '5px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</span>
                      <span style={{ padding: '2px 9px', borderRadius: '100px', fontSize: '10.5px', fontWeight: 700, color: '#fff', background: statusColor(t.status) }}>{t.status}</span>
                      <span style={{ padding: '2px 9px', borderRadius: '100px', fontSize: '10.5px', fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}>{t.source}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      {t.tenderNumber && <span>#{t.tenderNumber}</span>}
                      {t.department && <span>{t.department}</span>}
                      {t.estimatedValue != null && <span>Value: {fmt(t.estimatedValue)}</span>}
                      {t.emdAmount != null && <span>EMD: {fmt(t.emdAmount)}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 600, color: urgencyColor(t.urgency) }}>
                        <Clock size={13} />
                        {t.urgency === 'CLOSED' ? 'Closed' :
                          t.daysToDeadline < 0 ? `${Math.abs(t.daysToDeadline)} days overdue` :
                          t.daysToDeadline === 0 ? 'Due today' : `${t.daysToDeadline} days left`}
                      </span>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Deadline: {t.submissionDeadline}</span>
                      {!t.eligibilityConfirmed && t.urgency !== 'CLOSED' && (
                        <span style={{ fontSize: '11.5px', color: '#D97706', fontWeight: 500 }}>· eligibility not confirmed</span>
                      )}
                      {t.portalUrl && (
                        <a href={t.portalUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '12.5px', color: 'var(--gold)', textDecoration: 'none' }}>
                          Portal <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>
                  <button onClick={() => { if (confirm('Remove this tender?')) deleteMut.mutate(t.id) }}
                    aria-label="Remove tender" className="btn-icon" style={{ flexShrink: 0 }}>
                    <Trash2 size={15} style={{ color: 'var(--text-muted)' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add modal */}
        {showAdd && (
          <div className="modal-overlay" onClick={() => setShowAdd(false)}>
            <div className="modal-content" onClick={(e: any) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <h2 className="font-serif" style={{ fontSize: '19px', color: 'var(--text-primary)' }}>Add Tender</h2>
                <button onClick={() => setShowAdd(false)} aria-label="Close" className="btn-icon"><X size={18} /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="label">Tender title *</label>
                  <input className="input" value={form.title ?? ''} onChange={(e: any) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Supply of office furniture to..." />
                </div>
                <div className="auto-grid-2">
                  <div>
                    <label className="label">Source *</label>
                    <select className="input" value={form.source} onChange={(e: any) => setForm(f => ({ ...f, source: e.target.value }))}>
                      {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Tender number</label>
                    <input className="input" value={form.tenderNumber ?? ''} onChange={(e: any) => setForm(f => ({ ...f, tenderNumber: e.target.value }))} placeholder="GEM/2026/B/..." />
                  </div>
                </div>
                <div>
                  <label className="label">Department / organisation</label>
                  <input className="input" value={form.department ?? ''} onChange={(e: any) => setForm(f => ({ ...f, department: e.target.value }))} placeholder="Ministry of Railways" />
                </div>
                <div className="auto-grid-2">
                  <div>
                    <label className="label">Estimated value (₹)</label>
                    <input className="input" type="number" value={form.estimatedValue ?? ''} onChange={(e: any) => setForm(f => ({ ...f, estimatedValue: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <label className="label">EMD amount (₹)</label>
                    <input className="input" type="number" value={form.emdAmount ?? ''} onChange={(e: any) => setForm(f => ({ ...f, emdAmount: parseFloat(e.target.value) || 0 }))} />
                  </div>
                </div>
                <div className="auto-grid-2">
                  <div>
                    <label className="label">Submission deadline *</label>
                    <input className="input" type="date" value={form.submissionDeadline ?? ''} onChange={(e: any) => setForm(f => ({ ...f, submissionDeadline: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Status</label>
                    <select className="input" value={form.status} onChange={(e: any) => setForm(f => ({ ...f, status: e.target.value }))}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Portal URL</label>
                  <input className="input" value={form.portalUrl ?? ''} onChange={(e: any) => setForm(f => ({ ...f, portalUrl: e.target.value }))} placeholder="https://gem.gov.in/..." />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!form.eligibilityConfirmed} onChange={(e: any) => setForm(f => ({ ...f, eligibilityConfirmed: e.target.checked }))} />
                  We meet the eligibility criteria for this tender
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
                <button onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
                <button onClick={submit} disabled={createMut.isPending} className="btn-primary">{createMut.isPending ? 'Adding…' : 'Add Tender'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGate>
  )
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  return (
    <div className="card" style={{ padding: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{label}</span>
        <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} style={{ color }} />
        </div>
      </div>
      <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
    </div>
  )
}
