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
import { breadcrumbTrail, CONTENT_UPDATED, faqSchemaFor, pageSchema, PAGES, type PageKey } from '@/lib/seo'
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
export function FaqList({ items, title = 'Frequently asked questions' }: { items: ReadonlyArray<{ q: string; a: string }>; title?: string }) {
  return (
    <section style={{ padding: '56px 0' }}>
      <div style={narrow}>
        <h2 style={{ ...h2Style, textAlign: 'center', marginBottom: '28px' }}>{title}</h2>
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

/** One line on each page, for the "related pages" cards. */
const BLURBS: Partial<Record<PageKey, string>> = {
  gstBilling: 'Create GST invoices with HSN codes and the right CGST, SGST or IGST split.',
  accountingSoftware: 'Double-entry books with ledgers, Trial Balance, P&L and Balance Sheet that post themselves.',
  payrollSoftware: 'Monthly payroll with PF, ESI, professional tax, TDS, payslips and bank files.',
  hrmsSoftware: 'Employees, attendance, leave, hiring and performance reviews in one place.',
  eInvoicing: 'Who must e-invoice in 2026, the 30-day rule, and how e-way bills differ.',
  tallyAlternative: 'Double-entry books that post your invoices, bills and payroll automatically.',
  gstCalculator: 'Add or remove GST and see the tax split — free, no sign-up.',
  gstinChecker: 'Check a GST number’s format and check digit — free.',
  gstInvoiceFormat: 'Free GST invoice template in Excel and PDF, with a Rule 46 checklist.',
  gstDueDates: 'Every GST, TDS, PF and ESI date this year, with a calendar to download.',
  freeTools: 'Every free tool in one place — no sign-up for any of them.',
}

/** Where to go next from each page: the closest topics first. */
const RELATED: Partial<Record<PageKey, PageKey[]>> = {
  gstBilling: ['eInvoicing', 'gstInvoiceFormat', 'gstCalculator', 'accountingSoftware', 'gstDueDates', 'tallyAlternative'],
  eInvoicing: ['gstBilling', 'gstInvoiceFormat', 'gstDueDates', 'gstinChecker', 'accountingSoftware', 'tallyAlternative'],
  tallyAlternative: ['accountingSoftware', 'gstBilling', 'payrollSoftware', 'gstInvoiceFormat', 'gstCalculator', 'eInvoicing'],
  accountingSoftware: ['tallyAlternative', 'gstBilling', 'payrollSoftware', 'gstDueDates', 'gstCalculator', 'eInvoicing'],
  payrollSoftware: ['hrmsSoftware', 'accountingSoftware', 'gstDueDates', 'tallyAlternative', 'gstBilling', 'gstCalculator'],
  hrmsSoftware: ['payrollSoftware', 'accountingSoftware', 'gstDueDates', 'gstBilling', 'tallyAlternative', 'gstinChecker'],
  gstCalculator: ['gstinChecker', 'gstInvoiceFormat', 'gstDueDates', 'gstBilling', 'eInvoicing', 'freeTools'],
  gstinChecker: ['gstCalculator', 'gstInvoiceFormat', 'gstDueDates', 'gstBilling', 'eInvoicing', 'freeTools'],
  gstInvoiceFormat: ['gstBilling', 'gstCalculator', 'gstinChecker', 'gstDueDates', 'eInvoicing', 'freeTools'],
  gstDueDates: ['gstCalculator', 'gstinChecker', 'gstInvoiceFormat', 'payrollSoftware', 'gstBilling', 'freeTools'],
}

/** Internal links between the GST and software pages (helps visitors and search engines find them). */
export function RelatedLinks({ current }: { current: PageKey }) {
  const keys = RELATED[current] ?? []
  return (
    <section style={{ padding: '8px 0 56px' }} aria-labelledby="related-heading">
      <div style={wrap}>
        <h2 id="related-heading" style={{ ...h2Style, fontSize: 'clamp(22px,3vw,28px)', textAlign: 'center', marginBottom: '22px' }}>Related</h2>
        <div className="auto-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '900px', margin: '0 auto' }}>
          {keys.map(k => (
            <Link key={k} href={PAGES[k].path} className="lp-card" style={{ ...card, display: 'block', textDecoration: 'none' }}>
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>{PAGES[k].label} →</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{BLURBS[k]}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/** Home › (hub ›) page, matching the page's BreadcrumbList schema. */
export function Breadcrumbs({ page }: { page: PageKey }) {
  const trail = breadcrumbTrail(page)
  return (
    <nav aria-label="Breadcrumb">
      <ol className="mk-crumbs">
        {trail.map((k, i) => (
          <li key={k}>
            {i < trail.length - 1
              ? <Link href={PAGES[k].path}>{PAGES[k].label}</Link>
              : <span aria-current="page">{PAGES[k].label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}

/** "Updated 9 October 2026": when the page's content last changed (CONTENT_UPDATED in lib/seo). */
export function UpdatedOn({ page }: { page: PageKey }) {
  const iso = CONTENT_UPDATED[page]
  const label = new Date(`${iso}T00:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
  return <>Updated <time dateTime={iso}>{label}</time></>
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
      <JsonLd nodes={pageSchema(id, faqSchemaFor(page.path, s.faqs))} />

      <section style={{ padding: '72px 0 56px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
        <div style={wrap}>
          <Breadcrumbs page={id} />
          <Eyebrow>{s.eyebrow}</Eyebrow>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(32px,5vw,54px)', color: 'var(--text-primary)',
                       lineHeight: 1.12, margin: '0 auto 18px', maxWidth: '820px', fontWeight: 400 }}>{s.h1}</h1>
          <p style={{ fontSize: '17px', color: 'var(--text-secondary)', maxWidth: '680px', margin: '0 auto 30px', lineHeight: 1.7 }}>{s.lead}</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" className="btn-primary" style={{ height: '46px', padding: '0 26px', fontSize: '15px', textDecoration: 'none' }}>Start free trial</Link>
            <Link href="/pricing" className="btn-secondary" style={{ height: '46px', padding: '0 22px', fontSize: '15px', textDecoration: 'none' }}>See pricing</Link>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '14px' }}>14-day free trial · No credit card · <UpdatedOn page={id} /></p>
        </div>
      </section>

      <section style={{ padding: '64px 0' }} aria-labelledby="highlights-heading">
        <div style={wrap}>
          {/* Keeps the outline in order (H1 → H2 → H3) for screen readers; the cards speak for themselves. */}
          <h2 id="highlights-heading" className="sr-only">{page.label} at a glance</h2>
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
