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

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/lib/context/ThemeContext'
import { Sun, Moon, Menu, X, Zap, ChevronDown } from 'lucide-react'

const NAV_LINKS = [
  { href: '/#features',    label: 'Features' },
  { href: '/#compare',     label: 'Compare' },
  { href: '/#ai-features', label: 'AI Features' },
  { href: '/pricing',      label: 'Pricing' },
  { href: '/custom-plan',  label: 'Custom Plan' },
  { href: '/about',        label: 'About' },
  { href: '/contact',      label: 'Contact' },
]

export default function MarketingNav() {
  const { isDark, toggle } = useTheme()
  const pathname = usePathname()
  const [scrolled, setScrolled]     = useState(false)
  const [menuOpen, setMenuOpen]     = useState(false)
  const [mounted, setMounted]       = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navBase: React.CSSProperties = {
    position:  'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    transition: 'background 0.3s, box-shadow 0.3s, border-bottom 0.3s',
  }
  const navScrolled: React.CSSProperties = scrolled ? {
    background:  'var(--bg-surface)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    borderBottom: '1px solid var(--border)',
    boxShadow:   'var(--shadow-md)',
  } : {}

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href.replace('/#','/')))

  return (
    <nav style={{ ...navBase, ...navScrolled }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
              background: 'var(--btn-primary-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--btn-primary-shadow)',
            }}>
              <Zap size={16} color="var(--text-on-gold)" />
            </div>
            <span className="font-serif" style={{
              fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em',
              background: 'var(--btn-primary-bg)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              display: 'flex', alignItems: 'baseline', gap: '5px',
            }}>
              FINVOSMART
              <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.02em', color: 'var(--text-muted)', WebkitTextFillColor: 'var(--text-muted)' }}>by Navgrow</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} className="hidden-mobile">
            {NAV_LINKS.map(l => (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  padding: '8px 12px', borderRadius: '8px',
                  fontSize: '14px', textDecoration: 'none', whiteSpace: 'nowrap',
                  color: isActive(l.href) ? 'var(--gold)' : 'var(--text-secondary)',
                  transition: 'color 0.2s, background 0.2s',
                  fontWeight: isActive(l.href) ? 500 : 400,
                }}
                onMouseEnter={(e: any) => { (e.target as HTMLElement).style.color = 'var(--text-primary)'; (e.target as HTMLElement).style.background = 'var(--bg-hover)' }}
                onMouseLeave={(e: any) => { (e.target as HTMLElement).style.color = isActive(l.href) ? 'var(--gold)' : 'var(--text-secondary)'; (e.target as HTMLElement).style.background = 'transparent' }}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* CTA + theme toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} className="hidden-mobile">
            <Link href="/login" style={{
              padding: '8px 18px', borderRadius: '8px',
              fontSize: '14px', color: 'var(--text-secondary)',
              textDecoration: 'none', border: '1px solid var(--border-strong)',
              transition: 'all 0.2s',
            }}
              onMouseEnter={(e: any) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--gold)'; el.style.color = 'var(--gold)' }}
              onMouseLeave={(e: any) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border-strong)'; el.style.color = 'var(--text-secondary)' }}
            >
              Sign In
            </Link>
            <Link href="/login?register=1" style={{
              padding: '9px 20px', borderRadius: '8px',
              fontSize: '14px', fontWeight: 600,
              textDecoration: 'none', color: 'var(--text-on-gold)',
              background: 'var(--btn-primary-bg)',
              boxShadow: 'var(--btn-primary-shadow)',
              transition: 'opacity 0.2s, transform 0.2s',
            }}
              onMouseEnter={(e: any) => { (e.currentTarget as HTMLElement).style.opacity = '0.9'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
              onMouseLeave={(e: any) => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.transform = 'none' }}
            >
              Start Free Trial
            </Link>
            {mounted && (
              <button
                onClick={toggle}
                className="btn-icon"
                title="Toggle theme"
                style={{ width: '36px', height: '36px' }}
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            )}
          </div>

          {/* Mobile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="mobile-only">
            {mounted && (
              <button onClick={toggle} className="btn-icon" style={{ width: '36px', height: '36px' }}>
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            )}
            <button onClick={() => setMenuOpen(v => !v)} className="btn-icon" aria-label="Open menu" style={{ width: '36px', height: '36px' }}>
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: '68px', left: 0, right: 0,
          background: 'var(--bg-surface)',
          backdropFilter: 'blur(18px)',
          borderBottom: '1px solid var(--border)',
          padding: '16px 24px 24px',
          zIndex: 99,
        }}>
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} style={{
              display: 'block', padding: '13px 0',
              fontSize: '15px', color: 'var(--text-secondary)',
              borderBottom: '1px solid var(--border)',
              textDecoration: 'none',
            }}>
              {l.label}
            </Link>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
            <Link href="/login" onClick={() => setMenuOpen(false)} style={{
              display: 'block', padding: '12px', borderRadius: '8px',
              textAlign: 'center', fontSize: '15px', textDecoration: 'none',
              border: '1px solid var(--border-strong)', color: 'var(--text-secondary)',
            }}>Sign In</Link>
            <Link href="/login?register=1" onClick={() => setMenuOpen(false)} style={{
              display: 'block', padding: '12px', borderRadius: '8px',
              textAlign: 'center', fontSize: '15px', fontWeight: 600,
              textDecoration: 'none', color: 'var(--text-on-gold)',
              background: 'var(--btn-primary-bg)',
            }}>Start Free Trial</Link>
          </div>
        </div>
      )}

      {/* Responsive styles injected */}
      <style dangerouslySetInnerHTML={{ __html: `
        .hidden-mobile { display: flex !important; }
        .mobile-only   { display: none  !important; }
        @media (max-width: 768px) {
          .hidden-mobile { display: none  !important; }
          .mobile-only   { display: flex  !important; }
        }
      ` }} />
    </nav>
  )
}
