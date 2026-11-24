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

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Keyboard, PanelLeftClose, PanelLeftOpen, Pin, PinOff, Star, X, Zap } from 'lucide-react'
import { useAuthStore } from '@/lib/store/slices/authStore'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useIndustry } from '@/lib/hooks/useIndustry'
import { shown } from '@/lib/previews'
import { allowed, MENU, NAV_SECTIONS, type NavAccess, type NavItem, type NavSection } from '@/lib/navigation'
import { PLATFORM_COLOR } from '@/components/platform/theme'

/*
 * The menu (lib/navigation.ts is what it lists). Sections in the order of the day's work, each opening to its pages;
 * the section of the page you are on opens by itself, the others stay as you left them. Pages you use most can be
 * pinned to the top. On a wide screen the menu folds to a rail of section icons, each opening its pages beside it.
 * What is open, what is pinned and whether the menu is folded are kept in this browser (a convenience: without
 * storage the menu works the same, it just doesn't remember).
 */

const OPEN_KEY = 'finvo-menu-open'
const PINS_KEY = 'finvo-menu-pins'
const MAX_PINS = 8

function readJson<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback } catch { return fallback }
}
function writeJson(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* storage unavailable: not remembered */ }
}

/** Who sees what: the same rules as search and the pages themselves. */
export function useNavAccess(): NavAccess {
  const { can, isPlatformAdmin, consoleHint } = usePermissions()
  const industry = useIndustry()
  return {
    can, isPlatformAdmin, consoleHint, shown,
    visible: industry.visible,
    has: when => !!industry.current?.[when],
  }
}

interface SidebarProps {
  onClose?: () => void
  /** folded to a rail of section icons (wide screens) */
  rail?: boolean
  onToggleRail?: () => void
  onHelp?: () => void
}

