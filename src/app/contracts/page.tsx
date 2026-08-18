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
import {
  Plus, FileText, AlertTriangle, CheckCircle2, Clock,
  RefreshCw, Search, Calendar, ChevronRight, X
} from 'lucide-react'
import toast from 'react-hot-toast'

type ContractStatus = 'DRAFT' | 'UNDER_REVIEW' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'RENEWED'
type ContractType = 'SERVICE_AGREEMENT' | 'MAINTENANCE_AMC' | 'PURCHASE_AGREEMENT' |
                    'EMPLOYMENT' | 'NDA' | 'LEASE' | 'FRANCHISE' | 'PARTNERSHIP' | 'LOAN' | 'OTHER'

interface Contract {
  id: string; contractNumber: string; title: string; type: ContractType
  status: ContractStatus; partyName: string; partyType: string
  startDate: string; endDate?: string; contractValue?: number; currency: string
  renewalReminderDays: number; autoRenew: boolean; description?: string
}

const STATUS_META: Record<ContractStatus, { label: string; color: string; bg: string; icon: any }> = {
  DRAFT:        { label: 'Draft',        color: '#6B7280', bg: 'rgba(107,114,128,0.1)', icon: FileText    },
  UNDER_REVIEW: { label: 'Under Review', color: '#2563EB', bg: 'rgba(37,99,235,0.1)',   icon: Clock       },
  ACTIVE:       { label: 'Active',       color: '#059669', bg: 'rgba(5,150,105,0.1)',   icon: CheckCircle2},
  EXPIRED:      { label: 'Expired',      color: '#DC2626', bg: 'rgba(220,38,38,0.1)',   icon: AlertTriangle},
  TERMINATED:   { label: 'Terminated',   color: '#DC2626', bg: 'rgba(220,38,38,0.08)', icon: X           },
  RENEWED:      { label: 'Renewed',      color: '#7C3AED', bg: 'rgba(124,58,237,0.1)', icon: RefreshCw   },
}

const CONTRACT_TYPES: ContractType[] = [
  'SERVICE_AGREEMENT','MAINTENANCE_AMC','PURCHASE_AGREEMENT',
  'EMPLOYMENT','NDA','LEASE','FRANCHISE','PARTNERSHIP','LOAN','OTHER'
]

const BLANK_FORM = {
  title: '', type: 'SERVICE_AGREEMENT' as ContractType, partyName: '', partyType: 'CUSTOMER',
  startDate: new Date().toISOString().split('T')[0], endDate: '', contractValue: '',
  currency: 'INR', renewalReminderDays: 60, autoRenew: false, description: ''
}

