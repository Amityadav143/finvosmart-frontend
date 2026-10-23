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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, Copy, Globe, KeyRound, Plus, Power, Send, ShieldCheck, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { Modal } from '@/components/ui/Modal'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { timeAgo } from '@/lib/notifications'
import { apiError } from '@/lib/utils'
import { webhooksApi, webhookUrlProblem, type WebhookEndpoint } from '@/lib/api/webhooks'

const KEY = ['webhooks']
const BLANK = { url: '', eventType: '*', description: '' }
const err = (e: any, fallback: string) => apiError(e, fallback)

function statusOf(ep: WebhookEndpoint): { label: string; color: string; bg: string } {
  if (!ep.active) return ep.lastStatus === 'OFF'
    ? { label: 'Switched off after failures', color: '#B91C1C', bg: 'rgba(220,38,38,0.1)' }
    : { label: 'Off', color: 'var(--text-muted)', bg: 'rgba(107,114,128,0.12)' }
  if (ep.lastStatus === 'FAILED') return { label: 'Failing', color: '#C2410C', bg: 'rgba(234,88,12,0.12)' }
  if (ep.lastStatus === 'OK') return { label: 'Working', color: '#047857', bg: 'rgba(5,150,105,0.12)' }
  return { label: ep.lastFiredAt ? 'On — waiting for the next event' : 'Waiting for the first event', color: '#1D4ED8', bg: 'rgba(37,99,235,0.1)' }
}

/** One sentence on the last delivery: what happened, when, and why it failed. */
function lastDelivery(ep: WebhookEndpoint): { text: string; bad: boolean } {
  if (!ep.lastFiredAt) return { text: 'Nothing sent yet. Use “Send test” to check the address.', bad: false }
  if (ep.lastStatus === 'OK') return { text: `Last delivery succeeded ${timeAgo(ep.lastFiredAt)}.`, bad: false }
  if (!ep.lastStatus) return { text: 'Nothing sent since it was switched back on.' + (ep.lastError ? ` Before that: ${ep.lastError}` : ''), bad: false }
  return { text: `Last delivery failed ${timeAgo(ep.lastFiredAt)}: ${ep.lastError ?? 'no details'}`
    + (ep.active && ep.failureCount > 0 ? ` ${ep.failureCount} failed in a row — it switches off at 15.` : ''), bad: true }
}

