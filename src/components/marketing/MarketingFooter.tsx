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
import { Zap, Linkedin } from 'lucide-react'
import { SITE } from '@/lib/seo'
import { FOOTER_COLUMNS } from '@/lib/siteNav'

/** Profiles the business really has (SITE.sameAs) — the same list the Organization schema gives. */
const SOCIAL: Record<string, { name: string; Icon: typeof Linkedin }> = {
  'linkedin.com': { name: 'LinkedIn', Icon: Linkedin },
}
const social = (url: string) => Object.entries(SOCIAL).find(([host]) => url.includes(host))?.[1]

/** The public site's footer: a server component, every page one plain link away. */
export default function MarketingFooter() {
  return (
    <footer className="mk-footer">
      <div className="mk-footer-inner">
        <div className="mk-footer-grid">
          <div>
            <Link href="/" className="mk-logo" aria-label="Finvosmart home">
              <span className="mk-logo-mark mk-logo-mark-sm"><Zap size={14} color="var(--text-on-gold)" aria-hidden /></span>
              <span className="font-serif mk-logo-text mk-logo-text-sm">
                FINVOSMART
                <span className="mk-logo-by">by Navgrow</span>
              </span>
            </Link>
            <p className="mk-footer-tagline">
              GST billing, accounting, payroll and HR software for Indian businesses — one connected platform, built in India.
            </p>
            <div className="mk-social">
              {SITE.sameAs.map(url => {
                const s = social(url)
                return s && (
                  <a key={url} href={url} target="_blank" rel="noopener" className="mk-social-link" aria-label={`Finvosmart on ${s.name}`}>
                    <s.Icon size={15} aria-hidden />
                  </a>
                )
              })}
            </div>
          </div>

          {FOOTER_COLUMNS.map(col => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="mk-footer-title">{col.title}</h2>
              <ul className="mk-footer-list">
                {col.links.map(l => (
                  <li key={l.href + l.label}>
                    <Link href={l.href} className="mk-footer-link" {...(l.href === '/hi' ? { lang: 'hi', hrefLang: 'hi' } : {})}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mk-footer-bottom">
          <span>© 2026 Navgrow Engineering Service Pvt. Ltd. · CIN: U29302WB2025PTC281015 · All rights reserved.</span>
          <div className="mk-footer-legal">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/about#security">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
