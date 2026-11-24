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

import { api } from '@/lib/api/client'
import { getAccessToken, useAuthStore } from '@/lib/store/slices/authStore'
import { renewSession } from '@/lib/auth/session'

/**
 * "Ask Finvosmart": talking to the assistant. The conversation lives in this tab (the server keeps none); each answer
 * is streamed as server-sent events — status (what is being looked up), delta (text as it is written), done or error —
 * read here from a POST (EventSource can only GET, and can't carry the sign-in).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

export type Audience = 'app' | 'website'

export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
  /** an answer: still being written, finished, stopped by the person, or failed */
  state?: 'writing' | 'done' | 'stopped' | 'error'
  error?: string
  cutShort?: boolean
  refused?: boolean
  /** the person's rating of an answer (once) */
  rated?: 'up' | 'down'
  /** who wrote an answer: Finvosmart's own server (in-house) or Claude */
  by?: 'finvosmart' | 'claude'
  /** questions to ask next, offered under the latest answer */
  suggest?: string[]
}

export type ChatEvent =
  | { type: 'status'; text: string }
  | { type: 'delta'; text: string }
  | { type: 'done'; cutShort: boolean; refused: boolean; by?: 'finvosmart' | 'claude'; suggest: string[] }
  | { type: 'error'; code: string; message: string }

export interface AppStatus {
  available: boolean
  dataAccess: boolean
  canSwitch: boolean
  changedAt?: string
  changedBy?: string
  usedToday: number
  dailyLimit: number
  starters: string[]
  /** whether Claude may be asked (a key, and a mode that uses it); the day's limit counts only its answers */
  claude?: boolean
}

export interface WebsiteStatus { available: boolean; starters: string[] }

/** Something went wrong before an answer could start (offline, signed out, refused). */
export class ChatError extends Error {}

/** Reads server-sent events from a stream: each complete event, as its name and its data. */
export async function readEvents(body: ReadableStream<Uint8Array>, on: (event: string, data: string) => void): Promise<void> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = '', event = 'message', data = '', have = false
  const line = (raw: string) => {
    const l = raw.endsWith('\r') ? raw.slice(0, -1) : raw
    if (l === '') { if (have) on(event, data); event = 'message'; data = ''; have = false; return }
    if (l.startsWith(':')) return                                  // a comment: keep-alive
    const c = l.indexOf(':')
    const field = c < 0 ? l : l.slice(0, c)
    let value = c < 0 ? '' : l.slice(c + 1)
    if (value.startsWith(' ')) value = value.slice(1)
    if (field === 'event') event = value
    else if (field === 'data') { data = have ? data + '\n' + value : value; have = true }
  }
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let i: number
    while ((i = buffer.indexOf('\n')) >= 0) { line(buffer.slice(0, i)); buffer = buffer.slice(i + 1) }
  }
  buffer += decoder.decode()
  if (buffer) line(buffer)
  line('')
}

/**
 * Asks for one answer. messages: the whole conversation, ending with the question. Events arrive through onEvent;
 * resolves when the answer has ended (done or error), rejects with ChatError when it couldn't start, and with an
 * AbortError when the person stopped it.
 */
