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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, FolderOpen, Calendar, IndianRupee, CheckCircle, PauseCircle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { api } from '@/lib/api/client'
import { formatCurrency, formatDate, apiError } from '@/lib/utils'

type Status = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
interface Project {
  id: string; projectCode?: string; name: string; description?: string; customerName?: string
  startDate?: string; endDate?: string; contractValue?: number; status: Status
}

const STATUS_COLOR: Record<Status, string> = {
  PLANNING: '#6366f1', ACTIVE: '#22c55e', ON_HOLD: '#f59e0b', COMPLETED: '#3b82f6', CANCELLED: '#94a3b8',
}
const BADGE: Record<Status, 'success' | 'info' | 'warning' | 'default'> = {
  PLANNING: 'default', ACTIVE: 'success', ON_HOLD: 'warning', COMPLETED: 'info', CANCELLED: 'default',
}
// Only the moves that make sense from each status.
const NEXT: Record<Status, { to: Status; label: string }[]> = {
  PLANNING:  [{ to: 'ACTIVE', label: 'Start' }, { to: 'CANCELLED', label: 'Cancel' }],
  ACTIVE:    [{ to: 'ON_HOLD', label: 'Put on hold' }, { to: 'COMPLETED', label: 'Complete' }],
  ON_HOLD:   [{ to: 'ACTIVE', label: 'Resume' }, { to: 'CANCELLED', label: 'Cancel' }],
  COMPLETED: [],
  CANCELLED: [],
}
const EMPTY = { name: '', projectCode: '', customerName: '', contractValue: '', startDate: '', endDate: '', description: '' }
const DAY = 86_400_000

/** Time elapsed between start and end dates — a schedule, not a measure of work done. */
function schedule(p: Project): { pct: number; label: string } | null {
  if (!p.startDate || !p.endDate) return null
  const start = new Date(p.startDate + 'T00:00:00').getTime(), end = new Date(p.endDate + 'T00:00:00').getTime()
  const now = Date.now()
  if (end <= start) return null
  const pct = Math.max(0, Math.min(100, Math.round(((now - start) / (end - start)) * 100)))
  if (p.status === 'COMPLETED') return { pct: 100, label: 'Completed' }
  if (now < start) return { pct: 0, label: `Starts in ${Math.ceil((start - now) / DAY)} days` }
  if (now > end) return { pct: 100, label: `Overdue by ${Math.floor((now - end) / DAY)} days` }
  return { pct, label: `${Math.ceil((end - now) / DAY)} days left` }
}

