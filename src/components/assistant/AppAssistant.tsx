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
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Mail, X } from 'lucide-react'
import { ChatPanel } from './ChatPanel'
import { assistantApi, forServer, type AppStatus, type ChatMessage } from '@/lib/assistant'
import { useAuthStore } from '@/lib/store/slices/authStore'
import { placeOf } from '@/lib/navigation'
import { appStarters } from '@/lib/assistantStarters'
import { apiError } from '@/lib/apiError'

/** Whether the assistant answers in the app, whether it reads this company's figures, and today's use (one ask, shared). */
export function useAssistantStatus() {
  const signedIn = useAuthStore(s => s.isAuthenticated && !!s.accessToken)
  return useQuery<AppStatus>({ queryKey: ['assistant-status'], queryFn: assistantApi.appStatus, enabled: signedIn, staleTime: 5 * 60_000, retry: false })
}

/** Asks the assistant from anywhere in the app (the search's "Ask the assistant"). */
export function askAssistant(question: string) {
  window.dispatchEvent(new CustomEvent('finvo:ask', { detail: { question } }))
}

/**
 * The assistant inside the app: a panel at the right (the whole screen on a phone), opened from the top bar or the
 * search. It knows where the person is; until the company's admin lets it read the figures it says so, and how.
 */
export function AppAssistant({ open, onClose, ask }: { open: boolean; onClose: () => void; ask: { text: string; at: number } | null }) {
  const { data: status } = useAssistantStatus()
  const qc = useQueryClient()
  const pathname = usePathname()
  const userId = useAuthStore(s => s.user?.userId ?? s.user?.email ?? '')

  // Esc closes it — unless Esc is for something else on the page (a dialog of the page, the search), and the person
  // isn't in the assistant itself
  useEffect(() => {
    if (!open) return
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      const inside = !!(document.activeElement as HTMLElement | null)?.closest?.('[data-testid="assistant-side"]')
      const elsewhere = document.querySelector('.cmd-overlay, .modal-overlay, [role="dialog"][aria-modal="true"]')
      if (inside || !elsewhere) onClose()
    }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [open, onClose])

  // closed: back to "Ask" in the top bar, for the keyboard
  const wasOpen = useRef(false)
  useEffect(() => {
    if (!open && wasOpen.current) setTimeout(() => (document.querySelector('[data-testid="open-assistant"]') as HTMLElement | null)?.focus(), 0)
    wasOpen.current = open
  }, [open])

  if (!open || !status?.available) return null
  const data = status.dataAccess
  const near = !!status.claude && status.dailyLimit > 0 && status.usedToday >= status.dailyLimit * 0.8

  return (
    <aside className="asst-shell asst-side" aria-label="Ask Finvosmart" data-testid="assistant-side">
      <ChatPanel
        audience="app"
        storageKey={`finvo-assistant:app:${userId}`}
        subtitle={data ? 'The guide, and your company’s figures' : 'How to do things in Finvosmart'}
        intro={<p>Hi! Ask me how to do something in Finvosmart — I’ll give you the steps and take you to the page.{data
          ? ' I can also look up your figures: overdue invoices, bills to pay, cash for the next 13 weeks, or a record by name or number.'
          : ''}</p>}
        starters={appStarters(pathname || '/', status.starters, data)}
        banner={!data ? (
          <p data-testid="asst-data-off">I don’t read your company’s figures yet.{' '}
            {status.canSwitch
              ? <Link href="/settings/assistant" className="asst-link">Let me answer from them</Link>
              : 'A company admin can let me answer from them.'}
          </p>
        ) : near ? <p>{status.usedToday} of today’s {status.dailyLimit} questions for Claude are used by your company — Finvosmart’s own answers don’t count.</p> : undefined}
        where={() => {
          const search = typeof window === 'undefined' ? '' : window.location.search
          const place = placeOf(pathname || '/', search)
          return { page: (pathname || '/') + search, pageTitle: place.title || (typeof document === 'undefined' ? undefined : document.title) }
        }}
        maxLength={2000}
        onClose={onClose}
        onLink={() => { if (window.matchMedia('(max-width: 1023px)').matches) onClose() }}
        ask={ask}
        onAnswered={() => qc.invalidateQueries({ queryKey: ['assistant-status'] })}
        handoff={(c, busy) => <EmailSupport conversation={c} busy={busy} />}
        handoffHint="“Email this chat to support” below gets you a person."
      />
    </aside>
  )
}

/** "Email this chat to support": the conversation, with the person's name and email to reply to. */
function EmailSupport({ conversation, busy }: { conversation: ChatMessage[]; busy: boolean }) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [state, setState] = useState<{ kind: 'idle' | 'sending' } | { kind: 'sent'; text: string } | { kind: 'error'; message: string }>({ kind: 'idle' })
  const answered = conversation.some(m => m.role === 'assistant' && m.text.trim())
  const opener = useRef<HTMLButtonElement>(null)
  const close = () => { setOpen(false); setTimeout(() => opener.current?.focus(), 0) }

  const send = async () => {
    setState({ kind: 'sending' })
    try {
      const r = await assistantApi.handoff(forServer(conversation), note)
      setState({ kind: 'sent', text: r.message || `Sent to support at ${r.sentTo}. They’ll reply by email.` })
    } catch (e) {
      setState({ kind: 'error', message: apiError(e, 'The chat could not be sent. Please try again.') })
    }
  }

  return (
    <>
      <button ref={opener} type="button" className="asst-handoff" onClick={() => { setState({ kind: 'idle' }); setOpen(true) }} disabled={busy || !answered}
        data-testid="asst-email" title={answered ? undefined : 'Ask something first'}>
        <Mail size={14} aria-hidden />Email this chat to support
      </button>
      {open && (
        <div className="asst-overlay" role="region" aria-label="Email this chat to support" data-testid="asst-email-form"
          onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close() } }}>
          <div className="asst-overlay-head">
            <h3>Email this chat to support</h3>
            <button type="button" className="btn-icon" onClick={close} aria-label="Back to the chat"><X size={15} /></button>
          </div>
          {state.kind === 'sent' ? (
            <div className="asst-sent" role="status">
              <CheckCircle2 size={28} aria-hidden />
              <p>{state.text}</p>
              <button type="button" className="btn-secondary h-9 px-4" onClick={close}>Back to the chat</button>
            </div>
          ) : (
            <div className="asst-form">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Finvosmart’s support team gets this conversation (its latest part, if it is long), with your name and email so they can reply. Nothing else is sent.
              </p>
              <label className="label" htmlFor="ae-note">Anything to add? (optional)</label>
              <textarea id="ae-note" className="input" rows={3} value={note} onChange={e => setNote(e.target.value)} maxLength={1000} autoFocus />
              {state.kind === 'error' && <p className="asst-error" role="alert">{state.message}</p>}
              <button type="button" className="btn-primary h-10 w-full justify-center" onClick={send} disabled={state.kind === 'sending'} data-testid="asst-email-send">
                {state.kind === 'sending' ? 'Sending…' : 'Send to support'}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
