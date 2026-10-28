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
import { askServer, serverNotice } from '@/lib/auth/server'

/**
 * On the sign-in pages: a server that can't be reached, an API that isn't where the web app looks
 * for it, or a web app and backend from different updates — said before anyone types a password.
 */
export function ServerNotice() {
  const [note, setNote] = useState<{ title: string; detail: string } | null>(null)
  useEffect(() => {
    let live = true
    askServer().then(a => { if (live) setNote(serverNotice(a)) })
    return () => { live = false }
  }, [])
  if (!note) return null
  return (
    <div role="status" data-testid="server-notice"
         style={{ marginBottom: '18px', padding: '12px 14px', borderRadius: '12px', background: 'rgba(217,119,6,0.08)',
                  border: '1px solid rgba(217,119,6,0.35)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
      <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>{note.title}</p>
      <p style={{ margin: 0 }}>{note.detail}</p>
    </div>
  )
}
