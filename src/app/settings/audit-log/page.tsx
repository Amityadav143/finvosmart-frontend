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

import { Fragment, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ChevronDown, ChevronRight, Download, History, Lock } from 'lucide-react'
import { auditApi, type AuditEntry, type AuditFilter } from '@/lib/api/audit'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'

const ACTIONS: { value: string; label: string; color: string }[] = [
  { value: 'CREATE',        label: 'Created',          color: '#16a34a' },
  { value: 'UPDATE',        label: 'Changed',          color: '#2563eb' },
  { value: 'DELETE',        label: 'Deleted',          color: '#dc2626' },
  { value: 'LOGIN',         label: 'Signed in',        color: '#64748b' },
  { value: 'LOGIN_FAILED',  label: 'Failed sign-in',   color: '#d97706' },
  { value: 'LOGIN_BLOCKED', label: 'Blocked sign-in',  color: '#dc2626' },
  { value: 'PASSWORD_CHANGED',     label: 'Password changed',          color: '#0891b2' },
  { value: 'PASSWORD_RESET',       label: 'Password reset by email',   color: '#0891b2' },
  { value: 'SIGNED_OUT_ELSEWHERE', label: 'Signed out other devices',  color: '#64748b' },
  { value: 'TWO_STEP_ON',          label: 'Two-step sign-in on',       color: '#16a34a' },
  { value: 'TWO_STEP_OFF',         label: 'Two-step sign-in off',      color: '#d97706' },
  { value: 'BACKUP_CODES_RENEWED', label: 'New backup codes',          color: '#64748b' },
  { value: 'GOOGLE_LINKED',        label: 'Google sign-in linked',     color: '#16a34a' },
  { value: 'GOOGLE_UNLINKED',      label: 'Google sign-in removed',    color: '#d97706' },
  { value: 'EXPORT',        label: 'Exported',         color: '#7c3aed' },
]
const actionMeta = (a: string) => ACTIONS.find(x => x.value === a) ?? { value: a, label: a, color: '#64748b' }

/** "invoiceNumber" → "Invoice number" */
const human = (key: string) => key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase()).replace(/ ([A-Z])/g, (_, c) => ' ' + c.toLowerCase())
const show = (v: unknown) => (v === null || v === undefined || v === '' ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v))
const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })   // YYYY-MM-DD in IST

function fields(e: AuditEntry): string[] {
  return Array.from(new Set([...Object.keys(e.before ?? {}), ...Object.keys(e.after ?? {})]))
}

function summary(e: AuditEntry): string {
  const f = fields(e)
  if (e.action === 'UPDATE' && f.length === 1) return `${human(f[0])}: ${show(e.before?.[f[0]])} → ${show(e.after?.[f[0]])}`
  if (e.action === 'UPDATE') return `${f.length} fields changed`
  // Failed or blocked: why. Signed in: how (password, Google, a code by email).
  if (e.action.startsWith('LOGIN')) return show((e.after ?? {})['reason'] ?? (e.after ?? {})['method'] ?? '')
  if (e.action.startsWith('GOOGLE_')) return show((e.after ?? {})['googleEmail'] ?? '')
  if (e.action === 'CREATE') return `${f.length} fields recorded`
  if (e.action === 'DELETE') return 'Record removed'
  return f.length ? `${f.length} details` : ''
}

