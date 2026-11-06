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

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'
import { usePermissions } from '@/lib/hooks/usePermissions'

const TABS = [
  { href: '/platform', label: 'Overview' },
  { href: '/platform/companies', label: 'Companies' },
  { href: '/platform/settings', label: 'Settings' },
]

/**
 * The console's frame: its tabs, for Finvosmart's own administrators — a super administrator of the company that
 * runs Finvosmart. Anyone else is told so (the server refuses them too, on every call).
 */
export function PlatformGate({ children }: { children: React.ReactNode }) {
  const { isPlatformAdmin } = usePermissions()
  const path = usePathname()
  if (!isPlatformAdmin) return (
    <div className="card max-w-lg mx-auto mt-10 text-center space-y-3" data-testid="platform-denied">
      <ShieldAlert size={28} className="mx-auto" style={{ color: 'var(--text-muted)' }} aria-hidden />
      <h1 className="text-lg font-semibold">The platform console is for Finvosmart&apos;s own administrators</h1>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        It opens for a super administrator of the company that runs Finvosmart. Your company&apos;s own settings are under Settings.
      </p>
      <Link href="/dashboard" className="btn-primary h-9 px-4 inline-flex" style={{ textDecoration: 'none' }}>Go to the dashboard</Link>
    </div>
  )
  const current = TABS.filter(t => path === t.href || path.startsWith(t.href + '/')).sort((a, b) => b.href.length - a.href.length)[0]?.href
  return (
    <div className="space-y-5" data-testid="platform-console">
      <nav aria-label="Platform console" className="flex flex-wrap items-center gap-1" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="text-xs font-semibold uppercase tracking-wide mr-3" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Platform</span>
        {TABS.map(t => (
          <Link key={t.href} href={t.href} aria-current={current === t.href ? 'page' : undefined} data-tab={t.label.toLowerCase()}
            style={{
              padding: '8px 14px', fontSize: 13, fontWeight: 600, textDecoration: 'none',
              color: current === t.href ? 'var(--gold)' : 'var(--text-muted)',
              borderBottom: current === t.href ? '2px solid var(--gold)' : '2px solid transparent',
            }}>{t.label}</Link>
        ))}
      </nav>
      {children}
    </div>
  )
}
