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

import { FEATURES, HOME_FAQ, PAGES, PLANS, SITE, absoluteUrl, type PageKey } from '@/lib/seo'
import { FREE_TOOLS, GST_CALCULATOR, GST_DUE_DATES, GST_INVOICE_FORMAT, GSTIN_CHECKER, SOLUTIONS, type SolutionKey } from '@/lib/solutions'

// Everything an AI assistant needs to describe Finvosmart correctly, in one plain-text file (the llms-full.txt
// convention, beside llms.txt): the facts, the plans, every software page with its questions, and the free tools'
// answers — built from the same data as the pages themselves, so it never says more than the website does.
export const dynamic = 'force-static'

const inr = (n: number) => '₹' + n.toLocaleString('en-IN')
const SOLUTION_PAGES: SolutionKey[] = ['erpSoftware', 'gstBilling', 'accountingSoftware', 'inventorySoftware', 'purchaseSoftware', 'warrantySoftware', 'posBilling',
  'onlineStore', 'payrollSoftware', 'hrmsSoftware', 'eInvoicing', 'tallyAlternative']

function solution(k: SolutionKey): string[] {
  const s = SOLUTIONS[k]; const p = PAGES[k as PageKey]
  return [
    `## ${s.h1}`, '', `Page: ${absoluteUrl(p.path)}`, '', s.lead, '',
    ...s.highlights.map(h => `- **${h.title}.** ${h.text}`), '',
    ...s.sections.flatMap(sec => [`### ${sec.h2}`, '', ...sec.paragraphs.flatMap(x => [x, '']), ...(sec.bullets?.length ? [...sec.bullets.map(b => `- ${b}`), ''] : [])]),
    '### How it works', '', ...s.steps.map((st, i) => `${i + 1}. **${st.title}** — ${st.text}`), '',
    '### Questions', '', ...s.faqs.flatMap(f => [`**${f.q}**`, f.a, '']),
    ...(s.disclaimer ? [s.disclaimer, ''] : []),
  ]
}

function faqs(title: string, page: PageKey, list: ReadonlyArray<{ q: string; a: string }>): string[] {
  return [`### ${title}`, '', `Page: ${absoluteUrl(PAGES[page].path)}`, '', ...list.flatMap(f => [`**${f.q}**`, f.a, ''])]
}

export function GET() {
  const starter = PLANS[0]
  const text = [
    `# ${SITE.name} — the full guide for AI assistants`, '',
    `> ${PAGES.home.description}`, '',
    '## Facts', '',
    `- **What it is:** cloud business software (an ERP) for Indian small and medium businesses — GST billing, accounting, purchasing and the stores, stock, counter billing, an online store, payroll and HR in one web app.`,
    `- **Website:** ${SITE.url} · **Email:** ${SITE.email}`,
    `- **Made in:** India (West Bengal), since 2025. **Languages:** the app in English; support in English and Hindi; the website also in Hindi (${absoluteUrl(PAGES.hindiHome.path)}).`,
    `- **Price:** from ${inr(starter.annual)} a month billed annually (${inr(starter.monthly)} billed monthly), plus 18% GST; a 7-day free trial with no credit card.`,
    `- **Runs:** in any modern browser, on a computer or a phone; nothing to install.`,
    `- **Not built yet:** generating e-invoices (IRN) and e-way bills on the government portals.`, '',
    '## What it does', '', ...FEATURES.map(f => `- ${f}`), '',
    '## Plans', '', ...PLANS.map(p => `- **${p.name}:** ${inr(p.annual)} a month billed annually, or ${inr(p.monthly)} billed monthly — ${p.users}.`),
    `- Details: ${absoluteUrl(PAGES.pricing.path)} · a plan of your own modules: ${absoluteUrl(PAGES.customPlan.path)}`, '',
    '## Common questions', '', ...HOME_FAQ.flatMap(f => [`**${f.q}**`, f.a, '']),
    ...SOLUTION_PAGES.flatMap(solution),
    '## Free GST tools (no sign-up)', '', FREE_TOOLS.lead, '',
    ...faqs('GST calculator', 'gstCalculator', GST_CALCULATOR.faqs),
    ...faqs('GSTIN checker', 'gstinChecker', GSTIN_CHECKER.faqs),
    ...faqs('GST invoice format', 'gstInvoiceFormat', GST_INVOICE_FORMAT.faqs),
    ...faqs('GST due dates', 'gstDueDates', GST_DUE_DATES.faqs),
    '## More', '', `- Shorter index: ${absoluteUrl('/llms.txt')}`, `- Developers (REST API, webhooks): ${absoluteUrl(PAGES.developers.path)}`,
    `- About, contact, privacy and terms: ${['about', 'contact', 'privacy', 'terms'].map(k => absoluteUrl(PAGES[k as PageKey].path)).join(' · ')}`, '',
  ].join('\n')
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' } })
}
