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

import { ReactNode } from 'react'
import Link from 'next/link'
import { Hourglass } from 'lucide-react'
import { PREVIEWS_ON, PREVIEW_INFO, type PreviewFeature } from '@/lib/previews'

/**
 * Shows a feature that still runs on demo data only when previews are switched on; otherwise
 * says plainly that it isn't available yet, and points to where the real thing lives.
 */
export function PreviewGate({ feature, children }: { feature: PreviewFeature; children: ReactNode }) {
  if (PREVIEWS_ON) return <>{children}</>
  const info = PREVIEW_INFO[feature]
  return (
    <div className="max-w-xl mx-auto mt-10">
      <div className="card text-center space-y-3 py-10 px-6">
        <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center" style={{ background: 'var(--gold-muted)' }}>
          <Hourglass size={22} style={{ color: 'var(--gold)' }} aria-hidden />
        </div>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{info.name} isn't available yet</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          It's still being built, so it's switched off — nothing here would come from your own books yet.
        </p>
        {info.instead && (
          <>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{info.instead.why}</p>
            <Link href={info.instead.href} className="btn-primary h-9 text-sm inline-flex">{info.instead.label}</Link>
          </>
        )}
        {!info.instead && <Link href="/dashboard" className="btn-secondary h-9 text-sm inline-flex">Back to the dashboard</Link>}
      </div>
    </div>
  )
}
