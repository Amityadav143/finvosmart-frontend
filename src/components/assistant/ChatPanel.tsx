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

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowUp, Check, Copy, RotateCcw, Sparkles, Square, ThumbsDown, ThumbsUp, X } from 'lucide-react'
import { AssistantText } from './AssistantText'
import { assistantApi, ChatError, forServer, loadConversation, plainText, saveConversation, streamChat, type Audience, type ChatMessage } from '@/lib/assistant'

export interface ChatPanelProps {
  audience: Audience
  /** where this tab keeps the conversation while it moves between pages */
  storageKey: string
  title?: string
  subtitle: string
  /** the first words, before anything is asked */
  intro: ReactNode
  starters: string[]
  /** a line above the conversation (e.g. that the company's figures aren't read yet) */
  banner?: ReactNode
  /** the page the person is on, sent with each question */
  where: () => { page?: string; pageTitle?: string }
  maxLength: number
  onClose: () => void
  /** a link in an answer was followed */
  onLink?: () => void
  /** the way to a person: a button, and what it opens */
  handoff: (conversation: ChatMessage[], busy: boolean) => ReactNode
  /** said under an answer marked unhelpful: where a person can be reached */
  handoffHint: string
  /** a question to ask at once (from the search) */
  ask?: { text: string; at: number } | null
  onAnswered?: () => void
}

/**
 * The conversation with the assistant: the question box, the answers written as they arrive (with what is being looked
 * up meanwhile), Stop, ask again, copy, a new conversation, and the way to a person. Nothing here is sent anywhere but
 * to Finvosmart's server, and the conversation stays in this tab.
 */
