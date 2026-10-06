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
import { JsonLd } from '@/components/seo/JsonLd'
import { GstCalculator } from '@/components/marketing/GstCalculator'
import { CtaBand, Eyebrow, FaqList, RelatedLinks, h2Style, narrow, pStyle, wrap } from '@/components/marketing/SolutionPage'
import { breadcrumbSchema, faqSchemaFor, gstCalculatorSchema, pageMetadata, PAGES } from '@/lib/seo'
import { GST_CALCULATOR as C } from '@/lib/solutions'

export const metadata: Metadata = pageMetadata('gstCalculator')

const th = { textAlign: 'left' as const, padding: '12px 14px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }
const td = { padding: '12px 14px', fontSize: '14.5px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', verticalAlign: 'top' as const }
const strong = { color: 'var(--text-primary)' }

export default function GstCalculatorPage() {
  return (
    <div style={{ background: 'var(--bg-base)', paddingTop: '88px' }}>
      <JsonLd nodes={[breadcrumbSchema('gstCalculator'), gstCalculatorSchema(), faqSchemaFor(PAGES.gstCalculator.path, C.faqs)]} />

      <section style={{ padding: '64px 0 32px', textAlign: 'center' }}>
        <div style={wrap}>
          <Eyebrow>{C.eyebrow}</Eyebrow>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(34px,5vw,56px)', color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: '16px', fontWeight: 400 }}>{C.h1}</h1>
          <p style={{ fontSize: '17px', color: 'var(--text-secondary)', maxWidth: '640px', margin: '0 auto', lineHeight: 1.7 }}>{C.lead}</p>
        </div>
      </section>

      <GstCalculator />

      <section style={{ padding: '24px 0 16px' }}>
        <div style={narrow}>
          <h2 style={h2Style}>How to calculate GST</h2>
          <p style={pStyle}><strong style={strong}>Adding GST to a price:</strong> GST = taxable value × rate ÷ 100, and the total is the taxable value plus GST. At 18%, a ₹10,000 sale carries ₹1,800 GST, for a total of ₹11,800.</p>
          <p style={pStyle}><strong style={strong}>Removing GST from a price:</strong> taxable value = GST-inclusive price ÷ (1 + rate ÷ 100). ₹11,800 including 18% GST is ₹11,800 ÷ 1.18 = ₹10,000, with ₹1,800 of it being GST.</p>
          <p style={pStyle}><strong style={strong}>Splitting the tax:</strong> within your state, divide GST equally between CGST and SGST — 18% becomes 9% + 9%. For a customer in another state, charge the full rate as IGST.</p>

          <h2 style={{ ...h2Style, marginTop: '36px' }}>GST rates in 2026 (GST 2.0)</h2>
          <p style={pStyle}>Since 22 September 2025, most goods and services fall into three slabs, with 0% for exempt items and special rates for a few goods. The old 12% and 28% slabs were largely removed, with items moved to 5%, 18% or 40%.</p>
          <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '14px', background: 'var(--bg-card)', margin: '8px 0 12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '520px' }}>
              <thead><tr><th style={th}>Rate</th><th style={th}>Slab</th><th style={th}>Applies to (examples)</th></tr></thead>
              <tbody>
                {C.slabs.map(s => (
                  <tr key={s.rate}>
                    <td style={{ ...td, fontWeight: 700, color: 'var(--gold)', whiteSpace: 'nowrap' }}>{s.rate}</td>
                    <td style={{ ...td, whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{s.label}</td>
                    <td style={td}>{s.examples}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>Rates are notified by the GST Council and can change. Always check the rate for your item&apos;s HSN or SAC code.</p>
        </div>
      </section>

      <FaqList items={C.faqs} />
      <RelatedLinks current="gstCalculator" />
      <CtaBand title="Stop calculating GST by hand" text="Finvosmart applies the right GST on every invoice line and splits it into CGST, SGST or IGST for you." href="/gst-billing-software" label="See GST billing software" />
    </div>
  )
}
