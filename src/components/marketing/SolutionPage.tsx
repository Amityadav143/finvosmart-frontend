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
import type { CSSProperties, ReactNode } from 'react'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbSchema, faqSchemaFor, PAGES } from '@/lib/seo'
import { SOLUTIONS, type SolutionKey } from '@/lib/solutions'

// Server component: every word of these pages is in the initial HTML.

export const wrap: CSSProperties = { maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }
export const narrow: CSSProperties = { maxWidth: '780px', margin: '0 auto', padding: '0 24px' }
export const h2Style: CSSProperties = {
  fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(26px,3.6vw,38px)',
  color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: '16px', fontWeight: 400,
}
export const pStyle: CSSProperties = { fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '14px' }
const card: CSSProperties = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 600,
                  letterSpacing: '0.12em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '18px' }}>
      <span style={{ width: '28px', height: '2px', background: 'var(--gold)', display: 'inline-block' }} />
      {children}
    </div>
  )
}

/** Native <details>: answers are in the HTML (crawlable, no JavaScript needed) yet collapsible. */
export function FaqList({ items }: { items: ReadonlyArray<{ q: string; a: string }> }) {
  return (
    <section style={{ padding: '56px 0' }}>
      <div style={narrow}>
        <h2 style={{ ...h2Style, textAlign: 'center', marginBottom: '28px' }}>Frequently asked questions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.map(f => (
            <details key={f.q} style={{ ...card, padding: '0' }}>
              <summary style={{ cursor: 'pointer', padding: '18px 22px', fontSize: '15.5px', fontWeight: 600,
                                color: 'var(--text-primary)', listStyle: 'revert' }}>{f.q}</summary>
              <p style={{ ...pStyle, padding: '0 22px 18px', marginBottom: 0 }}>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

const RELATED = [
  { key: 'gstBilling' as const, blurb: 'Create GST invoices with HSN codes and the right CGST, SGST or IGST split.' },
  { key: 'eInvoicing' as const, blurb: 'Generate IRNs and e-way bills straight from your invoices.' },
  { key: 'gstCalculator' as const, blurb: 'Add or remove GST and see the tax split — free, no sign-up.' },
  { key: 'tallyAlternative' as const, blurb: 'Double-entry books that post your GST invoices automatically.' },
]

/** Internal links between the GST pages (helps visitors and search engines find them). */
export function RelatedLinks({ current }: { current: 'gstBilling' | 'eInvoicing' | 'gstCalculator' | 'tallyAlternative' }) {
  return (
    <section style={{ padding: '8px 0 56px' }}>
      <div style={wrap}>
        <div className="auto-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '900px', margin: '0 auto' }}>
          {RELATED.filter(r => r.key !== current).map(r => (
            <Link key={r.key} href={PAGES[r.key].path} style={{ ...card, display: 'block', textDecoration: 'none' }}>
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>{PAGES[r.key].label} →</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r.blurb}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export function CtaBand({ title, text, href = '/register', label = 'Start free trial' }:
  { title: string; text: string; href?: string; label?: string }) {
  return (
    <section style={{ padding: '64px 0 88px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
      <div style={narrow}>
        <h2 style={h2Style}>{title}</h2>
        <p style={{ ...pStyle, marginBottom: '24px' }}>{text}</p>
        <Link href={href} className="btn-primary" style={{ height: '46px', padding: '0 28px', fontSize: '15px', textDecoration: 'none' }}>{label}</Link>
      </div>
    </section>
  )
}

export function SolutionPage({ id }: { id: SolutionKey }) {
  const s = SOLUTIONS[id]
  const page = PAGES[id]
  return (
    <div style={{ background: 'var(--bg-base)', paddingTop: '88px' }}>
      <JsonLd nodes={[breadcrumbSchema(id), faqSchemaFor(page.path, s.faqs)]} />

      <section style={{ padding: '72px 0 56px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
        <div style={wrap}>
          <Eyebrow>{s.eyebrow}</Eyebrow>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(32px,5vw,54px)', color: 'var(--text-primary)',
                       lineHeight: 1.12, margin: '0 auto 18px', maxWidth: '820px', fontWeight: 400 }}>{s.h1}</h1>
          <p style={{ fontSize: '17px', color: 'var(--text-secondary)', maxWidth: '680px', margin: '0 auto 30px', lineHeight: 1.7 }}>{s.lead}</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" className="btn-primary" style={{ height: '46px', padding: '0 26px', fontSize: '15px', textDecoration: 'none' }}>Start free trial</Link>
            <Link href="/pricing" className="btn-secondary" style={{ height: '46px', padding: '0 22px', fontSize: '15px', textDecoration: 'none' }}>See pricing</Link>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '14px' }}>14-day free trial · No credit card</p>
        </div>
      </section>

      <section style={{ padding: '64px 0' }}>
        <div style={wrap}>
          <div className="auto-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
            {s.highlights.map(h => (
              <div key={h.title} style={card}>
                <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>{h.title}</h3>
                <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{h.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '16px 0 32px' }}>
        <div style={narrow}>
          {s.sections.map(sec => (
            <div key={sec.h2} style={{ marginBottom: '44px' }}>
              <h2 style={h2Style}>{sec.h2}</h2>
              {sec.paragraphs.map((p, i) => <p key={i} style={pStyle}>{p}</p>)}
              {sec.bullets && (
                // Tailwind's reset removes list bullets, so restore them explicitly.
                <ul style={{ listStyle: 'disc', paddingLeft: '22px', margin: '4px 0 0' }}>
                  {sec.bullets.map(b => <li key={b} style={{ ...pStyle, marginBottom: '8px' }}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '56px 0', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={wrap}>
          <h2 style={{ ...h2Style, textAlign: 'center', marginBottom: '32px' }}>How it works</h2>
          <div className="auto-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '18px' }}>
            {s.steps.map((st, i) => (
              <div key={st.title} style={card}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gold-muted)', color: 'var(--gold)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', marginBottom: '14px' }}>{i + 1}</div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>{st.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{st.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FaqList items={s.faqs} />
      <RelatedLinks current={id} />
      <CtaBand title={s.cta.title} text={s.cta.text} />
      {s.disclaimer && (
        <p style={{ ...narrow, fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', paddingBottom: '40px', lineHeight: 1.6 }}>{s.disclaimer}</p>
      )}
    </div>
  )
}
