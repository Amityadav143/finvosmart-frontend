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

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { AlertTriangle, CheckCircle2, Copy, PlugZap, Save, Send } from 'lucide-react'
import { platformApi, moment, type PlatformGroup, type PlatformSetting, type PlatformSettingsView } from '@/lib/api/platform'
import { useAuthStore } from '@/lib/store/slices/authStore'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { apiError } from '@/lib/apiError'

const CHOICE_LABELS: Record<string, string> = {
  STARTTLS: 'STARTTLS (port 587)', SSL: 'SSL/TLS (port 465)', NONE: 'None — a mail server on your own network only',
  INFO: 'Information (blue)', WARNING: 'Warning (amber)',
}
const NOT_CHOSEN: Record<string, string> = {
  'mail.security': 'Automatic: SSL/TLS on port 465, STARTTLS on any other',
  'notice.tone': 'Information (the default)',
}

/** What the box shows to start with: what is saved here (never a secret — its box starts empty). */
const initial = (s: PlatformSetting) => (s.secret || !s.savedHere ? '' : s.saved ?? '')

/** The save button of each tab (names like Google, WhatsApp and SMTP keep their capitals). */
const SAVE_LABELS: Record<string, string> = {
  contact: 'Save contact details',
  email: 'Save the email server',
  payments: 'Save the payment gateway',
  signin: 'Save Google sign-in',
  whatsapp: 'Save WhatsApp Business',
  access: 'Save sign-ups and notices',
}

/**
 * The settings for all of Finvosmart, group by group: what is in force and where it comes from (saved here, the
 * server's environment, the built-in default). Saving checks every value first; an empty box means "nothing saved
 * here" — the environment's value applies again. Secrets never come back to the browser: their boxes start empty,
 * and typing replaces them. The email server, the Razorpay keys and WhatsApp can be tried before saving.
 */