export default function AuditLogPage() {
  const [filter, setFilter] = useState<AuditFilter>({ from: '', to: '', action: '', entityType: '', q: '' })
  const [page, setPage] = useState(0)
  const [open, setOpen] = useState<string | null>(null)
  const set = (k: keyof AuditFilter) => (e: any) => { setFilter(f => ({ ...f, [k]: e.target.value })); setPage(0) }

  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit-trail', filter, page],
    queryFn: () => auditApi.search(filter, page, 50),
  })
  const { data: types = [] } = useQuery({ queryKey: ['audit-trail-types'], queryFn: auditApi.types })
  const exporter = useMutation({
    mutationFn: () => auditApi.exportCsv(filter),
    onError: () => toast.error('Could not export the audit trail'),
  })

  const filtered = data?.content ?? []

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Audit Log</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Every change to your records — who made it, when, and what changed</p>
        </div>
        <button className="btn-secondary h-9 text-sm" onClick={() => exporter.mutate()} disabled={exporter.isPending}>
          <Download className="w-4 h-4" />{exporter.isPending ? 'Preparing…' : 'Export CSV'}
        </button>
      </div>

      <div className="card flex items-start gap-3" style={{ padding: '12px 16px' }}>
        <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--gold)' }} />
        <p className="text-xs" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Recorded automatically for every create, change and delete, and for sign-ins. Entries can&apos;t be edited or deleted, and
          recording can&apos;t be switched off — as Rule 3(1) of the Companies (Accounts) Rules, 2014 requires. Exports are recorded too.
        </p>
      </div>

      <div className="card grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', padding: '14px 16px' }}>
        <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>From
          <input type="date" className="input h-9 mt-1 block w-full" value={filter.from} max={filter.to || today()} onChange={set('from')} />
        </label>
        <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>To
          <input type="date" className="input h-9 mt-1 block w-full" value={filter.to} min={filter.from || undefined} max={today()} onChange={set('to')} />
        </label>
        <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Action
          <select className="input h-9 mt-1 block w-full" value={filter.action} onChange={set('action')}>
            <option value="">All actions</option>
            {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Record type
          <select className="input h-9 mt-1 block w-full" value={filter.entityType} onChange={set('entityType')}>
            <option value="">All records</option>
            {types.map(t => <option key={t} value={t}>{human(t)}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Search
          <input className="input h-9 mt-1 block w-full" placeholder="Invoice no., name or id" value={filter.q} onChange={set('q')} />
        </label>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading && <p className="text-sm p-6" style={{ color: 'var(--text-muted)' }}>Loading…</p>}
        {isError && <p className="text-sm p-6" style={{ color: '#ef4444' }}>Could not load the audit trail. Please refresh the page.</p>}
        {!isLoading && !isError && filtered.length === 0 && (
          <EmptyState icon={History} title="No entries" description="Nothing matches these filters yet. Changes appear here as soon as they're saved." compact />
        )}
        {filtered.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '760px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-hover)', textAlign: 'left' }}>
                  {['', 'When (IST)', 'Who', 'Action', 'Record', 'What changed'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => {
                  const meta = actionMeta(e.action)
                  const isOpen = open === e.id
                  return (
                    <Fragment key={e.id}>
                      <tr onClick={() => setOpen(isOpen ? null : e.id)} style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }}>
                        <td style={{ padding: '10px 6px 10px 12px', width: '24px', color: 'var(--text-muted)' }}>
                          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </td>
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{when(e.createdAt)}</td>
                        <td style={{ padding: '10px 12px' }}>{e.userName}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: meta.color, background: `${meta.color}1a`, padding: '3px 8px', borderRadius: '999px', whiteSpace: 'nowrap' }}>{meta.label}</span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{e.entityType ? human(e.entityType) : ''}</span>
                          {e.entityLabel && <span className="font-mono" style={{ marginLeft: '6px', color: 'var(--text-primary)' }}>{e.entityLabel}</span>}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', maxWidth: '360px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{summary(e)}</td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={6} style={{ padding: '0 16px 14px 42px', background: 'var(--bg-hover)' }}>
                            {fields(e).length > 0 ? (
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', marginTop: '6px' }}>
                                <thead><tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                                  <th style={{ padding: '6px 8px', width: '28%' }}>Field</th>
                                  {e.action !== 'CREATE' && <th style={{ padding: '6px 8px' }}>Before</th>}
                                  {e.action !== 'DELETE' && <th style={{ padding: '6px 8px' }}>After</th>}
                                </tr></thead>
                                <tbody>
                                  {fields(e).map(f => (
                                    <tr key={f} style={{ borderTop: '1px solid var(--border)' }}>
                                      <td style={{ padding: '6px 8px', color: 'var(--text-secondary)' }}>{human(f)}</td>
                                      {e.action !== 'CREATE' && <td style={{ padding: '6px 8px', fontFamily: 'var(--font-geist-mono), monospace', wordBreak: 'break-word' }}>{show(e.before?.[f])}</td>}
                                      {e.action !== 'DELETE' && <td style={{ padding: '6px 8px', fontFamily: 'var(--font-geist-mono), monospace', wordBreak: 'break-word' }}>{show(e.after?.[f])}</td>}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : <p className="text-xs pt-3" style={{ color: 'var(--text-muted)' }}>No field details.</p>}
                            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                              {e.ipAddress ? `IP ${e.ipAddress}` : 'No IP (system or background task)'}{e.userAgent ? ` · ${e.userAgent.slice(0, 90)}` : ''}{e.entityId ? ` · id ${e.entityId}` : ''}
                            </p>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {data && data.totalPages > 1 && (
        <Pagination currentPage={data.currentPage} totalPages={data.totalPages} totalElements={data.totalElements} pageSize={data.pageSize} onPageChange={setPage} />
      )}
    </div>
  )
}
