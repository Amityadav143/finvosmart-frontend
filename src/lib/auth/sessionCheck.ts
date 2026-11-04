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
import { lastServer } from '@/lib/api/client'
import { renewSession, SESSION_HEADERS } from '@/lib/auth/session'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

export interface SignInProblem {
  /** Why the server refused the new session (AccountSecurityRules on the server): NOT_RECOGNISED, NO_TOKEN… */
  reason: string
  /**
   * The sign-in came from one backend process and the refusal from another (true), both from the same
   * one (false); null when it can't be told (no backend sent its id).
   */
  otherServer: boolean | null
  /**
   * 'app': the sign-in service took the session, but the rest of the API (outside /api/v1/auth/) refused
   * it — nginx sends the two to different backends.
   */
  part?: 'app'
}

/**
 * The problem a refused request shows — a 401, with the server's reason — and whether the backend that
 * refused it is the one that signed in ({@code signedInBy}: its X-Finvo-Instance). Null for any other answer.
 */
export function problemFrom(e: any, signedInBy: string | null = lastServer()): SignInProblem | null {
  if (e?.response?.status !== 401) return null
  const answeredBy = String(e.response.headers?.['x-finvo-instance'] ?? '')
  const reason = e.response.data?.reason
  return {
    reason: typeof reason === 'string' && /^[A-Z_]{1,40}$/.test(reason) ? reason : 'UNKNOWN',
    otherServer: signedInBy === null || (signedInBy === '' && answeredBy === '') ? null : signedInBy !== answeredBy,
  }
}

/**
 * Right after signing in or signing up, before the app opens: does the server take the new session?
 *
 * When it doesn't — two backends behind nginx (sign-in sent to one, everything else to another), a
 * backend restarted with a new random JWT secret, a proxy that drops the Authorization header — the
 * app used to open, see every request refused, and land back on the sign-in page with no reason
 * given. Now the sign-in page says what is wrong. An unclear answer (offline, a busy server) counts
 * as fine: the app opens as before.
 */
export async function checkNewSession(accessToken: string | null | undefined): Promise<SignInProblem | null> {
  if (!accessToken) return null
  const signedInBy = lastServer()       // '' when the sign-in came from a backend that sends no id (an older one)
  const headers = { Authorization: `Bearer ${accessToken}` }
  try {
    await axios.get(`${API_URL}/auth/me`, { headers, timeout: 15000 })
  } catch (e: any) {
    return problemFrom(e, signedInBy)
  }
  // …and the rest of the API, which nginx may send to another backend (a separate location for
  // /api/v1/auth/). A backend from before 29 October has no /session: its 404 says nothing.
  try {
    await axios.get(`${API_URL}/session`, { headers, timeout: 15000 })
    return null
  } catch (e: any) {
    const p = problemFrom(e, signedInBy)
    return p ? { ...p, part: 'app' } : null
  }
}

/**
 * The session of this browser (its refresh cookie), checked before the sign-in page sends anyone on to the app
 * (it used to send them straight on, and an old session then came back here after a burst of refused requests).
 * 'ok' — the server renewed it (`renewed` is the new session); 'ended' — the server refused it: forget it;
 * 'unknown' — no clear answer (offline, a restart): keep it and stay.
 */
export async function verifyStoredSession(): Promise<{ state: 'ok' | 'ended' | 'unknown'; renewed?: any }> {
  const r = await renewSession()
  if (r.ok) return { state: 'ok', renewed: r.auth }
  return { state: r.ended ? 'ended' : 'unknown' }
}

/**
 * The new password chosen right after signing in with one printed in the guides, before the session
 * is kept: changed with the new session's own access token. The server answers with a fresh session
 * (other devices are signed out).
 */
export async function changePasswordAs(accessToken: string, currentPassword: string, newPassword: string) {
  const r = await axios.post(`${API_URL}/auth/change-password`, { currentPassword, newPassword },
    { headers: { Authorization: `Bearer ${accessToken}`, ...SESSION_HEADERS }, withCredentials: true, timeout: 30000 })
  return r.data?.data
}

/**
 * The note on the sign-in page after a session ended (/login?expired=1&reason=…): an ordinary ending
 * (password changed, signed out of other devices, too long ago) or a server set-up problem.
 */
