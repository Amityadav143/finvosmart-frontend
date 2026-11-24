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

/**
 * The questions the assistant offers to start with, for the page the person is on: on the pricing page, questions
 * about plans; in Sales, about invoices and payments; on the Hindi page, in Hindi. Each is one the assistant can answer
 * from what it knows (its knowledge is the product's own pages); elsewhere the server's own starters are used.
 */

const WEBSITE: [prefixes: string[], starters: string[]][] = [
  [['/pricing', '/custom-plan'], ['Which plan fits a business with 15 people?', 'Is GST included in the price?',
    'What happens when the 7-day trial ends?', 'What do the add-ons cost?']],
  [['/tally-alternative'], ['How do I bring my data over from Tally?', 'Can my CA work in Finvosmart too?',
    'What does Finvosmart do that Tally doesn’t?']],
  [['/e-invoicing-software'], ['Who must issue e-invoices?', 'Can Finvosmart generate the IRN?', 'What is an e-way bill?']],
  [['/gst-due-dates'], ['When is GSTR-3B due?', 'When is GSTR-1 due?', 'When must TDS be deposited?']],
  [['/gst-billing-software', '/gst-invoice-format', '/gst-calculator', '/gstin-checker', '/free-gst-tools'],
    ['What must a GST invoice show?', 'How are GSTR-1 and GSTR-3B prepared?', 'How do I find the GST in a price that includes it?']],
  [['/payroll-software', '/hrms-software'], ['Does payroll handle PF, ESI and professional tax?', 'Can employees see their own payslips?',
    'How is TDS on salary worked out?']],
  [['/accounting-software'], ['Does it make the P&L and Balance Sheet?', 'Can I lock a period after filing returns?',
    'How do I record an expense from a bill?']],
  [['/developers'], ['Is there an API for invoices?', 'How do webhooks work?', 'How do I get an API key?']],
  [['/warranty-management-software'], ['How do I claim warranty from my supplier?', 'Is GST charged on a warranty replacement?',
    'How is the warranty period worked out?']],
  [['/features'], ['What does Finvosmart do?', 'What is coming soon?', 'Is it right for a pharmacy?']],
  [['/contact', '/about'], ['Can I book a demo?', 'Is support available in Hindi?', 'How is my data kept safe?']],
]

/** The Hindi page: the greeting and the questions in Hindi (the assistant answers in the language it is asked in). */
export const HINDI_STARTERS = ['Finvosmart क्या-क्या करता है?', 'इसकी कीमत कितनी है?', 'क्या मैं Tally से अपना डेटा ला सकता हूँ?',
  'GST बिल कैसे बनता है?']

export function isHindiPage(path: string): boolean {
  return path === '/hi' || path.startsWith('/hi/')
}

const within = (path: string, prefix: string) => path === prefix || path.startsWith(prefix + '/')

export function websiteStarters(path: string, fallback: string[]): string[] {
  if (isHindiPage(path)) return HINDI_STARTERS
  const hit = WEBSITE.find(([prefixes]) => prefixes.some(x => within(path, x)))
  return hit ? hit[1] : fallback
}

const APP: [prefixes: string[], starters: string[], withFigures?: string][] = [
  [['/invoicing', '/quotations', '/crm/customers', '/crm/leads'], ['How do I record a part payment?', 'How do I send a payment reminder?',
    'How do I turn a quotation into an invoice?'], 'Which invoices are overdue?'],
  [['/purchases', '/procurement/orders', '/procurement/grn', '/procurement/vendors'], ['How do I record an expense from a bill?', 'How is the MSME pay-by date worked out?',
    'How do I raise a purchase order?'], 'Which bills are due this week?'],
  [['/warranty'], ['How do I register a customer’s warranty claim?', 'How do I claim warranty from my supplier?',
    'Is GST charged on a warranty replacement?']],
  [['/inventory'], ['How do I set a reorder level?', 'Why did my stock change?', 'How do I add opening stock?']],
  [['/bank-reconciliation', '/cash-flow'], ['How do I match my bank statement?', 'How is the cash forecast worked out?'], 'Will cash run short?'],
  [['/finance/vouchers', '/finance/ledger', '/finance/accounts', '/finance/reports', '/ca-workspace'], ['How do I correct a journal entry?', 'How do I lock a period?', 'Where is the Trial Balance?']],
  [['/gst-export', '/gst-reconciler', '/tds'], ['How do I file GSTR-1?', 'How does the GSTR-2B check work?', 'When is TDS due?']],
  [['/hrms/payroll', '/hrms/employees', '/hrms/leave', '/hrms/attendance', '/recruitment', '/performance', '/self-service'], ['How do I run payroll?', 'How do I approve leave?',
    'How are PF and ESI worked out?']],
  [['/settings'], ['How do I add my team?', 'How do roles and permissions work?', 'How do I set up email alerts?']],
]

/**
 * In the app: "What can I do on this page?" first, then questions about the part of the app the person is in — with
 * one about the company's own figures when the company allows them — or the server's starters elsewhere.
 */
export function appStarters(path: string, fallback: string[], dataAccess: boolean): string[] {
  const hit = APP.find(([prefixes]) => prefixes.some(x => within(path, x)))
  const own = hit ? [...(dataAccess && hit[2] ? [hit[2]] : []), ...hit[1]] : fallback
  const first = path === '/dashboard' || path === '/' ? [] : ['What can I do on this page?']
  return [...first, ...own.filter(q => !first.includes(q))].slice(0, 4)
}
