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

import type { Metadata } from 'next'
import Link from 'next/link'
import { Calculator, BadgeCheck, FileSpreadsheet, CalendarDays, ArrowRight } from 'lucide-react'
import { JsonLd } from '@/components/seo/JsonLd'
import { Breadcrumbs, CtaBand, Eyebrow, FaqList, h2Style, narrow, pStyle, wrap } from '@/components/marketing/SolutionPage'
import { absoluteUrl, faqSchemaFor, pageMetadata, pageSchema, PAGES, type PageKey } from '@/lib/seo'
import { FREE_TOOLS as C } from '@/lib/solutions'

export const metadata: Metadata = pageMetadata('freeTools')

const ICONS: Partial<Record<PageKey, typeof Calculator>> = {
  gstCalculator: Calculator, gstinChecker: BadgeCheck, gstInvoiceFormat: FileSpreadsheet, gstDueDates: CalendarDays,
}

/** The hub for the free tools: each one a click away, described properly (and listed as an ItemList). */
export default function FreeGstToolsPage() {
  const itemList = {
    '@type': 'ItemList',
    '@id': `${absoluteUrl(PAGES.freeTools.path)}#tools`,
    name: 'Free GST tools',
    itemListElement: C.tools.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: PAGES[t.key].label, url: absoluteUrl(PAGES[t.key].path) })),
  }
  return (
    <div style={{ background: 'var(--bg-base)', paddingTop: '88px' }}>
      <JsonLd nodes={pageSchema('freeTools', itemList, faqSchemaFor(PAGES.freeTools.path, C.faqs))} />

      <section style={{ padding: '64px 0 40px', textAlign: 'center' }}>
        <div style={wrap}>
          <Breadcrumbs page="freeTools" />
          <Eyebrow>{C.eyebrow}</Eyebrow>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(34px,5vw,56px)', color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: '16px', fontWeight: 400 }}>{C.h1}</h1>
          <p style={{ fontSize: '17px', color: 'var(--text-secondary)', maxWidth: '660px', margin: '0 auto', lineHeight: 1.7 }}>{C.lead}</p>
        </div>
      </section>

      <section style={{ padding: '8px 0 40px' }}>
        <div style={{ ...wrap, maxWidth: '1000px' }}>
          <div className="auto-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {C.tools.map(t => {
              const Icon = ICONS[t.key] ?? Calculator
              return (
                <Link key={t.key} href={PAGES[t.key].path} className="lp-card" style={{ display: 'block', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '18px', padding: '26px', textDecoration: 'none' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: 'var(--gold-muted)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }} aria-hidden="true">
                    <Icon size={22} />
                  </div>
                  <h2 style={{ fontSize: '19px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>{PAGES[t.key].label}</h2>
                  <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '14px' }}>{t.text}</p>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, color: 'var(--gold)' }}>{t.action} <ArrowRight size={14} aria-hidden /></span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section style={{ padding: '16px 0 8px' }}>
        <div style={narrow}>
          {C.sections.map(sec => (
            <div key={sec.h2} style={{ marginBottom: '36px' }}>
              <h2 style={h2Style}>{sec.h2}</h2>
              {sec.paragraphs.map((p, i) => <p key={i} style={pStyle}>{p}</p>)}
            </div>
          ))}
        </div>
      </section>

      <FaqList items={C.faqs} />
      <CtaBand title="When you outgrow the free tools" text="Finvosmart puts the right GST on every invoice, keeps your books, and prepares GSTR-1, GSTR-3B and payroll files — free for 14 days." />
    </div>
  )
}
