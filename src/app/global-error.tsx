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

// global-error.tsx catches errors thrown in the root layout itself, which the
// route-segment error.tsx cannot. It must render its own <html> and <body>.

import { useEffect } from 'react'

export default function GlobalError({
  error, reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[FINVOSMART Global Error]', error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#0B0B1A', color: '#F4F5FA' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
          <div style={{ textAlign: 'center', maxWidth: '420px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '28px' }}>⚠️</div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '10px' }}>Something went wrong</h1>
            <p style={{ fontSize: '14px', color: '#9CA3AF', lineHeight: 1.7, marginBottom: '28px' }}>
              {error.message || 'A critical error occurred. Please try reloading the application.'}
            </p>
            <button
              onClick={reset}
              style={{ padding: '12px 28px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 600, background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#1A1B4B' }}
            >
              Reload application
            </button>
            {error.digest && (
              <p style={{ fontSize: '12px', marginTop: '20px', color: '#6B7280', fontFamily: 'monospace' }}>
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}