export async function streamChat(audience: Audience, messages: Pick<ChatMessage, 'role' | 'text'>[], where: { page?: string; pageTitle?: string },
                                 signal: AbortSignal, onEvent: (e: ChatEvent) => void): Promise<void> {
  const url = `${API_URL}/${audience === 'website' ? 'public/assistant' : 'assistant'}/chat`
  const body = JSON.stringify({ messages: messages.map(m => ({ role: m.role, text: m.text })), page: where.page, pageTitle: where.pageTitle })
  const send = (token: string | null) => fetch(url, {
    method: 'POST', signal, credentials: audience === 'app' ? 'include' : 'omit', body,
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  let token: string | null = null
  if (audience === 'app') {
    token = getAccessToken()
    if (!token && useAuthStore.getState().isAuthenticated) {
      const r = await renewSession()
      if (r.ok) token = r.auth.accessToken
    }
  }
  let res: Response
  try {
    res = await send(token)
    if (res.status === 401 && audience === 'app') {
      const r = await renewSession()
      if (!r.ok) throw new ChatError('Your sign-in has ended. Sign in again to use the assistant.')
      res = await send(r.auth.accessToken)
    }
  } catch (e: any) {
    if (e?.name === 'AbortError' || e instanceof ChatError) throw e
    throw new ChatError('The assistant couldn’t be reached. Check your connection and try again.')
  }
  if (!res.ok || !res.body) {
    throw new ChatError(res.status === 401 ? 'Your sign-in has ended. Sign in again to use the assistant.'
      : res.status === 403 ? 'Your role can’t use the assistant here.' : 'The assistant can’t answer right now. Please try again in a few minutes.')
  }
  let ended = false
  await readEvents(res.body, (event, raw) => {
    let d: any
    try { d = JSON.parse(raw) } catch { return }
    if (event === 'status') onEvent({ type: 'status', text: String(d.text ?? '') })
    else if (event === 'delta') onEvent({ type: 'delta', text: String(d.text ?? '') })
    else if (event === 'done') {
      ended = true
      const by = d.by === 'finvosmart' || d.by === 'claude' ? d.by : undefined
      const suggest = Array.isArray(d.suggest) ? d.suggest.filter((x: unknown) => typeof x === 'string' && x.trim()).slice(0, 3).map((x: string) => x.slice(0, 160)) : []
      onEvent({ type: 'done', cutShort: !!d.cutShort, refused: !!d.refused, by, suggest })
    }
    else if (event === 'error') { ended = true; onEvent({ type: 'error', code: String(d.code ?? 'FAILED'), message: String(d.message ?? '') }) }
  })
  if (!ended) onEvent({ type: 'error', code: 'FAILED', message: 'The answer stopped before its end. Please ask again.' })
}

export const assistantApi = {
  appStatus: async (): Promise<AppStatus> => (await api.get('/assistant/status')).data.data,
  websiteStatus: async (): Promise<WebsiteStatus> => {
    const res = await fetch(`${API_URL}/public/assistant/status`, { credentials: 'omit' })
    const d = await res.json().catch(() => null)
    if (!res.ok || !d?.data) return { available: false, starters: [] }
    return d.data
  },
  setDataAccess: async (on: boolean): Promise<AppStatus> => (await api.put('/assistant/data-access', { on })).data.data,
  handoff: async (messages: Pick<ChatMessage, 'role' | 'text'>[], note: string): Promise<{ sentTo: string; message?: string }> => {
    const r = await api.post('/assistant/handoff', { messages: messages.map(m => ({ role: m.role, text: m.text })), note })
    return { ...r.data.data, message: r.data.message }
  },
  /** Whether an answer helped: a count for the day, nothing of the answer (a rating that doesn't arrive is no error). */
  feedback: async (audience: Audience, helpful: boolean): Promise<void> => {
    try {
      if (audience === 'app') await api.post('/assistant/feedback', { helpful })
      else await fetch(`${API_URL}/public/assistant/feedback`, {
        method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ helpful }),
      })
    } catch { /* offline: the thanks is shown anyway */ }
  },
}

/** The website's status, asked once per page load and shared (the chat, and the "Ask the assistant" buttons). */
let websiteStatusOnce: Promise<WebsiteStatus> | null = null
export function websiteStatus(): Promise<WebsiteStatus> {
  if (!websiteStatusOnce) {
    websiteStatusOnce = assistantApi.websiteStatus().catch(() => ({ available: false, starters: [] }))
  }
  return websiteStatusOnce
}

/** Opens the assistant (the website's chat, or the app's panel) and, given a question, asks it. */
export function openAssistant(question = '') {
  window.dispatchEvent(new CustomEvent('finvo:ask', { detail: { question } }))
}