export default function ProjectsPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const { data: projects = [], isLoading, isError } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(r => r.data.data ?? []),
  })

  const create = useMutation({
    mutationFn: () => api.post('/projects', {
      name: form.name.trim(),
      projectCode: form.projectCode.trim() || undefined,
      customerName: form.customerName.trim() || undefined,
      contractValue: form.contractValue ? Number(form.contractValue) : undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      description: form.description.trim() || undefined,
      status: 'PLANNING',
    }).then(r => r.data.data),
    onSuccess: () => {
      toast.success('Project created')
      setShowCreate(false); setForm(EMPTY)
      qc.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: (e: any) => toast.error(apiError(e, 'Could not create the project')),
  })

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) =>
      api.patch(`/projects/${id}/status`, null, { params: { status } }).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
    onError: (e: any) => toast.error(apiError(e, 'Could not update the project')),
  })

  const onCreate = () => {
    if (!form.name.trim()) { toast.error('Project name is required'); return }
    if (form.startDate && form.endDate && form.endDate < form.startDate) { toast.error('End date must be on or after the start date'); return }
    if (form.contractValue && Number(form.contractValue) < 0) { toast.error("Contract value can't be negative"); return }
    create.mutate()
  }

  const count = (s: Status) => projects.filter(p => p.status === s).length
  const openValue = projects.filter(p => p.status === 'ACTIVE' || p.status === 'PLANNING')
    .reduce((sum, p) => sum + Number(p.contractValue ?? 0), 0)
  const stats = [
    { label: 'Projects', val: String(projects.length), icon: FolderOpen, color: 'var(--gold)' },
    { label: 'Active', val: String(count('ACTIVE')), icon: CheckCircle, color: '#22c55e' },
    { label: 'On hold', val: String(count('ON_HOLD')), icon: PauseCircle, color: '#f59e0b' },
    { label: 'Open contract value', val: formatCurrency(openValue), icon: IndianRupee, color: '#3b82f6' },
  ]
  const set = (k: keyof typeof EMPTY) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Track client projects, schedules and contract value</p>
        </div>
        <button className="btn-primary h-9 text-sm" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" />New Project</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="card">
            <div className="flex items-center gap-2 mb-2"><s.icon className="w-4 h-4" style={{ color: s.color }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</span></div>
            <div className="text-xl font-bold">{s.val}</div>
          </div>
        ))}
      </div>

      {isLoading && <div className="card text-sm" style={{ color: 'var(--text-muted)' }}>Loading projects…</div>}
      {isError && <div className="card text-sm" style={{ color: '#ef4444' }}>Could not load projects. Please refresh the page.</div>}
      {!isLoading && !isError && projects.length === 0 && (
        <div className="card text-center" style={{ padding: '40px 24px' }}>
          <FolderOpen className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-semibold mb-1">No projects yet</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Create your first project to track its schedule and contract value.</p>
          <button className="btn-primary h-9 text-sm" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" />New Project</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {projects.map(p => {
          const sch = schedule(p)
          return (
            <div key={p.id} className="card">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${STATUS_COLOR[p.status]}1f` }}>
                    <FolderOpen className="w-5 h-5" style={{ color: STATUS_COLOR[p.status] }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{p.name}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {[p.projectCode, p.customerName].filter(Boolean).join(' · ') || 'No client'}
                    </p>
                  </div>
                </div>
                <Badge variant={BADGE[p.status]} className="flex-shrink-0">{p.status.replace('_', ' ')}</Badge>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />
                  {p.startDate ? formatDate(p.startDate) : 'No start date'} → {p.endDate ? formatDate(p.endDate) : 'No end date'}</span>
                {p.contractValue != null && <span className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5" />{formatCurrency(Number(p.contractValue))}</span>}
              </div>
              {sch && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                    <span>Time elapsed</span><span>{sch.label}</span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '4px', background: 'var(--bg-hover)' }}>
                    <div style={{ height: '100%', borderRadius: '4px', width: `${sch.pct}%`,
                                  background: sch.label.startsWith('Overdue') ? '#ef4444' : STATUS_COLOR[p.status] }} />
                  </div>
                </div>
              )}
              {NEXT[p.status].length > 0 && (
                <div className="flex gap-2">
                  {NEXT[p.status].map(n => (
                    <button key={n.to} className="btn-ghost h-8 text-xs" disabled={setStatus.isPending}
                            onClick={() => setStatus.mutate({ id: p.id, status: n.to })}>{n.label}</button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Project" subtitle="Create a project to track its schedule and value">
        <div className="space-y-3">
          <div><label className="label">Project Name *</label><input className="input h-10" value={form.name} onChange={set('name')} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Project Code</label><input className="input h-10" value={form.projectCode} onChange={set('projectCode')} placeholder="e.g. PRJ-001" /></div>
            <div><label className="label">Client</label><input className="input h-10" value={form.customerName} onChange={set('customerName')} /></div>
          </div>
          <div><label className="label">Contract Value ₹</label><input className="input h-10" type="number" min="0" value={form.contractValue} onChange={set('contractValue')} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Start Date</label><input className="input h-10" type="date" value={form.startDate} onChange={set('startDate')} /></div>
            <div><label className="label">End Date</label><input className="input h-10" type="date" value={form.endDate} min={form.startDate || undefined} onChange={set('endDate')} /></div>
          </div>
          <div><label className="label">Description</label><textarea className="input" rows={3} value={form.description} onChange={set('description')} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary h-9 text-sm" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn-primary h-9 text-sm" disabled={create.isPending} onClick={onCreate}>{create.isPending ? 'Creating…' : 'Create Project'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