export default function WebhooksPage() {
  const qc = useQueryClient()
  const { can } = usePermissions()
  const manage = can('SETTINGS_COMPANY')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ ...BLANK })
  const [touched, setTouched] = useState(false)
  const [secret, setSecret] = useState<{ url: string; value: string } | null>(null)
  const [removing, setRemoving] = useState<WebhookEndpoint | null>(null)

  const list = useQuery({ queryKey: KEY, queryFn: webhooksApi.list })
  const events = useQuery({ queryKey: [...KEY, 'events'], queryFn: webhooksApi.events, staleTime: 3600_000 })
  const endpoints = list.data ?? []
  const refresh = () => qc.invalidateQueries({ queryKey: KEY })

  const register = useMutation({
    mutationFn: () => webhooksApi.register({ url: form.url.trim(), eventType: form.eventType, description: form.description.trim() || undefined }),
    onSuccess: ep => {
      refresh(); setAdding(false); setForm({ ...BLANK }); setTouched(false)
      if (ep?.secret) setSecret({ url: ep.url, value: ep.secret })
      toast.success('Endpoint added — copy its signing secret now')
    },
    onError: (e: any) => toast.error(err(e, 'The endpoint could not be added')),
  })
  const test = useMutation({
    mutationFn: (id: string) => webhooksApi.test(id),
    onSuccess: r => { refresh(); r?.ok ? toast.success(r.message || 'Test delivered') : toast.error(r?.message || 'The test delivery failed') },
    onError: (e: any) => toast.error(err(e, 'The test could not be sent')),
  })
  const rotate = useMutation({
    mutationFn: (id: string) => webhooksApi.rotateSecret(id),
    onSuccess: ep => { refresh(); if (ep?.secret) setSecret({ url: ep.url, value: ep.secret }); toast.success('New secret created — the old one stops working now') },
    onError: (e: any) => toast.error(err(e, 'A new secret could not be created')),
  })
  const toggle = useMutation({
    mutationFn: (ep: WebhookEndpoint) => webhooksApi.setActive(ep.id, !ep.active),
    onSuccess: ep => { refresh(); toast.success(ep?.active ? 'Endpoint switched on' : 'Endpoint switched off') },
    onError: (e: any) => toast.error(err(e, 'The endpoint could not be changed')),
  })
  const remove = useMutation({
    mutationFn: (id: string) => webhooksApi.remove(id),
    onSuccess: () => { refresh(); setRemoving(null); toast.success('Endpoint removed') },
    onError: (e: any) => toast.error(err(e, 'The endpoint could not be removed')),
  })

  const urlProblem = webhookUrlProblem(form.url)
  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast.success('Copied') }
    catch { toast.error('Copy failed — select the text and copy it yourself') }
  }

  return (
    <PermissionGate anyOf={['SETTINGS_VIEW', 'SETTINGS_COMPANY']} showDenied>
      <div className="space-y-5" style={{ maxWidth: '820px' }}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="page-title">Webhooks</h1>
            <p className="page-subtitle">Send events to your own systems as they happen — signed, retried, and switched off if an endpoint keeps failing.</p>
          </div>
          {manage && (
            <button className="btn-primary h-9" onClick={() => setAdding(true)}>
              <Plus size={15} /> Add endpoint
            </button>
          )}
        </div>

        {secret && (
          <div className="card" role="status" style={{ border: '1px solid rgba(217,119,6,0.45)', background: 'rgba(217,119,6,0.07)' }}>
            <div className="flex items-start gap-3">
              <KeyRound size={18} style={{ color: '#B45309', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>Copy the signing secret now</p>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.55 }}>
                  For <code style={{ fontSize: '12px' }}>{secret.url}</code>. It is shown only this once; keep it with your server&apos;s settings to check each delivery&apos;s signature.
                </p>
                <div className="flex items-center gap-2" style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <code data-testid="webhook-secret" style={{ flex: 1, fontSize: '12.5px', fontFamily: 'monospace', color: 'var(--text-primary)', overflowWrap: 'anywhere' }}>{secret.value}</code>
                  <button className="btn-secondary h-8 text-xs" onClick={() => copy(secret.value)}><Copy size={13} /> Copy</button>
                </div>
                <button className="btn-ghost text-xs h-8 px-2 mt-2" onClick={() => setSecret(null)}>I&apos;ve saved it</button>
              </div>
            </div>
          </div>
        )}

        {list.isLoading && <div className="card" style={{ height: '96px', background: 'var(--bg-surface)', animation: 'pulse 1.5s ease-in-out infinite' }} />}
        {list.isError && <div className="card" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Webhooks couldn&apos;t be loaded. {err(list.error, '')}</div>}

        {!list.isLoading && !list.isError && endpoints.length === 0 && (
          <div className="card text-center" style={{ padding: '44px 24px' }}>
            <Globe size={30} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>No endpoints yet</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', maxWidth: '460px', margin: '0 auto 14px', lineHeight: 1.6 }}>
              Add an HTTPS address and Finvosmart will POST to it when an invoice is issued or paid, a payment comes in, a bill is recorded, a purchase order is approved, leave is decided or salaries are paid.
            </p>
            {manage && <button className="btn-primary h-9" onClick={() => setAdding(true)}><Plus size={15} /> Add endpoint</button>}
          </div>
        )}

        <div className="space-y-3">
          {endpoints.map(ep => {
            const st = statusOf(ep)
            return (
              <div key={ep.id} className="card" data-testid="webhook-endpoint">
                <div className="flex items-start gap-3">
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: st.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {ep.active && ep.lastStatus !== 'FAILED' ? <CheckCircle2 size={19} style={{ color: st.color }} /> : <AlertTriangle size={19} style={{ color: st.color }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: '4px' }}>
                      <code style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflowWrap: 'anywhere' }}>{ep.url}</code>
                      <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10.5px', fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      <span>Sends: <b style={{ color: 'var(--text-secondary)' }}>{ep.eventLabel}</b></span>
                      {ep.description && <span>{ep.description}</span>}
                      <span>Secret <code>{ep.secretHint}</code></span>
                    </div>
                    <p style={{ fontSize: '12px', margin: '6px 0 0', color: lastDelivery(ep).bad ? '#B91C1C' : 'var(--text-secondary)' }}>
                      {lastDelivery(ep).text}
                    </p>
                    {manage && (
                      <div className="flex flex-wrap gap-2" style={{ marginTop: '10px' }}>
                        <button className="btn-secondary h-8 text-xs" onClick={() => test.mutate(ep.id)} disabled={test.isPending && test.variables === ep.id}>
                          <Send size={12} /> {test.isPending && test.variables === ep.id ? 'Sending…' : 'Send test'}
                        </button>
                        <button className="btn-ghost h-8 text-xs" onClick={() => toggle.mutate(ep)} disabled={toggle.isPending}>
                          <Power size={12} /> {ep.active ? 'Switch off' : 'Switch on'}
                        </button>
                        <button className="btn-ghost h-8 text-xs" onClick={() => rotate.mutate(ep.id)} disabled={rotate.isPending}>
                          <KeyRound size={12} /> New secret
                        </button>
                        <button className="btn-ghost h-8 text-xs" style={{ color: '#B91C1C' }} onClick={() => setRemoving(ep)}>
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="card" style={{ background: 'var(--bg-surface)' }}>
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              <p style={{ fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>Checking that a delivery came from Finvosmart</p>
              Each POST carries <code>X-FINVO-Timestamp</code> and <code>X-FINVO-Signature: sha256=&lt;hex&gt;</code> — the HMAC-SHA256 of
              <code> timestamp.body</code> with your secret. Refuse anything older than five minutes. Failed deliveries are tried three times;
              the payload&apos;s <code>id</code> stays the same, so you can ignore repeats.{' '}
              <Link href="/developers#webhooks" style={{ color: 'var(--gold)', fontWeight: 600 }}>Code samples and the event list</Link>
            </div>
          </div>
        </div>
      </div>

      <Modal open={adding} onClose={() => setAdding(false)} title="Add a webhook endpoint" subtitle="Finvosmart will POST signed JSON to this address."
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-secondary h-10" onClick={() => setAdding(false)}>Cancel</button>
            <button className="btn-primary h-10" disabled={register.isPending || !!urlProblem} onClick={() => { setTouched(true); if (!urlProblem) register.mutate() }}>
              {register.isPending ? 'Adding…' : 'Add endpoint'}
            </button>
          </div>
        }>
        <div className="space-y-4">
          <div>
            <label className="label label-required" htmlFor="wh-url">Endpoint address</label>
            <input id="wh-url" className="input h-10 font-mono text-sm" placeholder="https://your-server.example/finvosmart" autoFocus
              value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} onBlur={() => setTouched(true)}
              aria-invalid={touched && !!urlProblem} />
            {touched && urlProblem && <p style={{ fontSize: '12px', color: '#B91C1C', marginTop: '4px' }}>{urlProblem}</p>}
          </div>
          <div>
            <label className="label label-required" htmlFor="wh-event">Send</label>
            <select id="wh-event" className="input h-10" value={form.eventType} onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))}>
              <option value="*">Every event</option>
              {(events.data ?? []).filter(ev => ev.type !== '*').map(ev => <option key={ev.type} value={ev.type}>{ev.type} — {ev.description}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="wh-desc">Note (optional)</label>
            <input id="wh-desc" className="input h-10" maxLength={200} placeholder="e.g. Tally sync, Slack #payments"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
        </div>
      </Modal>

      <Modal open={!!removing} onClose={() => setRemoving(null)} title="Remove this endpoint?" size="sm"
        subtitle={removing?.url}
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-secondary h-10" onClick={() => setRemoving(null)}>Keep it</button>
            <button className="btn-danger h-10" disabled={remove.isPending} onClick={() => removing && remove.mutate(removing.id)}>
              {remove.isPending ? 'Removing…' : 'Remove'}
            </button>
          </div>
        }>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
          Nothing more is sent to it. To pause deliveries instead, switch it off — it keeps its secret.
        </p>
      </Modal>
    </PermissionGate>
  )
}
