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
import { RELEASE } from '@/lib/release'
import { noteAddressNotice } from '@/lib/auth/publicAuth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

export interface ServerInfo {
  google: { clientId: string } | null
  /** The release the backend reports; null — a backend from before releases were reported. */
  release: string | null
  /** Sign-in codes by SMS can arrive (sandbox only until an SMS gateway is wired in); email codes always can. */
  smsCodes: boolean
}
/**
 * No usable answer: the HTTP status (null: no answer at all), whether a web page came back instead of the
 * API, and the backend's own words when it explained itself (an address that isn't the API: it says how
 * the address arrived).
 */
export interface ServerProblem { status: number | null; notApi: boolean; said?: string }
export type ServerAnswer = { info: ServerInfo } | { problem: ServerProblem }

let asked: Promise<ServerAnswer> | null = null
let settled: ServerAnswer | null = null

/**
 * Whether the sign-in pages' notice already says that the server gets the API at a changed address (even
 * the public /auth/providers refused as signed out): an error below it then just points there.
 */
export function addressNoticeShown(): boolean {
  return !!settled && 'problem' in settled && (settled.problem.status === 401 || settled.problem.status === 403) && !!settled.problem.said
}

function settle(a: ServerAnswer): ServerAnswer {
  settled = a
  noteAddressNotice(addressNoticeShown())          // (errors below the notice then point to it)
  return a
}

/**
 * What the sign-in pages need from the server — Google's client ID and the server's release — in one
 * request per page load (GET /auth/providers, public: no sign-in is sent). A failed answer is asked
 * again next time.
 */
export function askServer(): Promise<ServerAnswer> {
  if (!asked) {
    asked = axios.get(`${API_URL}/auth/providers`, { timeout: 15000 })
      .then((r): ServerAnswer => {
        const d = r.data?.data
        // a web page (the site itself) instead of the API: nginx doesn't send /api/ to the backend
        if (!d || typeof d !== 'object') return settle({ problem: { status: r.status, notApi: true } })
        return settle({ info: { google: d.google?.clientId ? { clientId: String(d.google.clientId) } : null,
                                release: typeof d.release === 'string' ? d.release : null, smsCodes: d.smsCodes === true } })
      })
      .catch((e: any): ServerAnswer => {
        asked = null
        const body = e?.response?.data
        const html = typeof body === 'string' && /<html|<!doctype/i.test(body)
        // the backend's own words, when it explained itself (an address it can't place says how it arrived)
        const said = typeof body?.error === 'string' && body.error ? body.error as string : undefined
        return settle({ problem: { status: e?.response?.status ?? null, notApi: html && e?.response?.status < 500, said } })
      })
  }
  return asked
}

/**
 * What to tell someone on a sign-in page about the server, or null when all is well: it can't be
 * reached, the API isn't where the web app looks for it, or the web app and the backend are from
 * different releases (one wasn't rebuilt or restarted after an update — the usual reason for
 * "it still doesn't work").
 */
export function serverNotice(a: ServerAnswer): { title: string; detail: string } | null {
  if ('problem' in a) {
    const { status, notApi } = a.problem
    if (status === null)
      return { title: 'Can’t reach the Finvosmart server',
               detail: 'Signing in won’t work until it answers. Check your internet connection; if nobody can sign in, the server is down.' }
    // the public sign-in address refused as if it weren't one: the backend got the request at another address
    if ((status === 401 || status === 403) && a.problem.said)
      return { title: 'The server gets the sign-in requests at a changed address',
               detail: `Even ${API_URL}/auth/providers, which is public, was refused (HTTP ${status}), so signing in can’t work: the request `
                 + 'reached a Finvosmart backend, but not at the address the web app sent it to. In nginx, location /api/ must have '
                 + 'proxy_pass http://127.0.0.1:PORT; with nothing after the port. A backend updated to this release accepts such an address '
                 + 'anyway. On the server, sudo bash scripts/check-sign-in.sh https://your-site shows what is wrong.' }
    // refused before it reached Finvosmart (no answer of its own): something in front of the server
    if (status === 401 || status === 403)
      return { title: 'Something in front of the server refuses the sign-in service',
               detail: `Requests to ${API_URL} are refused (HTTP ${status}) before they reach Finvosmart — by a password-protected folder, `
                 + 'a firewall or a CDN rule. The API must be reachable without a sign-in of its own.' }
    if (status === 404 && a.problem.said)                    // the backend says how the address arrived
      return { title: 'The sign-in service isn’t at this address', detail: a.problem.said }
    if (notApi || status === 404 || status === 405)
      return { title: 'The sign-in service isn’t at this address',
               detail: `Requests to ${API_URL} reach the website instead of the Finvosmart backend (HTTP ${status}). On the server, nginx must send /api/ to the backend — see DEPLOYMENT_MANUAL_VPS.md, section 7.` }
    if (status === 502 || status === 503 || status === 504)
      return { title: 'The Finvosmart backend isn’t running',
               detail: `The website answers but the backend behind it doesn’t (HTTP ${status}). On the server: sudo systemctl restart finvosmart-backend, then reload this page.` }
    if (status >= 500)
      return { title: 'The Finvosmart server has a problem',
               detail: `It answered with an error (HTTP ${status}). The backend’s log says why: sudo journalctl -u finvosmart-backend -n 100.` }
    return null
  }
  const theirs = a.info.release
  if (theirs === RELEASE) return null
  if (!theirs || theirs < RELEASE)
    return { title: 'The server wasn’t updated',
             detail: `This page is from the ${RELEASE} update, but the backend answering is ${theirs ? 'from ' + theirs : 'older'}. `
               + 'Rebuild it (mvn clean package -DskipTests), restart it, and check that nginx sends /api/ to that backend — not to an old one.' }
  return { title: 'The web app wasn’t updated',
           detail: `The backend is from the ${theirs} update, but this page is from ${RELEASE}. Rebuild the web app (npm ci && npm run build) and restart it.` }
}
