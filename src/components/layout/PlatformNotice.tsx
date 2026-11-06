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

import { useState } from 'react'
import { AlertTriangle, Info, X } from 'lucide-react'
import { usePlatformInfo } from '@/lib/platformInfo'

/**
 * Finvosmart's notice to everyone (Platform settings → Sign-ups and notices): planned maintenance and the like —
 * above every page of the app and on the sign-in page, until its last day. It can be put away for this visit.
 */
export function PlatformNotice({ compact = false }: { compact?: boolean }) {
  const { notice } = usePlatformInfo()
  const [hidden, setHidden] = useState<string | null>(null)
  if (!notice || !notice.text || hidden === notice.text) return null
  const warn = notice.tone === 'WARNING'
  const tone = warn ? { bg: 'rgba(217,119,6,0.12)', border: 'rgba(217,119,6,0.40)', ink: '#b45309' }
                    : { bg: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.30)', ink: '#1d4ed8' }
  const Icon = warn ? AlertTriangle : Info
  return (
    <div role={warn ? 'alert' : 'status'} data-testid="platform-notice" data-tone={notice.tone}
      className={compact ? 'flex items-start gap-2 rounded-xl px-3 py-2 text-sm' : 'flex items-start gap-2 px-4 py-2 text-sm'}
      style={{ background: tone.bg, border: compact ? `1px solid ${tone.border}` : undefined, borderBottom: `1px solid ${tone.border}`, color: tone.ink }}>
      <Icon size={15} className="mt-0.5 flex-shrink-0" aria-hidden />
      <span className="flex-1 min-w-0">{notice.text}</span>
      {!compact && (
        <button type="button" onClick={() => setHidden(notice.text)} aria-label="Hide this notice" className="flex-shrink-0"
          style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: 2 }}>
          <X size={14} />
        </button>
      )}
    </div>
  )
}
