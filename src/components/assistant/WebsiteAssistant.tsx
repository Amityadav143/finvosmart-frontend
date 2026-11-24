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

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { CheckCircle2, MessageCircle, Sparkles, Users, X } from 'lucide-react'
import { ChatPanel } from './ChatPanel'
import { openAssistant, websiteStatus, type ChatMessage, type WebsiteStatus } from '@/lib/assistant'
import { isHindiPage, websiteStarters } from '@/lib/assistantStarters'
import { attributionForRequest } from '@/lib/attribution'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
const OPEN_KEY = 'finvo-assistant-open:website'
/** What the server said, kept while the visitor moves between pages (the home page and the others mount their own). */
let known: WebsiteStatus | null = null

/** Whether the website's assistant answers (asked once a page loads, a moment after, so it never slows the page). */
export function useWebsiteAssistant(): WebsiteStatus | null {
  const [status, setStatus] = useState<WebsiteStatus | null>(known)
  useEffect(() => {
    if (known) return
    let gone = false
    const t = setTimeout(() => websiteStatus().then(s => { known = s; if (!gone) setStatus(s) }), 800)
    return () => { gone = true; clearTimeout(t) }
  }, [])
  return status
}

/**
 * "Ask the assistant" in a page of the website (the FAQ, the contact page): opens the chat, asking a question if one is
 * given. Shown only when the assistant answers.
 */
export function AskAssistantButton({ question, label = 'Ask our AI assistant', className = 'btn-secondary' }: {
  question?: string; label?: string; className?: string
}) {
  const status = useWebsiteAssistant()
  if (!status?.available) return null
  return (
    <button type="button" className={className} onClick={() => openAssistant(question)} data-testid="ask-assistant-button">
      <Sparkles size={15} aria-hidden />{label}
    </button>
  )
}

/**
 * The website's assistant: a button at the foot of every page of the website that opens the chat. It is there only
 * when the server says the website's assistant answers (switched on, with a key). It offers questions about the page
 * the visitor is reading (in Hindi on the Hindi page), and "Talk to our team" sends the visitor's details to sales, as
 * the contact form does.
 */
export function WebsiteAssistant() {
  const status = useWebsiteAssistant()
  const [open, setOpen] = useState(false)
  const [ask, setAsk] = useState<{ text: string; at: number } | null>(null)
  const pathname = usePathname() || '/'
  const launcher = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)
  const hindi = isHindiPage(pathname)

  useEffect(() => {
    try { if (sessionStorage.getItem(OPEN_KEY) === '1') setOpen(true) } catch { /* storage blocked */ }
  }, [])

  // "Ask the assistant" from a page (or a question for it)
  useEffect(() => {
    const onAsk = (e: Event) => {
      const q = String((e as CustomEvent).detail?.question ?? '').trim()
      setOpen(true)
      if (q) setAsk({ text: q, at: Date.now() })
    }
    window.addEventListener('finvo:ask', onAsk)
    return () => window.removeEventListener('finvo:ask', onAsk)
  }, [])

  useEffect(() => {
    try { sessionStorage.setItem(OPEN_KEY, open ? '1' : '0') } catch { /* storage blocked */ }
    // on a phone the chat is the whole screen: the page behind it doesn't scroll
    const phone = typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches
    document.body.classList.toggle('asst-locked', open && phone)
    // closed: back to the button that opened it, for the keyboard
    if (!open && wasOpen.current) setTimeout(() => launcher.current?.focus(), 0)
    wasOpen.current = open
    if (!open) return
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape' && !e.defaultPrevented) setOpen(false) }
    window.addEventListener('keydown', esc)
    return () => { window.removeEventListener('keydown', esc); document.body.classList.remove('asst-locked') }
  }, [open])

  if (!status?.available) return null

  return (
    <>
      {!open && (
        <button ref={launcher} type="button" className="asst-launch" onClick={() => setOpen(true)} data-testid="assistant-launch"
          aria-label={hindi ? 'Finvosmart से पूछें — Finvosmart, प्लान और GST के बारे में' : 'Ask Finvosmart — questions about Finvosmart, plans and GST'}>
          <MessageCircle size={20} aria-hidden /><span>{hindi ? 'पूछें' : 'Ask Finvosmart'}</span>
        </button>
      )}
      {open && (
        <div className="asst-shell asst-float" role="dialog" aria-label="Ask Finvosmart">
          <ChatPanel
            audience="website"
            storageKey="finvo-assistant:website"
            subtitle={hindi ? 'सुविधाएँ, प्लान, GST और शुरुआत' : 'Features, plans, GST and getting started'}
            intro={hindi
              ? <p>नमस्ते! मैं Finvosmart का सहायक हूँ। पूछिए कि Finvosmart क्या करता है, इसकी कीमत क्या है, Tally या Excel से कैसे आएँ, या GST बिल और रिटर्न के बारे में — हिंदी या अंग्रेज़ी में।</p>
              : <p>Hi! I’m Finvosmart’s assistant. Ask me what Finvosmart does, what it costs, how to move from Tally or Excel, or about GST billing and returns — in English or Hindi.</p>}
            starters={websiteStarters(pathname, status.starters)}
            where={() => ({ page: pathname, pageTitle: typeof document === 'undefined' ? undefined : document.title })}
            maxLength={1000}
            onClose={() => setOpen(false)}
            ask={ask}
            handoff={(c, busy) => <TalkToTeam conversation={c} busy={busy} page={pathname} />}
            handoffHint="“Talk to our team” below gets you a person."
          />
        </div>
      )}
    </>
  )
}

