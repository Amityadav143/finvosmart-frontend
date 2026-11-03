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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

/**
 * The public sign-in endpoints: signing in and up, renewing, the password-reset link, sign-in codes,
 * Google, the second sign-in step, the server's sign-in options. They never get the saved session
 * (an old one sent along only made the server log a refused sign-in for every attempt), and their
 * 401 is the page's to show — never a reason to renew the session or leave the page.
 */
export const PUBLIC_AUTH = /^\/?auth\/(login|register|refresh|forgot-password|reset-password|otp\/|social\/|providers|mfa\/verify)/
export const isPublicAuth = (url?: string) => !!url && PUBLIC_AUTH.test(url.replace(API_URL, ''))

/**
 * What a 401 from one of those means. They are public, so the backend never refuses them as signed out —
 * an older backend did only for an address it didn't know: one changed on the way (nginx's proxy_pass with
 * a path after the port cuts "/api" off). It answered "Your session has ended. Please sign in again.",
 * which is what people saw when they tried to sign in, sign up or reset a password.
 */
export const ADDRESS_REFUSED =
  'This didn’t reach Finvosmart’s sign-in service: the server answered “your session has ended” (HTTP 401), as an older '
  + 'Finvosmart backend does for an address it doesn’t know. Something between the browser and the backend changes the address — '
  + 'in nginx, location /api/ must have proxy_pass http://127.0.0.1:PORT; with nothing after the port. A backend updated to '
  + 'this release accepts such an address anyway. On the server, sudo bash scripts/check-sign-in.sh https://your-site shows '
  + 'what is wrong.'

/** …when the notice above it (ServerNotice) already says how to put it right. */
export const ADDRESS_REFUSED_SHORT =
  'This didn’t reach Finvosmart’s sign-in service: the server answered “your session has ended” (HTTP 401) because the '
  + 'address is changed on its way to the backend — the note above says how to put it right.'

let addressNotice = false
/** Told by the sign-in pages' notice (lib/auth/server.ts) whether it says the server gets the API at a changed address. */
export function noteAddressNotice(shown: boolean) { addressNotice = shown }

/** The message for a public sign-in endpoint refused as signed out: in full, or pointing at the notice that says it. */
export function addressRefused(): string {
  return addressNotice ? ADDRESS_REFUSED_SHORT : ADDRESS_REFUSED
}

/**
 * A 403 whose body is Spring's "Invalid CORS request": the backend took the request for one from another
 * website, because this site's address isn't among its allowed origins (CORS_ORIGINS). Browsers send the
 * site's address (Origin) with every sign-in, sign-up and save, so none of them worked.
 */
export function corsRefused(e: any): boolean {
  const d = e?.response?.data
  return e?.response?.status === 403 && typeof d === 'string' && /invalid cors request/i.test(d)
}

export function corsRefusedMessage(): string {
  const here = typeof window === 'undefined' ? 'this site’s address' : window.location.origin
  return `The backend refused this as a request from another website (CORS): ${here} isn’t among the addresses it allows. `
    + `Add it to CORS_ORIGINS in the backend’s settings (or set APP_BASE_URL to it) and restart the backend.`
}
