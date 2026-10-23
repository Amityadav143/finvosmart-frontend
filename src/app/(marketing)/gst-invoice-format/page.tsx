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
import { JsonLd } from '@/components/seo/JsonLd'
import { ShareButtons } from '@/components/marketing/ShareButtons'
import { Breadcrumbs, CtaBand, Eyebrow, FaqList, RelatedLinks, UpdatedOn, h2Style, narrow, pStyle, wrap } from '@/components/marketing/SolutionPage'
import { absoluteUrl, faqSchemaFor, gstInvoiceTemplateSchema, pageMetadata, pageSchema, PAGES } from '@/lib/seo'
import { GST_INVOICE_FORMAT as C } from '@/lib/solutions'

export const metadata: Metadata = pageMetadata('gstInvoiceFormat')

const th = { textAlign: 'left' as const, padding: '12px 14px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }
const td = { padding: '12px 14px', fontSize: '14.5px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', verticalAlign: 'top' as const }
const tableWrap = { overflowX: 'auto' as const, border: '1px solid var(--border)', borderRadius: '14px', background: 'var(--bg-card)', margin: '8px 0 12px' }
const dl = { display: 'inline-flex', alignItems: 'center', gap: '8px', height: '48px', padding: '0 24px', fontSize: '15px', textDecoration: 'none' }

export default function GstInvoiceFormatPage() {
  return (
    <div style={{ background: 'var(--bg-base)', paddingTop: '88px' }}>
      <JsonLd nodes={pageSchema('gstInvoiceFormat', ...gstInvoiceTemplateSchema(), faqSchemaFor(PAGES.gstInvoiceFormat.path, C.faqs))} />

      <section style={{ padding: '64px 0 28px', textAlign: 'center' }}>
        <div style={wrap}>
          <Breadcrumbs page="gstInvoiceFormat" />
          <Eyebrow>{C.eyebrow}</Eyebrow>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(34px,5vw,56px)', color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: '16px', fontWeight: 400 }}>{C.h1}</h1>
          <p style={{ fontSize: '17px', color: 'var(--text-secondary)', maxWidth: '660px', margin: '0 auto 26px', lineHeight: 1.7 }}>{C.lead}</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/downloads/gst-invoice-format.xlsx" download className="btn-primary" style={dl}>Download Excel (.xlsx)</a>
            <a href="/downloads/gst-invoice-format.pdf" download className="btn-secondary" style={dl}>Download PDF</a>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '14px' }}>
            Free · No sign-up · Works in Excel, Google Sheets and LibreOffice · <UpdatedOn page="gstInvoiceFormat" />
          </p>
        </div>
      </section>

      <section style={{ padding: '8px 0 24px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 24px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/downloads/gst-invoice-format-preview.webp" width={1000} height={1414} loading="lazy"
               alt="GST tax invoice format with supplier and buyer details, HSN/SAC codes, taxable value, and CGST, SGST and IGST columns"
               style={{ width: '100%', height: 'auto', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg, 0 10px 30px rgba(0,0,0,.25))', background: '#fff' }} />
        </div>
      </section>

      <ShareButtons url={absoluteUrl(PAGES.gstInvoiceFormat.path)} text="Free GST invoice format (Excel & PDF) with every field Rule 46 requires:" />

      <section style={{ padding: '16px 0 16px' }}>
        <div style={narrow}>
          <h2 style={h2Style}>What a GST invoice must contain</h2>
          <p style={pStyle}>Rule 46 of the CGST Rules, 2017 sets out what a tax invoice must show. The layout is up to you — what matters is that every detail is there.</p>
          <div style={tableWrap}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '520px' }}>
              <thead><tr><th style={th}>Field</th><th style={th}>What to show</th></tr></thead>
              <tbody>
                {C.fields.map(f => (
                  <tr key={f.field}>
                    <td style={{ ...td, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{f.field}</td>
                    <td style={td}>{f.what}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 style={{ ...h2Style, marginTop: '36px' }}>HSN digits by turnover</h2>
          <p style={pStyle}>The number of HSN or SAC digits depends on your aggregate turnover in the previous financial year.</p>
          <div style={tableWrap}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '480px' }}>
              <thead><tr><th style={th}>Turnover</th><th style={th}>HSN digits</th><th style={th}>Applies to</th></tr></thead>
              <tbody>
                {C.hsn.map(h => (
                  <tr key={h.turnover}>
                    <td style={{ ...td, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{h.turnover}</td>
                    <td style={{ ...td, fontWeight: 700, color: 'var(--gold)', whiteSpace: 'nowrap' }}>{h.digits}</td>
                    <td style={td}>{h.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 style={{ ...h2Style, marginTop: '36px' }}>Tax invoice or bill of supply?</h2>
          <p style={pStyle}>A tax invoice is for taxable supplies by a registered business. If you are under the composition scheme, or you are supplying exempt goods or services, you issue a bill of supply instead — it carries no GST.</p>

          <h2 style={{ ...h2Style, marginTop: '36px' }}>When you also need an e-invoice</h2>
          <p style={pStyle}>
            If your aggregate turnover has exceeded ₹5 crore in any financial year since 2017-18, B2B invoices must also be reported to the Invoice Registration Portal, which returns an IRN and a QR code to print on the invoice.
            See <Link href="/e-invoicing-software" style={{ color: 'var(--gold)' }}>e-invoicing and e-way bills</Link> for who is covered and the reporting deadlines.
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>For guidance only. Rules change — check the latest position or ask your tax adviser. Sources: Rules 46 to 48 of the CGST Rules, 2017; Notification No. 78/2020–Central Tax.</p>
        </div>
      </section>

      <FaqList items={C.faqs} />
      <RelatedLinks current="gstInvoiceFormat" />
      <CtaBand title="Make GST invoices in seconds" text="Finvosmart fills in your business and customer details, applies CGST and SGST or IGST on every line, and numbers each invoice for the financial year." href="/gst-billing-software" label="See GST billing software" />
    </div>
  )
}
