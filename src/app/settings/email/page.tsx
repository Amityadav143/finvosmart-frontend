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
import { emailSettingsApi, type EmailEventConfig } from '@/lib/api/emailSettings'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { SkeletonCard } from '@/components/ui/Skeleton'
import toast from 'react-hot-toast'
import { Mail, ChevronDown, Send, Settings2, Check } from 'lucide-react'

// Groups the events into sections for a cleaner admin experience
const GROUPS: { title: string; events: string[] }[] = [
  { title: 'Authentication & Account', events: ['WELCOME', 'PASSWORD_RESET', 'PASSWORD_CHANGED', 'OTP_LOGIN', 'NEW_DEVICE_LOGIN'] },
  { title: 'Invoicing & Finance',      events: ['INVOICE_CREATED', 'INVOICE_SENT', 'PAYMENT_RECEIVED', 'PAYMENT_REMINDER'] },
  { title: 'HR & Team',                events: ['EMPLOYEE_ONBOARDED', 'LEAVE_REQUESTED', 'LEAVE_APPROVED', 'LEAVE_REJECTED'] },
  { title: 'Subscription & Billing',   events: ['SUBSCRIPTION_RENEWAL', 'SUBSCRIPTION_EXPIRED'] },
]

export default function EmailSettingsPage() {
  const qc = useQueryClient()
  const { data: configs, isLoading } = useQuery({ queryKey: ['email-settings'], queryFn: emailSettingsApi.list })
  const [expanded, setExpanded] = useState<string | null>(null)

  const byEvent = (configs ?? []).reduce((acc: Record<string, EmailEventConfig>, c: EmailEventConfig) => { acc[c.event] = c; return acc }, {} as Record<string, EmailEventConfig>)

  const toggleMutation = useMutation({
    mutationFn: ({ event, enabled }: { event: string; enabled: boolean }) => emailSettingsApi.update(event, { enabled }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['email-settings'] }); toast.success('Email setting updated') },
    onError: () => toast.error('Could not update setting'),
  })

  return (
    <PermissionGate permission="SETTINGS_COMPANY">
      <div className="space-y-5">
        <div>
          <h1 className="page-title">Email Notifications</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Configure which events send emails, customise their content, and send test emails. Changes apply to your whole organisation.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4"><SkeletonCard lines={2} /><SkeletonCard lines={2} /></div>
        ) : (
          GROUPS.map(group => (
            <div key={group.title}>
              <h2 style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>{group.title}</h2>
              <div className="space-y-2.5" style={{ marginBottom: '28px' }}>
                {group.events.map(ev => {
                  const cfg = byEvent[ev]
                  if (!cfg) return null
                  return (
                    <EmailEventCard
                      key={ev}
                      config={cfg}
                      expanded={expanded === ev}
                      onToggleExpand={() => setExpanded(expanded === ev ? null : ev)}
                      onToggleEnabled={(enabled) => toggleMutation.mutate({ event: ev, enabled })}
                      onSaved={() => qc.invalidateQueries({ queryKey: ['email-settings'] })}
                    />
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </PermissionGate>
  )
}

/* ── Single event card with inline editor ────────────────────────────────── */
function EmailEventCard({ config, expanded, onToggleExpand, onToggleEnabled, onSaved }: {
  config: EmailEventConfig
  expanded: boolean
  onToggleExpand: () => void
  onToggleEnabled: (enabled: boolean) => void
  onSaved: () => void
  key?: any
}) {
  const [subject, setSubject] = useState(config.subjectOverride ?? '')
  const [intro, setIntro] = useState(config.customIntro ?? '')
  const [cc, setCc] = useState(config.ccRecipients ?? '')
  const [testEmail, setTestEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await emailSettingsApi.update(config.event, {
        subjectOverride: subject || null,
        customIntro: intro || null,
        ccRecipients: cc || null,
      })
      toast.success('Saved')
      onSaved()
    } catch { toast.error('Could not save') }
    finally { setSaving(false) }
  }

  const sendTest = async () => {
    if (!testEmail.trim()) { toast.error('Enter a test recipient email'); return }
    setSending(true)
    try {
      await emailSettingsApi.sendTest(config.event, testEmail)
      toast.success(`Test email sent to ${testEmail}`)
    } catch { toast.error('Could not send test email') }
    finally { setSending(false) }
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', opacity: config.enabled ? 1 : 0.7 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 18px' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--gold-muted)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Mail size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-primary)' }}>{config.label}</div>
          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {config.subjectOverride || config.defaultSubject}
            {config.customised && <span style={{ marginLeft: '8px', color: 'var(--gold)', fontSize: '11px' }}>· customised</span>}
          </div>
        </div>
        {/* Toggle switch */}
        <button
          onClick={() => onToggleEnabled(!config.enabled)}
          aria-label={config.enabled ? 'Disable this email' : 'Enable this email'}
          style={{ width: '42px', height: '24px', borderRadius: '100px', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, background: config.enabled ? 'var(--btn-primary-bg)' : 'var(--bg-input)', transition: 'background 0.2s' }}>
          <span style={{ position: 'absolute', top: '3px', left: config.enabled ? '21px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </button>
        <button onClick={onToggleExpand} aria-label="Edit email settings" className="btn-icon" style={{ flexShrink: 0 }}>
          <ChevronDown size={17} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--text-muted)' }} />
        </button>
      </div>

      {expanded && (
        <div style={{ padding: '4px 18px 20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ marginTop: '16px', marginBottom: '14px' }}>
            <label className="label">Subject line</label>
            <input className="input" value={subject} onChange={(e: any) => setSubject(e.target.value)} placeholder={config.defaultSubject} />
            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>Leave blank to use the default subject.</p>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label className="label">Custom intro message (optional)</label>
            <textarea className="input" value={intro} onChange={(e: any) => setIntro(e.target.value)} rows={2}
              placeholder="Add a sentence shown at the top of this email…" style={{ resize: 'vertical', minHeight: '60px' }} />
          </div>
          <div style={{ marginBottom: '18px' }}>
            <label className="label">CC recipients (optional)</label>
            <input className="input" value={cc} onChange={(e: any) => setCc(e.target.value)} placeholder="finance@company.com, hr@company.com" />
            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>Comma-separated. These addresses are copied on every email for this event.</p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <button onClick={save} disabled={saving} aria-label="Save email settings" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
              <Check size={15} /> {saving ? 'Saving…' : 'Save changes'}
            </button>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input className="input" value={testEmail} onChange={(e: any) => setTestEmail(e.target.value)} placeholder="test@email.com" style={{ width: '180px', height: '38px' }} />
              <button onClick={sendTest} disabled={sending} aria-label="Send test email" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', height: '38px' }}>
                <Send size={14} /> {sending ? 'Sending…' : 'Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
