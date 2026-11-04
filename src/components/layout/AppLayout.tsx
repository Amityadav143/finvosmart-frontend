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

import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/slices/authStore'
import { followOtherTabs, forgetHere, renewSession } from '@/lib/auth/session'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { TrialBanner } from '../billing/TrialBanner'
import { CommandPalette } from '../ui/CommandPalette'
import { ShortcutsHelp } from './ShortcutsHelp'
import { useCreateAllowed } from './QuickCreate'
import { useIndustry } from '@/lib/hooks/useIndustry'
import { CREATE_ACTIONS, GO_TO } from '@/lib/quickCreate'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { goTo } from '@/lib/hooks/useUrlParams'

/** Typing in a box (or a menu) must never trigger a shortcut. */
function typing(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null
  if (!t) return false
  const tag = t.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable
}

/** Set inside the app shell, so a second AppLayout further down renders only its page. */
const InShell = createContext(false)

/**
 * The signed-in app: sidebar, top bar, search and shortcuts around the page. A layout lower in
 * the tree that wraps it again gets the page alone — two shells meant two menus on screen and
 * every shortcut handled twice.
 */
export function AppLayout({ children }: { children: React.ReactNode }) {
  if (useContext(InShell)) return <>{children}</>
  return <InShell.Provider value={true}><Shell>{children}</Shell></InShell.Provider>
}

function Shell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const createAllowed = useCreateAllowed()
  const { canAny, isSuperAdmin } = usePermissions()
  const { visible } = useIndustry()
  // the latest permission checks, read by the one keyboard listener below
  const perms = useRef({ createAllowed, canAny, isSuperAdmin, visible })
  perms.current = { createAllowed, canAny, isSuperAdmin, visible }
  // The saved session is read from the browser after the first render. Deciding before that
  // sent signed-in people to the login page on every refresh or opened link.
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true))
    setHydrated(useAuthStore.persist.hasHydrated())
    return unsub
  }, [])

  useEffect(() => {
    if (!hydrated || isAuthenticated) return
    const here = window.location.pathname + window.location.search
    router.replace(here && here !== '/' ? `/login?next=${encodeURIComponent(here)}` : '/login')
  }, [hydrated, isAuthenticated, router])

  // After a reload the access token (kept in memory only) is gone: the session is renewed with its cookie before
  // the app shows anything. Refused: the session is over (the sign-in page says why). No answer: say so and retry.
  const accessToken = useAuthStore(s => s.accessToken)
  const [renewal, setRenewal] = useState<'idle' | 'renewing' | 'offline'>('idle')
  const renew = useCallback(() => {
    setRenewal('renewing')
    renewSession().then(r => {
      if (r.ok) { setRenewal('idle'); return }
      if (!r.ended) { setRenewal('offline'); return }
      forgetHere()
      const here = window.location.pathname + window.location.search
      window.location.href = `/login?expired=1${r.reason && /^[A-Z_]{1,40}$/.test(r.reason) ? `&reason=${r.reason}` : ''}&next=${encodeURIComponent(here)}`
    })
  }, [])
  useEffect(() => {
    if (hydrated && isAuthenticated && !accessToken && renewal === 'idle') renew()
  }, [hydrated, isAuthenticated, accessToken, renewal, renew])
  // Other tabs: signed out there → signed out here; someone else signed in → reload, so nothing of this person stays
  useEffect(() => followOtherTabs(
    () => { window.location.href = '/login?signedout=1' },
    () => { window.location.reload() },
  ), [])

  // Ctrl/⌘ K or "/" search · "?" shortcuts · "g" then a letter goes to a list · "n" then a letter creates
  useEffect(() => {
    let lead: 'g' | 'n' | null = null
    let timer: ReturnType<typeof setTimeout> | undefined
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCmdOpen(v => !v); return }
      if (e.metaKey || e.ctrlKey || e.altKey || typing(e) || document.querySelector('[role="dialog"], .cmd-overlay')) return
      const k = e.key.toLowerCase()
      if (lead) {
        const was = lead; lead = null; clearTimeout(timer)
        const p = perms.current
        if (was === 'g') {
          const to = GO_TO.find(g => g.key === k && (!g.module || p.visible(g.module)) && (!g.perms || p.isSuperAdmin || p.canAny(...g.perms)))
          if (to) { e.preventDefault(); router.push(to.href) }
        } else {
          const make = CREATE_ACTIONS.find(a => a.key === k && p.createAllowed(a))
          if (make) { e.preventDefault(); goTo(router, make.href) }
        }
        return
      }
      if (e.key === '?') { e.preventDefault(); setHelpOpen(true); return }
      if (e.key === '/') { e.preventDefault(); setCmdOpen(true); return }
      if (k === 'g' || k === 'n') { lead = k; clearTimeout(timer); timer = setTimeout(() => { lead = null }, 1500) }
    }
    window.addEventListener('keydown', handler)
    return () => { window.removeEventListener('keydown', handler); clearTimeout(timer) }
  }, [router])

  if (!hydrated || !isAuthenticated) return null
  if (!accessToken) return (
    <div className="flex h-screen items-center justify-center p-6" style={{ background: 'var(--bg-base)' }} data-testid="session-renewing">
      {renewal === 'offline' ? (
        <div className="card max-w-sm text-center space-y-3">
          <p className="font-semibold">Can’t reach the server</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>You are still signed in. Check your connection — the app opens as soon as the server answers.</p>
          <button className="btn-primary h-9 px-4" onClick={renew}>Try again</button>
        </div>
      ) : (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }} role="status">Opening Finvosmart…</p>
      )}
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col flex-shrink-0" style={{ width: '252px' }}>
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }} />
          <div className="absolute left-0 top-0 bottom-0" style={{ width: '268px', zIndex: 50 }}
            onClick={(e: any) => e.stopPropagation()}>
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} onSearchOpen={() => setCmdOpen(true)} onShortcuts={() => setHelpOpen(true)} />
        <TrialBanner />
        <main className="flex-1 overflow-y-auto p-5 md:p-6 page-enter" style={{ background: 'var(--bg-base)' }}>
          <div className="max-w-screen-2xl mx-auto">{children}</div>
        </main>
      </div>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <ShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  )
}
