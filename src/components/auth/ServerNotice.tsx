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
import { askServer, peopleNotice, serverNotice } from '@/lib/auth/server'
import { diagnosing, logForAdmin } from '@/lib/auth/setupNotes'

/**
 * On the sign-in pages, before anyone types a password: the server can't be reached, or isn't available just now —
 * in plain words, and only when signing in can't work. How the server is set up (an API that isn't where the web app
 * looks for it, a web app and backend from different updates…) is for whoever runs it: in the browser's developer
 * console, and on the page when its address ends in ?check (lib/auth/setupNotes).
 */
export function ServerNotice() {
  const [note, setNote] = useState<{ title: string; detail: string; setup: boolean } | null>(null)
  useEffect(() => {
    let live = true
    askServer().then(a => {
      if (!live) return
      const setup = serverNotice(a)
      if (setup) logForAdmin(`${setup.title}: ${setup.detail}`)
      const shown = diagnosing() ? setup : peopleNotice(a)
      setNote(shown ? { ...shown, setup: shown === setup } : null)
    })
    return () => { live = false }
  }, [])
  if (!note) return null
  return (
    <div role="status" data-testid="server-notice" data-setup={String(note.setup)}
         style={{ marginBottom: '18px', padding: '12px 14px', borderRadius: '12px', background: 'rgba(217,119,6,0.08)',
                  border: '1px solid rgba(217,119,6,0.35)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
      <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>{note.title}</p>
      <p style={{ margin: 0 }}>{note.detail}</p>
    </div>
  )
}
