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

/**
 * Someone already signed in who opens the homepage goes straight to their dashboard. The
 * homepage itself stays a server-rendered page (what visitors and search engines get); while
 * the redirect runs, a plain cover hides it so a signed-in person doesn't see it flash by.
 */
export default function SignedInRedirect() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard')
  }, [isAuthenticated, router])

  if (!mounted || !isAuthenticated) return null
  return <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'var(--bg-base)' }} />
}
