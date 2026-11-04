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

import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useState } from 'react'
import { ThemeProvider, useTheme } from '@/lib/context/ThemeContext'
import { queryClientRef } from '@/lib/queryClientRef'

function ToasterThemed() {
  const { isDark } = useTheme()
  return (
    <Toaster position="bottom-right" toastOptions={{
      duration: 3500,
      style: {
        background: isDark ? '#182540' : '#ffffff',
        border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
        color: isDark ? '#eef2fc' : '#1a1208',
        fontSize: '13px',
        fontFamily: "'Geist', system-ui, sans-serif",
        borderRadius: '12px',
      },
      success: { iconTheme: { primary: '#22c55e', secondary: isDark ? '#182540' : '#fff' } },
      error:   { iconTheme: { primary: '#ef4444', secondary: isDark ? '#182540' : '#fff' } },
    }} />
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => {
    const client: QueryClient = new QueryClient({
      mutationCache: new MutationCache({
        // Every create, edit or delete — saved or refused — refreshes what is on screen, so a list always shows
        // what the server holds now: a page that refreshed the wrong list, or a save that failed after the record
        // was stored, used to leave the list out of date until the page was reloaded. A mutation that keeps its
        // own data up to date (marking attendance cell by cell) opts out with meta: { refresh: false }.
        onSettled: (_data, _error, _variables, _context, mutation) => {
          if ((mutation.options.meta as { refresh?: boolean } | undefined)?.refresh === false) return
          client.invalidateQueries({ refetchType: 'active' })
        },
      }),
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          // 402: the trial has ended (read-only) — asking again changes nothing
          retry: (count: any, err: any) => count < 2 && ![401, 402, 403, 404].includes(err?.response?.status),
          refetchOnWindowFocus: false,
        },
      },
    })
    queryClientRef.current = client
    return client
  })
  return (
    <ThemeProvider>
      <QueryClientProvider client={qc}>
        {children}
        <ToasterThemed />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
