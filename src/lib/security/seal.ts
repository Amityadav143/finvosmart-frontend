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

import axios from 'axios'

/**
 * Passwords, codes and secrets never leave this tab as plain text, and one-time secrets the server shows never arrive
 * as plain text: neither is readable in the Network tab, a saved HAR file or a proxy's log (the backend's
 * common.crypto.SealedFields is the other half).
 *
 * Sending: each sensitive field of a JSON body (a password, a one-time code, a token, an integration secret — by its
 * name, at any depth) is sealed for the server's RSA key with a fresh one-time challenge: AES-256-GCM for the value,
 * RSA-OAEP (SHA-256) for its key — "fv1.<key id>.<key>.<iv>.<value>". The server opens them before the API reads the
 * body. A server without the key (an older backend) gets the values as before, so sign-in never breaks on a
 * half-done update.
 *
 * Receiving: this tab has its own key pair (the private key can't leave the browser's crypto); its public half goes
 * with each change sent, and the server seals the one-time secrets of its answer for it — the page opens them.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

export const SEALED_HEADER = 'X-Finvo-Sealed'
export const REPLY_KEY_HEADER = 'X-Finvo-Reply-Key'
const PREFIX = 'fv1.'
/** Why the server refused a sealed body: the web app gets a new key and challenge and seals again, once. */
export const SEAL_AGAIN = ['SEALED_KEY_CHANGED', 'SEALED_EXPIRED', 'SEALED_REPLAYED']

/** A field holding a password, a code or a secret, by the last part of its name ("mail.password" → "password"). */
const SECRET_NAME = /(password|passwd|passphrase|secret|token|credential|apikey|api_key|privatekey|private_key)$/i
const SECRET_EXACT = new Set(['pin', 'mpin', 'otp', 'otpcode', 'cvv', 'backupcode'])

export function isSensitive(name: string, url?: string): boolean {
  const last = name.split('.').pop() ?? name
  if (SECRET_NAME.test(last) || SECRET_EXACT.has(last.toLowerCase())) return true
  // "code" is a one-time code in the sign-in calls (two-step, OTP), and an item's or a ledger's code elsewhere
  return last === 'code' && !!url && /(^|\/)auth\//.test(url.replace(API_URL, ''))
}

const enc = new TextEncoder()
const b64 = (bytes: Uint8Array) => {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
const unb64 = (s: string) => {
  const t = s.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(t + '==='.slice((t.length + 3) % 4))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function subtle(): SubtleCrypto | null {
  // the browser's crypto exists on https:// (and on localhost) only
  return typeof window !== 'undefined' && window.isSecureContext !== false && window.crypto?.subtle ? window.crypto.subtle : null
}

let warned = false
function plainOnce(why: string) {
  if (warned) return
  warned = true
  // eslint-disable-next-line no-console
  console.warn(`[Finvosmart set-up] Passwords are sent unsealed: ${why}`)
}

// ── the server's key ───────────────────────────────────────────────────────────

type Offer = { keyId: string; key: CryptoKey; challenge: string }
let serverKey: { keyId: string; key: CryptoKey } | null = null
/** The backend has no key for sealed values (older than this update): values go as before, for this page. */
let older = false

/** Forget the server's key (it changed: a restart, another backend): the next seal asks again. */
export function forgetServerKey() { serverKey = null }

async function offer(): Promise<Offer | null> {
  const s = subtle()
  if (!s) { plainOnce('this page isn’t on https:// (the browser’s crypto is off)'); return null }
  if (older) return null
  let d: any
  try {
    d = (await axios.get(`${API_URL}/auth/transport-key`, { timeout: 15000, withCredentials: true, headers: { Accept: 'application/json' } })).data?.data
  } catch (e: any) {
    const st = e?.response?.status
    // an older backend: no such address (404/405), or an address it doesn't know answered as "signed out" (401)
    if (st === 404 || st === 405 || st === 401) { older = true; plainOnce('the backend is older than this web app'); return null }
    throw e
  }
  if (!d?.keyId || !d?.publicKey || !d?.challenge) { older = true; return null }
  if (!serverKey || serverKey.keyId !== d.keyId) {
    const key = await s.importKey('spki', unb64(d.publicKey), { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt'])
    serverKey = { keyId: d.keyId, key }
  }
  return { ...serverKey, challenge: d.challenge }
}

async function sealValue(o: Offer, value: string): Promise<string> {
  const s = subtle()!
  const ch = enc.encode(o.challenge)
  const v = enc.encode(value)
  const payload = new Uint8Array(1 + ch.length + v.length)
  payload[0] = ch.length
  payload.set(ch, 1)
  payload.set(v, 1 + ch.length)
  const aes = await s.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt'])
  const raw = new Uint8Array(await s.exportKey('raw', aes))
  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  const ct = new Uint8Array(await s.encrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(PREFIX + o.keyId), tagLength: 128 }, aes, payload))
  const ek = new Uint8Array(await s.encrypt({ name: 'RSA-OAEP' }, o.key, raw))
  raw.fill(0)
  return `${PREFIX}${o.keyId}.${b64(ek)}.${b64(iv)}.${b64(ct)}`
}

const plainObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null)

function hasSensitive(data: unknown, url?: string, depth = 0): boolean {
  if (depth > 6) return false
  if (Array.isArray(data)) return data.some(x => hasSensitive(x, url, depth + 1))
  if (!plainObject(data)) return false
  return Object.entries(data).some(([k, v]) =>
    (typeof v === 'string' && v !== '' && isSensitive(k, url)) || ((plainObject(v) || Array.isArray(v)) && hasSensitive(v, url, depth + 1)))
}

async function walk(data: unknown, url: string | undefined, seal: (v: string) => Promise<string>, depth = 0): Promise<unknown> {
  if (depth > 6) return data
  if (Array.isArray(data)) return Promise.all(data.map(x => walk(x, url, seal, depth + 1)))
  if (!plainObject(data)) return data
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === 'string' && v !== '' && isSensitive(k, url)) out[k] = await seal(v)
    else out[k] = plainObject(v) || Array.isArray(v) ? await walk(v, url, seal, depth + 1) : v
  }
  return out
}

