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

import { startTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

/**
 * A store's page that couldn't be made just now — the API down for a moment (a restart), or a fault. Not "not found":
 * the store may well be there, so the customer is asked to try again. (The server's log has the cause; the Error ID
 * below is the one it is logged under.)
 */
export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter()
  useEffect(() => { console.error('[finvo] the store page failed', error) }, [error])
  return (
    <div role="main" className="min-h-[70vh] flex items-center justify-center p-6 bg-white" data-testid="store-error">
      <div className="text-center max-w-sm">
        <h1 className="text-xl font-semibold mb-2" style={{ color: '#0f172a' }}>This store can&apos;t be shown just now</h1>
        <p className="text-sm mb-6" style={{ color: '#64748b', lineHeight: 1.7 }}>
          Something went wrong while loading it. Please try again in a minute.
        </p>
        {/* a server page is made again on the server: refresh, then clear the error */}
        <button type="button" onClick={() => startTransition(() => { router.refresh(); reset() })}
          className="inline-flex items-center gap-2 text-sm font-semibold px-5 h-10 rounded-full text-white" style={{ background: '#0f172a' }}>
          <RefreshCw className="w-4 h-4" aria-hidden />Try again
        </button>
        {error.digest && <p className="text-xs mt-4 font-mono" style={{ color: '#94a3b8' }}>Error ID: {error.digest}</p>}
      </div>
    </div>
  )
}
