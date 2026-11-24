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
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Globe, RefreshCw, ShieldAlert } from 'lucide-react'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useAuthStore } from '@/lib/store/slices/authStore'
import { renewSession } from '@/lib/auth/session'
import { RELEASE } from '@/lib/release'
import { PLATFORM_COLOR } from './theme'
import { ConsoleDiagnosis } from './ConsoleDiagnosis'

export const TABS = [
  { href: '/platform', label: 'Overview' },
  { href: '/platform/companies', label: 'Companies' },
  { href: '/platform/users', label: 'Logins' },
  { href: '/platform/payments', label: 'Payments' },
  { href: '/platform/leads', label: 'Enquiries' },
  { href: '/platform/acquisition', label: 'Sign-up sources' },
  { href: '/platform/activity', label: 'Activity' },
  { href: '/platform/admins', label: 'Administrators' },
  { href: '/platform/settings', label: 'Settings' },
]

/**
 * The console's frame: its tabs, for Finvosmart's own administrators — a super administrator of the company that
 * runs Finvosmart. Anyone else is told so, and the one who might expect it is told why and what to do (the server
 * refuses them too, on every call).
 */
export function PlatformGate({ children }: { children: React.ReactNode }) {
  const { isPlatformAdmin } = usePermissions()
  const user = useAuthStore(s => s.user)
  const path = usePathname()
  if (!isPlatformAdmin) return <ConsoleClosed />
  const current = TABS.filter(t => path === t.href || path.startsWith(t.href + '/')).sort((a, b) => b.href.length - a.href.length)[0]?.href
  return (
    <div className="space-y-5" data-testid="platform-console">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-4 py-2.5"
        style={{ background: `${PLATFORM_COLOR}0f`, border: `1px solid ${PLATFORM_COLOR}33` }} data-testid="console-banner">
        <Globe size={16} style={{ color: PLATFORM_COLOR }} aria-hidden />
        <span className="text-sm font-semibold" style={{ color: PLATFORM_COLOR }}>Finvosmart platform console</span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Every company on Finvosmart · signed in as {user?.email} ({user?.companyName ?? 'the platform company'}) · release {RELEASE}
        </span>
      </div>
      <nav aria-label="Platform console" className="flex items-center gap-1 overflow-x-auto" style={{ borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <Link key={t.href} href={t.href} aria-current={current === t.href ? 'page' : undefined} data-tab={t.label.toLowerCase()}
            className="whitespace-nowrap"
            style={{
              padding: '8px 14px', fontSize: 13, fontWeight: 600, textDecoration: 'none',
              color: current === t.href ? PLATFORM_COLOR : 'var(--text-muted)',
              borderBottom: current === t.href ? `2px solid ${PLATFORM_COLOR}` : '2px solid transparent',
            }}>{t.label}</Link>
        ))}
      </nav>
      {children}
    </div>
  )
}

/**
 * The console is closed to this login. Who might expect it is told why and what to do: a Super Admin of another
 * company (the console belongs to the company set as PLATFORM_COMPANY_ID on the server), or an administrator of the
 * platform company without the Super Admin role. "Check again" renews the session, so access given meanwhile
 * (in the console, or with scripts/platform-admin.sh on the server) shows without signing out.
 */
