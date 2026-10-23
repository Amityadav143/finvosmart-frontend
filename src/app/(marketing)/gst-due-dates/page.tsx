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
import { DueDatePlanner } from '@/components/marketing/DueDatePlanner'
import { ShareButtons } from '@/components/marketing/ShareButtons'
import { Breadcrumbs, CtaBand, Eyebrow, FaqList, RelatedLinks, UpdatedOn, h2Style, narrow, pStyle, wrap } from '@/components/marketing/SolutionPage'
import { absoluteUrl, faqSchemaFor, pageMetadata, pageSchema, PAGES } from '@/lib/seo'
import { GST_DUE_DATES as C } from '@/lib/solutions'
import { AREA_LABEL, QRMP_22, QRMP_24, deadlinesBetween, formatDate, fyName, fyStartOf, monthTitle } from '@/lib/dueDates'

// The year in the heading and the month-by-month list follow the calendar: the page is
// rebuilt at most once a day, so it rolls over to the new financial year on its own in April.
export const revalidate = 86400

export function generateMetadata(): Metadata {
  return pageMetadata('gstDueDates')
}

const th = { textAlign: 'left' as const, padding: '12px 14px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '1px solid var(--border)' }
const td = { padding: '12px 14px', fontSize: '14.5px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', verticalAlign: 'top' as const }
const form = { ...td, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' as const }
const tableBox = { overflowX: 'auto' as const, border: '1px solid var(--border)', borderRadius: '14px', background: 'var(--bg-card)', margin: '8px 0 28px' }

function Table({ caption, rows }: { caption: string; rows: [string, string, string][] }) {
  return (
    <div style={tableBox}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px' }}>
        <caption style={{ textAlign: 'left', padding: '14px 14px 4px', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{caption}</caption>
        <thead><tr><th scope="col" style={th}>Return or payment</th><th scope="col" style={th}>Who</th><th scope="col" style={th}>Due by</th></tr></thead>
        <tbody>{rows.map(([f, who, due]) => <tr key={f + who}><th scope="row" style={form}>{f}</th><td style={td}>{who}</td><td style={{ ...td, color: 'var(--text-primary)' }}>{due}</td></tr>)}</tbody>
      </table>
    </div>
  )
}

export default function GstDueDatesPage() {
  const fy = fyStartOf(new Date())
  const year = fyName(fy)
  // Everything due within this financial year's calendar months (whatever tax period it is for).
  const inYear = deadlinesBetween(`${fy}-04-01`, `${fy + 1}-03-31`).filter(d => d.area !== 'gst-other')
  const months: { title: string; items: typeof inYear }[] = []
  for (const d of inYear) {
    const t = monthTitle(d.date)
    if (months[months.length - 1]?.title !== t) months.push({ title: t, items: [] })
    months[months.length - 1].items.push(d)
  }

  return (
    <div style={{ background: 'var(--bg-base)', paddingTop: '88px' }}>
      <JsonLd nodes={pageSchema('gstDueDates', faqSchemaFor(PAGES.gstDueDates.path, C.faqs))} />

      <section style={{ padding: '64px 0 32px', textAlign: 'center' }}>
        <div style={wrap}>
          <Breadcrumbs page="gstDueDates" />
          <Eyebrow>{C.eyebrow}</Eyebrow>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(34px,5vw,56px)', color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: '16px', fontWeight: 400 }}>
            GST due dates for FY {year}
          </h1>
          <p style={{ fontSize: '17px', color: 'var(--text-secondary)', maxWidth: '680px', margin: '0 auto', lineHeight: 1.7 }}>{C.lead}</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '14px' }}>Free · No sign-up · <UpdatedOn page="gstDueDates" /></p>
        </div>
      </section>

      <DueDatePlanner />
      <ShareButtons url={absoluteUrl(PAGES.gstDueDates.path)} text={`GST, TDS, PF and ESI due dates for FY ${year}, with a calendar to download —`} />

      <section style={{ padding: '24px 0 8px' }}>
        <div style={narrow}>
          <h2 style={h2Style}>GST return due dates at a glance</h2>
          <p style={pStyle}>Most businesses file GSTR-1 (sales) and GSTR-3B (summary and payment) every month. Businesses with turnover up to ₹5 crore can choose the QRMP scheme instead: returns every quarter, tax every month.</p>
          <Table caption="Monthly filers" rows={[
            ['GSTR-1', 'Regular taxpayers filing monthly', '11th of the next month'],
            ['GSTR-3B', 'Regular taxpayers filing monthly', '20th of the next month (tax paid with it)'],
          ]} />
          <Table caption="Quarterly filers (QRMP scheme)" rows={[
            ['IFF', 'Optional, for B2B invoices of the 1st and 2nd month', '13th of the next month'],
            ['PMT-06', 'Tax for the 1st and 2nd month of the quarter', '25th of the next month'],
            ['GSTR-1', 'Quarterly return of sales', '13th of the month after the quarter'],
            ['GSTR-3B', 'Quarterly summary return', '22nd or 24th of the month after the quarter, by state'],
          ]} />
          <Table caption="Composition scheme and annual returns" rows={[
            ['CMP-08', 'Composition taxpayers: the quarter’s tax', '18th of the month after the quarter'],
            ['GSTR-4', 'Composition taxpayers: annual return', '30 April after the financial year'],
            ['GSTR-9', 'Regular taxpayers: annual return', '31 December after the financial year'],
            ['GSTR-9C', 'Reconciliation statement, turnover above ₹5 crore', '31 December after the financial year'],
          ]} />
          <Table caption="Other GST returns" rows={[
            ['GSTR-7', 'Government departments and notified GST TDS deductors', '10th of the next month'],
            ['GSTR-8', 'E-commerce operators collecting TCS', '10th of the next month'],
            ['GSTR-5', 'Non-resident taxable persons', '13th of the next month'],
            ['GSTR-6', 'Input service distributors', '13th of the next month'],
          ]} />

          <h2 style={{ ...h2Style, marginTop: '12px' }}>QRMP: which states file GSTR-3B by the 22nd, and which by the 24th</h2>
          <div className="auto-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', margin: '8px 0 28px' }}>
            {([['By the 22nd', QRMP_22], ['By the 24th', QRMP_24]] as const).map(([title, list]) => (
              <div key={title} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '18px 20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>{title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{list.join(', ')}.</p>
              </div>
            ))}
          </div>

          <h2 style={h2Style}>TDS, PF, ESI and advance tax</h2>
          <p style={pStyle}>The other monthly and quarterly dates a business with staff and suppliers works to.</p>
          <Table caption="Income tax and payroll" rows={[
            ['TDS deposit', 'Tax deducted on salaries and payments to suppliers', '7th of the next month; 30 April for March'],
            ['TDS returns (24Q, 26Q)', 'Every deductor, each quarter', '31 July, 31 October, 31 January and 31 May'],
            ['PF (ECR and challan)', 'Employers registered with EPFO', '15th of the next month'],
            ['ESI contribution', 'Employers registered with ESIC', '15th of the next month'],
            ['Advance income tax', 'Businesses whose tax for the year is ₹10,000 or more', '15 June (15%), 15 September (45%), 15 December (75%), 15 March (100%)'],
          ]} />
        </div>
      </section>

      <section style={{ padding: '24px 0 32px' }} aria-labelledby="month-by-month">
        <div style={wrap}>
          <h2 id="month-by-month" style={{ ...h2Style, textAlign: 'center' }}>Month by month: FY {year}</h2>
          <p style={{ ...pStyle, textAlign: 'center', maxWidth: '680px', margin: '0 auto 28px' }}>Everything due in each month of the year, whichever period it is for. Quarterly GSTR-3B shows both state dates.</p>
          <div className="auto-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
            {months.map(mo => (
              <div key={mo.title} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px 20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>{mo.title}</h3>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {mo.items.map(d => (
                    <li key={d.date + d.title} style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{formatDate(d.date).replace(/ \d{4}$/, '')}</strong> · {d.title}
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>{AREA_LABEL[d.area]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FaqList items={C.faqs} />
      <RelatedLinks current="gstDueDates" />
      <CtaBand title="Never miss a filing date" text="Finvosmart shows the GST, TDS, PF and ESI dates coming up on your dashboard — and prepares GSTR-1, GSTR-3B and the payroll files from your own books." />
      <p style={{ ...narrow, fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', paddingBottom: '40px', lineHeight: 1.6 }}>
        Due dates as set by law for FY {year}. The government extends dates from time to time by notification — check gst.gov.in and incometax.gov.in for any extension before relying on a later date.
      </p>
    </div>
  )
}
