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

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useState } from 'react'
import { ThemeProvider, useTheme } from '@/lib/context/ThemeContext'

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
  const [qc] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (count: any, err: any) => count < 2 && err?.response?.status !== 401 && err?.response?.status !== 403,
        refetchOnWindowFocus: false,
      },
    },
  }))
  return (
    <ThemeProvider>
      <QueryClientProvider client={qc}>
        {children}
        <ToasterThemed />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
