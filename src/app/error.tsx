'use client'
/*
 * FINVOSMART — India's Business Operating System
 *
 * Copyright (c) 2025-2026 Navgrow Engineering Service Pvt. Ltd.
 * CIN: U29302WB2025PTC281015
 *
 * All rights reserved. This source code is proprietary and confidential.
 * Unauthorized copying, distribution, modification, or use of this file,
 * via any medium, is strictly prohibited without prior written permission.
 */

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function Error({
  error, reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[FINVOSMART Error]', error)
  }, [error])

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <div
          style={{ width:'56px', height:'56px', borderRadius:'16px', background:'rgba(239,68,68,0.1)',
            display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}
        >
          <AlertTriangle size={24} color="#ef4444" />
        </div>
        <h2 className="font-serif text-xl mb-2" style={{ color:'var(--text-primary)' }}>
          Something went wrong
        </h2>
        <p className="text-sm mb-6" style={{ color:'var(--text-muted)', lineHeight:1.7 }}>
          {error.message || 'An unexpected error occurred. Our team has been notified.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button aria-label="Retry" onClick={reset} className="btn-primary h-10 px-5 text-sm"><RefreshCw size={15} />Try again
          </button>
          <button onClick={() => window.location.href='/dashboard'} className="btn-secondary h-10 px-5 text-sm">
            Go to Dashboard
          </button>
        </div>
        {error.digest && (
          <p className="text-xs mt-4 font-mono" style={{ color:'var(--text-muted)' }}>
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
