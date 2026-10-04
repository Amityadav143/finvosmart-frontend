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

/**
 * Loads Google Identity Services (GIS) and initialises it with the configured
 * client id. When the user completes Google sign-in, GIS calls back with an ID
 * token, which we hand to `onToken` (the login page then posts it to
 * /auth/social/google and receives a FINVOSMART JWT).
 *
 * The client id comes from NEXT_PUBLIC_GOOGLE_CLIENT_ID (a build-time env var).
 * If it isn't set, this hook stays dormant and reports `ready: false`, so the
 * login page can show a "not configured" message instead of a broken button.
 */
export function useGoogleSignIn(onToken: (idToken: string) => void) {
  const [ready, setReady] = useState(false)
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const cbRef = useRef(onToken)
  cbRef.current = onToken

  useEffect(() => {
    if (!clientId) return               // not configured — stay dormant
    if (typeof window === 'undefined') return

    const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

    function initGis() {
      const g = (window as any).google
      if (!g?.accounts?.id) return
      try {
        g.accounts.id.initialize({
          client_id: clientId,
          callback: (response: { credential?: string }) => {
            if (response?.credential) cbRef.current(response.credential)
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true,
        })
        setReady(true)
      } catch {
        setReady(false)
      }
    }

    // If the script is already present, just initialise.
    if ((window as any).google?.accounts?.id) { initGis(); return }

    // Otherwise inject the GIS script once.
    let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
    if (!script) {
      script = document.createElement('script')
      script.src = SCRIPT_SRC
      script.async = true
      script.defer = true
      script.onload = initGis
      document.head.appendChild(script)
    } else {
      script.addEventListener('load', initGis)
    }
  }, [clientId])

  /** Trigger the Google sign-in prompt / one-tap. */
  function prompt() {
    const g = (window as any).google
    if (g?.accounts?.id) g.accounts.id.prompt()
  }

  /** Render an official Google button into the given element (optional). */
  /**
   * Render Google's official "Sign in with Google" button into `el`. Unlike the
   * One Tap prompt, this always opens the Google popup when clicked — Google
   * suppresses One Tap for a cooling-off period after a user dismisses it once,
   * which made a custom button that called prompt() silently do nothing.
   */
  function renderButton(el: HTMLElement | null) {
    const g = (window as any).google
    if (!el || !g?.accounts?.id) return
    el.innerHTML = ''                                       // avoid stacking duplicates on re-render
    const width = Math.min(400, Math.max(200, el.clientWidth || 320))   // GIS accepts 200–400px
    g.accounts.id.renderButton(el, {
      theme: 'outline', size: 'large', text: 'continue_with',
      shape: 'rectangular', logo_alignment: 'left', width,
    })
  }

  return { ready, configured: !!clientId, prompt, renderButton }
}
