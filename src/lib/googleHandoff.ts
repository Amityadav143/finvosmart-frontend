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
 * A Google sign-in carried from the sign-in page to the sign-up page, or back, so the person doesn't
 * go through Google's window twice: "no login uses this address — start a company with it?", or "this
 * Google account already has a login — sign in instead?". Kept in memory only (never in storage), for
 * the next page to take once; Google's ID token lasts an hour, a handed-over one is used within ten minutes.
 */

let pending: { idToken: string; at: number } | null = null

export function handOverGoogleSignIn(idToken: string) {
  pending = { idToken, at: Date.now() }
}

/** The handed-over ID token, once; null when there is none (or it is too old to be worth trying). */
export function takeGoogleSignIn(): string | null {
  const p = pending
  pending = null
  return p && Date.now() - p.at < 10 * 60 * 1000 ? p.idToken : null
}
