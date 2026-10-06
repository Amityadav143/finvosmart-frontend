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
import { Eyebrow, h2Style, narrow, pStyle } from '@/components/marketing/SolutionPage'
import { LEGAL_ENTITY, LEGAL_UPDATED, type LegalDoc } from '@/lib/legal'

// Server component: the whole document is in the initial HTML.
export function LegalPage({ doc }: { doc: LegalDoc }) {
  const other = doc.key === 'privacy' ? { href: '/terms', label: 'Terms of Service' } : { href: '/privacy', label: 'Privacy Policy' }
  return (
    <div style={{ background: 'var(--bg-base)', paddingTop: '88px' }}>
      <section style={{ padding: '56px 0 8px' }}>
        <div style={narrow}>
          <Eyebrow>Legal</Eyebrow>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(34px,5vw,50px)', color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: '10px', fontWeight: 400 }}>{doc.h1}</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '22px' }}>Last updated: {LEGAL_UPDATED}</p>
          <p style={pStyle}>{doc.intro}</p>

          <nav aria-label="Contents" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '18px 22px', margin: '26px 0 8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>Contents</div>
            <ol style={{ listStyle: 'decimal', paddingLeft: '20px', margin: 0, columns: '2 240px', columnGap: '28px' }}>
              {doc.sections.map(s => (
                <li key={s.id} style={{ fontSize: '14px', marginBottom: '6px', breakInside: 'avoid' }}>
                  <a href={`#${s.id}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>{s.h2}</a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </section>

      <section style={{ padding: '16px 0 48px' }}>
        <div style={narrow}>
          {doc.sections.map((s, i) => (
            <div key={s.id} id={s.id} style={{ scrollMarginTop: '96px', marginTop: '34px' }}>
              <h2 style={{ ...h2Style, fontSize: 'clamp(22px,3vw,28px)', marginBottom: '12px' }}>{i + 1}. {s.h2}</h2>
              {s.paragraphs?.map((p, j) => <p key={j} style={pStyle}>{p}</p>)}
              {s.bullets && (
                <ul style={{ listStyle: 'disc', paddingLeft: '22px', margin: '0 0 12px' }}>
                  {s.bullets.map((b, j) => <li key={j} style={{ ...pStyle, marginBottom: '8px' }}>{b}</li>)}
                </ul>
              )}
              {s.after?.map((p, j) => <p key={j} style={pStyle}>{p}</p>)}
            </div>
          ))}

          <div id="contact" style={{ scrollMarginTop: '96px', marginTop: '44px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '22px 24px' }}>
            <h2 style={{ ...h2Style, fontSize: '24px', marginBottom: '10px' }}>Contact us</h2>
            <p style={{ ...pStyle, marginBottom: '4px' }}>{LEGAL_ENTITY.name}</p>
            <p style={{ ...pStyle, marginBottom: '4px' }}>CIN: {LEGAL_ENTITY.cin}</p>
            {LEGAL_ENTITY.address && <p style={{ ...pStyle, marginBottom: '4px' }}>Registered office: {LEGAL_ENTITY.address}</p>}
            <p style={{ ...pStyle, marginBottom: 0 }}>Email: <a href={`mailto:${LEGAL_ENTITY.email}`} style={{ color: 'var(--gold)' }}>{LEGAL_ENTITY.email}</a></p>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '24px' }}>
            See also our <Link href={other.href} style={{ color: 'var(--gold)' }}>{other.label}</Link>.
          </p>
        </div>
      </section>
    </div>
  )
}