export default function PlatformSettingsPage() {
  const qc = useQueryClient()
  const me = useAuthStore(s => s.user?.email ?? '')
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['platform', 'settings'], queryFn: platformApi.settings })
  const [tab, setTab] = useState('contact')
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [clear, setClear] = useState<string[]>([])
  const [problem, setProblem] = useState('')

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab')
    if (t) setTab(t)
  }, [])

  const group = data?.groups.find(g => g.id === tab) ?? data?.groups[0]
  const valueOf = (s: PlatformSetting) => draft[s.key] ?? initial(s)
  const changed = (g: PlatformGroup) => g.settings.some(s => (s.key in draft && draft[s.key] !== initial(s)) || clear.includes(s.key))

  /** What a tab sends: every box (empty = nothing saved here), secrets only when typed. */
  const valuesOf = (g: PlatformGroup) => {
    const out: Record<string, string> = {}
    for (const s of g.settings) {
      const v = valueOf(s)
      if (s.secret) { if (v.trim()) out[s.key] = v }
      else out[s.key] = v
    }
    return out
  }

  const save = useMutation({
    mutationFn: (g: PlatformGroup) => platformApi.saveSettings(valuesOf(g), clear.filter(k => g.settings.some(s => s.key === k))),
    onSuccess: (view: PlatformSettingsView, g) => {
      qc.setQueryData(['platform', 'settings'], view)
      setDraft(d => Object.fromEntries(Object.entries(d).filter(([k]) => !g.settings.some(s => s.key === k))))
      setClear(c => c.filter(k => !g.settings.some(s => s.key === k)))
      setProblem('')
      qc.invalidateQueries({ queryKey: ['platform', 'overview'] })
      qc.invalidateQueries({ queryKey: ['platform-info'] })
      toast.success(`${g.label}: saved`)
    },
    onError: (e: unknown) => setProblem(apiError(e, 'The settings could not be saved.')),
  })

  if (isLoading) return <div className="space-y-4"><SkeletonCard lines={3} /><SkeletonCard lines={6} /></div>
  if (isError || !data || !group) return <div className="card text-sm" role="alert" style={{ color: '#dc2626' }}>{apiError(error, 'The platform settings could not be loaded.')}</div>

  return (
    <div className="space-y-5" data-testid="platform-settings">
      <div>
        <h1 className="page-title">Platform settings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          For all of Finvosmart. A value saved here comes before the server&apos;s environment (MAIL_HOST, RAZORPAY_KEY_ID…); leave a box empty to use
          the environment&apos;s value. Changes apply within a minute, without restarting the server.
        </p>
      </div>

      {!data.setup.encryptionReady && (
        <div role="status" className="rounded-xl px-4 py-3 text-sm flex gap-2" data-testid="no-encryption-key"
          style={{ background: 'rgba(217,119,6,0.10)', border: '1px solid rgba(217,119,6,0.35)', color: 'var(--text-primary)' }}>
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#b45309' }} aria-hidden />
          <span>APP_ENCRYPTION_KEY isn&apos;t set on the server, so secrets (the SMTP password, Razorpay and WhatsApp secrets) can&apos;t be kept here —
            they keep coming from the server&apos;s environment. Everything else saves as usual. To keep secrets here: <code>openssl rand -base64 32</code> into
            APP_ENCRYPTION_KEY, then restart the backend.</span>
        </div>
      )}

      <div role="tablist" aria-label="Settings" className="flex flex-wrap gap-1" style={{ borderBottom: '1px solid var(--border)' }}>
        {data.groups.map(g => (
          <button key={g.id} role="tab" type="button" aria-selected={group.id === g.id} data-group={g.id} onClick={() => { setTab(g.id); setProblem('') }}
            style={{
              padding: '8px 14px', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer',
              color: group.id === g.id ? 'var(--gold)' : 'var(--text-muted)',
              borderBottom: group.id === g.id ? '2px solid var(--gold)' : '2px solid transparent',
            }}>
            {g.label}{changed(g) && <span aria-label="unsaved changes" style={{ color: 'var(--gold)' }}> •</span>}
          </button>
        ))}
      </div>

      <section className="card space-y-5" role="tabpanel" aria-label={group.label} data-testid={`group-${group.id}`}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{group.description}</p>

        <div className="grid gap-x-6 gap-y-5 lg:grid-cols-2">
          {group.settings.map(s => (
            <Field key={s.key} s={s} value={valueOf(s)} encryption={data.setup.encryptionReady} removing={clear.includes(s.key)}
              onChange={v => setDraft(d => ({ ...d, [s.key]: v }))}
              onRemove={() => setClear(c => c.includes(s.key) ? c.filter(k => k !== s.key) : [...c, s.key])} />
          ))}
        </div>

        {group.id === 'payments' && <WebhookBox url={data.webhookUrl} />}
        {group.id === 'email' && <TestEmail me={me} values={valuesOf(group)} />}
        {group.id === 'payments' && <TestButton label="Check the keys with Razorpay" testId="test-razorpay" run={() => platformApi.testRazorpay(valuesOf(group))}
          note="Razorpay is asked whether it accepts the key ID and secret as typed above (saved or not). Nothing is charged." />}
        {group.id === 'whatsapp' && <TestButton label="Check the connection" testId="test-whatsapp" run={() => platformApi.testWhatsApp(valuesOf(group))}
          note="WhatsApp is asked which number the phone number ID and token above are for. No message is sent." />}

        {problem && <p role="alert" className="text-sm" style={{ color: '#dc2626' }} data-testid="settings-error">{problem}</p>}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          {changed(group) && <button type="button" className="btn-ghost h-9 px-3 text-sm" data-action="discard"
            onClick={() => { setDraft(d => Object.fromEntries(Object.entries(d).filter(([k]) => !group.settings.some(s => s.key === k)))); setClear(c => c.filter(k => !group.settings.some(s => s.key === k))); setProblem('') }}>
            Discard changes</button>}
          <button type="button" className="btn-primary h-9 px-4" disabled={save.isPending || !changed(group)} onClick={() => save.mutate(group)} data-action="save">
            <Save size={14} /> {save.isPending ? 'Saving…' : SAVE_LABELS[group.id] ?? 'Save'}
          </button>
        </div>
      </section>
    </div>
  )
}