export function ChatPanel(p: ChatPanelProps) {
  // the panel is only drawn once someone opens it (never on the server), so the tab's conversation is there at once
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadConversation(p.storageKey))
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [writing, setWriting] = useState(false)
  const [said, setSaid] = useState('')                // for screen readers: an answer is ready, or failed
  const [copied, setCopied] = useState<number | null>(null)
  const abort = useRef<AbortController | null>(null)
  const list = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLTextAreaElement>(null)
  const stick = useRef(true)
  // the latest conversation, for a question asked before the next render (one from the search, as the panel opens)
  const latest = useRef(messages)
  const key = useRef(p.storageKey)

  useEffect(() => {
    setTimeout(() => box.current?.focus(), 30)
    return () => abort.current?.abort()
  }, [])

  // another person signed in in this tab: their own conversation
  useEffect(() => {
    if (key.current === p.storageKey) return
    key.current = p.storageKey
    const theirs = loadConversation(p.storageKey)
    latest.current = theirs
    setMessages(theirs)
  }, [p.storageKey])

  useEffect(() => { latest.current = messages; saveConversation(key.current, messages) }, [messages])

  // keep the newest words in view while they arrive — unless the person scrolled up to read
  useEffect(() => {
    const el = list.current
    if (el && stick.current) el.scrollTop = el.scrollHeight
  }, [messages, status])

  const onScroll = () => {
    const el = list.current
    if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60
  }

  const send = useCallback(async (raw: string, base?: ChatMessage[]) => {
    const q = raw.trim()
    if (!q || writing) return
    const before = base ?? latest.current
    const asked: ChatMessage[] = [...before, { role: 'user', text: q }]
    setMessages([...asked, { role: 'assistant', text: '', state: 'writing' }])
    setInput('')
    setWriting(true)
    setSaid('')
    stick.current = true
    const ctrl = new AbortController()
    abort.current = ctrl
    const update = (f: (m: ChatMessage) => ChatMessage) =>
      setMessages(ms => { const c = ms.slice(); c[c.length - 1] = f(c[c.length - 1]); return c })
    let answer = ''
    try {
      await streamChat(p.audience, forServer(asked), p.where(), ctrl.signal, e => {
        if (e.type === 'status') { setStatus(e.text); setSaid(e.text) }
        else if (e.type === 'delta') { setStatus(null); answer += e.text; update(m => ({ ...m, text: m.text + e.text })) }
        else if (e.type === 'done') {
          update(m => ({ ...m, state: 'done', cutShort: e.cutShort, refused: e.refused, by: e.by, suggest: e.suggest }))
          // a screen reader hears the answer itself, as plain words
          setSaid(answer.trim() ? plainText(answer) : 'I can’t help with that one.')
        } else if (e.type === 'error') {
          update(m => ({ ...m, state: 'error', error: e.message }))
          setSaid(e.message)
        }
      })
    } catch (e: any) {
      if (e?.name === 'AbortError') update(m => ({ ...m, state: 'stopped' }))
      else {
        const msg = e instanceof ChatError ? e.message : 'The assistant can’t answer right now. Please try again in a few minutes.'
        update(m => ({ ...m, state: 'error', error: msg }))
        setSaid(msg)
      }
    } finally {
      setWriting(false)
      setStatus(null)
      abort.current = null
      p.onAnswered?.()
      setTimeout(() => box.current?.focus(), 30)
    }
  }, [writing, p])

  // a question from the search: asked once it arrives
  const lastAsk = useRef(0)
  useEffect(() => {
    if (p.ask && p.ask.at !== lastAsk.current) {
      lastAsk.current = p.ask.at
      send(p.ask.text)
    }
  }, [p.ask, send])

  const again = () => {
    // the last question asked again, without the answer that failed or was stopped
    let i = messages.length - 1
    while (i >= 0 && messages[i].role !== 'user') i--
    if (i < 0) return
    send(messages[i].text, messages.slice(0, i))
  }

  const fresh = () => {
    abort.current?.abort()
    setMessages([])
    setInput('')
    setSaid('A new conversation.')
    box.current?.focus()
  }

  // copied as plain words (no ** or link syntax; a link's address after its words), ready to paste anywhere
  const copy = async (i: number) => {
    try { await navigator.clipboard.writeText(plainText(messages[i].text)); setCopied(i); setTimeout(() => setCopied(null), 1500) } catch { /* no clipboard here */ }
  }

  // whether an answer helped: once per answer, a count on the server (nothing of the answer is sent)
  const rate = (i: number, helpful: boolean) => {
    if (messages[i].rated) return
    setMessages(ms => ms.map((m, j) => j === i ? { ...m, rated: helpful ? 'up' : 'down' } : m))
    setSaid(helpful ? 'Thanks — glad it helped.' : `Sorry it didn’t help. ${p.handoffHint}`)
    assistantApi.feedback(p.audience, helpful)
  }

  // the box grows with what is typed, up to a few lines (then it scrolls)
  const grow = (el: HTMLTextAreaElement) => { el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 140)}px` }
  useEffect(() => { if (!input && box.current) box.current.style.height = 'auto' }, [input])

  const last = messages[messages.length - 1]
  const empty = messages.length === 0

  return (
    <div className="asst-panel" data-testid="assistant-panel" data-audience={p.audience}>
      <div className="asst-head">
        <span className="asst-mark" aria-hidden><Sparkles size={16} /></span>
        <div className="min-w-0 flex-1">
          <h2 className="asst-title">{p.title ?? 'Ask Finvosmart'} <span className="asst-ai">AI</span></h2>
          <p className="asst-sub">{p.subtitle}</p>
        </div>
        <button type="button" className="btn-icon" onClick={fresh} disabled={empty} aria-label="New conversation" title="New conversation" data-testid="asst-new">
          <RotateCcw size={15} />
        </button>
        <button type="button" className="btn-icon" onClick={p.onClose} aria-label="Close the assistant" title="Close (Esc)" data-testid="asst-close">
          <X size={16} />
        </button>
      </div>

      {p.banner && <div className="asst-banner">{p.banner}</div>}

      <div ref={list} className="asst-log" onScroll={onScroll} role="log" aria-label="The conversation" aria-live="off">
        {empty && (
          <div className="asst-intro">
            <div className="asst-bubble asst-from-them">{p.intro}</div>
            {p.starters.length > 0 && (
              <div className="asst-starters" aria-label="Questions to start with">
                {p.starters.map(s => (
                  <button key={s} type="button" className="asst-starter" onClick={() => send(s)} data-testid="asst-starter">{s}</button>
                ))}
              </div>
            )}
          </div>
        )}
        {messages.map((m, i) => m.role === 'user' ? (
          <div key={i} className="asst-row asst-row-me" data-testid="asst-msg" data-role="user">
            <div className="asst-bubble asst-from-me">{m.text}</div>
          </div>
        ) : (
          <div key={i} className="asst-row" data-testid="asst-msg" data-role="assistant" data-state={m.state ?? 'done'}>
            <div className="asst-bubble asst-from-them">
              {m.text ? <AssistantText text={m.text} onLink={p.onLink} /> : m.state === 'writing'
                ? <span className="asst-typing" aria-label="Writing"><i /><i /><i /></span> : null}
              {m.state === 'writing' && i === messages.length - 1 && status && (
                <p className="asst-status" data-testid="asst-status"><span className="asst-spin" aria-hidden />{status}</p>
              )}
              {m.state === 'stopped' && <p className="asst-note">Stopped.</p>}
              {m.cutShort && <p className="asst-note">The answer was long and stopped here — ask “go on” for the rest.</p>}
              {m.state === 'done' && m.refused && !m.text && <p>I can’t help with that one. Try asking about Finvosmart, GST or your business.</p>}
              {m.state === 'error' && <p className="asst-error" role="alert" data-testid="asst-error">{m.error}</p>}
            </div>
            {i === messages.length - 1 && !writing && (m.state === 'error' || m.state === 'stopped') && (
              <button type="button" className="asst-act" onClick={again} data-testid="asst-retry"><RotateCcw size={13} />Ask again</button>
            )}
            {m.state === 'done' && m.text && (
              <div className="asst-acts">
                <button type="button" className="asst-act" onClick={() => copy(i)} data-testid="asst-copy" aria-label="Copy this answer">
                  {copied === i ? <><Check size={13} />Copied</> : <><Copy size={13} />Copy</>}
                </button>
                {m.by && (
                  <span className="asst-by" data-testid="asst-by" data-by={m.by}
                    title={m.by === 'finvosmart' ? 'Answered on Finvosmart’s own server — nothing was sent outside' : 'Written by Claude, an AI from Anthropic'}>
                    {m.by === 'finvosmart' ? 'Finvosmart' : 'Claude (AI)'}
                  </span>
                )}
                {m.rated ? (
                  <span className="asst-rated" data-testid="asst-rated">{m.rated === 'up' ? 'Thanks — glad it helped.' : `Sorry it didn’t help. ${p.handoffHint}`}</span>
                ) : (<>
                  <button type="button" className="asst-act asst-rate" onClick={() => rate(i, true)} aria-label="This helped" title="This helped" data-testid="asst-rate-up">
                    <ThumbsUp size={13} />
                  </button>
                  <button type="button" className="asst-act asst-rate" onClick={() => rate(i, false)} aria-label="This didn’t help" title="This didn’t help" data-testid="asst-rate-down">
                    <ThumbsDown size={13} />
                  </button>
                </>)}
              </div>
            )}
            {i === messages.length - 1 && !writing && m.state === 'done' && (m.suggest?.length ?? 0) > 0 && (
              <div className="asst-suggest" aria-label="Questions to ask next">
                {m.suggest!.map(s => (
                  <button key={s} type="button" className="asst-starter" onClick={() => send(s)} data-testid="asst-suggest">{s}</button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">{said}</p>

      <div className="asst-foot">
        <form onSubmit={e => { e.preventDefault(); send(input) }}>
          <div className="asst-box">
            <textarea ref={box} value={input} rows={1}
              onChange={e => { setInput(e.target.value.slice(0, p.maxLength)); grow(e.target) }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(input) } }}
              placeholder={writing ? 'Writing…' : 'Ask a question…'} aria-label="Your question" maxLength={p.maxLength} data-testid="asst-input" />
            {writing
              ? <button type="button" className="asst-send" onClick={() => abort.current?.abort()} aria-label="Stop the answer" title="Stop" data-testid="asst-stop"><Square size={14} /></button>
              : <button type="submit" className="asst-send" disabled={!input.trim()} aria-label="Send" title="Send (Enter)" data-testid="asst-send"><ArrowUp size={16} /></button>}
          </div>
          {input.length > p.maxLength * 0.9 && <p className="asst-count">{input.length} / {p.maxLength}</p>}
        </form>
        {/* (outside the question's form: the way to a person has a form of its own) */}
        <div className="asst-meta">
          {p.handoff(messages, writing)}
          <p className="asst-fine">AI answers can be wrong — check important figures. Never share passwords or OTPs. <Link href="/privacy#assistant" className="asst-link">How chats are handled</Link></p>
        </div>
      </div>
      {last?.state === 'writing' && <span className="sr-only">Writing an answer…</span>}
    </div>
  )
}
