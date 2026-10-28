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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

export interface ServerInfo {
  google: { clientId: string } | null
  /** The release the backend reports; null — a backend from before releases were reported. */
  release: string | null
  /** Sign-in codes by SMS can arrive (sandbox only until an SMS gateway is wired in); email codes always can. */
  smsCodes: boolean
}
/** No usable answer: the HTTP status (null: no answer at all) and whether a web page came back instead of the API. */
export interface ServerProblem { status: number | null; notApi: boolean }
export type ServerAnswer = { info: ServerInfo } | { problem: ServerProblem }

let asked: Promise<ServerAnswer> | null = null

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
        if (!d || typeof d !== 'object') return { problem: { status: r.status, notApi: true } }
        return { info: { google: d.google?.clientId ? { clientId: String(d.google.clientId) } : null,
                         release: typeof d.release === 'string' ? d.release : null, smsCodes: d.smsCodes === true } }
      })
      .catch((e: any): ServerAnswer => {
        asked = null
        const html = typeof e?.response?.data === 'string' && /<html|<!doctype/i.test(e.response.data)
        return { problem: { status: e?.response?.status ?? null, notApi: html && e?.response?.status < 500 } }
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