/** One setting: its box, and where the value in force comes from. */
function Field({ s, value, encryption, removing, onChange, onRemove }: {
  s: PlatformSetting; value: string; encryption: boolean; removing: boolean; onChange: (v: string) => void; onRemove: () => void
}) {
  const id = `ps-${s.key.replace(/\./g, '-')}`
  const inForce = s.value ?? s.defaultValue ?? ''
  const common = { id, 'data-setting': s.key, 'aria-describedby': `${id}-source` } as const
  let box: React.ReactNode
  if (s.kind === 'SWITCH') {
    const on = (value === '' ? (s.value ?? s.defaultValue ?? 'true') : value) === 'true'
    box = (
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" {...common} checked={on} onChange={e => onChange(e.target.checked ? 'true' : 'false')} />
        {on ? 'On' : 'Off'}
      </label>
    )
  } else if (s.kind === 'CHOICE') {
    box = (
      <select className="input" {...common} value={value} onChange={e => onChange(e.target.value)}>
        <option value="">{NOT_CHOSEN[s.key] ?? 'Not chosen'}</option>
        {s.choices.map(c => <option key={c} value={c}>{CHOICE_LABELS[c] ?? c}</option>)}
      </select>
    )
  } else if (s.kind === 'LONG_TEXT') {
    box = <textarea className="input" rows={3} maxLength={s.max} {...common} value={value} onChange={e => onChange(e.target.value)} placeholder={s.savedHere ? '' : inForce} />
  } else if (s.kind === 'SECRET') {
    box = (
      <input className="input" type="password" autoComplete="new-password" maxLength={s.max} {...common} value={value} onChange={e => onChange(e.target.value)}
        disabled={!encryption} placeholder={!encryption ? 'Needs APP_ENCRYPTION_KEY on the server' : s.value ? 'Type a new one to replace it' : 'Not set'} />
    )
  } else {
    const type = s.kind === 'EMAIL' ? 'email' : s.kind === 'PHONE' ? 'tel' : s.kind === 'DATE' ? 'date' : s.kind === 'PORT' ? 'number' : 'text'
    box = <input className="input" type={type} maxLength={s.max} {...common} value={value} onChange={e => onChange(e.target.value)} placeholder={s.savedHere ? '' : inForce} />
  }
  return (
    <div className={s.kind === 'LONG_TEXT' || s.key === 'notice.text' || s.key === 'signups.closedMessage' ? 'lg:col-span-2' : ''} data-field={s.key} data-source={s.source}>
      <label className="label" htmlFor={id}>{s.label}{s.shownOnWebsite && <span className="ml-1 font-normal" style={{ color: 'var(--text-muted)' }}>· public</span>}</label>
      {box}
      <p id={`${id}-source`} className="text-xs mt-1" style={{ color: 'var(--text-muted)' }} data-testid="setting-source">
        <Source s={s} />
        {s.secret && s.savedHere && !s.unreadable && (
          <button type="button" className="ml-2 underline" style={{ background: 'none', border: 'none', color: removing ? '#b91c1c' : 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}
            onClick={onRemove} data-action="remove-secret">{removing ? 'Will be removed — undo' : 'Remove the saved one'}</button>
        )}
      </p>
      {s.hint && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.hint}</p>}
    </div>
  )
}