function ConsoleClosed() {
  const { isSuperAdmin, inPlatformCompany, hasRole } = usePermissions()
  const user = useAuthStore(s => s.user)
  const [checking, setChecking] = useState(false)
  const [answer, setAnswer] = useState<'' | 'still' | 'ended' | 'offline'>('')
  const why: 'other-company' | 'not-super-admin' | 'not-admin' =
    isSuperAdmin ? 'other-company' : inPlatformCompany && hasRole('COMPANY_ADMIN') ? 'not-super-admin' : 'not-admin'
  const company = user?.companyName || 'your company'

  const checkAgain = async () => {
    setChecking(true); setAnswer('')
    const r = await renewSession()
    setChecking(false)
    // given access: the renewed session says so, and this page becomes the console by itself
    if (r.ok) { if (r.auth?.platformAdmin !== true) setAnswer('still') }
    else setAnswer(r.ended ? 'ended' : 'offline')
  }

  if (why === 'not-admin') return (
    <div className="card max-w-lg mx-auto mt-10 text-center space-y-3" data-testid="platform-denied" data-reason={why}>
      <ShieldAlert size={28} className="mx-auto" style={{ color: 'var(--text-muted)' }} aria-hidden />
      <h1 className="text-lg font-semibold">The platform console is for Finvosmart&apos;s own administrators</h1>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        It opens for a super administrator of the company that runs Finvosmart. Your company&apos;s own settings are under Settings.
      </p>
      <Link href="/dashboard" className="btn-primary h-9 px-4 inline-flex" style={{ textDecoration: 'none' }}>Go to the dashboard</Link>
    </div>
  )

  return (
    <div className="card max-w-2xl mx-auto mt-8 space-y-4" data-testid="platform-denied" data-reason={why}>
      <div className="flex items-start gap-3">
        <ShieldAlert size={26} className="flex-shrink-0 mt-0.5" style={{ color: '#b45309' }} aria-hidden />
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">The platform console isn&apos;t open to this login yet</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            The console is for Finvosmart&apos;s own administrators: the <b>Super Admins</b> of the company that runs Finvosmart
            — the company set as <code>PLATFORM_COMPANY_ID</code> on the server (the seeded Nvgrow company unless it was changed).
          </p>
        </div>
      </div>

      <div className="rounded-lg px-4 py-3 text-sm space-y-1" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }} data-testid="denied-login">
        <p><span style={{ color: 'var(--text-muted)' }}>Signed in as</span> <b>{user?.email}</b></p>
        <p><span style={{ color: 'var(--text-muted)' }}>Company</span> <b>{company}</b>{user?.companyCode ? ` (${user.companyCode})` : ''}
          {user?.companyId && <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}> · id {user.companyId}</span>}</p>
        <p><span style={{ color: 'var(--text-muted)' }}>Roles</span> {(user?.roles ?? []).map(r => r.replace(/_/g, ' ').toLowerCase()).join(', ') || '—'}</p>
      </div>

      {why === 'other-company' ? (
        // a Super Admin: what the server itself says — its release, PLATFORM_COMPANY_ID as it got it — and the one change to make
        <div className="text-sm space-y-2" data-testid="denied-what-to-do">
          <p>This login is a Super Admin of <b>{company}</b>, but the server answered that it can&apos;t open the console.</p>
          <ConsoleDiagnosis />
        </div>
      ) : (
        <div className="text-sm space-y-2" data-testid="denied-what-to-do">
          <p>{company} runs Finvosmart, and this login is its company administrator — without the Super Admin role the console needs. Either:</p>
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>ask one of the console&apos;s administrators to give you access: Platform console → Administrators; or</li>
            <li>on the server: <code>sudo bash scripts/platform-admin.sh grant {user?.email}</code></li>
          </ol>
          <p style={{ color: 'var(--text-muted)' }}>Then press “Check again” — no need to sign out.</p>
        </div>
      )}

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        On the server, <code>sudo bash scripts/platform-admin.sh</code> shows which company runs Finvosmart and which of its logins can open the console;
        the backend says the same in its log when it starts (“Platform console: …”). This web app is release {RELEASE}.
      </p>

      {answer && (
        <p className="text-sm" role="status" data-testid="denied-check" style={{ color: answer === 'still' ? '#b45309' : 'var(--text-secondary)' }}>
          {answer === 'still' ? 'Checked with the server just now: still closed to this login.'
            : answer === 'ended' ? 'Your session has ended — sign in again.'
            : 'The server didn’t answer. Try again in a moment.'}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary h-9 px-4 inline-flex items-center gap-2" onClick={checkAgain} disabled={checking} data-action="check-again">
          <RefreshCw size={14} className={checking ? 'animate-spin' : ''} aria-hidden /> {checking ? 'Checking…' : 'Check again'}
        </button>
        {answer === 'ended'
          ? <Link href="/login" className="btn-secondary h-9 px-4 inline-flex" style={{ textDecoration: 'none' }}>Sign in</Link>
          : <Link href="/dashboard" className="btn-secondary h-9 px-4 inline-flex" style={{ textDecoration: 'none' }}>Go to the dashboard</Link>}
      </div>
    </div>
  )
}
