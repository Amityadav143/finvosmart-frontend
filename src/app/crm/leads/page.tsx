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
import { crmApi } from '@/lib/api/crm'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, formatDate, apiError } from '@/lib/utils'
import type { Lead, LeadUpdate } from '@/types'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { todayIST } from '@/lib/money'
import { Plus, TrendingUp, DollarSign, Target, Award, CalendarClock, UserCheck, FileText } from 'lucide-react'
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

const EMPTY_FORM = { name: '', email: '', phone: '', companyName: '', source: 'WEBSITE', estimatedValue: '', nextFollowUp: '', notes: '' }

export default function LeadsPage() {
  const qc = useQueryClient()
  const { canAny } = usePermissions()
  const canCreate = canAny('CRM_CREATE', 'CRM_ADMIN')
  const canMove = canAny('CRM_CREATE', 'CRM_EDIT', 'CRM_ADMIN')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [openId, setOpenId] = useState<string | null>(null)
  const canMakeCustomer = canAny('CRM_CREATE', 'CRM_ADMIN')
  const today = todayIST()

  const { data: pipeline } = useQuery({ queryKey: ['crm-pipeline'], queryFn: crmApi.leads.pipeline })
  const { data: myLeads, isLoading, isError, refetch } = useQuery({ queryKey: ['leads'], queryFn: crmApi.leads.list })

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['leads'] })
    qc.invalidateQueries({ queryKey: ['crm-pipeline'] })
  }

  const createMutation = useMutation({
    mutationFn: (d: any) => crmApi.leads.create(d),
    onSuccess: () => { refresh(); setShowCreate(false); setForm(EMPTY_FORM); toast.success('Lead added') },
    onError: (e: any) => toast.error(apiError(e, "Couldn't add the lead")),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => crmApi.leads.updateStatus(id, status),
    onSuccess: refresh,
    onError: (e: any) => toast.error(apiError(e, "Couldn't move the lead")),
  })

  const convertMutation = useMutation({
    mutationFn: (id: string) => crmApi.leads.convert(id),
    onSuccess: r => { refresh(); qc.invalidateQueries({ queryKey: ['customers'] }); toast.success(r.created ? `${r.customer.name} added as a customer` : `Linked to your customer ${r.customer.name}`) },
    onError: (e: any) => toast.error(apiError(e, "Couldn't make the lead a customer")),
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
        {canCreate && (
          <button onClick={() => setShowCreate(true)} className="btn-primary h-9">
            <Plus className="w-4 h-4" /> New Lead
          </button>
        )}
      </div>

      {isError && (
        <div className="card flex items-center justify-between gap-3" role="alert">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Couldn&apos;t load the leads.</p>
          <button className="btn-secondary h-8" onClick={() => refetch()}>Try again</button>
        </div>
      )}

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
                    <button type="button" className="text-xs font-semibold mb-1 truncate block w-full text-left hover:underline" style={{ color: 'var(--text-primary)' }}
                      onClick={() => setOpenId(lead.id)} aria-label={`Open ${lead.name}`}>{lead.name}</button>
                    {lead.companyName && <p className="text-xs mb-2 truncate" style={{ color: 'var(--text-muted)' }}>{lead.companyName}</p>}
                    {!!lead.estimatedValue && (
                      <p className="text-xs font-bold mb-2" style={{ color: 'var(--gold)' }}>{formatCurrency(lead.estimatedValue)}</p>
                    )}
                    {(lead.phone || lead.email) && (
                      <p className="text-xs mb-1 truncate" style={{ color: 'var(--text-muted)' }}>{lead.phone || lead.email}</p>
                    )}
                    {lead.nextFollowUp && !['WON', 'LOST'].includes(lead.status) && (
                      <p className="text-xs mb-1 flex items-center gap-1"
                        style={{ color: lead.nextFollowUp <= today ? 'var(--danger, #ef4444)' : 'var(--text-muted)' }}>
                        <CalendarClock className="w-3 h-3" aria-hidden />
                        {lead.nextFollowUp < today ? 'Follow-up overdue · ' : lead.nextFollowUp === today ? 'Follow up today · ' : 'Follow up '}
                        {formatDate(lead.nextFollowUp)}
                      </p>
                    )}
                    {lead.convertedToCustomerId ? (
                      <p className="text-xs mb-1 flex items-center gap-1" style={{ color: '#16a34a' }}><UserCheck className="w-3 h-3" aria-hidden />Customer</p>
                    ) : lead.status === 'WON' && canMakeCustomer && (
                      <button type="button" className="text-xs mb-1 underline flex items-center gap-1" style={{ color: 'var(--gold)' }}
                        disabled={convertMutation.isPending} onClick={() => convertMutation.mutate(lead.id)}>
                        <UserCheck className="w-3 h-3" aria-hidden />Make customer
                      </button>
                    )}
                    {/* Quick stage change */}
                    <select className="w-full text-xs rounded-lg px-2 py-1 mt-1 outline-none"
                      aria-label={`Stage for ${lead.name}`}
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                      value={lead.status}
                      disabled={!canMove || updateMutation.isPending}
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

      {openId && (() => {
        const lead = (myLeads ?? []).find(l => l.id === openId)
        return lead ? <LeadModal lead={lead} canEdit={canMove} canMakeCustomer={canMakeCustomer} onClose={() => setOpenId(null)} onSaved={refresh}
          converting={convertMutation.isPending} onConvert={() => convertMutation.mutate(lead.id)} /> : null
      })()}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Lead" subtitle="Add a new prospect to your pipeline">
        <form onSubmit={e => {
          e.preventDefault()
          createMutation.mutate({
            ...form,
            email: form.email || undefined, phone: form.phone || undefined, companyName: form.companyName || undefined,
            notes: form.notes || undefined, nextFollowUp: form.nextFollowUp || undefined,
            estimatedValue: form.estimatedValue ? parseFloat(form.estimatedValue) : undefined,
          })
        }} className="space-y-4">
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
            <div><label className="label">Est. Value (₹)</label><input className="input h-10" type="number" min="0" step="0.01" value={form.estimatedValue} onChange={e => setForm(f => ({...f, estimatedValue: e.target.value}))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Next follow-up</label><input className="input h-10" type="date" value={form.nextFollowUp} onChange={e => setForm(f => ({...f, nextFollowUp: e.target.value}))} /></div>
            <div><label className="label">Notes</label><input className="input h-10" maxLength={500} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} /></div>
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

/**
 * One lead: its details (editable), and — once it is a customer — the way on to a quotation or
 * an invoice. "Make customer" adds the customer from the lead (or links the customer who already
 * has its email address).
 */
function LeadModal({ lead, canEdit, canMakeCustomer, converting, onConvert, onClose, onSaved }: {
  lead: Lead; canEdit: boolean; canMakeCustomer: boolean; converting: boolean
  onConvert: () => void; onClose: () => void; onSaved: () => void
}) {
  const [f, setF] = useState({
    name: lead.name ?? '', companyName: lead.companyName ?? '', email: lead.email ?? '', phone: lead.phone ?? '',
    estimatedValue: lead.estimatedValue != null ? String(lead.estimatedValue) : '', nextFollowUp: lead.nextFollowUp ?? '',
    expectedCloseDate: lead.expectedCloseDate ?? '', notes: lead.notes ?? '',
  })
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF(p => ({ ...p, [k]: e.target.value }))
  const { data: customer } = useQuery({ queryKey: ['customer', lead.convertedToCustomerId], queryFn: () => crmApi.customers.get(lead.convertedToCustomerId!), enabled: !!lead.convertedToCustomerId })
  const save = useMutation({
    mutationFn: () => {
      const body: LeadUpdate = {
        name: f.name, companyName: f.companyName, email: f.email, phone: f.phone, notes: f.notes,
        estimatedValue: f.estimatedValue.trim() === '' ? undefined : Number(f.estimatedValue),
        expectedCloseDate: f.expectedCloseDate || undefined,
        ...(f.nextFollowUp ? { nextFollowUp: f.nextFollowUp } : { clearFollowUp: true }),
      }
      return crmApi.leads.update(lead.id, body)
    },
    onSuccess: () => { toast.success('Lead saved'); onSaved() },
    onError: (e: any) => toast.error(apiError(e, "Couldn't save the lead")),
  })
  const problem = !f.name.trim() ? 'Enter the contact’s name.'
    : f.estimatedValue.trim() !== '' && !(Number(f.estimatedValue) >= 0) ? 'The estimated value must be a number, not below zero.' : null
  return (
    <Modal open onClose={onClose} title={lead.name} subtitle={[lead.companyName, lead.source && `from ${lead.source.toLowerCase().replace(/_/g, ' ')}`].filter(Boolean).join(' · ') || 'Lead'}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="label label-required" htmlFor="lead-name">Contact name</label><input id="lead-name" className="input h-10" value={f.name} maxLength={200} onChange={set('name')} disabled={!canEdit} /></div>
          <div><label className="label" htmlFor="lead-company">Company</label><input id="lead-company" className="input h-10" value={f.companyName} maxLength={200} onChange={set('companyName')} disabled={!canEdit} /></div>
          <div><label className="label" htmlFor="lead-email">Email</label><input id="lead-email" className="input h-10" type="email" value={f.email} maxLength={200} onChange={set('email')} disabled={!canEdit} /></div>
          <div><label className="label" htmlFor="lead-phone">Phone</label><input id="lead-phone" className="input h-10" value={f.phone} maxLength={15} onChange={set('phone')} disabled={!canEdit} /></div>
          <div><label className="label" htmlFor="lead-value">Est. value (₹)</label><input id="lead-value" className="input h-10" type="number" min="0" step="0.01" value={f.estimatedValue} onChange={set('estimatedValue')} disabled={!canEdit} /></div>
          <div><label className="label" htmlFor="lead-follow">Next follow-up</label><input id="lead-follow" className="input h-10" type="date" value={f.nextFollowUp} onChange={set('nextFollowUp')} disabled={!canEdit} /></div>
          <div><label className="label" htmlFor="lead-close">Expected to close</label><input id="lead-close" className="input h-10" type="date" value={f.expectedCloseDate} onChange={set('expectedCloseDate')} disabled={!canEdit} /></div>
        </div>
        <div><label className="label" htmlFor="lead-notes">Notes</label><textarea id="lead-notes" className="input resize-none" rows={3} maxLength={2000} value={f.notes} onChange={set('notes')} disabled={!canEdit} /></div>

        <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          {lead.convertedToCustomerId ? (
            <>
              <p className="text-sm flex items-center gap-1.5"><UserCheck className="w-4 h-4" style={{ color: '#16a34a' }} aria-hidden />
                Customer: <Link href={`/crm/customers?open=${lead.convertedToCustomerId}`} className="underline font-semibold">{customer?.name ?? 'open the customer'}</Link></p>
              <div className="flex flex-wrap gap-2">
                <Link href={`/invoicing/new?type=QUOTATION&customer=${lead.convertedToCustomerId}`} className="btn-secondary h-9 text-sm"><FileText className="w-4 h-4" aria-hidden />New quotation</Link>
                <Link href={`/invoicing/new?customer=${lead.convertedToCustomerId}`} className="btn-secondary h-9 text-sm">New invoice</Link>
              </div>
            </>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Ready to quote? Make this lead a customer — quotations and invoices then pick up their details.</p>
              {canMakeCustomer && <button type="button" className="btn-secondary h-9 text-sm" disabled={converting} onClick={onConvert}><UserCheck className="w-4 h-4" aria-hidden />{converting ? 'Adding…' : 'Make customer'}</button>}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: problem ? '#dc2626' : 'var(--text-muted)' }}>{problem ?? (lead.createdAt ? `Added ${formatDate(lead.createdAt)}` : '')}</p>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary h-10" onClick={onClose}>Close</button>
            {canEdit && <button type="button" className="btn-primary h-10" disabled={!!problem || save.isPending} onClick={() => save.mutate()}>{save.isPending ? 'Saving…' : 'Save'}</button>}
          </div>
        </div>
      </div>
    </Modal>
  )
}