export function sessionEndedNote(reason: string): string {
  const again = ' Sign in again; if this keeps happening straight after signing in, the server set-up needs checking.'
  switch (reason) {
    case 'NOT_RECOGNISED':
      return 'You were signed out because the server no longer recognised your sign-in — it restarted with a new secret, or a different server answered.' + again
    case 'UNKNOWN_USER':
      return 'You were signed out because the server couldn’t find your login — it was removed, or a different server answered.' + again
    case 'NO_TOKEN':
      return 'You were signed out because your sign-in didn’t reach the server — something between your browser and the server removed it.' + again
    case 'NOT_AN_API_ADDRESS':
      return 'You were signed out because the server got a request at an address it doesn’t know: something between your browser '
        + 'and the server changes it (in nginx, location /api/ must have proxy_pass http://127.0.0.1:PORT; with nothing after the port).' + again
    case 'ACCOUNT_OFF':
      return 'Your login has been switched off. Your company’s admin can switch it back on under Settings → Users.'
    case 'SIGNED_OUT':
      return 'Your session ended — you signed out (in another tab too), the password was changed or reset, or “Sign out of all other devices” '
        + 'was used — or this device was signed out under Sign-in & security on another one. Sign in again to pick up where you left off.'
    case 'LOGGED_OUT':
      return 'You have signed out. This device’s sign-in no longer works anywhere — sign in again whenever you need to.'
    case 'REUSED':
      return 'For your safety you were signed out: this sign-in was used from two places at once, which happens when it is copied. '
        + 'Sign in again; if you didn’t expect this, change your password.'
    case 'PASSWORD_CHANGE_REQUIRED':
      return 'Sign in again and choose a new password to continue.'
    default:
      return 'Your session ended. Sign in again to pick up where you left off.'
  }
}

/** What went wrong and what to do — for the person who runs the server (in a self-hosted set-up, often the person signing in). */
export function explainSignInProblem(p: SignInProblem): { title: string; detail: string; fix: string } {
  const oneBackend = 'On the server, run a single Finvosmart backend and point every nginx /api/ location — including '
    + '/api/v1/auth/login and /api/v1/auth/register — at its port. See DEPLOYMENT_MANUAL_VPS.md, “Signed in, then back at the sign-in page”.'
  if (p.part === 'app')
    return { title: 'Signed in — but the rest of the app refused the session',
      detail: `The sign-in service accepted it, but the next request outside it (/api/v1/session) was refused (${p.reason})`
        + (p.otherServer ? ' by a different backend process: nginx sends /api/v1/auth/ to one backend and the rest of /api/ to another.'
                         : '. Usually that is nginx sending /api/v1/auth/ to one backend and the rest of /api/ to another.'),
      fix: 'In nginx, send all of /api/ to one backend: a single location /api/ with proxy_pass http://127.0.0.1:PORT; — remove any '
        + 'separate location for /api/v1/auth/. Stop any second backend left running'
        + (p.reason === 'NOT_RECOGNISED' ? ', or give every backend the same JWT_SECRET.' : '.') }
  switch (p.reason) {
    case 'NOT_RECOGNISED':
      if (p.otherServer) return { title: 'Signed in — but a different server answered next',
            detail: 'Your sign-in came from one Finvosmart backend, and the very next request reached another one that doesn’t accept it, so the app can’t open.',
            fix: oneBackend + ' Give every backend the same JWT_SECRET.' }
      return p.otherServer === false
        ? { title: 'Signed in — but the sign-in was changed on its way back to the server',
            detail: 'The backend that issued the sign-in couldn’t verify it on the very next request, so something between the browser and the server changes the Authorization header.',
            fix: 'Check the proxy, CDN or firewall settings in front of the API: the Authorization header must be passed on unchanged.' }
        : { title: 'Signed in — but the server didn’t recognise the sign-in',
            detail: 'The backend that answered couldn’t verify the sign-in it should have issued: two backends with different secrets are running, or the backend restarted with a new random secret.',
            fix: 'Set a fixed JWT_SECRET (sudo bash scripts/set-jwt-secret.sh) and run a single backend. ' + oneBackend }
    case 'UNKNOWN_USER':
      return { title: 'Signed in — but the next request reached a different database',
        detail: 'The backend that answered has no such login in its database: two backends with different databases are running, or nginx sends sign-in to an old one.',
        fix: oneBackend }
    case 'NO_TOKEN':
      return { title: 'Signed in — but the sign-in didn’t reach the server',
        detail: 'Something between the browser and the backend removes the Authorization header, so every request arrives without the sign-in.',
        fix: 'Check the proxy, CDN or web-host settings in front of the API: the Authorization header must be passed on (nginx passes it by default).' }
    case 'EXPIRED':
      return { title: 'Signed in — but the server says the session has already expired',
        detail: 'The server’s clock is probably wrong.',
        fix: 'On the server: timedatectl — turn on time sync (sudo timedatectl set-ntp true), then restart the backend.' }
    case 'SIGNED_OUT':
      return { title: 'Signed in — but the server ended the session straight away',
        detail: 'Usually the server’s clock is wrong, or two backends with different clocks answer.',
        fix: 'Check timedatectl on the server, and that a single backend answers. Then sign in again.' }
    case 'ACCOUNT_OFF':
      return { title: 'This login is switched off', detail: 'Your company’s admin can switch it back on under Settings → Users.', fix: '' }
    default:
      return { title: 'Signed in — but the server didn’t accept the session',
        detail: `The server refused it (${p.reason}).`, fix: 'Try again. If it keeps happening, the server set-up needs checking: ' + oneBackend }
  }
}
