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
import { GstinChecker } from '@/components/marketing/GstinChecker'
import { Breadcrumbs, CtaBand, Eyebrow, FaqList, RelatedLinks, UpdatedOn, h2Style, narrow, pStyle, wrap } from '@/components/marketing/SolutionPage'
import { ShareButtons } from '@/components/marketing/ShareButtons'
import { absoluteUrl, faqSchemaFor, gstinCheckerSchema, pageMetadata, pageSchema, PAGES } from '@/lib/seo'
import { GSTIN_CHECKER as C } from '@/lib/solutions'

export const metadata: Metadata = pageMetadata('gstinChecker')

const th = { textAlign: 'left' as const, padding: '12px 14px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }
const td = { padding: '12px 14px', fontSize: '14.5px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', verticalAlign: 'top' as const }

export default function GstinCheckerPage() {
  return (
    <div style={{ background: 'var(--bg-base)', paddingTop: '88px' }}>
      <JsonLd nodes={pageSchema('gstinChecker', gstinCheckerSchema(), faqSchemaFor(PAGES.gstinChecker.path, C.faqs))} />

      <section style={{ padding: '64px 0 32px', textAlign: 'center' }}>
        <div style={wrap}>
          <Breadcrumbs page="gstinChecker" />
          <Eyebrow>{C.eyebrow}</Eyebrow>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(34px,5vw,56px)', color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: '16px', fontWeight: 400 }}>{C.h1}</h1>
          <p style={{ fontSize: '17px', color: 'var(--text-secondary)', maxWidth: '640px', margin: '0 auto', lineHeight: 1.7 }}>{C.lead}</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '14px' }}>Free · No sign-up · <UpdatedOn page="gstinChecker" /></p>
        </div>
      </section>

      <GstinChecker />
      <ShareButtons url={absoluteUrl(PAGES.gstinChecker.path)} text="Free GSTIN checker: check a GST number's format and check digit before it goes on an invoice —" />

      <section style={{ padding: '24px 0 16px' }}>
        <div style={narrow}>
          <h2 style={h2Style}>How a GSTIN is built</h2>
          <p style={pStyle}>Every GSTIN has the same 15-character structure, which is why a typo can usually be spotted without looking anything up.</p>
          <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '14px', background: 'var(--bg-card)', margin: '8px 0 12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '520px' }}>
              <thead><tr><th style={th}>Characters</th><th style={th}>What it is</th><th style={th}>Details</th></tr></thead>
              <tbody>
                {C.parts.map(p => (
                  <tr key={p.chars}>
                    <td style={{ ...td, fontWeight: 700, color: 'var(--gold)', whiteSpace: 'nowrap' }}>{p.chars}</td>
                    <td style={{ ...td, whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{p.name}</td>
                    <td style={td}>{p.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 style={{ ...h2Style, marginTop: '36px' }}>Why check a GSTIN before you invoice</h2>
          <p style={pStyle}>Your customer claims input tax credit against the GSTIN printed on your invoice, and your GSTR-1 reports the sale against it. A single wrong character can cost the buyer their credit and create mismatches you then have to fix in your returns.</p>
          <p style={pStyle}>This checker catches mistyped numbers. It can’t tell you whether a GSTIN is registered or active, or who it belongs to — for that, use Search Taxpayer on the GST portal, which is free.</p>
        </div>
      </section>

      <FaqList items={C.faqs} />
      <RelatedLinks current="gstinChecker" />
      <CtaBand title="Never print a wrong GSTIN again" text="Finvosmart checks every GSTIN as you add customers and puts the right one on each GST invoice." href="/gst-billing-software" label="See GST billing software" />
    </div>
  )
}