/** Where the value in force comes from, in words. */
function Source({ s }: { s: PlatformSetting }) {
  const by = s.updatedBy ? ` by ${s.updatedBy}` : ''
  const when = s.updatedAt ? ` on ${moment(s.updatedAt)}` : ''
  if (s.unreadable) return <span style={{ color: '#b45309' }}>Saved with another encryption key, so it can&apos;t be read — type it again{s.environment ? `; meanwhile the server's environment (${s.envVar}) applies` : ''}.</span>
  if (s.secret) {
    if (s.source === 'SAVED') return <>Saved here: {s.saved}{by}{when}{s.environment ? ` (instead of ${s.envVar} in the server's environment)` : ''}.</>
    if (s.source === 'ENVIRONMENT') return <>In force: {s.environment}, from the server&apos;s environment ({s.envVar}).</>
    return <>Not set.</>
  }
  if (s.source === 'SAVED') return <>Saved here{by}{when}{s.environment ? ` — instead of ${s.environment} from ${s.envVar}` : ''}.</>
  if (s.source === 'ENVIRONMENT') return <>In force: <strong>{s.value}</strong>, from the server&apos;s environment ({s.envVar}).</>
  if (s.source === 'DEFAULT') return <>In force: <strong>{s.value}</strong> (built-in default).</>
  return <>Not set.</>
}

function WebhookBox({ url }: { url: string }) {
  return (
    <div className="rounded-xl p-3 text-sm space-y-1" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }} data-testid="webhook-url">
      <p className="font-medium">Razorpay webhook</p>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        In Razorpay Dashboard → Webhooks, add this address with the events payment.captured, order.paid and payment.failed, and the same secret as the Webhook secret above.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <code className="text-xs break-all">{url}</code>
        <button type="button" className="btn-ghost h-7 px-2 text-xs" onClick={() => navigator.clipboard?.writeText(url).then(() => toast.success('Copied'))}>
          <Copy size={12} /> Copy</button>
      </div>
    </div>
  )
}

/** A test email through the server as typed above — saved or not. */
function TestEmail({ me, values }: { me: string; values: Record<string, string> }) {
  const [to, setTo] = useState(me)
  const [answer, setAnswer] = useState<{ ok: boolean; text: string } | null>(null)
  const test = useMutation({
    mutationFn: () => platformApi.testEmail(to, values),
    onSuccess: text => setAnswer({ ok: true, text }),
    onError: (e: unknown) => setAnswer({ ok: false, text: apiError(e, 'The test email could not be sent.') }),
  })
  return (
    <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }} data-testid="test-email">
      <p className="text-sm font-medium">Send a test email</p>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Through the email server as typed above (saved or not), so a wrong password or port shows before anything is saved.</p>
      <div className="flex flex-wrap gap-2">
        <input className="input flex-1 min-w-[220px]" type="email" value={to} onChange={e => setTo(e.target.value)} aria-label="Send the test email to" data-field="test-to" />
        <button type="button" className="btn-secondary h-10 px-3 text-sm" disabled={test.isPending || !to.includes('@')} onClick={() => { setAnswer(null); test.mutate() }} data-action="test-email">
          <Send size={14} /> {test.isPending ? 'Sending…' : 'Send test email'}</button>
      </div>
      <Answer answer={answer} />
    </div>
  )
}

function TestButton({ label, note, testId, run }: { label: string; note: string; testId: string; run: () => Promise<string> }) {
  const [answer, setAnswer] = useState<{ ok: boolean; text: string } | null>(null)
  const test = useMutation({
    mutationFn: run,
    onSuccess: text => setAnswer({ ok: true, text }),
    onError: (e: unknown) => setAnswer({ ok: false, text: apiError(e, 'The check could not be made.') }),
  })
  return (
    <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }} data-testid={testId}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{note}</p>
        <button type="button" className="btn-secondary h-9 px-3 text-sm" disabled={test.isPending} onClick={() => { setAnswer(null); test.mutate() }} data-action="test">
          <PlugZap size={14} /> {test.isPending ? 'Checking…' : label}</button>
      </div>
      <Answer answer={answer} />
    </div>
  )
}

function Answer({ answer }: { answer: { ok: boolean; text: string } | null }) {
  const icon = useMemo(() => answer?.ok ? <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0" aria-hidden /> : <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" aria-hidden />, [answer])
  if (!answer) return null
  return (
    <p role={answer.ok ? 'status' : 'alert'} className="flex gap-2 text-sm" data-testid="test-answer" data-ok={String(answer.ok)}
      style={{ color: answer.ok ? 'var(--ok-text, #15803d)' : '#b91c1c' }}>{icon}<span>{answer.text}</span></p>
  )
}
