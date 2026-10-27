'use client'

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

import { useEffect, useRef, useState } from 'react'
import { authApi } from '@/lib/api/auth'

/**
 * Google's own "Continue with Google" button (Google Identity Services, GIS).
 *
 * The OAuth client ID comes from the server (GET /auth/providers, set by GOOGLE_CLIENT_ID), so Google
 * sign-in is switched on or off on the server alone — no rebuild of the web app, and the browser and
 * the server can't disagree about it. Nothing is loaded from Google until the server says it is on.
 *
 * When the person finishes in Google's window, GIS gives us an ID token and `onToken` sends it to the
 * server: to sign in (login page) or to link the Google account (Settings → Sign-in & security).
 */

const GIS_SRC = 'https://accounts.google.com/gsi/client'

/** The client ID, asked once per page load (asked again after a failure). */
let clientIdAnswer: Promise<string | null> | null = null
function askClientId(): Promise<string | null> {
  if (!clientIdAnswer) {
    clientIdAnswer = authApi.providers()
      .then(p => p?.google?.clientId || null)
      .catch(() => { clientIdAnswer = null; return null })
  }
  return clientIdAnswer
}

let gisScript: Promise<boolean> | null = null
function loadGis(): Promise<boolean> {
  if ((window as any).google?.accounts?.id) return Promise.resolve(true)
  if (!gisScript) {
    gisScript = new Promise<boolean>(resolve => {
      const s = document.createElement('script')
      s.src = GIS_SRC
      s.async = true
      s.defer = true
      s.onload = () => resolve(!!(window as any).google?.accounts?.id)
      s.onerror = () => { gisScript = null; resolve(false) }     // blocked or offline: try again on the next page
      document.head.appendChild(s)
    })
  }
  return gisScript
}

// GIS keeps one callback per page; the button on screen now receives the token.
let initialisedWith: string | null = null
let onScreen: ((idToken: string) => void) | null = null

export function useGoogleSignIn(onToken: (idToken: string) => void) {
  const [clientId, setClientId] = useState<string | null | undefined>(undefined)   // undefined: still asking
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const cbRef = useRef(onToken)
  cbRef.current = onToken

  useEffect(() => {
    let live = true
    const mine = (idToken: string) => cbRef.current(idToken)
    onScreen = mine
    askClientId().then(async id => {
      if (!live) return
      setClientId(id)
      if (!id) return
      const loaded = await loadGis()
      if (!live) return
      const g = (window as any).google
      if (!loaded || !g?.accounts?.id) { setFailed(true); return }
      try {
        if (initialisedWith !== id) {
          g.accounts.id.initialize({
            client_id: id,
            callback: (response: { credential?: string }) => { if (response?.credential) onScreen?.(response.credential) },
            auto_select: false,
            cancel_on_tap_outside: true,
            use_fedcm_for_prompt: true,
          })
          initialisedWith = id
        }
        setReady(true)
      } catch {
        setFailed(true)
      }
    })
    return () => { live = false; if (onScreen === mine) onScreen = null }
  }, [])

  /** Google's One Tap prompt (the official button below is the dependable way in). */
  function prompt() {
    const g = (window as any).google
    if (g?.accounts?.id) g.accounts.id.prompt()
  }

  /**
   * Draw Google's official button into `el`. It always opens Google's window when clicked — unlike
   * One Tap, which Google holds back for a while after someone dismisses it once.
   */
  function renderButton(el: HTMLElement | null, text: 'continue_with' | 'signin_with' | 'signup_with' = 'continue_with') {
    const g = (window as any).google
    if (!el || !g?.accounts?.id) return
    el.innerHTML = ''                                                 // no second button on a re-render
    const width = Math.min(400, Math.max(200, el.clientWidth || 320))  // GIS draws 200–400px wide
    g.accounts.id.renderButton(el, {
      theme: 'outline', size: 'large', text, shape: 'rectangular', logo_alignment: 'left', width,
    })
  }

  return {
    /** Google's button can be drawn now. */
    ready,
    /** The server has Google sign-in switched on. */
    configured: !!clientId,
    /** Still asking the server. */
    checking: clientId === undefined,
    /** Switched on, but Google's script didn't load (offline, or blocked by an extension). */
    failed,
    prompt,
    renderButton,
  }
}
