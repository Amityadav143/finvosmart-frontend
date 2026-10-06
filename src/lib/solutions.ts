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

/**
 * Content for the search landing pages. Each page renders its FAQ from here AND
 * builds its FAQPage schema from the same entries, so they can never drift.
 * Rules for this file: describe only what the product really does today, and
 * state compliance facts exactly (they were verified for 2026).
 */

export type SolutionKey = 'gstBilling' | 'eInvoicing' | 'tallyAlternative'

export interface Solution {
  eyebrow: string
  h1: string
  lead: string
  highlights: { title: string; text: string }[]
  sections: { h2: string; paragraphs: string[]; bullets?: string[] }[]
  steps: { title: string; text: string }[]
  faqs: { q: string; a: string }[]
  cta: { title: string; text: string }
  /** Optional small print at the bottom of the page (e.g. a trademark notice). */
  disclaimer?: string
}

export const SOLUTIONS: Record<SolutionKey, Solution> = {
  gstBilling: {
    eyebrow: 'GST billing software',
    h1: 'GST billing software built for Indian businesses',
    lead: 'Create GST-compliant invoices in under a minute. Finvosmart calculates CGST, SGST or IGST on every line, prints HSN/SAC codes, generates e-invoices and e-way bills, and turns your sales into GSTR-1 ready exports — so month-end stops being a scramble.',
    highlights: [
      { title: 'Tax worked out for you', text: 'Set the GST rate on an item once. Every invoice then splits tax into CGST + SGST for sales within your state, or IGST for sales to another state.' },
      { title: 'HSN/SAC on every line', text: 'Each line carries its HSN or SAC code, quantity, unit, taxable value and tax — the details GST law expects on a tax invoice.' },
      { title: 'E-invoice and e-way bill', text: 'Generate the IRN on the government e-invoice system and an e-way bill from the same invoice, without retyping anything on the portal.' },
      { title: 'GSTR-1 and GSTR-3B exports', text: 'Download GSTR-1 as JSON for the GST offline tool or as Excel, plus a GSTR-3B summary, built straight from the invoices you raised.' },
      { title: 'Share on WhatsApp', text: 'Send invoices to customers on WhatsApp and let automatic reminders follow up on overdue payments.' },
      { title: 'Your format, your brand', text: 'Six invoice designs with your logo, colours, bank details and signature — plus quotations, proformas, delivery challans, credit notes, receipts and purchase orders.' },
    ],
    sections: [
      {
        h2: 'What a GST invoice must include',
        paragraphs: [
          'Under Rule 46 of the CGST Rules, a tax invoice needs more than a total and a signature. Finvosmart builds these fields into every invoice so you never have to remember them:',
        ],
        bullets: [
          'Your name, address and GSTIN',
          'A unique invoice number of up to 16 characters, in a consecutive series for the financial year',
          'Invoice date',
          'Customer name, address and GSTIN (if registered)',
          'Place of supply, with the state name and code for sales to another state',
          'HSN code for goods or SAC code for services, with description, quantity and unit',
          'Taxable value, GST rate and the CGST, SGST or IGST amount',
          'Signature or digital signature of the supplier',
        ],
      },
      {
        h2: 'CGST + SGST or IGST — which applies?',
        paragraphs: [
          'It depends on where the sale happens. When you and your customer are in the same state, GST is split equally into CGST (central) and SGST (state) — 18% becomes 9% + 9%. When the place of supply is in another state, the full rate is charged as IGST.',
          'In Finvosmart you mark a line as inter-state and the invoice applies IGST instead of the CGST/SGST pair, then carries the right amounts into your GSTR-1 export. Want to check a figure quickly? Use our free GST calculator.',
        ],
      },
      {
        h2: 'Ready for GST 2.0 rates',
        paragraphs: [
          'Since 22 September 2025, most goods and services fall into three slabs — 5%, 18% and 40% — with 0% for exempt items, and special rates such as 3% on gold and jewellery. Because rates live on each item, moving an item to its new slab is a one-time change, and every new invoice picks it up automatically.',
        ],
      },
    ],
    steps: [
      { title: 'Set up your business', text: 'Add your GSTIN, invoice series and logo, and choose an invoice design.' },
      { title: 'Add customers and items', text: 'Save customers with their GSTIN and items with HSN/SAC codes and GST rates.' },
      { title: 'Raise the invoice', text: 'Pick a customer and items — tax, totals and the CGST/SGST or IGST split are calculated for you.' },
      { title: 'Send, comply, file', text: 'Share it on WhatsApp, generate the IRN or e-way bill if needed, and export GSTR-1 at month-end.' },
    ],
    faqs: [
      { q: 'Are Finvosmart invoices GST-compliant?', a: 'Yes. Every invoice includes the details required by Rule 46 of the CGST Rules — your GSTIN, a consecutive invoice number, the customer\'s details, place of supply, HSN/SAC codes, taxable value and the CGST, SGST or IGST amounts.' },
      { q: 'Does Finvosmart support the new GST 2.0 rates?', a: 'Yes. GST rates are set on each item, so you can use the 0%, 5%, 18% and 40% slabs introduced on 22 September 2025, as well as special rates like 3% on gold. Update an item once and every new invoice uses the new rate.' },
      { q: 'Can I generate e-invoices and e-way bills?', a: 'Yes. After you add your e-invoice and e-way bill API credentials in settings, Finvosmart generates the IRN on the government IRP and creates e-way bills from your invoices, saving the IRN and e-way bill number on each invoice.' },
      { q: 'Can I send invoices on WhatsApp?', a: 'Yes. You can share invoices with customers on WhatsApp, and Finvosmart can send automatic WhatsApp reminders for overdue payments.' },
      { q: 'Can I customise my invoice format?', a: 'Yes. Choose from six designs and set your logo, colours, bank details, signature and whether to show the HSN column. The same designs work for quotations, proforma invoices, delivery challans, credit notes, receipts and purchase orders.' },
      { q: 'How much does it cost?', a: 'Plans start at ₹3,999 per month billed annually (₹4,999 billed monthly), with a 14-day free trial and no credit card required.' },
    ],
    cta: { title: 'Raise your first GST invoice today', text: 'Start a 14-day free trial — no credit card, no installation.' },
  },

  eInvoicing: {
    eyebrow: 'E-invoice & e-way bill',
    h1: 'E-invoice and e-way bill software for GST',
    lead: 'Generate your Invoice Reference Number (IRN) on the government e-invoice system straight from the invoice you already created, then raise the e-way bill from the same data. No copy-pasting into portals, no mismatched figures.',
    highlights: [
      { title: 'IRN in one click', text: 'Send the invoice to the government Invoice Registration Portal (IRP) and save the IRN it returns on the invoice.' },
      { title: 'E-way bill from the invoice', text: 'Create the e-way bill from the invoice\'s details and keep the e-way bill number with it.' },
      { title: 'Update the vehicle', text: 'Change the vehicle number on an e-way bill when goods switch trucks mid-route.' },
      { title: 'Cancel when needed', text: 'Cancel an IRN or an e-way bill from Finvosmart within the time the government allows.' },
      { title: 'Feeds your GSTR-1', text: 'Invoices reported on the IRP flow into your GSTR-1, and Finvosmart\'s own GSTR-1 export matches your books.' },
      { title: 'Sandbox to start', text: 'Try the flow safely in sandbox mode first, then switch to live once your API credentials are in place.' },
    ],
    sections: [
      {
        h2: 'Who needs to generate e-invoices in 2026',
        paragraphs: [
          'E-invoicing is mandatory for every GST-registered business whose aggregate annual turnover (AATO) has crossed ₹5 crore in any financial year since 2017-18. This limit has applied since 1 August 2023 and is unchanged in 2026. Turnover is counted across all GSTINs under the same PAN, not per registration.',
          'Larger businesses have a deadline too. Since 1 April 2025, if your AATO is ₹10 crore or more, you must report each invoice, credit note and debit note to the IRP within 30 days of its date — the portal rejects anything older. Some sectors, such as banks, insurers and SEZ units, are exempt from e-invoicing.',
        ],
      },
      {
        h2: 'E-invoice and e-way bill are not the same thing',
        paragraphs: [
          'An e-invoice validates the invoice itself. An e-way bill authorises the movement of goods. They often go together, but not always:',
        ],
        bullets: [
          'An e-way bill is generally needed when you move goods worth more than ₹50,000 — whatever your turnover.',
          'A services business above ₹5 crore needs e-invoices but may never need an e-way bill.',
          'A small trader below ₹5 crore may need e-way bills but not e-invoices.',
          'E-invoice data fills Part A of the e-way bill; you add the vehicle or transporter details (Part B) to complete it.',
          'An e-way bill can only be generated within 180 days of the invoice date.',
        ],
      },
    ],
    steps: [
      { title: 'Connect once', text: 'Add your e-invoice and e-way bill API credentials in Finvosmart settings (your existing e-way bill portal login works on the e-invoice portal too).' },
      { title: 'Create the invoice', text: 'Raise a GST invoice as usual — Finvosmart already has every field the IRP needs.' },
      { title: 'Generate the IRN', text: 'Report it to the IRP in one click; the IRN is saved on the invoice.' },
      { title: 'Move the goods', text: 'Generate the e-way bill from the invoice and update the vehicle if it changes in transit.' },
    ],
    faqs: [
      { q: 'What is the e-invoice turnover limit in 2026?', a: 'E-invoicing is mandatory if your aggregate annual turnover crossed ₹5 crore in any financial year from 2017-18 onwards. The limit has applied since 1 August 2023 and is unchanged in 2026. Turnover is counted across all GSTINs under the same PAN.' },
      { q: 'What is the 30-day e-invoice reporting rule?', a: 'Since 1 April 2025, businesses with an aggregate annual turnover of ₹10 crore or more must report each invoice, credit note and debit note to the IRP within 30 days of its date. The portal rejects documents older than that, so report promptly.' },
      { q: 'What is an IRN?', a: 'The Invoice Reference Number is a unique number the government\'s Invoice Registration Portal issues for each e-invoice it accepts. An invoice that needs e-invoicing is not valid without one.' },
      { q: 'Do I need an e-way bill if I already generate e-invoices?', a: 'Often, yes — they serve different purposes. An e-way bill covers the movement of goods, generally above ₹50,000 in value. E-invoice data fills Part A of the e-way bill, and you add the vehicle details in Part B.' },
      { q: 'What do I need to start e-invoicing with Finvosmart?', a: 'Your e-invoice and e-way bill API credentials. Add them in Finvosmart settings once; until then you can try everything in sandbox mode.' },
      { q: 'Does e-invoicing replace GSTR-1?', a: 'No. Invoices reported on the IRP flow into GSTR-1 automatically, but you still review and file the return. Finvosmart\'s GSTR-1 export helps you check it against your books.' },
    ],
    cta: { title: 'Make e-invoicing a one-click job', text: 'Start a 14-day free trial and try the full flow in sandbox mode.' },
  },
  tallyAlternative: {
    eyebrow: 'Tally alternative',
    h1: 'A cloud alternative to Tally for GST businesses',
    lead: 'Keep the double-entry books your accountant knows — vouchers, ledgers, Trial Balance, Profit & Loss and Balance Sheet — in a system that runs in your browser and books every GST invoice for you.',
    highlights: [
      { title: 'Books that keep themselves', text: 'When an invoice is issued, Finvosmart posts it to the ledger: Sundry Debtors, Sales and Output CGST, SGST or IGST. Payments and cancellations post their own entries.' },
      { title: 'The reports you rely on', text: 'A Trial Balance with debit and credit columns, Profit & Loss for any period and a Balance Sheet as at any date — all computed from posted entries.' },
      { title: 'Nothing to install', text: 'Finvosmart runs in your browser, so you can open your books from the office, from home or on the road.' },
      { title: 'Your whole team at once', text: 'Everyone gets their own login and role: accountants post vouchers, managers read reports, sales staff raise invoices.' },
      { title: 'GST built in', text: 'Generate e-invoice IRNs and e-way bills from your invoices, and export GSTR-1 and GSTR-3B data from the same records.' },
      { title: 'More than accounting', text: 'CRM, inventory and HR records live in the same system, and invoices reach customers on WhatsApp.' },
    ],
    sections: [
      {
        h2: 'What stays familiar',
        paragraphs: [
          'Finvosmart keeps proper double-entry accounting. Every voucher must balance before it is saved, and the books follow the Indian financial year from April to March.',
        ],
        bullets: [
          'A ready-made chart of accounts for an Indian business — Cash, Bank, Sundry Debtors and Creditors, input and output GST, Capital, Sales, Purchases and common expenses — which you can extend.',
          'Journal and receipt vouchers, numbered by financial year, such as SV/2026-27/00012.',
          'A Trial Balance with debit and credit columns that tells you whether your books balance.',
          'A Balance Sheet laid out the way Indian accountants expect: liabilities and equity beside assets.',
        ],
      },
      {
        h2: 'What gets easier',
        paragraphs: [],
        bullets: [
          'Sales post themselves. Issue a GST invoice and the ledger entry is made for you; mark it paid and the receipt is posted; cancel it and the entries are reversed.',
          'Work from anywhere. Your books live online, so you and your accountant see the same numbers at the same time.',
          'The right access for each person. Roles decide who can post entries, who can only read reports, and who cannot see the accounts at all.',
          'Compliance in one place. E-invoices, e-way bills and GST return exports come from the same invoices as your books.',
        ],
      },
      {
        h2: 'Moving from Tally',
        paragraphs: [
          'Most businesses switch at the start of a month or a financial year. Our team helps you bring across customers, items and opening balances during onboarding, and you can run Finvosmart alongside Tally while you compare the numbers.',
          'One thing to know: today, purchases and expenses are recorded with vouchers rather than posted automatically. Sales, receipts and cancellations post automatically.',
        ],
      },
    ],
    steps: [
      { title: 'Start your trial', text: 'Sign up in a minute. Your company gets a standard chart of accounts.' },
      { title: 'Add opening balances', text: 'Enter balances as at your start date — our team can help.' },
      { title: 'Add customers and items', text: 'With GSTINs, HSN/SAC codes and GST rates.' },
      { title: 'Invoice as usual', text: 'Every issued invoice posts to your books. Check the Trial Balance any time.' },
    ],
    faqs: [
      { q: 'Can Finvosmart replace Tally for my business?', a: 'If you need GST invoicing, double-entry books and the standard reports — Trial Balance, Profit & Loss and Balance Sheet — yes. Today, purchases and expenses are recorded with vouchers rather than automatically, so check that suits how you work. The free trial is the easiest way to find out.' },
      { q: 'Do I need to install anything?', a: 'No. Finvosmart runs in a web browser on a computer, tablet or phone, so there is nothing to install or update on your office machines.' },
      { q: 'How do I move my data from Tally?', a: 'Our team helps you import customers, items and opening balances during onboarding. Many businesses run both systems side by side for a month before switching fully.' },
      { q: 'Can my accountant use it?', a: 'Yes. Invite them with the Accountant role: they can post vouchers and see every financial report, but cannot manage users, roles or company settings.' },
      { q: 'Does it handle GST?', a: 'Yes. Invoices apply CGST and SGST, or IGST, with HSN/SAC codes on every line. Once your API credentials are added, you can generate e-invoice IRNs and e-way bills, and you can export GSTR-1 and GSTR-3B data.' },
      { q: 'How much does it cost?', a: 'Plans start at ₹3,999 per month billed annually (₹4,999 billed monthly), with a 14-day free trial and no credit card required.' },
    ],
    cta: { title: 'Try Finvosmart alongside Tally', text: '14 days free, no credit card. Keep Tally running while you compare.' },
    disclaimer: 'Tally and TallyPrime are trademarks of Tally Solutions Pvt. Ltd. Finvosmart is an independent product and is not affiliated with Tally Solutions.',
  },
}

