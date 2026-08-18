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
import { Plus, Globe, Trash2, Copy, Shield, CheckCircle2, AlertTriangle, Code } from 'lucide-react'
import toast from 'react-hot-toast'

interface WebhookEndpoint {
  id: string; url: string; eventType: string; description?: string
  isActive: boolean; lastFiredAt?: string; failureCount: number; secret: string
}

const EVENTS = [
  { value: '*',                    label: 'All Events (wildcard)' },
  { value: 'invoice.created',      label: 'Invoice Created' },
  { value: 'invoice.paid',         label: 'Invoice Paid' },
  { value: 'invoice.overdue',      label: 'Invoice Overdue' },
  { value: 'leave.approved',       label: 'Leave Approved' },
  { value: 'leave.rejected',       label: 'Leave Rejected' },
  { value: 'po.approved',          label: 'PO Approved' },
  { value: 'po.received',          label: 'GRN / PO Received' },
  { value: 'payment.received',     label: 'Payment Received' },
  { value: 'employee.created',     label: 'Employee Created' },
  { value: 'payroll.processed',    label: 'Payroll Processed' },
  { value: 'application.stage_changed', label: 'Recruitment Stage Changed' },
  { value: 'review.completed',     label: 'Performance Review Completed' },
]

const BLANK = { url: '', eventType: '*', description: '' }

export default function WebhooksPage() {
  const qc = useQueryClient()
  const [showNew, setShowNew] = useState(false)
  const [form, setForm]       = useState({ ...BLANK })
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})

  const { data: endpoints = [] } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => api.get('/webhooks').then(r => r.data.data ?? []),
  })

  const create = useMutation({
    mutationFn: (d: typeof form) => api.post('/webhooks', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['webhooks'] })
      setShowNew(false); setForm({ ...BLANK })
      toast.success('Webhook endpoint registered')
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Registration failed'),
  })

  const deactivate = useMutation({
    mutationFn: (id: string) => api.delete(`/webhooks/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['webhooks'] }); toast.success('Webhook deactivated') },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Could not deactivate webhook'),
  })

  const copySecret = (ep: WebhookEndpoint) => {
    navigator.clipboard.writeText(ep.secret)
    toast.success('Secret copied to clipboard')
  }

  const samplePayload = `{
  "event": "invoice.paid",
  "timestamp": "2026-04-19T08:30:00Z",
  "company": "company-uuid",
  "data": {
    "invoiceNumber": "INV/2026/000042",
    "customerName": "Acme Corp",
    "totalAmount": 150000,
    "paidAt": "2026-04-19T08:28:00Z"
  }
}`

  return (
    <PermissionGate permission="SETTINGS_VIEW" showDenied>
      <div className="space-y-5" style={{ maxWidth: '760px' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Webhooks</h1>
            <p className="page-subtitle">Register endpoints to receive real-time event notifications from FINVOSMART</p>
          </div>
          <PermissionGate permission="SETTINGS_COMPANY">
            <button className="btn-primary h-9" onClick={() => setShowNew(true)}>
              <Plus size={15} /> Register Endpoint
            </button>
          </PermissionGate>
        </div>

        {/* How it works */}
        <div className="card" style={{ background: 'var(--bg-surface)' }}>
          <div className="flex items-start gap-3 mb-3">
            <Shield size={18} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>HMAC-SHA256 Signed Payloads</p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Every webhook POST includes an <code style={{ background: 'var(--bg-hover)', padding: '1px 5px', borderRadius: '4px', fontSize: '11px' }}>X-FINVO-Signature: sha256=&lt;hex&gt;</code> header.
                Verify it on your server to confirm the payload is from FINVOSMART.
              </p>
            </div>
          </div>
          <div style={{ borderRadius: '10px', background: 'var(--bg-hover)', padding: '12px 14px', marginTop: '10px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sample Payload</p>
            <pre style={{ fontSize: '11px', color: 'var(--text-primary)', margin: 0, fontFamily: 'monospace', lineHeight: 1.6, overflow: 'auto' }}>{samplePayload}</pre>
          </div>
        </div>

        {/* Registered endpoints */}
        {(endpoints as WebhookEndpoint[]).length === 0 && !showNew ? (
          <div className="card text-center" style={{ padding: '48px' }}>
            <Globe size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>No webhook endpoints registered yet</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Register an endpoint to start receiving real-time events from FINVOSMART</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(endpoints as WebhookEndpoint[]).map(ep => (
              <div key={ep.id} className="card">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: ep.isActive ? 'rgba(5,150,105,0.1)' : 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {ep.isActive
                      ? <CheckCircle2 size={20} style={{ color: '#059669' }} />
                      : <AlertTriangle size={20} style={{ color: 'var(--text-muted)' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <code style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>
                        {ep.url}
                      </code>
                      <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: ep.isActive ? 'rgba(5,150,105,0.1)' : 'rgba(107,114,128,0.1)', color: ep.isActive ? '#059669' : 'var(--text-muted)', flexShrink: 0 }}>
                        {ep.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                      <span>Event: <b style={{ color: 'var(--text-secondary)' }}>{ep.eventType}</b></span>
                      {ep.description && <span>· {ep.description}</span>}
                      {ep.lastFiredAt && <span>· Last fired: {ep.lastFiredAt}</span>}
                      {ep.failureCount > 0 && <span style={{ color: '#DC2626' }}>· {ep.failureCount} failures</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                      <Shield size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <code style={{ fontSize: '12px', color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                        {revealed[ep.id] ? ep.secret : '•'.repeat(32)}
                      </code>
                      <button className="btn-ghost text-xs h-7 px-2" onClick={() => setRevealed(r => ({ ...r, [ep.id]: !r[ep.id] }))}>
                        {revealed[ep.id] ? 'Hide' : 'Reveal'}
                      </button>
                      <button className="btn-ghost text-xs h-7 px-2" onClick={() => copySecret(ep)}>
                        <Copy size={12} /> Copy
                      </button>
                    </div>
                  </div>
                  <PermissionGate permission="SETTINGS_COMPANY">
                    <button className="btn-danger h-8 text-xs" style={{ flexShrink: 0, marginTop: '4px' }}
                      onClick={() => deactivate.mutate(ep.id)}>
                      <Trash2 size={13} /> Deactivate
                    </button>
                  </PermissionGate>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Register new endpoint */}
        {showNew && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
            onClick={() => setShowNew(false)}>
            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '520px' }} onClick={(e: any) => e.stopPropagation()}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>Register Webhook Endpoint</h2>
              <div className="space-y-4">
                <div>
                  <label className="label label-required">Endpoint URL</label>
                  <input className="input h-10 font-mono text-sm" placeholder="https://your-server.com/webhooks/finvo"
                    value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
                </div>
                <div>
                  <label className="label label-required">Event to listen for</label>
                  <select className="input h-10" value={form.eventType} onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))}>
                    {EVENTS.map(ev => <option key={ev.value} value={ev.value}>{ev.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Description (optional)</label>
                  <input className="input h-10" placeholder="e.g. Slack notification for paid invoices"
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.18)' }}>
                  <p style={{ fontSize: '12px', color: '#2563EB', margin: 0 }}>
                    A signing secret will be auto-generated and shown after registration. Use it to verify webhook authenticity on your server.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button className="btn-secondary h-10" onClick={() => setShowNew(false)}>Cancel</button>
                <button className="btn-primary h-10" onClick={() => create.mutate(form)}
                  disabled={!form.url || create.isPending}>
                  {create.isPending ? 'Registering...' : 'Register Endpoint'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGate>
  )
}
