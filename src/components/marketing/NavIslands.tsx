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

/**
 * The few parts of the public site's header that need the browser. The header itself
 * (MarketingNav) is a server component, so every menu link is plain HTML that crawlers and
 * visitors without JavaScript can follow; these small islands add the rest.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sun, Moon, Menu, X } from 'lucide-react'
import { useTheme } from '@/lib/context/ThemeContext'
import type { NavLink } from '@/lib/siteNav'

/** Light / dark switch. */
export function ThemeToggle({ size = 16 }: { size?: number }) {
  const { isDark, toggle } = useTheme()
  const label = isDark ? 'Switch to the light theme' : 'Switch to the dark theme'
  return (
    <button type="button" onClick={toggle} className="btn-icon mk-icon-btn" aria-label={label} title={label}>
      {isDark ? <Sun size={size} aria-hidden /> : <Moon size={size} aria-hidden />}
    </button>
  )
}

/** The phone menu: every page in the top menu, grouped, plus sign-in and sign-up. */
export function MobileMenu({ groups }: { groups: { title?: string; links: NavLink[] }[] }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setMenuOpen(false) }, [pathname])
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <>
      <button type="button" onClick={() => setMenuOpen(v => !v)} className="btn-icon mk-icon-btn"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="mk-mobile-menu">
        {menuOpen ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
      </button>
      {menuOpen && (
        <nav id="mk-mobile-menu" className="mk-mobile-panel" aria-label="Menu">
          {groups.map((g, i) => (
            <div key={i} className="mk-mobile-group">
              {g.title && <p className="mk-mobile-title">{g.title}</p>}
              {g.links.map(l => (
                <Link key={l.href} href={l.href} className="mk-mobile-link" aria-current={l.href === pathname ? 'page' : undefined}
                  {...(l.href === '/hi' ? { lang: 'hi', hrefLang: 'hi' } : {})}>{l.label}</Link>
              ))}
            </div>
          ))}
          <div className="mk-mobile-cta">
            <Link href="/login" className="mk-btn-outline">Sign In</Link>
            <Link href="/register" className="mk-btn-gold">Start Free Trial</Link>
          </div>
        </nav>
      )}
    </>
  )
}

/**
 * Header behaviour without re-rendering the server HTML: a solid background once the page
 * scrolls, the current page marked in the menu, and the drop-downs opening on click or tap
 * (mouse users also get them on hover, in CSS) and closing on Escape or a click elsewhere.
 */
export function NavEnhancer() {
  const pathname = usePathname()

  useEffect(() => {
    const nav = document.getElementById('site-nav')
    if (!nav) return
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const nav = document.getElementById('site-nav')
    if (!nav) return
    nav.querySelectorAll<HTMLAnchorElement>('a[data-nav]').forEach(a => {
      if (a.getAttribute('href') === pathname) a.setAttribute('aria-current', 'page')
      else a.removeAttribute('aria-current')
    })
    closeMenus(nav)
  }, [pathname])

  useEffect(() => {
    const nav = document.getElementById('site-nav')
    if (!nav) return
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null
      const trigger = target?.closest('.mk-dd-trigger')
      if (trigger && nav.contains(trigger)) {
        const menu = trigger.closest('.mk-dd')
        const open = !menu?.classList.contains('is-open')
        closeMenus(nav)
        if (menu && open) { menu.classList.add('is-open'); trigger.setAttribute('aria-expanded', 'true') }
        return
      }
      if (!target?.closest('.mk-dd')) closeMenus(nav)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMenus(nav) }
    const onFocusOut = (e: FocusEvent) => {
      const menu = (e.target as Element | null)?.closest('.mk-dd')
      if (menu && !menu.contains(e.relatedTarget as Node | null)) closeMenus(nav)
    }
    document.addEventListener('click', onClick)
    document.addEventListener('keydown', onKey)
    nav.addEventListener('focusout', onFocusOut)
    return () => {
      document.removeEventListener('click', onClick)
      document.removeEventListener('keydown', onKey)
      nav.removeEventListener('focusout', onFocusOut)
    }
  }, [])

  return null
}

function closeMenus(nav: HTMLElement) {
  nav.querySelectorAll('.mk-dd.is-open').forEach(menu => {
    menu.classList.remove('is-open')
    menu.querySelector('.mk-dd-trigger')?.setAttribute('aria-expanded', 'false')
  })
}
