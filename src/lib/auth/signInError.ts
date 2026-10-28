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

/**
 * Why a password sign-in didn't work, said on the page (not in a toast that vanishes) and with what
 * to do: the company code isn't known, the email or password isn't right (and that five wrong tries
 * lock the login), the login is locked, too many tries from this network, or the server can't be
 * reached or answers with an error. The server's own words are kept for everything else.
 */
export function signInError(e: any, companyCode: string): string {
  const res = e?.response
  if (!res) return 'Can’t reach the Finvosmart server. Check your connection and try again — if it keeps happening, the server is down.'
  const d = res.data
  const said: string | null = typeof d?.error === 'string' && d.error ? d.error : typeof d?.message === 'string' && d.message ? d.message : null
  const code = companyCode.trim().toUpperCase()
  if (res.status === 429)
    return 'Too many sign-in attempts from your network just now. Wait a minute, then try again.'
  if (said === 'Invalid company code')
    return `There’s no company with the code ${code}. It’s in your welcome email — or sign in with a code sent to you instead, which needs no company code.`
  if (said === 'Invalid credentials')
    return `The email or password isn’t right for ${code}. Passwords are case-sensitive. After 5 wrong tries the login is locked for 30 minutes — “Forgot password?” sets a new one.`
  if (said && said.startsWith('Account locked'))
    return `${said} “Forgot password?” sets a new password and unlocks it straight away.`
  if (said) return said
  if (res.status === 404 || res.status === 405)
    return `The sign-in service wasn’t found at this address (HTTP ${res.status}). The server set-up needs checking: nginx must send /api/ to the Finvosmart backend.`
  if (res.status >= 500)
    return `The server couldn’t sign you in just now (HTTP ${res.status}). Try again in a minute — if it keeps happening, the backend’s log says why.`
  return 'Signing in didn’t work. Please try again.'
}
