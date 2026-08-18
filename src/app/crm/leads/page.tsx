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
import { crmApi } from '@/lib/api/crm'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Lead } from '@/types'
import { Plus, TrendingUp, DollarSign, Target, Award } from 'lucide-react'
import toast from 'react-hot-toast'

const STAGES = [
  { key: 'NEW',         label: 'New',          color: '#3b82f6', bg: 'rgba(59,130,246,0.08)'  },
  { key: 'CONTACTED',   label: 'Contacted',     color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
  { key: 'QUALIFIED',   label: 'Qualified',     color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  { key: 'PROPOSAL',    label: 'Proposal Sent', color: '#14b8a6', bg: 'rgba(20,184,166,0.08)' },
  { key: 'NEGOTIATION', label: 'Negotiation',   color: '#f97316', bg: 'rgba(249,115,22,0.08)' },
  { key: 'WON',         label: 'Won',           color: '#22c55e', bg: 'rgba(34,197,94,0.08)'  },
  { key: 'LOST',        label: 'Lost',          color: '#ef4444', bg: 'rgba(239,68,68,0.08)'  },
]

export default function LeadsPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', companyName: '', source: 'WEBSITE', estimatedValue: '' })

  const { data: pipeline } = useQuery({ queryKey: ['crm-pipeline'], queryFn: crmApi.leads.pipeline })
  const { data: myLeads, isLoading } = useQuery({ queryKey: ['my-leads'], queryFn: crmApi.leads.list })

  const createMutation = useMutation({
    mutationFn: (d: any) => crmApi.leads.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-leads', 'crm-pipeline'] }); setShowCreate(false); toast.success('Lead created!') },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to create lead'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => crmApi.leads.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-leads', 'crm-pipeline'] }),
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to update lead'),
  })

  const grouped: Record<string, Lead[]> = {}
  STAGES.forEach(s => { grouped[s.key] = [] })
  ;(myLeads ?? []).forEach((l: any) => { if (grouped[l.status]) grouped[l.status].push(l) })

  const totalValue = (myLeads ?? []).filter((l: any) => l.status === 'WON').reduce((sum: any, l: any) => sum + (l.estimatedValue ?? 0), 0)
  const wonCount   = pipeline?.WON ?? 0
  const totalLeads = Object.values(pipeline ?? {}).reduce((a: number, b) => a + (Number(b) || 0), 0)
  const winRate    = totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : 0

  return (
    <div className="space-y-5">
      {/* Header stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)' }}>
            <Target className="w-5 h-5 text-blue-400" />
          </div>
          <div><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Leads</p><p className="text-2xl font-display">{totalLeads}</p></div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.12)' }}>
            <Award className="w-5 h-5 text-green-400" />
          </div>
          <div><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Win Rate</p><p className="text-2xl font-display text-green-400">{winRate}%</p></div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)' }}>
            <DollarSign className="w-5 h-5" style={{ color: 'var(--gold)' }} />
          </div>
          <div><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Won Value</p><p className="text-xl font-display">{formatCurrency(totalValue)}</p></div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.12)' }}>
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <div><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Active Pipeline</p><p className="text-2xl font-display">{(myLeads ?? []).filter((l: any) => !['WON','LOST'].includes(l.status)).length}</p></div>
        </div>
      </div>

      {/* Kanban header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl" style={{ letterSpacing: '-0.02em' }}>Sales Pipeline</h2>
        <button onClick={() => setShowCreate(true)} className="btn-primary h-9">
          <Plus className="w-4 h-4" /> New Lead
        </button>
      </div>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollSnapType: 'x mandatory' }}>
        {STAGES.map(stage => {
          const leads = grouped[stage.key] ?? []
          const stageValue = leads.reduce((s, l) => s + (l.estimatedValue ?? 0), 0)
          return (
            <div key={stage.key} className="flex-shrink-0 rounded-2xl p-3 flex flex-col" style={{ width: '260px', minHeight: '400px', background: stage.bg, border: `1px solid ${stage.color}20`, scrollSnapAlign: 'start' }}>
              {/* Column header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: stage.color }}>{stage.label}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${stage.color}18`, color: stage.color }}>
                  {leads.length}
                </span>
              </div>
              {stageValue > 0 && (
                <p className="text-xs px-1 mb-2" style={{ color: 'var(--text-muted)' }}>
                  {formatCurrency(stageValue)}
                </p>
              )}

              {/* Lead cards */}
              <div className="flex-1 space-y-2">
                {isLoading ? Array.from({length:2}).map((_,i) => (
                  <div key={i} className="skeleton rounded-xl h-20" />
                )) : leads.map((lead, idx) => (
                  <div key={lead.id} className="rounded-xl p-3 animate-fade-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', animationDelay: `${idx * 0.05}s` }}>
                    <p className="text-xs font-semibold mb-1 truncate" style={{ color: 'var(--text-primary)' }}>{lead.name}</p>
                    {lead.companyName && <p className="text-xs mb-2 truncate" style={{ color: 'var(--text-muted)' }}>{lead.companyName}</p>}
                    {lead.estimatedValue && (
                      <p className="text-xs font-bold mb-2" style={{ color: 'var(--gold)' }}>{formatCurrency(lead.estimatedValue)}</p>
                    )}
                    {/* Quick stage change */}
                    <select className="w-full text-xs rounded-lg px-2 py-1 mt-1 outline-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                      value={lead.status}
                      onChange={e => updateMutation.mutate({ id: lead.id, status: e.target.value })}>
                      {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Lead" subtitle="Add a new prospect to your pipeline">
        <form onSubmit={e => { e.preventDefault(); createMutation.mutate({ ...form, estimatedValue: form.estimatedValue ? parseFloat(form.estimatedValue) : undefined }) }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Contact Name *</label><input className="input h-10" required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} /></div>
            <div><label className="label">Company Name</label><input className="input h-10" value={form.companyName} onChange={e => setForm(f => ({...f, companyName: e.target.value}))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Email</label><input className="input h-10" type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} /></div>
            <div><label className="label">Phone</label><input className="input h-10" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Source</label>
              <select className="input h-10" value={form.source} onChange={e => setForm(f => ({...f, source: e.target.value}))}>
                <option value="WEBSITE">Website</option><option value="REFERRAL">Referral</option>
                <option value="COLD_CALL">Cold Call</option><option value="EVENT">Event</option>
              </select></div>
            <div><label className="label">Est. Value (₹)</label><input className="input h-10" type="number" value={form.estimatedValue} onChange={e => setForm(f => ({...f, estimatedValue: e.target.value}))} /></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">Create Lead</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