/** "Talk to our team": the visitor's details and question to the sales inbox (POST /public/demo-requests). */
function TalkToTeam({ conversation, busy, page }: { conversation: ChatMessage[]; busy: boolean; page: string }) {
  const [open, setOpen] = useState(false)
  const lastQuestion = [...conversation].reverse().find(m => m.role === 'user')?.text ?? ''
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', message: '', website: '' })
  const [state, setState] = useState<{ kind: 'idle' | 'sending' | 'sent' } | { kind: 'error'; message: string }>({ kind: 'idle' })
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }))
  const opener = useRef<HTMLButtonElement>(null)

  const start = () => {
    setForm(f => ({ ...f, message: f.message || (lastQuestion ? `I asked the website assistant: ${lastQuestion}` : '') }))
    setState({ kind: 'idle' })
    setOpen(true)
  }
  const close = () => { setOpen(false); setTimeout(() => opener.current?.focus(), 0) }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState({ kind: 'sending' })
    try {
      const res = await fetch(`${API_URL}/public/demo-requests`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'omit',
        body: JSON.stringify({ ...form, plan: 'Not sure yet', page, attribution: attributionForRequest() }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.success !== false) { setState({ kind: 'sent' }); return }
      setState({ kind: 'error', message: data?.error || 'Your details could not be sent. Please check them and try again.' })
    } catch {
      setState({ kind: 'error', message: 'We couldn’t reach our server just now. Please try again in a moment.' })
    }
  }

  return (
    <>
      <button ref={opener} type="button" className="asst-handoff" onClick={start} disabled={busy} data-testid="asst-team">
        <Users size={14} aria-hidden />Talk to our team
      </button>
      {open && (
        <div className="asst-overlay" role="region" aria-label="Talk to our team" data-testid="asst-team-form"
          onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close() } }}>
          <div className="asst-overlay-head">
            <h3>Talk to our team</h3>
            <button type="button" className="btn-icon" onClick={close} aria-label="Back to the chat"><X size={15} /></button>
          </div>
          {state.kind === 'sent' ? (
            <div className="asst-sent" role="status">
              <CheckCircle2 size={28} aria-hidden />
              <p>Thank you — we have your details. We’ll reply to <strong>{form.email}</strong> within 4 business hours.</p>
              <button type="button" className="btn-secondary h-9 px-4" onClick={close}>Back to the chat</button>
            </div>
          ) : (
            <form onSubmit={submit} className="asst-form">
              <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
                <label htmlFor="at-website">Website</label>
                <input id="at-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
              </div>
              <label className="label" htmlFor="at-name">Your name</label>
              <input id="at-name" className="input" value={form.name} onChange={set('name')} required minLength={2} maxLength={100} autoComplete="name" autoFocus />
              <label className="label" htmlFor="at-email">Work email</label>
              <input id="at-email" className="input" type="email" value={form.email} onChange={set('email')} required maxLength={254} autoComplete="email" />
              <label className="label" htmlFor="at-company">Company</label>
              <input id="at-company" className="input" value={form.company} onChange={set('company')} required minLength={2} maxLength={150} autoComplete="organization" />
              <label className="label" htmlFor="at-phone">Mobile (optional)</label>
              <input id="at-phone" className="input" type="tel" value={form.phone} onChange={set('phone')} maxLength={20} autoComplete="tel" placeholder="+91 98765 43210" />
              <label className="label" htmlFor="at-message">Message</label>
              <textarea id="at-message" className="input" rows={3} value={form.message} onChange={set('message')} maxLength={2000} />
              {state.kind === 'error' && <p className="asst-error" role="alert">{state.message}</p>}
              <button type="submit" className="btn-primary h-10 w-full justify-center" disabled={state.kind === 'sending'} data-testid="asst-team-send">
                {state.kind === 'sending' ? 'Sending…' : 'Send to the team'}
              </button>
              <p className="asst-fine">Your details go to Finvosmart’s sales team only, to reply to you.</p>
            </form>
          )}
        </div>
      )}
    </>
  )
}