export default function ContractsPage() {
  const qc = useQueryClient()
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatus] = useState<ContractStatus | ''>('')
  const [showNew, setShowNew]     = useState(false)
  const [renewId, setRenewId]     = useState<string | null>(null)
  const [renewDate, setRenewDate] = useState('')
  const [form, setForm]           = useState({ ...BLANK_FORM })

  const { data, isLoading } = useQuery({
    queryKey: ['contracts', statusFilter, search],
    queryFn: () => api.get('/contracts', {
      params: { status: statusFilter || undefined, q: search || undefined, size: 30 }
    }).then(r => r.data.data?.content ?? []),
  })

  const { data: expiring } = useQuery({
    queryKey: ['contracts-expiring'],
    queryFn: () => api.get('/contracts/expiring-soon').then(r => r.data.data ?? []),
  })

  const createMutation = useMutation({
    mutationFn: (d: typeof form) => api.post('/contracts', {
      ...d, contractValue: d.contractValue ? Number(d.contractValue) : null,
      endDate: d.endDate || null
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] })
      setShowNew(false); setForm({ ...BLANK_FORM })
      toast.success('Contract created')
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to create contract'),
  })

  const activateMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/contracts/${id}/activate`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contracts'] }); toast.success('Contract activated') },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Could not activate contract'),
  })

  const terminateMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch(`/contracts/${id}/terminate`, { reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contracts'] }); toast.success('Contract terminated') },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Could not terminate contract'),
  })

  const renewMutation = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) =>
      api.post(`/contracts/${id}/renew`, { newEndDate: date }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] }); qc.invalidateQueries({ queryKey: ['contracts-expiring'] })
      setRenewId(null); toast.success('Contract renewed — new draft created')
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Could not renew contract'),
  })

  const contracts = data as Contract[] ?? []
  const expiringList = expiring as Contract[] ?? []

  const fmtCurrency = (v?: number, cur = 'INR') =>
    v ? `${cur} ${v.toLocaleString('en-IN')}` : '—'

  const daysUntil = (dateStr?: string) => {
    if (!dateStr) return null
    const d = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
    return d
  }

  return (
    <PermissionGate permission="SETTINGS_VIEW" showDenied>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="page-title">Contract Management</h1>
            <p className="page-subtitle">Track service agreements, AMC, vendor contracts, and renewal alerts</p>
          </div>
          <PermissionGate permission="SETTINGS_COMPANY">
            <button className="btn-primary h-9" onClick={() => setShowNew(true)}>
              <Plus size={15} /> New Contract
            </button>
          </PermissionGate>
        </div>

        {/* Expiry alerts */}
        {expiringList.length > 0 && (
          <div style={{ padding: '14px 18px', borderRadius: '12px', background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <AlertTriangle size={16} style={{ color: '#DC2626' }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#DC2626' }}>
                {expiringList.length} contract{expiringList.length > 1 ? 's' : ''} expiring within 60 days
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {expiringList.map(c => {
                const d = daysUntil(c.endDate)
                return (
                  <div key={c.id} style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#DC2626' }}>{c.partyName}</span>
                    <span style={{ fontSize: '11px', color: '#DC2626' }}>— {c.title}</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#DC2626' }}>({d !== null ? (d <= 0 ? 'EXPIRED' : `${d}d`) : ''})</span>
                    <button className="btn-ghost text-xs h-6 px-2" style={{ color: '#059669' }}
                      onClick={() => { setRenewId(c.id); setRenewDate('') }}>
                      Renew
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input h-10" style={{ paddingLeft: '34px' }} placeholder="Search by title or party..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input h-10" style={{ width: '160px' }} value={statusFilter}
            onChange={e => setStatus(e.target.value as ContractStatus | '')}>
            <option value="">All statuses</option>
            {Object.keys(STATUS_META).map(s => (
              <option key={s} value={s}>{STATUS_META[s as ContractStatus].label}</option>
            ))}
          </select>
        </div>

        {/* Summary chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {Object.entries(STATUS_META).map(([st, meta]) => {
            const count = contracts.filter(c => c.status === st).length
            if (!count) return null
            const Icon = meta.icon
            return (
              <button key={st} onClick={() => setStatus(s => s === st ? '' : st as ContractStatus)}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '20px',
                  border: `1.5px solid ${statusFilter === st ? meta.color : 'var(--border)'}`,
                  background: statusFilter === st ? meta.bg : 'var(--bg-card)',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600, color: meta.color }}>
                <Icon size={12} />{meta.label} ({count})
              </button>
            )
          })}
        </div>

        {/* Contract cards */}
        <div className="space-y-3">
          {isLoading && <div className="card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Loading contracts...</div>}
          {!isLoading && contracts.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <FileText size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No contracts found. Create your first contract.</p>
            </div>
          )}
          {contracts.map(contract => {
            const meta = STATUS_META[contract.status]
            const Icon = meta.icon
            const days = daysUntil(contract.endDate)
            return (
              <div key={contract.id} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} style={{ color: meta.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{contract.title}</span>
                    <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: meta.bg, color: meta.color }}>{meta.label}</span>
                    {contract.autoRenew && <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: 'rgba(5,150,105,0.1)', color: '#059669' }}>Auto-renew</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span><b style={{ color: 'var(--text-secondary)' }}>{contract.partyName}</b> · {contract.partyType}</span>
                    <span><Calendar size={11} style={{ display: 'inline', marginRight: '3px' }} />
                      {contract.startDate}{contract.endDate ? ` → ${contract.endDate}` : ''}
                    </span>
                    {contract.contractValue && <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{fmtCurrency(contract.contractValue, contract.currency)}</span>}
                    {days !== null && days <= 60 && days > 0 && (
                      <span style={{ color: days <= 30 ? '#DC2626' : '#D97706', fontWeight: 700 }}>⚠ Expires in {days} days</span>
                    )}
                    {days !== null && days <= 0 && contract.status === 'ACTIVE' && (
                      <span style={{ color: '#DC2626', fontWeight: 700 }}>⚠ EXPIRED</span>
                    )}
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '3px 0 0', fontFamily: 'monospace' }}>{contract.contractNumber}</p>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {contract.status === 'DRAFT' && (
                    <button className="btn-primary h-8 text-xs" onClick={() => activateMutation.mutate(contract.id)}>
                      Activate
                    </button>
                  )}
                  {contract.status === 'ACTIVE' && (
                    <>
                      <button className="btn-secondary h-8 text-xs" onClick={() => { setRenewId(contract.id); setRenewDate('') }}>
                        <RefreshCw size={12} /> Renew
                      </button>
                      <button className="btn-danger h-8 text-xs"
                        onClick={() => { if (confirm('Terminate this contract?')) terminateMutation.mutate({ id: contract.id, reason: 'Terminated by user' }) }}>
                        Terminate
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* New contract modal */}
        {showNew && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', overflowY: 'auto' }}
            onClick={() => setShowNew(false)}>
            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e: any) => e.stopPropagation()}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>Create Contract</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="label label-required">Contract Title</label>
                  <input className="input h-10" placeholder="e.g. Annual Maintenance Contract — TATA Steel"
                    value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Contract Type</label>
                  <select className="input h-10" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ContractType }))}>
                    {CONTRACT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Party Type</label>
                  <select className="input h-10" value={form.partyType} onChange={e => setForm(f => ({ ...f, partyType: e.target.value }))}>
                    {['CUSTOMER','VENDOR','EMPLOYEE','OTHER'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="label label-required">Party / Company Name</label>
                  <input className="input h-10" placeholder="e.g. TATA Steel Ltd."
                    value={form.partyName} onChange={e => setForm(f => ({ ...f, partyName: e.target.value }))} />
                </div>
                <div>
                  <label className="label label-required">Start Date</label>
                  <input type="date" className="input h-10" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input type="date" className="input h-10" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Contract Value</label>
                  <input type="number" className="input h-10" placeholder="0.00" value={form.contractValue}
                    onChange={e => setForm(f => ({ ...f, contractValue: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Renewal Reminder (days before)</label>
                  <input type="number" className="input h-10" value={form.renewalReminderDays}
                    onChange={e => setForm(f => ({ ...f, renewalReminderDays: Number(e.target.value) }))} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="label">Description / Key Terms</label>
                  <textarea className="input" rows={3} value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <label style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.autoRenew} onChange={e => setForm(f => ({ ...f, autoRenew: e.target.checked }))} />
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Auto-renew on expiry</span>
                </label>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button className="btn-secondary h-10" onClick={() => setShowNew(false)}>Cancel</button>
                <button className="btn-primary h-10" disabled={!form.title || !form.partyName || createMutation.isPending}
                  onClick={() => createMutation.mutate(form)}>
                  {createMutation.isPending ? 'Creating...' : 'Create Contract'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Renew modal */}
        {renewId && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
            onClick={() => setRenewId(null)}>
            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '400px' }} onClick={(e: any) => e.stopPropagation()}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Renew Contract</h2>
              <div>
                <label className="label label-required">New End Date</label>
                <input type="date" className="input h-10" value={renewDate} onChange={e => setRenewDate(e.target.value)} />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px' }}>
                A new draft contract will be created starting from the current end date. The existing contract will be marked as "Renewed".
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button className="btn-secondary h-10" onClick={() => setRenewId(null)}>Cancel</button>
                <button className="btn-primary h-10" disabled={!renewDate || renewMutation.isPending}
                  onClick={() => renewMutation.mutate({ id: renewId, date: renewDate })}>
                  {renewMutation.isPending ? 'Renewing...' : <><RefreshCw size={14} /> Renew</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGate>
  )
}