/** Content for the GST calculator page (FAQ shared with its schema). */
export const GST_CALCULATOR = {
  eyebrow: 'Free tool',
  h1: 'GST calculator',
  lead: 'Add GST to a price or take it out, and see the CGST, SGST or IGST split instantly. Uses the GST 2.0 rates in force since 22 September 2025. Free, no sign-up.',
  slabs: [
    { rate: '0%', label: 'Nil / exempt', examples: 'Exempt and nil-rated supplies, such as many fresh, unprocessed foods' },
    { rate: '5%', label: 'Merit rate', examples: 'Many everyday essentials — for example thermometers, and tractor tyres and parts, which moved down from 18%' },
    { rate: '18%', label: 'Standard rate', examples: 'Most goods and services — for example air conditioners, washing machines, dishwashers and cement, which moved down from 28%' },
    { rate: '40%', label: 'Luxury & sin goods', examples: 'For example caffeinated and aerated drinks, motorcycles above 350 cc, and yachts' },
    { rate: '3%', label: 'Special rate', examples: 'Gold, silver and jewellery' },
    { rate: '0.25%', label: 'Special rate', examples: 'Rough precious and semi-precious stones' },
  ],
  faqs: [
    { q: 'How is GST calculated?', a: 'Multiply the taxable value by the GST rate. For a ₹10,000 sale at 18%, GST is ₹10,000 × 18 ÷ 100 = ₹1,800, so the customer pays ₹11,800.' },
    { q: 'How do I remove GST from a price that already includes it?', a: 'Divide the GST-inclusive price by (1 + rate ÷ 100). For ₹11,800 including 18% GST, the taxable value is ₹11,800 ÷ 1.18 = ₹10,000, and the GST is the remaining ₹1,800.' },
    { q: 'When do I charge CGST + SGST, and when IGST?', a: 'If you and your customer are in the same state, split the GST equally into CGST and SGST (18% becomes 9% + 9%). If the place of supply is in another state, charge the full rate as IGST.' },
    { q: 'What are the GST rates in 2026?', a: 'Since 22 September 2025 (GST 2.0), most items fall into 5%, 18% or 40%, with 0% for exempt and nil-rated supplies. Special rates continue for a few goods, such as 3% on gold and jewellery and 0.25% on rough precious stones.' },
    { q: 'Is this GST calculator free?', a: 'Yes, completely free and with no sign-up. Results are for guidance — always confirm the rate for your item\'s HSN or SAC code.' },
  ],
}