/**
 * A JSON body with its sensitive fields sealed for the server (sealed: true — send it with X-Finvo-Sealed: v1), or as
 * it is (no such field, an older backend, a page not on https://). The body given is never changed.
 */
export async function sealBody(url: string | undefined, data: unknown): Promise<{ data: unknown; sealed: boolean }> {
  if (!hasSensitive(data, url)) return { data, sealed: false }
  const o = await offer()
  if (!o) return { data, sealed: false }
  return { data: await walk(data, url, v => sealValue(o, v)), sealed: true }
}

/** A POST outside the API client (signing in again, changing a published password): sealed, sealed again once if refused. */
export async function postSealed(url: string, body: unknown, config: any = {}): Promise<any> {
  for (let attempt = 0; ; attempt++) {
    const { data, sealed } = await sealBody(url, body)
    try {
      return await axios.post(url, data, { ...config, headers: { ...(config.headers ?? {}), ...(sealed ? { [SEALED_HEADER]: 'v1' } : {}) } })
    } catch (e: any) {
      if (attempt === 0 && sealed && e?.response?.status === 400 && SEAL_AGAIN.includes(e.response.data?.reason)) { forgetServerKey(); continue }
      throw e
    }
  }
}

// ── this tab's key, for one-time secrets in answers ─────────────────────────────

let tabKey: Promise<CryptoKeyPair> | null = null
let tabSpki: string | null = null

function tabKeyPair(): Promise<CryptoKeyPair> {
  // the private key is made non-extractable: it can't be read out of the browser's crypto, even by this page
  tabKey ??= subtle()!.generateKey({ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    false, ['encrypt', 'decrypt']) as Promise<CryptoKeyPair>
  return tabKey
}

/** Makes this tab's key pair ahead of time (the page has just loaded), so the first change sent doesn't wait for it. */
export function warmUp() {
  if (!subtle()) return
  const start = () => { replyKey().catch(() => { /* made on first use instead */ }) }
  const idle = (window as any).requestIdleCallback
  if (typeof idle === 'function') idle(start, { timeout: 2000 }); else setTimeout(start, 200)
}

/** This tab's public key (SPKI, base64url) for X-Finvo-Reply-Key — null where the browser's crypto is off. */
export async function replyKey(): Promise<string | null> {
  const s = subtle()
  if (!s) return null
  if (tabSpki) return tabSpki
  try {
    tabSpki = b64(new Uint8Array(await s.exportKey('spki', (await tabKeyPair()).publicKey)))
  } catch {
    return null
  }
  return tabSpki
}

async function openValue(envelope: string): Promise<string> {
  const s = subtle()!
  const [, kid, ek, iv, ct] = envelope.split('.')
  const pair = await tabKeyPair()
  const raw = await s.decrypt({ name: 'RSA-OAEP' }, pair.privateKey, unb64(ek))
  const aes = await s.importKey('raw', raw, { name: 'AES-GCM' }, false, ['decrypt'])
  const payload = new Uint8Array(await s.decrypt({ name: 'AES-GCM', iv: unb64(iv), additionalData: enc.encode(PREFIX + kid), tagLength: 128 }, aes, unb64(ct)))
  return new TextDecoder().decode(payload.slice(1 + payload[0]))
}

const looksSealed = (v: unknown): v is string => typeof v === 'string' && v.startsWith(PREFIX) && v.split('.').length === 5 && v.length > 300

/** An answer with the one-time secrets sealed for this tab opened (any depth); the rest as it came. */
export async function openReply<T>(data: T): Promise<T> {
  if (!tabKey || !subtle()) return data
  // most answers hold nothing sealed: one quick look before walking them value by value (a large import preview)
  try { if (!JSON.stringify(data)?.includes('"' + PREFIX)) return data } catch { /* not JSON: walked below */ }
  const open = async (v: unknown, depth: number): Promise<unknown> => {
    if (depth > 8) return v
    if (looksSealed(v)) { try { return await openValue(v) } catch { return v } }
    if (Array.isArray(v)) return Promise.all(v.map(x => open(x, depth + 1)))
    if (plainObject(v)) {
      const out: Record<string, unknown> = {}
      for (const [k, x] of Object.entries(v)) out[k] = await open(x, depth + 1)
      return out
    }
    return v
  }
  return open(data, 0) as Promise<T>
}