export function Sidebar({ onClose, rail = false, onToggleRail, onHelp }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const access = useNavAccess()
  const industry = useIndustry()
  const name = (i: NavItem) => industry.name(i.href, i.label)

  // the entries this person sees, section by section
  const sections = useMemo(
    () => NAV_SECTIONS.map(s => ({ ...s, items: s.items.filter(i => allowed(i, access)) })).filter(s => s.items.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- access is rebuilt each render from what these read
    [access.isPlatformAdmin, access.consoleHint, industry.current, user?.permissions, user?.roles],
  )

  // the most specific entry for the page is the one lit ("Schedule H1 register", not "Invoices" too, on /invoicing/h1-register)
  const matches = (href: string) => pathname === href || pathname.startsWith(href + '/')
  const current = sections.flatMap(s => s.items.map(i => i.href)).filter(matches).sort((a, b) => b.length - a.length)[0]
  const currentSection = sections.find(s => s.items.some(i => i.href === current))?.id

  // open sections: as left, else the console's and the current page's
  const [opened, setOpened] = useState<Record<string, boolean>>({})
  useEffect(() => { setOpened(readJson(OPEN_KEY, {})) }, [])
  const isOpen = (id: string) => opened[id] ?? (id === 'platform' || id === currentSection)
  const toggle = (id: string) => {
    const next = { ...opened, [id]: !isOpen(id) }
    setOpened(next); writeJson(OPEN_KEY, next)
  }

  // pinned pages, for this person
  const pinsKey = `${PINS_KEY}:${user?.userId ?? user?.email ?? ''}`
  const [pins, setPins] = useState<string[]>([])
  useEffect(() => { setPins(readJson<string[]>(pinsKey, []).filter(h => typeof h === 'string')) }, [pinsKey])
  const togglePin = (href: string) => {
    const next = pins.includes(href) ? pins.filter(h => h !== href) : [...pins, href].slice(-MAX_PINS)
    setPins(next); writeJson(pinsKey, next)
  }
  const visibleItems = sections.flatMap(s => s.items)
  const pinned = pins.map(h => visibleItems.find(i => i.href === h && !i.platform)).filter(Boolean) as NavItem[]

  // the rail's flyout: the pages of one section, beside its icon
  const [fly, setFly] = useState<{ id: string; top: number } | null>(null)
  useEffect(() => { setFly(null) }, [pathname, rail])
  useEffect(() => {
    if (!fly) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFly(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fly])

  const home = sections.find(s => s.id === 'home')
  const rest = sections.filter(s => s.id !== 'home' && s.id !== 'platform')
  const platform = sections.find(s => s.id === 'platform')

  const row = (i: NavItem, opts: { pinnedRow?: boolean; top?: boolean } = {}) => {
    const active = i.href === current
    const isPinned = pins.includes(i.href)
    const Icon = i.icon
    return (
      <div key={`${i.href}:${i.platform ?? ''}:${opts.pinnedRow ? 'pin' : ''}`} className="nav-row group relative">
        <Link
          href={i.href}
          onClick={onClose}
          {...(opts.pinnedRow ? { 'data-nav-pin': i.href } : { 'data-nav': i.href })}
          aria-current={active ? 'page' : undefined}
          className={`nav-link ${opts.top || opts.pinnedRow ? 'nav-link-top' : 'nav-link-sub'} ${active ? 'is-active' : ''}`}
          style={i.platform === 'console' && active ? { color: PLATFORM_COLOR } : undefined}
        >
          {(opts.top || opts.pinnedRow || i.platform) && <Icon size={15} aria-hidden className="nav-icon" />}
          <span className="truncate flex-1">{name(i)}</span>
        </Link>
        {!i.platform && !opts.top && (
          <button type="button" className="nav-pin" onClick={() => togglePin(i.href)} aria-pressed={isPinned}
            aria-label={isPinned ? `Unpin ${name(i)}` : `Pin ${name(i)} to the top`} title={isPinned ? 'Unpin' : 'Pin to the top'}
            data-pin={i.href}>
            {isPinned ? <PinOff size={12} aria-hidden /> : <Pin size={12} aria-hidden />}
          </button>
        )}
      </div>
    )
  }

  const sectionBlock = (s: NavSection) => {
    const open = isOpen(s.id)
    const framed = s.id === 'platform'
    const here = s.id === currentSection
    const Icon = s.icon
    return (
      <div key={s.id} data-nav-section={s.id} className={framed ? 'nav-framed' : 'nav-section'}
        style={framed ? { background: `${PLATFORM_COLOR}0d`, border: `1px solid ${PLATFORM_COLOR}33` } : undefined}>
        <button type="button" onClick={() => toggle(s.id)} aria-expanded={open} aria-controls={`nav-${s.id}`}
          className={`nav-head ${here ? 'is-here' : ''}`} style={framed ? { color: PLATFORM_COLOR } : undefined}>
          <Icon size={16} aria-hidden className="nav-icon" />
          <span className="flex-1 text-left truncate">{s.label}</span>
          {framed && <span className="nav-chip" style={{ background: `${PLATFORM_COLOR}15`, color: PLATFORM_COLOR }}>CONSOLE</span>}
          <ChevronDown size={14} aria-hidden className="nav-chevron" style={{ transform: open ? 'none' : 'rotate(-90deg)' }} />
        </button>
        {/* closed sections keep their links (hidden), so a page's place is always in the menu */}
        <div id={`nav-${s.id}`} hidden={!open} className="nav-items">
          {s.items.map(i => row(i))}
        </div>
      </div>
    )
  }

  // ── folded: a rail of section icons ──────────────────────────────────────
  if (rail) {
    const flySection = fly ? sections.find(s => s.id === fly.id) : undefined
    return (
      <aside className="flex flex-col w-full h-full nav-shell" aria-label="Main menu">
        <div className="flex items-center justify-center" style={{ height: '60px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <Link href="/dashboard" className="nav-logo" aria-label="FINVOSMART — dashboard"><Zap size={15} style={{ color: 'var(--text-on-gold)' }} /></Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col items-center gap-1" aria-label="Sections">
          {home?.items.map(i => (
            <Link key={i.href} href={i.href} data-nav={i.href} aria-label={name(i)} title={name(i)}
              aria-current={i.href === current ? 'page' : undefined} className={`nav-rail ${i.href === current ? 'is-here' : ''}`}>
              <i.icon size={18} aria-hidden />
            </Link>
          ))}
          {pinned.length > 0 && <span className="nav-rail-rule" aria-hidden />}
          {pinned.map(i => (
            <Link key={'pin:' + i.href} href={i.href} data-nav-pin={i.href} aria-label={`${name(i)} (pinned)`} title={name(i)}
              aria-current={i.href === current ? 'page' : undefined} className={`nav-rail ${i.href === current ? 'is-here' : ''}`}>
              <i.icon size={17} aria-hidden />
            </Link>
          ))}
          <span className="nav-rail-rule" aria-hidden />
          {[...(platform ? [platform] : []), ...rest].map(s => (
            <button key={s.id} type="button" aria-label={s.label} title={s.label} aria-expanded={fly?.id === s.id} aria-controls="nav-flyout"
              data-nav-section={s.id} className={`nav-rail ${s.id === currentSection ? 'is-here' : ''}`}
              style={s.id === 'platform' ? { color: PLATFORM_COLOR } : undefined}
              onClick={e => {
                const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
                setFly(fly?.id === s.id ? null : { id: s.id, top: Math.min(r.top, window.innerHeight - 60 - s.items.length * 36) })
              }}>
              <s.icon size={18} aria-hidden />
            </button>
          ))}
        </nav>
        <div className="flex flex-col items-center gap-1 py-3" style={{ borderTop: '1px solid var(--border)' }}>
          {onHelp && <button type="button" className="nav-rail" onClick={onHelp} aria-label="Help and keyboard shortcuts" title="Help and keyboard shortcuts"><Keyboard size={17} aria-hidden /></button>}
          {onToggleRail && <button type="button" className="nav-rail" onClick={onToggleRail} aria-label="Open the menu" title="Open the menu" data-testid="menu-expand"><PanelLeftOpen size={17} aria-hidden /></button>}
        </div>
        {flySection && fly && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setFly(null)} aria-hidden />
            {/* a plain list of links beside the icon (Tab moves through them, Escape or a click outside closes it) */}
            <nav id="nav-flyout" aria-label={flySection.label} className="nav-flyout" style={{ top: Math.max(8, fly.top) }} data-testid="menu-flyout">
              <p className="nav-flyout-title">{flySection.label}</p>
              {flySection.items.map(i => (
                <Link key={i.href} href={i.href} data-nav={i.href} onClick={() => setFly(null)}
                  aria-current={i.href === current ? 'page' : undefined} className={`nav-link nav-link-top ${i.href === current ? 'is-active' : ''}`}>
                  <i.icon size={15} aria-hidden className="nav-icon" /><span className="truncate">{name(i)}</span>
                </Link>
              ))}
            </nav>
          </>
        )}
      </aside>
    )
  }

  // ── open ─────────────────────────────────────────────────────────────────
  return (
    <aside className="flex flex-col w-full h-full nav-shell" aria-label="Main menu">
      <div className="flex items-center justify-between px-4" style={{ height: '60px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <Link href="/dashboard" className="flex items-center gap-2.5 no-underline">
          <span className="nav-logo"><Zap size={15} style={{ color: 'var(--text-on-gold)' }} /></span>
          <span>
            <span className="block font-serif text-sm text-gold-grad leading-none tracking-tight">FINVOSMART</span>
            <span className="block" style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>by Navgrow · v1.1</span>
          </span>
        </Link>
        {onClose && <button aria-label="Close the menu" className="btn-icon w-7 h-7 border-0" style={{ background: 'transparent' }} onClick={onClose}><X size={16} /></button>}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2.5" aria-label="Main">
        {platform && sectionBlock(platform)}
        {home && <div data-nav-section="home" className="nav-section">{home.items.map(i => row(i, { top: true }))}</div>}
        {pinned.length > 0 && (
          <div data-nav-section="pinned" className="nav-section">
            <p className="nav-label"><Star size={11} aria-hidden />Pinned</p>
            {pinned.map(i => row(i, { pinnedRow: true }))}
          </div>
        )}
        {rest.map(sectionBlock)}
      </nav>

      <div className="flex items-center gap-1 px-2.5 py-2.5" style={{ borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        {onHelp && (
          <button type="button" className="nav-foot flex-1" onClick={onHelp} title="Keyboard shortcuts, search and the setup guide">
            <Keyboard size={15} aria-hidden />Help & shortcuts
          </button>
        )}
        {onToggleRail && (
          <button type="button" className="nav-foot" onClick={onToggleRail} aria-label="Fold the menu to icons" title="Fold the menu to icons" data-testid="menu-collapse">
            <PanelLeftClose size={15} aria-hidden />
          </button>
        )}
      </div>
    </aside>
  )
}

/** Every page in the menu, for tests and tools: what the menu can link to. */
export const MENU_HREFS = Array.from(new Set(MENU.map(i => i.href)))
