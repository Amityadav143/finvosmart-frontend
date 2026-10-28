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

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/slices/authStore'
import { verifyStoredSession } from '@/lib/auth/sessionCheck'

/**
 * Someone already signed in who opens the homepage goes straight to their dashboard — once the
 * server has taken the saved session (renewed if need be). A session it refuses is forgotten and the
 * homepage shown: it used to open the dashboard, fail, and land on the sign-in page. The homepage
 * itself stays a server-rendered page (what visitors and search engines get); while the check runs,
 * a plain cover hides it so a signed-in person doesn't see it flash by.
 */
export default function SignedInRedirect() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    if (!isAuthenticated) { setChecking(false); return }
    let live = true
    const saved = useAuthStore.getState()
    verifyStoredSession(saved.accessToken, saved.refreshToken).then(v => {
      const now = useAuthStore.getState()
      if (!live || now.accessToken !== saved.accessToken) return     // the session changed meanwhile
      if (v.state === 'ok') {
        if (v.renewed) saved.setAuth(v.renewed)
        router.replace('/dashboard')
      } else {
        if (v.state === 'ended') saved.logout()
        setChecking(false)                      // no clear answer: show the homepage, keep the session
      }
    })
    return () => { live = false }
  }, [isAuthenticated, router])

  if (!mounted || !isAuthenticated || !checking) return null
  return <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'var(--bg-base)' }} />
}
