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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

export interface SignInProblem {
  /** Why the server refused the new session (AccountSecurityRules on the server): NOT_RECOGNISED, NO_TOKEN… */
  reason: string
  /**
   * The sign-in came from one backend process and the refusal from another (true), both from the same
   * one (false); null when it can't be told (no backend sent its id).
   */
  otherServer: boolean | null
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
  try {
    await axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 15000 })
    return null
  } catch (e: any) {
    if (e?.response?.status !== 401) return null
    const answeredBy = String(e.response.headers?.['x-finvo-instance'] ?? '')
    const reason = e.response.data?.reason
    return {
      reason: typeof reason === 'string' && /^[A-Z_]{1,40}$/.test(reason) ? reason : 'UNKNOWN',
      otherServer: signedInBy === null || (signedInBy === '' && answeredBy === '') ? null : signedInBy !== answeredBy,
    }
  }
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
    case 'ACCOUNT_OFF':
      return 'Your login has been switched off. Your company’s admin can switch it back on under Settings → Users.'
    case 'SIGNED_OUT':
      return 'Your session ended — the password was changed or reset, or “Sign out of all other devices” was used. Sign in again to pick up where you left off.'
    default:
      return 'Your session ended. Sign in again to pick up where you left off.'
  }
}

/** What went wrong and what to do — for the person who runs the server (in a self-hosted set-up, often the person signing in). */
export function explainSignInProblem(p: SignInProblem): { title: string; detail: string; fix: string } {
  const oneBackend = 'On the server, run a single Finvosmart backend and point every nginx /api/ location — including '
    + '/api/v1/auth/login and /api/v1/auth/register — at its port. See DEPLOYMENT_MANUAL_VPS.md, “Signed in, then back at the sign-in page”.'
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
