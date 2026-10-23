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
import { Zap, ChevronDown } from 'lucide-react'
import { PAGES } from '@/lib/seo'
import { MOBILE_NAV, TOP_NAV } from '@/lib/siteNav'
import { MobileMenu, NavEnhancer, ThemeToggle } from '@/components/marketing/NavIslands'

/**
 * The public site's header. A server component: the menu — real pages only, from
 * src/lib/siteNav.ts — is plain links in the HTML, which is what search engines read to
 * understand the site's main pages. Styles live in globals.css ("Marketing site").
 */
export default function MarketingNav() {
  return (
    <header id="site-nav" className="mk-nav">
      <div className="mk-nav-inner">
        <Link href="/" className="mk-logo" aria-label="Finvosmart home">
          <span className="mk-logo-mark"><Zap size={16} color="var(--text-on-gold)" aria-hidden /></span>
          <span className="font-serif mk-logo-text">
            FINVOSMART
            <span className="mk-logo-by">by Navgrow</span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden-mobile mk-menu">
          <ul className="mk-menu-list">
            {TOP_NAV.map((item, n) => item.kind === 'link' ? (
              <li key={item.link.href}>
                <Link href={item.link.href} className="mk-link" data-nav="">{item.link.label}</Link>
              </li>
            ) : (
              <li key={item.label} className="mk-dd">
                <button type="button" className="mk-link mk-dd-trigger" aria-expanded="false" aria-controls={`mk-menu-${n}`}>
                  {item.label} <ChevronDown size={14} aria-hidden />
                </button>
                <div id={`mk-menu-${n}`} className="mk-dd-panel">
                  <ul>
                    {item.items.map(i => (
                      <li key={i.key}>
                        <Link href={PAGES[i.key].path} className="mk-dd-item" data-nav="">
                          <span className="mk-dd-label">{PAGES[i.key].label}</span>
                          <span className="mk-dd-blurb">{i.blurb}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {item.hub && <Link href={item.hub.href} className="mk-dd-hub" data-nav="">{item.hub.label} →</Link>}
                </div>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden-mobile mk-actions">
          <Link href="/login" className="mk-btn-outline">Sign In</Link>
          <Link href="/register" className="mk-btn-gold">Start Free Trial</Link>
          <ThemeToggle />
        </div>

        <div className="mobile-only mk-actions">
          <ThemeToggle size={15} />
          <MobileMenu groups={MOBILE_NAV} />
        </div>
      </div>
      <NavEnhancer />
    </header>
  )
}