// ── the conversation, kept in this tab while it moves between pages ──────────────────────────────────────────────────
const MAX_KEPT = 40

export function loadConversation(key: string): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return []
    const list = JSON.parse(raw)
    if (!Array.isArray(list)) return []
    return list.filter((m: any) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.text === 'string')
      // an answer that was still being written when the page changed has stopped
      .map((m: any) => (m.state === 'writing' ? { ...m, state: 'stopped' } : m))
      .slice(-MAX_KEPT)
  } catch {
    return []
  }
}

export function saveConversation(key: string, messages: ChatMessage[]) {
  try { sessionStorage.setItem(key, JSON.stringify(messages.slice(-MAX_KEPT))) } catch { /* private window: kept in memory only */ }
}

/** How much of a long conversation is sent: the server reads at most the last 16 messages, so more would only cost. */
export const MAX_SENT = 24

/**
 * The conversation as the server takes it: questions and answers alternating, ending with the new question — its
 * latest part only (at most MAX_SENT messages, starting with a question), so a long conversation can go on.
 */
export function forServer(messages: ChatMessage[]): Pick<ChatMessage, 'role' | 'text'>[] {
  const out: Pick<ChatMessage, 'role' | 'text'>[] = []
  for (const m of messages) {
    const text = m.text.trim() || (m.role === 'assistant' ? '(no answer)' : '')
    if (!text) continue
    const last = out[out.length - 1]
    if (last && last.role === m.role) { last.text = `${last.text}\n\n${text}`; continue }   // two questions in a row: one
    out.push({ role: m.role, text })
  }
  const recent = out.slice(-MAX_SENT)
  while (recent.length && recent[0].role !== 'user') recent.shift()
  return recent
}

/** A link the assistant may make clickable: a page of this site (not the API), nothing else. */
export function internalHref(href: string): string | null {
  const h = href.trim()
  if (!/^\/(?!\/)[A-Za-z0-9\-._~/?=&%#]*$/.test(h)) return null
  if (h.startsWith('/api/')) return null
  return h
}

/** The government's own sites the assistant may send people to (GST, e-way bills, income tax and TDS, PF, ESI, Udyam, MCA). */
export const OFFICIAL_SITES = ['gst.gov.in', 'ewaybillgst.gov.in', 'incometax.gov.in', 'tdscpc.gov.in', 'epfindia.gov.in', 'esic.gov.in',
  'udyamregistration.gov.in', 'cbic-gst.gov.in', 'mca.gov.in']
const OWN_SITES = ['finvosmart.com', 'www.finvosmart.com', 'app.finvosmart.com']

/**
 * Where a link in an answer may go: a page of this site (also written as https://finvosmart.com/…), or an official
 * government site over https — opened apart; anything else isn't a link (its words are shown, not followed).
 */
export function linkTarget(href: string): { href: string; external: boolean } | null {
  const own = internalHref(href)
  if (own) return { href: own, external: false }
  let u: URL
  try { u = new URL(href.trim()) } catch { return null }
  if (u.protocol !== 'https:' || u.username || u.password || u.port) return null
  const host = u.hostname.toLowerCase()
  if (OWN_SITES.includes(host)) {
    const path = internalHref(u.pathname + u.search + u.hash)
    return path ? { href: path, external: false } : null
  }
  return OFFICIAL_SITES.some(d => host === d || host.endsWith('.' + d)) ? { href: u.toString(), external: true } : null
}

/** An answer as plain text, for copying and for screen readers: no ** or link syntax — a link's address after its words. */
export function plainText(md: string): string {
  return md
    .replace(/\[([^\]]{1,120})\]\(([^)\s]{1,300})\)/g, (_, text: string, href: string) => {
      const t = linkTarget(href)
      if (!t) return text
      const where = t.external ? t.href : (typeof window === 'undefined' ? t.href : window.location.origin + t.href)
      return `${text} (${where})`
    })
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .trim()
}
