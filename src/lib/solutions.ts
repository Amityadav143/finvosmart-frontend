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

export type SolutionKey = 'gstBilling' | 'eInvoicing' | 'tallyAlternative' | 'accountingSoftware' | 'payrollSoftware' | 'hrmsSoftware'
  | 'posBilling' | 'onlineStore' | 'inventorySoftware' | 'purchaseSoftware' | 'warrantySoftware' | 'erpSoftware'

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
  erpSoftware: {
    eyebrow: 'ERP software for Indian businesses',
    h1: 'Cloud ERP software for small and medium businesses in India',
    lead: 'Run sales and GST, accounts, purchasing and the stores, stock, the shop counter, payroll and HR from one set of books. Every invoice, bill, receipt and payslip posts where it belongs, so the figures agree everywhere — in a web app your team opens from any browser.',
    highlights: [
      { title: 'One set of books', text: 'An invoice moves stock and posts to the ledgers; so does a supplier’s bill; payroll posts salaries, PF and ESI. The Trial Balance, Profit & Loss and Balance Sheet come from what really happened, not from a second entry.' },
      { title: 'GST from the start', text: 'CGST and SGST or IGST from the place of supply, HSN and SAC codes, reverse charge, GSTR-1 and GSTR-3B files made from your books, and your bills checked against GSTR-2B.' },
      { title: 'From the order to the shelf', text: 'Purchase orders with approval, gate entry, goods receipts with quality inspection, returns with challans, and supplier bills matched to the order and the receipt — held for payment when they don’t match.' },
      { title: 'Stock in every place', text: 'Warehouses, shops, factory stores and sites as godowns, with transfers, material issued to departments, stock counts, and batches sold first-to-expire.' },
      { title: 'Selling, wherever it happens', text: 'GST invoices with UPI pay links and reminders, a counter for the shop with barcode scanning and receipts, and an online store whose orders become invoices.' },
      { title: 'People and payroll', text: 'Attendance, leave and payroll under the labour codes — PF, ESI, professional tax and TDS on salary — with payslips and bank files, plus hiring and performance reviews.' },
    ],
    sections: [
      {
        h2: 'What an ERP does for a growing business',
        paragraphs: [
          'An ERP (enterprise resource planning) system keeps a business’s sales, purchases, stock, money and people in one database, so every department works from the same figures and nothing is typed twice. Finvosmart was built for Indian GST and labour law from the start, and is priced for small and medium businesses.',
          'Everything shares the same customers, suppliers, items and accounts: set up a customer once and they flow through quotations, invoices, payments, statements and reports; buy an item once and it moves through the order, the gate, the receipt, the godown and the bill.',
        ],
      },
      {
        h2: 'The modules, in one system',
        paragraphs: ['Every plan includes the core of the business; the Growth plan adds WhatsApp, the GSTR-2B credit check, bank matching and TDS registers.'],
        bullets: [
          'Sales: quotations, GST invoices with UPI pay links, payment reminders, credit notes, delivery challans and statements of account.',
          'Purchasing: purchase orders with approval, gate entry, goods receipts (GRN), quality inspection, returns, matched bills, a reorder planner and supplier ratings.',
          'Accounts: double-entry ledgers, journal entries, the Trial Balance, Profit & Loss and Balance Sheet, period locks and review by your accountant.',
          'GST and TDS: GSTR-1 and GSTR-3B files, the GSTR-2B credit check, TDS on supplier bills and MSME payment dates.',
          'Stock: items with HSN, godowns, transfers, material requests, stock counts, batches and expiry.',
          'Shop and online: counter billing (POS) with shift close, and an online store for pickup and delivery orders.',
          'After-sales: warranty claims from customers, passed on to the supplier the goods came from.',
          'People: employees, attendance, leave, payroll with PF and ESI files, hiring and performance reviews.',
          'Around them: CRM leads, projects and contracts, a tender tracker, a 13-week cash-flow forecast and an AI assistant.',
        ],
      },
      {
        h2: 'A desk for each person, and a record of every change',
        paragraphs: [
          'Roles decide what each person sees and does — the cashier at the counter, the store keeper at the gate, the accountant in the books, the manager who approves. Purchase orders, leave, payroll and bills held for payment wait for the people who approve them, and the audit trail keeps every change to the books.',
          'Templates for retail stores, pharmacies, clinics, manufacturers, contractors and solar installers set up the menu, the fields on documents and the roles a business of that kind needs.',
        ],
      },
    ],
    steps: [
      { title: 'Start the trial', text: 'Seven days free, no credit card.' },
      { title: 'Choose your industry', text: 'The menu, fields and roles your kind of business needs.' },
      { title: 'Bring your data', text: 'Customers, suppliers, items and opening balances from Excel.' },
      { title: 'Add your team', text: 'Each person with the role for their desk.' },
      { title: 'Run the day', text: 'Sell, buy, pay and file from one set of books.' },
    ],
    faqs: [
      { q: 'What is ERP software?', a: 'ERP (enterprise resource planning) software runs a business’s core work — sales, purchases, stock, accounts and people — in one system with one database, so the figures agree across departments. Finvosmart is a cloud ERP: it runs in the browser, with nothing to install.' },
      { q: 'Is Finvosmart suitable for a small business?', a: 'Yes. The Starter plan covers up to 10 users and one branch with invoicing, accounts, purchasing and the stores, stock, the counter, the online store, payroll and HR. Growth adds more users, branches and the GST and bank checks.' },
      { q: 'Which industries does it suit?', a: 'Any Indian business that sells goods or services. Ready templates set it up for retail stores, pharmacies, clinics and hospitals, manufacturers, contractors and construction, and solar installers.' },
      { q: 'Can I move from Tally or another system?', a: 'Yes. Import customers, suppliers, items, employees, opening balances and unpaid invoices and bills from Excel, including what you export from Tally. Each import is checked and previewed, and saved all or nothing.' },
      { q: 'How much does it cost?', a: 'Plans start at ₹3,999 per month billed annually (₹4,999 billed monthly), with a 7-day free trial and no credit card required.' },
    ],
    cta: { title: 'One system for the whole business', text: 'Start a 7-day free trial — no credit card, nothing to install.' },
  },
  gstBilling: {
    eyebrow: 'GST billing software',
    h1: 'GST billing software built for Indian businesses',
    lead: 'Create GST-compliant invoices in under a minute. Finvosmart calculates CGST, SGST or IGST on every line, prints HSN/SAC codes, puts a UPI pay link on every invoice, and turns your sales into GSTR-1 and GSTR-3B files ready to upload — so month-end stops being a scramble.',
    highlights: [
      { title: 'Tax worked out for you', text: 'Set the GST rate on an item once. Every invoice then splits tax into CGST + SGST for sales within your state, or IGST for sales to another state.' },
      { title: 'HSN/SAC on every line', text: 'Each line carries its HSN or SAC code, quantity, unit, taxable value and tax — the details GST law expects on a tax invoice.' },
      { title: 'Get paid from the invoice', text: 'Every invoice carries a UPI QR code and a private view-and-pay link. Record part payments and the TDS your customer deducted; reminders go out by email and WhatsApp.' },
      { title: 'GSTR-1 and GSTR-3B, ready to upload', text: 'GSTR-1 section by section as the portal\'s JSON file or as Excel, and GSTR-3B with your input tax credit checked against GSTR-2B — built straight from your books.' },
      { title: 'Invoices on WhatsApp', text: 'Connect your WhatsApp Business account to send invoices to customers on WhatsApp, or download the PDF and share it yourself.' },
      { title: 'Your colours and notes', text: 'Start from a preset template and set its colour, a note under the heading, footer terms, and whether bank and UPI details and a signature line print — for invoices, quotations, proformas, delivery challans and credit notes.' },
      { title: 'From quotation to invoice, stock included', text: 'Your customer accepts the quotation from its link and you are told. It then becomes the tax invoice in one step, linked both ways and never twice, and issuing the invoice takes the items out of stock — the stock in hand shows as you pick each item.' },
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
          'In Finvosmart the invoice compares the place of supply with your state: the same state gets CGST + SGST, another state gets IGST — and the right amounts flow into your GSTR-1. Want to check a figure quickly? Use our free GST calculator.',
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
      { title: 'Set up your business', text: 'Add your GSTIN, address and invoice series, and pick a template for your invoices.' },
      { title: 'Add customers and items', text: 'Save customers with their GSTIN and items with HSN/SAC codes and GST rates.' },
      { title: 'Raise the invoice', text: 'Pick a customer and items — tax, totals and the CGST/SGST or IGST split are calculated for you.' },
      { title: 'Send, get paid, file', text: 'Send it by email or WhatsApp with a pay link, record the payment when it arrives, and upload GSTR-1 and GSTR-3B at month end.' },
    ],
    faqs: [
      { q: 'Are Finvosmart invoices GST-compliant?', a: 'Yes. Every invoice includes the details required by Rule 46 of the CGST Rules — your GSTIN, a consecutive invoice number, the customer\'s details, place of supply, HSN/SAC codes, taxable value and the CGST, SGST or IGST amounts.' },
      { q: 'Does Finvosmart support the new GST 2.0 rates?', a: 'Yes. GST rates are set on each item, so you can use the 0%, 5%, 18% and 40% slabs introduced on 22 September 2025, as well as special rates like 3% on gold. Update an item once and every new invoice uses the new rate.' },
      { q: 'Can I generate e-invoices and e-way bills?', a: 'Not from Finvosmart yet — direct IRN and e-way bill generation is being built. Today, generate them on the government portals and record the e-way bill number on the invoice, where it prints. Every Finvosmart invoice already carries the details the IRP needs.' },
      { q: 'Can I send invoices on WhatsApp?', a: 'Yes, once a WhatsApp Business account (Meta Cloud API) is connected with approved message templates. Finvosmart then sends each invoice’s number, amount and due date to your customer, and payment reminders with a pay link. You can always download the PDF and share it yourself.' },
      { q: 'Can I customise my invoice format?', a: 'Yes. Start from one of six preset templates and set its colour, a note under the heading, footer terms, and whether your bank and UPI details and a signature line print. Invoices, quotations, proforma invoices, delivery challans and credit notes can each have their own default template.' },
      { q: 'How much does it cost?', a: 'Plans start at ₹3,999 per month billed annually (₹4,999 billed monthly), with a 7-day free trial and no credit card required.' },
    ],
    cta: { title: 'Raise your first GST invoice today', text: 'Start a 7-day free trial — no credit card, no installation.' },
  },

  eInvoicing: {
    eyebrow: 'E-invoice & e-way bill',
    h1: 'E-invoice and e-way bill: the 2026 rules for GST businesses',
    lead: 'Who has to e-invoice, how fast invoices must reach the IRP, and how an e-way bill differs from an e-invoice — plus how Finvosmart keeps every invoice ready for both. Direct IRN and e-way bill generation from Finvosmart is coming soon; until then you generate them on the government portals.',
    highlights: [
      { title: 'Every field the IRP needs', text: 'GSTINs, place of supply, HSN/SAC codes, taxable value and tax on every line, and invoice numbers of up to 16 characters — the e-invoice schema\'s own limit.' },
      { title: 'Numbers kept with the invoice', text: 'Record the e-way bill number, LR number and purchase order reference on the invoice; they print on it and stay with it.' },
      { title: 'GSTR-1 from your books', text: 'Finvosmart builds GSTR-1 from the invoices you raised, so you can check what the IRP passed on to your return against your own records.' },
      { title: 'Coming soon: IRN from Finvosmart', text: 'Generating the IRN and e-way bill straight from the invoice, through a GST Suvidha Provider, is being built.' },
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
      {
        h2: 'Generating them today, with Finvosmart invoices',
        paragraphs: [
          'Until direct generation is ready, the work splits cleanly. You raise the GST invoice in Finvosmart, where tax, place of supply and HSN codes are already worked out. You report it on an Invoice Registration Portal to get the IRN and signed QR code, and raise the e-way bill on the e-way bill portal when goods move. Then you note the e-way bill number on the invoice in Finvosmart, so it prints on the copy that travels with the goods.',
          'Because the figures come from one invoice, the amounts you key into the portals match your books — and at month end your GSTR-1 from Finvosmart lets you check that every e-invoice reached your return.',
        ],
      },
    ],
    steps: [
      { title: 'Create the invoice', text: 'Raise a GST invoice in Finvosmart — tax, place of supply and HSN codes are worked out for you.' },
      { title: 'Report it to the IRP', text: 'Enter it on an Invoice Registration Portal to get the IRN and signed QR code.' },
      { title: 'Move the goods', text: 'Raise the e-way bill on the e-way bill portal and note its number on the invoice in Finvosmart.' },
      { title: 'Check at month end', text: 'Compare the GSTR-1 Finvosmart prepares with what the IRP passed on to your return.' },
    ],
    faqs: [
      { q: 'What is the e-invoice turnover limit in 2026?', a: 'E-invoicing is mandatory if your aggregate annual turnover crossed ₹5 crore in any financial year from 2017-18 onwards. The limit has applied since 1 August 2023 and is unchanged in 2026. Turnover is counted across all GSTINs under the same PAN.' },
      { q: 'What is the 30-day e-invoice reporting rule?', a: 'Since 1 April 2025, businesses with an aggregate annual turnover of ₹10 crore or more must report each invoice, credit note and debit note to the IRP within 30 days of its date. The portal rejects documents older than that, so report promptly.' },
      { q: 'What is an IRN?', a: 'The Invoice Reference Number is a unique number the government\'s Invoice Registration Portal issues for each e-invoice it accepts. An invoice that needs e-invoicing is not valid without one.' },
      { q: 'Do I need an e-way bill if I already generate e-invoices?', a: 'Often, yes — they serve different purposes. An e-way bill covers the movement of goods, generally above ₹50,000 in value. E-invoice data fills Part A of the e-way bill, and you add the vehicle details in Part B.' },
      { q: 'Can Finvosmart generate the IRN for me?', a: 'Not yet. Direct IRN and e-way bill generation is being built. Today, Finvosmart prepares GST invoices with every detail the IRP needs, and you generate the IRN and e-way bill on the government portals and note the numbers on the invoice.' },
      { q: 'Does e-invoicing replace GSTR-1?', a: 'No. Invoices reported on the IRP flow into GSTR-1 automatically, but you still review and file the return. Finvosmart\'s GSTR-1 export helps you check it against your books.' },
    ],
    cta: { title: 'Keep your GST invoices ready for the IRP', text: 'Start a 7-day free trial — GST invoices, GSTR-1 and GSTR-3B from the same books.' },
  },
  tallyAlternative: {
    eyebrow: 'Tally alternative',
    h1: 'A cloud alternative to Tally for GST businesses',
    lead: 'Keep the double-entry books your accountant knows — vouchers, ledgers, Trial Balance, Profit & Loss and Balance Sheet — in a system that runs in your browser and books every GST invoice for you.',
    highlights: [
      { title: 'Books that keep themselves', text: 'When an invoice is issued, Finvosmart posts it to the ledger: Sundry Debtors, Sales and Output CGST, SGST or IGST. Supplier bills, expenses, payments, cancellations and payroll post their own entries too.' },
      { title: 'The reports you rely on', text: 'A Trial Balance with debit and credit columns, Profit & Loss for any period and a Balance Sheet as at any date — all computed from posted entries.' },
      { title: 'Nothing to install', text: 'Finvosmart runs in your browser, so you can open your books from the office, from home or on the road.' },
      { title: 'Your whole team at once', text: 'Everyone gets their own login and role: accountants post vouchers, managers read reports, sales staff raise invoices.' },
      { title: 'GST built in', text: 'GSTR-1 and GSTR-3B are prepared from the same records as your books, with input tax credit checked against GSTR-2B.' },
      { title: 'Stock that keeps itself', text: 'As in Tally, sales and purchase invoices move your stock: issuing an invoice takes items out, a supplier bill brings them in, and the stock ledger shows the document behind every movement. Payroll, CRM and HR live in the same system.' },
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
          'A ledger for every account, with a running balance and a click through to the voucher, invoice or bill behind each entry — as a PDF or CSV too.',
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
          'Compliance in one place. GSTR-1, GSTR-3B, TDS on bills and payroll files come from the same records as your books.',
        ],
      },
      {
        h2: 'Moving from Tally',
        paragraphs: [
          'Most businesses switch at the start of a month or a financial year. Export your masters and balances from Tally to Excel and import them: customers, suppliers, items, employees, account opening balances, and the invoices and bills still unpaid. Every import is checked and previewed before anything is saved, and our team can help.',
          'You can run Finvosmart alongside Tally while you compare the numbers. Sales, purchases, receipts, payments and payroll all post to the books automatically.',
        ],
      },
    ],
    steps: [
      { title: 'Start your trial', text: 'Sign up in a minute. Your company gets a standard chart of accounts.' },
      { title: 'Add opening balances', text: 'Import balances as at your start date from Excel — our team can help.' },
      { title: 'Add customers and items', text: 'With GSTINs, HSN/SAC codes and GST rates.' },
      { title: 'Invoice as usual', text: 'Every issued invoice posts to your books. Check the Trial Balance any time.' },
    ],
    faqs: [
      { q: 'Can Finvosmart replace Tally for my business?', a: 'If you need GST invoicing and returns, purchase bills, double-entry books and the standard reports — Trial Balance, Profit & Loss and Balance Sheet — yes. The free trial is the easiest way to find out how it fits the way you work.' },
      { q: 'Do I need to install anything?', a: 'No. Finvosmart runs in a web browser on a computer, tablet or phone, so there is nothing to install or update on your office machines.' },
      { q: 'How do I move my data from Tally?', a: 'Export your customers, suppliers, items and balances from Tally to Excel and import them into Finvosmart — unpaid invoices and bills too. Each import is previewed and saved all or nothing. Many businesses run both systems side by side for a month before switching fully.' },
      { q: 'Can my accountant use it?', a: 'Yes. Invite them with the Accountant role: they can post vouchers and see every financial report, but cannot manage users, roles or company settings.' },
      { q: 'Does it handle GST?', a: 'Yes. Invoices apply CGST and SGST, or IGST, with HSN/SAC codes on every line. GSTR-1 and GSTR-3B are prepared from your records as files to upload on the GST portal, and supplier invoices are checked against GSTR-2B. Direct e-invoice and e-way bill generation is coming soon.' },
      { q: 'How much does it cost?', a: 'Plans start at ₹3,999 per month billed annually (₹4,999 billed monthly), with a 7-day free trial and no credit card required.' },
    ],
    cta: { title: 'Try Finvosmart alongside Tally', text: '7 days free, no credit card. Keep Tally running while you compare.' },
    disclaimer: 'Tally and TallyPrime are trademarks of Tally Solutions Pvt. Ltd. Finvosmart is an independent product and is not affiliated with Tally Solutions.',
  },

  accountingSoftware: {
    eyebrow: 'Accounting software',
    h1: 'Online accounting software for small businesses in India',
    lead: 'Proper double-entry books without the double entry. Finvosmart posts every invoice, supplier bill, payment and payroll to your ledgers as it happens, so the Trial Balance, Profit & Loss and Balance Sheet are ready whenever you — or your CA — want them.',
    highlights: [
      { title: 'Entries that post themselves', text: 'Issue an invoice and it is booked to Sundry Debtors, Sales and output GST. Supplier bills, expenses, receipts, payments and approved payroll post their own entries, and cancelling a document reverses them.' },
      { title: 'A ledger for every account', text: 'Opening balance, every entry with its running balance, and the closing balance for any period. Open the journal entry behind a line, or the invoice, bill or payroll it came from, and download the ledger as a PDF or CSV.' },
      { title: 'The reports that matter', text: 'A Trial Balance with debit and credit columns, Profit & Loss for any period and a Balance Sheet as at any date — all computed from posted entries.' },
      { title: 'Bank statements matched', text: 'Upload your bank statement as CSV, Excel or OFX. Money in and out is matched to invoices and bills by number and amount, and recorded in one go.' },
      { title: 'Your CA in the loop', text: 'Give your accountant their own login. Send an invoice, bill or journal entry for review, and lock a period once its returns are filed so nothing dated in it can change.' },
      { title: 'GST and TDS from the same books', text: 'GSTR-1 and GSTR-3B are prepared from the entries you posted, supplier invoices are checked against GSTR-2B, and TDS on bills is worked out by section.' },
    ],
    sections: [
      {
        h2: 'Double-entry accounting, done for you',
        paragraphs: [
          'Every transaction in Finvosmart is a balanced journal entry — debits always equal credits. The difference is who makes it. When you issue a GST invoice, Finvosmart posts it for you: the customer (Sundry Debtors) is debited, and Sales and the output CGST and SGST, or IGST, are credited. Record the customer\'s payment and the receipt is posted to your bank or cash account, with any TDS the customer deducted kept as TDS receivable. Supplier bills, expenses, payments and approved payroll work the same way.',
          'You can still post your own journal entries for everything else — depreciation, provisions, transfers between accounts. Finvosmart only saves an entry that balances, numbers it by financial year, and corrects a posted entry with a reversal rather than an edit, so the audit trail stays complete.',
        ],
      },
      {
        h2: 'Ledgers you can drill into',
        paragraphs: [
          'Open any account to see its ledger for the period you choose: the opening balance, every entry with the running balance after it, and the closing balance. Each line names the voucher it came from; click through to the journal entry, or to the invoice, supplier bill or payroll behind it.',
          'Ledgers download as PDF or CSV for your auditor. Customer and supplier statements of account — what was billed, what was paid and what is still due — can be viewed on screen, downloaded or emailed straight from Finvosmart.',
        ],
      },
      {
        h2: 'What you get',
        paragraphs: [],
        bullets: [
          'A ready chart of accounts for an Indian business — Cash, Bank, Sundry Debtors and Creditors, input and output GST, TDS receivable and payable, Capital, Sales, Purchases and common expenses — which you can extend.',
          'Books that follow the Indian financial year, April to March, with vouchers numbered by year.',
          'Trial Balance, Profit & Loss and Balance Sheet from posted entries, for any period or date.',
          'Opening balances and unpaid invoices and bills imported from Excel when you start — including what you export from Tally.',
          'An append-only audit trail of every change to the books, with who made it and when.',
          'Roles that decide who can post entries, who can only read reports, and who cannot see the accounts at all.',
        ],
      },
      {
        h2: 'Built for working with your CA',
        paragraphs: [
          'Most small businesses keep their own books and rely on a chartered accountant for review, returns and audit. Finvosmart is designed for that split. Your accountant gets their own login with the Accountant role: they can post vouchers and see every report, but cannot change users or company settings.',
          'Anything you want checked — an invoice, a supplier bill or a journal entry — can be sent for review. Someone other than the sender approves it, asks for changes or rejects it, and the sender is told. Once a month\'s returns are filed, lock the period so that nothing dated in it can be added, edited or cancelled by mistake.',
        ],
      },
    ],
    steps: [
      { title: 'Start your trial', text: 'Sign up in a minute — your company gets a standard chart of accounts.' },
      { title: 'Bring your balances', text: 'Import opening balances and unpaid invoices and bills from Excel, or add them by hand.' },
      { title: 'Work as usual', text: 'Raise invoices and record bills, payments and payroll — each one posts to the books.' },
      { title: 'Review and report', text: 'Check ledgers and the Trial Balance any time, and share the reports with your CA.' },
    ],
    faqs: [
      { q: 'What is double-entry accounting?', a: 'Every transaction is recorded in at least two accounts: one is debited and another credited by the same amount, so the books always balance. A ₹11,800 sale including 18% GST, for example, debits the customer by ₹11,800 and credits Sales by ₹10,000 and output GST by ₹1,800. Finvosmart makes these entries for you from your invoices, bills, payments and payroll.' },
      { q: 'Can I see the ledger of a customer or an expense account?', a: 'Yes. Every account has a ledger with the opening balance, each entry and its running balance, and the closing balance for any period. Each line links to its journal entry and to the invoice, bill or payroll it came from, and the ledger downloads as a PDF or CSV.' },
      { q: 'Does Finvosmart produce a Balance Sheet and Profit & Loss?', a: 'Yes — a Profit & Loss for any period and a Balance Sheet as at any date, laid out the way Indian accountants expect, plus a Trial Balance with debit and credit columns. All three come from the entries posted in your books.' },
      { q: 'Can my accountant use it?', a: 'Yes. Invite them with the Accountant role: they can post vouchers and see every financial report, but cannot manage users, roles or company settings. You can send documents to them for review and lock the periods they have signed off.' },
      { q: 'How do I move my books from Tally or Excel?', a: 'Import your account opening balances and the invoices and bills still unpaid from Excel — including what you export from Tally — together with your customers, suppliers and items. Every import is checked and previewed before anything is saved.' },
      { q: 'How much does it cost?', a: 'Plans start at ₹3,999 per month billed annually (₹4,999 billed monthly), with a 7-day free trial and no credit card required.' },
    ],
    cta: { title: 'Books that keep themselves', text: 'Start a 7-day free trial — no credit card, no installation.' },
  },

  payrollSoftware: {
    eyebrow: 'Payroll software',
    h1: 'Payroll software for India, built for the labour codes',
    lead: 'Run monthly payroll from attendance and approved leave, with PF, ESI, professional tax and TDS on salary worked out for every employee. Approve the run to issue payslips and post the payroll to your books, then download the bank transfer sheet and the PF and ESI files.',
    highlights: [
      { title: 'Pay from attendance', text: 'The month\'s draft starts from the attendance register and approved leave: absences, half days and leave without pay become unpaid days, and you can adjust any line before approving.' },
      { title: 'Wages under the labour codes', text: 'PF is worked out on wages as the Code on Wages and the Code on Social Security define them: if the allowances left out of wages come to more than half of pay, the excess counts as wages.' },
      { title: 'PF and ESI, month by month', text: 'Employee and employer PF with the pension (EPS) and EDLI split, using the wage limit in force for the month; ESI at 0.75% and 3.25% for employees within the ESI limit.' },
      { title: 'Professional tax by state', text: 'Built-in slabs for ten states, none for the states that levy none, and a fixed monthly amount for any other state.' },
      { title: 'TDS on salary', text: 'Tax on each employee\'s projected yearly income under the regime they chose — new or old — less tax already deducted, spread over the months left in the year.' },
      { title: 'Files ready to upload', text: 'The PF ECR file for the EPFO portal, the ESI contribution sheet for the ESIC portal, a bulk salary transfer sheet for your bank, the salary register and every payslip as a PDF.' },
    ],
    sections: [
      {
        h2: 'How a payroll run works',
        paragraphs: [
          'Each month starts as a draft with a line for every employee due pay that month who has a salary set-up. Pay is worked out from the salary set-up, the attendance register and approved leave: fixed pay for a part month — joining, leaving or unpaid days — is paid for the days worked, and one-off amounts such as overtime or a bonus are added as entered. You can change any line and recalculate before anything is final.',
          'Approving the draft issues the payslips and posts the payroll to your books: salaries, the employer\'s PF and ESI, and what you owe to employees and to the authorities. Each employee is told their payslip is ready and can open it in their own portal. When salaries go out, record the payment and it posts against your bank account. If something needs changing after approval, return the run to draft — the payslips are withdrawn and the posting is reversed.',
        ],
      },
      {
        h2: 'The statutory part, worked out',
        paragraphs: [],
        bullets: [
          'Provident fund: 12% from the employee and 12% from the employer, with 8.33% of wages up to the wage limit going to the pension scheme (EPS), plus EDLI and administration charges. The limit is the one in force for the wage month — ₹25,000 from September 2026, ₹15,000 before. Each employee can contribute on wages up to the limit, on actual wages, or not at all.',
          'ESI: 0.75% from the employee and 3.25% from the employer for employees earning up to ₹21,000 a month (₹25,000 for persons with disability), rounded up to the rupee. Cover decided at the start of a contribution period continues to its end.',
          'Professional tax by the state where the employee works — Maharashtra, Karnataka, West Bengal, Tamil Nadu (half-yearly), Telangana, Andhra Pradesh, Gujarat, Madhya Pradesh, Odisha and Assam are built in.',
          'TDS on salary: tax on the year\'s projected income under the employee\'s regime, less tax already deducted (including by a previous employer), spread over the months left. Tax caused by one-off pay is deducted in the month it is paid.',
          'Due dates: PF and ESI for a month\'s wages by the 15th of the next month, and TDS by the 7th (30 April for March) — shown on your dashboard as they come up.',
        ],
      },
      {
        h2: 'What the labour codes changed',
        paragraphs: [
          'The Code on Wages, 2019 and the Code on Social Security, 2020 came into force on 21 November 2025. One change matters most for payroll: wages — the base for PF — now include all pay except a list of exclusions such as house rent allowance, conveyance, overtime, commission and statutory bonus, and those exclusions may make up at most half of total pay. Anything above half counts as wages anyway.',
          'So a salary structure with a small basic and large allowances now attracts PF on more than the basic. Take total pay of ₹1,00,000 with a basic of ₹30,000 and ₹70,000 of house rent and conveyance allowances: half of pay is ₹50,000, so ₹20,000 is added back and wages are ₹50,000. Finvosmart works wages out this way for every employee, every month.',
        ],
      },
      {
        h2: 'Files and records',
        paragraphs: [],
        bullets: [
          'The PF electronic challan-cum-return (ECR) as the text file the EPFO unified portal takes.',
          'The ESI monthly contribution sheet, in the columns of the ESIC portal\'s upload template.',
          'A bulk salary transfer sheet most banks\' corporate portals can read: one NEFT payment per employee.',
          'The salary register, with every employee\'s earnings, deductions and employer contributions.',
          'Every payslip as a PDF, or all of them in one ZIP file.',
          'Rows that can\'t go in a file — a missing UAN or bank account, say — are listed for you to fix; nothing is dropped silently.',
        ],
      },
    ],
    steps: [
      { title: 'Set up salaries', text: 'Add employees with their pay, PF and ESI choices, work state and tax regime.' },
      { title: 'Mark attendance', text: 'Keep the monthly attendance register and approve leave as it comes in.' },
      { title: 'Run and approve', text: 'Start the month\'s payroll, check the draft and approve it to issue payslips.' },
      { title: 'Pay and file', text: 'Download the bank sheet, ECR and ESI files, and record the salary payment.' },
    ],
    faqs: [
      { q: 'Does Finvosmart follow the new labour codes?', a: 'Yes. Wages for PF are worked out as the Code on Wages and the Code on Social Security define them: all pay except the listed exclusions, which may not exceed half of total pay. The PF wage limit used is the one in force for each wage month.' },
      { q: 'Which statutory deductions does it calculate?', a: 'Employee and employer provident fund (with the pension and EDLI split), ESI, professional tax by state, and TDS on salary under the old or new regime. It also prepares the PF ECR file and the ESI contribution sheet for upload.' },
      { q: 'Can employees see their own payslips?', a: 'Yes. Once a payroll is approved, each employee is told their payslip is ready and can open and download it in their own portal, where they can also see and apply for leave.' },
      { q: 'Does payroll post to the accounts?', a: 'Yes. Approving a payroll posts salaries, the employer\'s PF and ESI, and the amounts due to employees and the authorities to your books. Recording the salary payment posts it against your bank account.' },
      { q: 'Which states\' professional tax is built in?', a: 'Maharashtra, Karnataka, West Bengal, Tamil Nadu, Telangana, Andhra Pradesh, Gujarat, Madhya Pradesh, Odisha and Assam. Delhi, Haryana, Rajasthan and Uttar Pradesh levy none. For any other state you can set a fixed monthly amount per employee.' },
      { q: 'How much does it cost?', a: 'Plans start at ₹3,999 per month billed annually (₹4,999 billed monthly), with a 7-day free trial and no credit card required.' },
    ],
    cta: { title: 'Run your next payroll in Finvosmart', text: 'Start a 7-day free trial — import your employees from Excel and run a test payroll.' },
    disclaimer: 'Statutory rates and limits are as notified in October 2026 and change from time to time.',
  },

  hrmsSoftware: {
    eyebrow: 'HRMS software',
    h1: 'HRMS software for Indian SMEs: people, attendance and leave',
    lead: 'Keep every employee\'s record, a monthly attendance register and leave approvals in one place — connected to payroll, so the days people worked are the days they are paid for. Hiring and performance reviews sit alongside, and employees see their own payslips and leave.',
    highlights: [
      { title: 'Employee records', text: 'Personal and job details, department, designation and reporting manager, joining and exit dates, bank account, PAN, PF and ESI numbers — everything payroll and the statutory files need.' },
      { title: 'Monthly attendance register', text: 'One row per employee and one cell per day: present, work from home, half day, absent, paid leave, leave without pay, holiday or weekly off. The unpaid days it shows are the ones payroll starts from.' },
      { title: 'Leave requests and approvals', text: 'Employees ask for leave; managers approve or reject it. Overlapping requests are caught, and approved leave flows into the attendance register and payroll.' },
      { title: 'Hiring', text: 'Job postings, and candidates moved through screening, phone, technical, HR and final rounds to an offer and hired — with interviews and the offered pay recorded.' },
      { title: 'Performance reviews', text: 'Reviews scored on performance, communication, teamwork, initiative and technical skill, giving an overall rating that the employee acknowledges.' },
      { title: 'A portal for every employee', text: 'Each employee signs in to see their payslips, the leave they have taken and their requests waiting for approval, and to apply for leave.' },
    ],
    sections: [
      {
        h2: 'Attendance that payroll can trust',
        paragraphs: [
          'The attendance register shows the whole month at a glance: one row per employee, one cell per day, built from the attendance marks and the approved leave. It uses the same rules as payroll, so what you see is what people will be paid for.',
          'A day marked absent is unpaid, a half day is half unpaid, and approved leave without pay is unpaid. Approved paid leave cancels an absence marked on the same day, weekends and holidays are never unpaid, and a day with no mark counts as worked. When the month\'s payroll starts, every employee\'s unpaid days are already counted.',
        ],
      },
      {
        h2: 'Leave without the back-and-forth',
        paragraphs: [
          'Employees apply for leave from their own portal, or HR records it for them — up to a year back or a year ahead. A request that overlaps one already pending or approved is stopped with a clear message, so nobody is booked twice.',
          'Managers see what is waiting and approve or reject it; the employee is told either way. Approved leave shows on the attendance register straight away, and leave without pay is deducted in the next payroll.',
        ],
      },
      {
        h2: 'Hiring and reviews in the same system',
        paragraphs: [
          'Open a job posting and add candidates as they apply. Move each one through the stages — screening, phone interview, technical, HR and final rounds — record the interviews, and make an offer with the yearly pay. Someone who has already applied for a posting can\'t be added twice, and a candidate can only be marked hired after an offer.',
          'Performance reviews follow a simple cycle: the reviewer scores the employee on five areas and submits the review, the overall score maps to a rating from unsatisfactory to outstanding, and the employee acknowledges it. Reviews are kept with the employee\'s record.',
        ],
      },
      {
        h2: 'Who sees what',
        paragraphs: [],
        bullets: [
          'Roles decide who can view employees, mark attendance, approve leave and run or approve payroll — each is a separate permission.',
          'Employees see only their own payslips, leave and requests in their portal.',
          'Pay, PAN, PF and ESI numbers and bank accounts show in full only to admins, HR and the people who run payroll — everyone else sees them masked. Webhooks to other systems carry payroll totals, never anyone\'s salary.',
          'Every change to pay and to the books is kept in the audit trail, with who made it and when.',
        ],
      },
    ],
    steps: [
      { title: 'Add your people', text: 'Import employees from Excel — each import is checked and previewed first — or add them one by one.' },
      { title: 'Mark attendance', text: 'Keep the monthly attendance register, with holidays and weekly offs.' },
      { title: 'Approve leave', text: 'Employees apply in their portal; managers approve or reject.' },
      { title: 'Run payroll', text: 'Unpaid days flow into the month\'s payroll, and payslips go out on approval.' },
    ],
    faqs: [
      { q: 'What does an HRMS do?', a: 'A human resource management system keeps employee records, attendance, leave and payroll together, so the information HR, managers and accounts need lives in one place. In Finvosmart it also covers hiring and performance reviews, and shares one set of books with accounting.' },
      { q: 'Can I import my employees from Excel?', a: 'Yes. Employee details import from Excel; every import is checked and previewed before anything is saved, and is saved all or nothing.' },
      { q: 'Can employees apply for leave themselves?', a: 'Yes. Each employee signs in to their own portal to apply for leave, see what they have taken this year and what is waiting for approval, and open their payslips.' },
      { q: 'Does attendance feed payroll?', a: 'Yes. Absences, half days and approved leave without pay on the attendance register become the unpaid days the month\'s payroll starts from. You can still adjust any line before approving the payroll.' },
      { q: 'Can I track hiring in Finvosmart?', a: 'Yes. Create job postings, add candidates and move them through screening and interview rounds to an offer and hired, with interviews and the offered pay recorded.' },
      { q: 'How much does it cost?', a: 'Plans start at ₹3,999 per month billed annually (₹4,999 billed monthly), with a 7-day free trial and no credit card required.' },
    ],
    cta: { title: 'Bring HR and payroll together', text: 'Start a 7-day free trial — add your team, mark a month of attendance and run payroll.' },
  },
  posBilling: {
    eyebrow: 'POS billing software',
    h1: 'POS billing software for retail shops in India',
    lead: 'Bill at the counter in seconds: scan the barcode, take cash, UPI or card, and hand over a GST receipt. Every counter bill is a proper tax invoice in your books, the stock leaves the counter\'s own godown, and at the end of the shift the drawer is counted against what it should hold.',
    highlights: [
      { title: 'Scan and bill', text: 'A USB or Bluetooth barcode scanner types straight into the counter, item code or barcode. On Android phones and tablets in Chrome, the camera can scan too. Type 3*code to add three at once.' },
      { title: 'Cash, UPI, card or on account', text: 'Cash with the change worked out, a UPI QR code for the exact amount from your own UPI ID, card with its approval code — or several ways on one bill. A named customer can leave part of the bill on their account.' },
      { title: 'A GST invoice every time', text: 'Each bill is a numbered tax invoice with HSN codes and CGST and SGST — or IGST for a customer from another state who gives a GSTIN. It sits with your other invoices and its payments post to the books.' },
      { title: '58 mm and 80 mm receipts', text: 'Print on the receipt printer attached to the counter\'s computer, through the browser, in the width you set per counter — or send the bill on WhatsApp with its link, which also prints on the receipt as a QR code.' },
      { title: 'Returns and refunds', text: 'Find the bill by its number, choose what came back and how many, and refund in cash, UPI or card — or keep it as credit for a regular customer. A credit note is made and the goods go back into stock.' },
      { title: 'Shifts that balance', text: 'Open a shift with the cash in the drawer, record cash put in or taken out with a reason, and close by counting the drawer. The shift report shows bills, returns and money by way of payment.' },
    ],
    sections: [
      {
        h2: 'Built for a busy counter',
        paragraphs: [
          'The counter screen keeps the cashier on the keyboard: the search box is always ready for the next scan, F9 takes payment, F8 puts a bill on hold while a customer fetches one more thing, and F4 picks the customer by mobile number. Items sold most at that counter recently sit on the screen as buttons, for loose items without a barcode.',
          'A bill on screen survives a reload of the page, and paying the same bill twice — a double tap, or a connection that drops halfway — makes it once. Up to 20 bills can be held at a counter and taken up again in any order.',
        ],
      },
      {
        h2: 'Stock and batches done right',
        paragraphs: [
          'Each counter sells from a godown you choose — the shop floor, say, while the warehouse keeps its own stock. A bill shows how many are left in that godown as items are added, and issuing it takes the stock out there.',
          'Items kept by batch are sold first-to-expire, split across batches when one runs out, and expired batches are never sold. For a pharmacy, Schedule H1 and X medicines ask for the patient\'s and the prescriber\'s details before the bill is made, and the sale goes into the Schedule H1 register.',
        ],
      },
      {
        h2: 'Control without slowing anyone down',
        paragraphs: [
          'Cashiers bill at the price your items carry. Changing a price, giving a discount on a line or on the whole bill is for managers only, and the server checks it on every bill — not just the screen.',
        ],
        bullets: [
          'Counters, the godown each sells from, the receipt width and the receipt\'s footer are set by a manager.',
          'One shift open per counter at a time; colleagues can bill on an open shift, but only the person who opened it, or a manager, can move cash or close it.',
          'A drawer that doesn\'t match at closing needs a note saying why, and the difference stays on the shift report.',
          'Refunds are posted to your books — the customer\'s account against cash or bank — the moment the return is made.',
        ],
      },
    ],
    steps: [
      { title: 'Add a counter', text: 'Name it, choose the godown it sells from and the receipt width.' },
      { title: 'Open a shift', text: 'Count the cash in the drawer to start.' },
      { title: 'Scan and take payment', text: 'Cash, UPI, card — or part on account for a regular customer.' },
      { title: 'Close the shift', text: 'Count the drawer; print the shift report.' },
    ],
    faqs: [
      { q: 'Which barcode scanners work with it?', a: 'Any USB or Bluetooth barcode scanner that types like a keyboard — almost all of them do. Scan into the counter\'s search box and the item goes on the bill. On Android phones and tablets in Chrome, the camera can read barcodes as well.' },
      { q: 'Can I print on a thermal receipt printer?', a: 'Yes. Receipts are laid out for 58 mm or 80 mm paper, set per counter, and print through the browser on the receipt printer installed on the counter\'s computer. You can also send the bill on WhatsApp.' },
      { q: 'Is every counter bill a GST invoice?', a: 'Yes. Each bill is a numbered tax invoice with HSN codes and the right split of CGST and SGST or IGST, issued at once. It is listed with your other invoices, goes into your GST returns and its payments post to your books.' },
      { q: 'How do customers pay by UPI?', a: 'When the cashier chooses UPI, the screen shows a QR code for the exact amount, made from your own UPI ID (set it under Settings → Company). The customer scans it with any UPI app and the money goes straight to your account; the cashier checks it arrived before completing the bill.' },
      { q: 'Does it work without the internet?', a: 'No — the counter needs an internet connection to make each bill. If the page reloads, the bill on screen is kept in the browser, and a bill sent twice because the connection dropped is made only once.' },
      { q: 'How much does it cost?', a: 'Counter billing is included in every plan. Plans start at ₹3,999 per month billed annually (₹4,999 billed monthly), with a 7-day free trial and no credit card required.' },
    ],
    cta: { title: 'Open your first counter', text: 'Start a 7-day free trial — add your items, open a shift and make your first bill.' },
  },
  onlineStore: {
    eyebrow: 'Online store for your shop',
    h1: 'An online store for your shop, run from your billing software',
    lead: 'Put your shop online with a link of your own: customers see your items with photos, prices with GST and what is in stock, and order for pickup or delivery without signing up. Each order arrives in Finvosmart, where you confirm it, pack it, hand it over or deliver it, and turn it into a GST invoice in one step.',
    highlights: [
      { title: 'Your own store link', text: 'Choose the address (…/shop/your-shop-name), your store\'s name, colour and logo. Share it on WhatsApp and Instagram, or print the QR poster for the counter.' },
      { title: 'Items straight from your stock', text: 'Choose which items to sell. Prices with GST, stock and categories come from your items, so there is nothing to keep in step by hand; up to four photos per item.' },
      { title: 'Pickup or delivery', text: 'Offer either or both, with a delivery charge, free delivery above an amount you set, a smallest order, and a note on where you deliver.' },
      { title: 'Orders the customer can follow', text: 'Every order has its own private page that shows where it stands — confirmed, packed or ready, out for delivery, delivered — with a button to WhatsApp the shop.' },
      { title: 'Bill it in one step', text: 'Make the tax invoice from the order: the customer is found by mobile number or added, the stock leaves the store\'s godown, and an online payment link goes with the bill.' },
      { title: 'Found on Google — if you want', text: 'Each store and item has its own page with prices and availability that search engines understand. Keep the store unlisted and only people with the link find it.' },
    ],
    sections: [
      {
        h2: 'Selling online without a second system',
        paragraphs: [
          'Most small shops that sell online keep two lists of products, two sets of prices and two stock counts — and spend the evening copying orders into the billing software. Here the store is part of the same system: an item\'s price, GST rate and stock are the ones you already bill with, so the store is always up to date.',
          'The prices on the store are worked out on Finvosmart\'s server from your items, never taken from the customer\'s browser, and an item can\'t be ordered beyond the stock in the godown the store sells from.',
        ],
      },
      {
        h2: 'From order to delivery',
        paragraphs: [
          'A new order shows up in Online orders, with a notification in the app. Open it to see the customer, the items, the stock you have of each and the total with GST. Confirm it, mark it packed or ready for pickup, send it out for delivery and complete it — the customer\'s order page follows every step, and a WhatsApp message to the customer is ready to send with the link.',
          'An order you can\'t fulfil can be cancelled with a reason, which the customer sees. Switch the store to "not taking orders" for a holiday and it stays visible, telling customers to call or message the shop meanwhile.',
        ],
      },
      {
        h2: 'Getting paid',
        paragraphs: [
          'Customers pay at pickup or on delivery, or choose to pay online. When you make the bill, its payment page offers your UPI ID, your bank details and, if you have connected one, your Razorpay payment gateway — the money goes straight to you, and Finvosmart takes no commission on orders.',
        ],
        bullets: [
          'Payments are recorded against the invoice like any other, and the books stay right.',
          'Limits on how many orders one connection can place guard the store against spam.',
          'The online store is included in every plan.',
        ],
      },
    ],
    steps: [
      { title: 'Choose your items', text: 'Pick what to sell and add photos.' },
      { title: 'Set pickup and delivery', text: 'Delivery charge, free delivery above, the smallest order.' },
      { title: 'Put it online', text: 'Share the link and the QR poster.' },
      { title: 'Fulfil and bill', text: 'Confirm, pack, deliver — and invoice in one step.' },
    ],
    faqs: [
      { q: 'Do my customers need to sign up?', a: 'No. They choose items, give their name and mobile number (and the address for delivery), and place the order. They get a private link to follow it, and their details are filled in for next time on the same phone.' },
      { q: 'Does the store show my real stock?', a: 'Yes. The stock shown and checked on every order is the stock in the godown you choose for the store. Items that run out can be hidden or shown as out of stock, as you prefer.' },
      { q: 'Can customers pay online?', a: 'Yes, once you bill the order: the invoice\'s payment page offers your UPI ID, bank transfer details and your Razorpay gateway if you have connected it. Customers can also pay at pickup or on delivery.' },
      { q: 'Will my store appear on Google?', a: 'If you allow it. A listed store and its items are in the sitemap, and each item page carries its price and availability in the form search engines read. An unlisted store is kept out of search results but works for anyone with the link.' },
      { q: 'What does it cost?', a: 'The online store is included in every plan, with no commission on orders. Plans start at ₹3,999 per month billed annually (₹4,999 billed monthly), with a 7-day free trial.' },
    ],
    cta: { title: 'Put your shop online today', text: 'Start a 7-day free trial — choose your items, add photos and share your store link.' },
  },
  inventorySoftware: {
    eyebrow: 'Inventory management software',
    h1: 'Inventory management software with godowns, batches and stock counts',
    lead: 'Know what you have, where it is and what it is worth. Stock moves by itself with your invoices, supplier bills, counter bills and online orders; each godown keeps its own stock; and transfers, material issues and stock counts keep the books and the shelves in agreement.',
    highlights: [
      { title: 'Stock that moves itself', text: 'Issuing an invoice or a counter bill takes stock out; a supplier bill or a credit note brings it in. Cancelling or correcting one puts the stock right, and the stock ledger links every movement to its document.' },
      { title: 'Godowns', text: 'Keep stock by place — warehouses, shops, factory stores and sites. See every item\'s stock in each, with batches and expiry, and choose the godown on an invoice, a counter or the online store.' },
      { title: 'Transfers with a challan', text: 'Move stock from one godown to another in one step and print the delivery challan to send with the goods, with the vehicle number. Cancelling a transfer puts the stock back.' },
      { title: 'Material requests and issues', text: 'A site or a department asks for material, an approver says yes, and the stores issue it from a godown against the request — with an issue slip. What isn\'t used comes back with a return slip.' },
      { title: 'Stock counts', text: 'Print the count sheet or count with a barcode scanner, see what is short or over and its value, then post the differences as adjustments.' },
      { title: 'Batches and expiry', text: 'Items can be kept by batch with expiry and MRP. Stock leaves first-to-expire, and the counter never sells a batch that has expired.' },
    ],
    sections: [
      {
        h2: 'One stock, everywhere you sell',
        paragraphs: [
          'The same stock serves your invoices, your shop counter and your online store. Each takes stock out of the godown it names, so a sale at the counter can\'t be sold again online, and the stock in hand shows as you pick each item on an invoice.',
          'Low-stock items are flagged at their reorder level, with a purchase order ready to start, and the stock ledger answers "where did it go?" for any item, movement by movement.',
        ],
      },
      {
        h2: 'Godowns, transfers and the stores',
        paragraphs: [
          'Add a godown for each place that holds stock and give it a code and an address. The main godown is where stock goes when nothing else is chosen, so a business with one place to keep things doesn\'t have to think about godowns at all.',
          'Transfers move stock between godowns at once — out of one, into the other — and refuse to move more than a godown holds. Material requests suit contractors and factories: the site engineer or the production floor asks, the manager approves, the stores issue against the request until it is complete, and unused material returns to the godown.',
        ],
      },
      {
        h2: 'Counts that fix the books',
        paragraphs: [
          'Start a count for a godown — or one category in it — and the sheet lists every item and batch the books say is there. Enter what is on the shelves, or scan each piece with a barcode scanner, and add anything found that wasn\'t listed.',
        ],
        bullets: [
          'The short and over lines, and their value at cost, are shown before anything changes.',
          'Posting sets the stock to what was counted, as adjustments with the count\'s number on them.',
          'Lines not counted are left as they are, so a count can cover just part of a godown.',
        ],
      },
    ],
    steps: [
      { title: 'Add your items', text: 'Import them from Excel or add them with HSN, GST rate, unit and reorder level.' },
      { title: 'Add your godowns', text: 'One for each warehouse, shop or site.' },
      { title: 'Sell and buy as usual', text: 'Invoices, bills, the counter and the online store move the stock.' },
      { title: 'Count and correct', text: 'Count a godown and post the differences.' },
    ],
    faqs: [
      { q: 'Does stock update when I make an invoice?', a: 'Yes. Issuing a tax invoice or a counter bill takes the items out of stock, and a supplier bill or a credit note brings them in. Cancelling or correcting the document puts the stock right again.' },
      { q: 'Can I keep stock in more than one place?', a: 'Yes. Add a godown for each warehouse, shop, factory store or site. Each keeps its own stock, and invoices, counters and the online store take stock from the godown they name.' },
      { q: 'How do I move stock between godowns?', a: 'Make a stock transfer: choose the two godowns and the items, and the stock moves at once. Print the delivery challan to send with the goods; cancelling the transfer puts the stock back.' },
      { q: 'Can I track batches and expiry dates?', a: 'Yes. An item can be kept by batch, with its expiry and MRP. Each godown shows its stock batch by batch, stock goes out first-to-expire, and the counter never sells an expired batch.' },
      { q: 'How much does it cost?', a: 'Inventory and godowns are included in every plan. Plans start at ₹3,999 per month billed annually (₹4,999 billed monthly), with a 7-day free trial and no credit card required.' },
    ],
    cta: { title: 'Get your stock in order', text: 'Start a 7-day free trial — add your items and godowns, and see your stock move with every bill.' },
  },
  purchaseSoftware: {
    eyebrow: 'Purchase management software',
    h1: 'Purchase management software with gate entry, GRN and quality inspection',
    lead: 'Run buying from the order to the shelf: purchase orders approved before they go out, every consignment recorded at the gate, goods counted into a goods receipt (GRN) against the order, inspected before they go into stock, rejected goods sent back with a challan, and the supplier’s bill matched with what was ordered and received — and held for payment when it doesn’t match.',
    highlights: [
      { title: 'Gate entry', text: 'Security records each consignment as it arrives: the supplier, their invoice or delivery challan, the vehicle and driver, transporter, LR, e-way bill, packages and weight. The stores are told at once, and a gate pass prints.' },
      { title: 'Goods receipt (GRN)', text: 'Count what came against the order’s lines: what their papers say, what was received, what was rejected and why, with batch and expiry. A receipt can come from the gate, from an order, or stand on its own.' },
      { title: 'Quality inspection', text: 'Mark items “inspect on receipt”, or send a whole receipt to quality. The inspector accepts or rejects each line with a reason, and only what passes goes into stock — into the receipt’s godown, at the order’s rate.' },
      { title: 'Returns to suppliers', text: 'Rejected goods go back with a delivery challan carrying the supplier’s GSTIN and the vehicle. They never entered stock, so nothing moves; the supplier’s credit note is recorded against the return.' },
      { title: 'Three-way match, with a payment hold', text: 'Make the supplier’s bill from the receipt: what was accepted, at the order’s rates. Each item is checked against what was ordered and received; a bill for more than came in, or above the order’s rate, is held for payment until someone who approves purchases or finance releases it.' },
      { title: 'Reorder planner', text: 'From your own books: what each item uses a day, what is in hand and on order, and how many days its supplier took on past orders. Choose what to order and make draft purchase orders, one per supplier.' },
    ],
    sections: [
      {
        h2: 'From the gate to the shelf',
        paragraphs: [
          'The purchase store page shows what waits at each step: consignments at the gate, receipts being counted, receipts waiting for quality, rejected goods to send back, receipts with no supplier bill yet, and deliveries that are late. Each figure opens the list behind it.',
          'A consignment at the gate becomes a goods receipt in one step, with the supplier, the order and their papers carried over and the order’s lines filled in with what is still to come. Receiving more than the order still needs takes someone who approves purchase orders. Submitting puts the accepted goods into stock — or, when something on it is inspected on receipt, sends it to quality first, who are told.',
          'Each order’s received quantities and its status follow its receipts, so nobody marks an order received by hand. When the rest of an order isn’t coming, close it with the reason, and it stops showing as due.',
        ],
      },
      {
        h2: 'Bills that match what came in',
        paragraphs: [
          'A supplier’s bill made from a goods receipt brings nothing into stock again — the receipt already did — and only one bill is made from each receipt. A bill recorded straight from an order whose goods came in on receipts is refused, so stock is never counted twice.',
          'On the bill, every item shows what was ordered, received, billed before and billed now, with the order’s rate beside the bill’s. A bill that doesn’t match is held for payment, with what doesn’t match written on it: no payment can be recorded against it until someone who approves purchases or finance releases it with a reason, and they are told when a bill is held. Ask the supplier for a credit note, and record it against the return or the bill.',
        ],
      },
      {
        h2: 'Reports for the stores and for accounts',
        paragraphs: ['Every report downloads as a CSV file.'],
        bullets: [
          'Pending deliveries: every approved order line still to come, the late orders first, with the value still to come.',
          'Received, not billed: goods in stock with no supplier bill yet, and their value with GST.',
          'Rejections: what failed at receipt or inspection, why, and what is still to go back.',
          'Supplier performance: receipts on time against the order’s date, the average days late, how much was rejected or claimed under warranty, and a rating from 1 to 100 (A to D) that weighs quality, delivery, price and how they settle warranty claims.',
          'The GRN register: every goods receipt between two dates.',
        ],
      },
      {
        h2: 'Warranty claims on suppliers',
        paragraphs: [
          'When a customer’s goods fail under warranty, pass their claim on to the supplier the goods came from: Finvosmart finds them from the batch’s goods receipt or bill, and checks the supplier’s own warranty from your purchase date. Faulty goods found in your own stock can be claimed straight from the receipt they came on.',
          'Send the goods back with a delivery challan — goods sent for warranty, not a sale — and record the supplier’s answer: what they accept, and whether they repair, replace or credit it. Their credit note settles the claim, and what comes back can go into stock at the claim’s rate. A rejected claim can be appealed, or closed as not recovered.',
        ],
      },
      {
        h2: 'A desk for each job, and material released from the stores',
        paragraphs: [
          'Give the security guard the gate entry right and they see the gate, the deliveries due and the suppliers’ names — not your supplier records, rates or receipts. Store keepers count goods into receipts, quality inspectors release what passes, and buyers raise and approve orders. Rates show only to those whose role includes them.',
          'Inside the company, a department or site asks for material, an approver agrees, and the stores issue it from a godown with an issue slip; what isn’t used comes back with a return slip.',
        ],
      },
    ],
    steps: [
      { title: 'Approve the order', text: 'Raise the purchase order, or let the reorder planner start it, and approve it.' },
      { title: 'Record it at the gate', text: 'Security notes the consignment, its papers and the vehicle, and prints the gate pass.' },
      { title: 'Count it into a GRN', text: 'The stores count what came against the order, with rejections and batches.' },
      { title: 'Inspect and release', text: 'Quality accepts or rejects each line; what passes goes into stock.' },
      { title: 'Bill and pay', text: 'Make the supplier’s bill from the receipt, matched with the order.' },
    ],
    faqs: [
      { q: 'What is a GRN?', a: 'A goods receipt note records what a supplier delivered against a purchase order: what their papers say, what was received, what was accepted and what was rejected. In Finvosmart the accepted goods go into stock when the GRN is submitted — or after quality releases them — and the order’s received quantities follow it.' },
      { q: 'Can goods be received without a purchase order?', a: 'Yes. A goods receipt can be made with no order: choose the supplier and the items that came. Receipts against an order start from the order’s lines still to come.' },
      { q: 'What happens to rejected goods?', a: 'They never go into stock. They wait on the receipt until they are sent back with a return delivery challan, and the supplier’s credit note is recorded against that return.' },
      { q: 'Does every delivery need a gate entry?', a: 'No. Gate entries suit businesses with security at the gate; a goods receipt can also be made straight from an order or on its own.' },
      { q: 'How does the bill get matched?', a: 'Make the supplier’s bill from the goods receipt: its lines are what was accepted, at the order’s rates. The bill shows each item’s ordered, received and billed quantities with both rates, and flags any item billed beyond what came in or above the order’s rate.' },
      { q: 'What happens when a supplier’s bill doesn’t match?', a: 'It is saved, but held for payment: the bill says what doesn’t match — for example “Steel rod 12 billed, 10 received” — and no payment can be recorded against it. Correct the bill when the supplier sends a revised one and the hold lifts once it matches; or someone who approves purchases or finance releases it with a reason — the new rate was agreed, say — and who did and why stay on the bill.' },
      { q: 'How much does it cost?', a: 'Purchase orders, the purchase store, warranty claims and inventory are included in every plan. Plans start at ₹3,999 per month billed annually (₹4,999 billed monthly), with a 7-day free trial and no credit card required.' },
    ],
    cta: { title: 'Know what came in, and what you owe for it', text: 'Start a 7-day free trial — raise an order, record the delivery at the gate and count it into stock.' },
  },
  warrantySoftware: {
    eyebrow: 'Warranty management software',
    h1: 'Warranty claim management software that claims it back from your supplier',
    lead: 'Register a customer’s faulty goods against the invoice they were sold on and see at once whether they are in warranty. Repair, replace or credit them — then pass the claim on to the supplier the goods came from, send the goods back with a challan and record what they accept, so the cost doesn’t stay with you.',
    highlights: [
      { title: 'Claims from the invoice', text: 'Find the sale by invoice number or customer: the item, batch, quantity, rate and date come from it, and what is already under claim is held back, so the same goods aren’t claimed twice. Goods sold before you used Finvosmart can be typed in with the date they were sold.' },
      { title: 'The warranty worked out', text: 'Give each item its warranty to customers and the supplier’s warranty to you, in months — the warranty details of the Electronics and Solar packs count too. Every claim shows whether it is in warranty, until when and how many days are left, or when it ended.' },
      { title: 'Repair, replace or credit', text: 'Approve a repair, a replacement from stock on a no-charge delivery challan, or a credit note against the original invoice. Outside the warranty, approve it as goodwill with the reason, or reject it — a rejected claim can be reopened.' },
      { title: 'Passed on to the supplier', text: 'Finvosmart finds who sold you the goods — from the batch’s goods receipt or bill, or the item’s last receipt before the sale — and starts the claim on them with your purchase and their warranty filled in. The two claims stay linked.' },
      { title: 'Goods back with a challan', text: 'Faulty goods go to the supplier with a delivery challan marked as sent for warranty, not a sale, with the vehicle, LR and e-way bill. What the supplier sends back can go into stock at the claim’s rate, or straight to your customer.' },
      { title: 'What is still to recover', text: 'The claims page shows what waits on each side — to approve, to resolve, to send, with the supplier — and the value still to recover from suppliers. Their credit notes, recorded against the claims, settle them.' },
    ],
    sections: [
      {
        h2: 'From the counter to the credit note',
        paragraphs: [
          'A claim records the customer, the goods with their serial number or batch, the fault, and whether the goods were handed in — and with what, such as the box or the charger. Print an acknowledgement for the customer to keep. Everyone who handles claims is told when a customer’s claim comes in, and whoever registered it is told when it is approved.',
          'Approve it with what you will do. A replacement leaves stock from the godown you choose, with a delivery challan for the customer and no charge. A credit note is made from the claim against the original invoice: issuing it resolves the claim, and cancelling it puts the claim back. A credit note for a claim never moves stock — the goods were dealt with on the claim.',
          'A repair or replacement given free under warranty carries no further GST (CBIC Circular 195/07/2023-GST). If you charge the customer for anything more, invoice it as usual.',
        ],
      },
      {
        h2: 'Claims on suppliers, and what comes back',
        paragraphs: [
          'Pass a customer’s claim on from its page, or claim faulty goods found in your own stock straight from the goods receipt they came on — those goods leave stock when they are sent. The supplier’s warranty is counted from your goods receipt or bill.',
          'Mark the claim sent with the challan, then record the supplier’s answer: what they accept — never more than you claimed — and whether they repair, replace or credit it. Their credit note, recorded against the claim, settles it; repaired or replaced goods that come back go into stock or straight to your customer. A rejected claim can be appealed, or closed as not recovered, and goods taken from stock for it put back.',
        ],
      },
      {
        h2: 'Every step on record',
        paragraphs: ['Each claim keeps its history — who registered, approved, sent, accepted or settled it, when, and why — with links to the invoice or receipt, the credit notes and the claim on the other side.'],
        bullets: [
          'One right, warranty claims, lets service staff register and follow claims; a credit note still needs the right to make invoices, or bills for a supplier’s.',
          'Values show only to those whose role includes sales, accounts, stock or purchasing.',
          'Claims are listed by status and found by number, customer or supplier, goods or serial number.',
          'The supplier report rates each supplier from 1 to 100 on quality, delivery, price and how they settle warranty claims.',
        ],
      },
    ],
    steps: [
      { title: 'Register the claim', text: 'From the invoice, with the fault and what was handed in.' },
      { title: 'Check the warranty', text: 'In warranty or not, worked out from the item’s period.' },
      { title: 'Decide', text: 'Repair, replace from stock or credit — or reject with the reason.' },
      { title: 'Pass it on', text: 'Claim from the supplier who sold it, and send the goods back.' },
      { title: 'Recover', text: 'Record what the supplier accepts and their credit note.' },
    ],
    faqs: [
      { q: 'How is the warranty period worked out?', a: 'From the item’s warranty in months, counted from the invoice date for a customer and from your goods receipt or bill for a supplier. A 12-month warranty on goods sold on 15 January runs to 14 January the next year; a one-month warranty from 31 January runs to the last day of February.' },
      { q: 'Is GST charged on a warranty replacement?', a: 'Not on a replacement or repair given free under warranty: CBIC Circular 195/07/2023-GST of 17 July 2023 says no further GST is payable on it. Finvosmart gives the replacement on a delivery challan with no charge; anything you charge the customer for goes on an invoice as usual.' },
      { q: 'How does Finvosmart know which supplier to claim from?', a: 'From the batch the goods were sold from: its goods receipt or bill names the supplier. Without a batch, it takes the latest receipt of the item before the sale, then the latest bill. It says how it found them, and you can choose another supplier before the claim is made.' },
      { q: 'Can I claim goods sold before we used Finvosmart?', a: 'Yes. Type in the customer, the item or what the goods are, the date they were sold and the bill number; the warranty is worked out from that date, or from the start date and months you give.' },
      { q: 'Does a warranty claim move stock?', a: 'Only when goods really move: a replacement given to the customer leaves stock, faulty goods sent to the supplier from your own stock leave it, and what the supplier sends back can go in. Credit notes made for claims never move stock.' },
      { q: 'How much does it cost?', a: 'Warranty claims are included in every plan. Plans start at ₹3,999 per month billed annually (₹4,999 billed monthly), with a 7-day free trial and no credit card required.' },
    ],
    cta: { title: 'Settle every claim, and claim it back', text: 'Start a 7-day free trial — register a claim from an invoice and pass it on to the supplier who sold you the goods.' },
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

/** Content for the GSTIN checker page (FAQ shared with its schema). */
export const GSTIN_CHECKER = {
  eyebrow: 'Free tool',
  h1: 'GSTIN checker',
  lead: 'Check that a GST number is correctly formed before it goes on an invoice. See the state, PAN and type of business it contains, and catch typos with the check digit — free, no sign-up.',
  parts: [
    { chars: '1–2', name: 'State code', text: 'The state or union territory of registration — 27 is Maharashtra, 07 Delhi, 19 West Bengal.' },
    { chars: '3–12', name: 'PAN', text: 'The PAN of the business. Its 4th character shows the type: C company, P individual, F firm, H HUF and so on.' },
    { chars: '13', name: 'Registration number', text: 'Which registration this is for the same PAN in that state: 1 for the first, then 2–9 and A–Z.' },
    { chars: '14', name: 'Default “Z”', text: 'Z for regular taxpayers. Special registrations, such as TDS deductors, follow a different pattern.' },
    { chars: '15', name: 'Check digit', text: 'Calculated from the first 14 characters, so a mistyped character makes it fail.' },
  ],
  faqs: [
    { q: 'How do I check if a GST number is valid?', a: 'Enter it in the checker above. It confirms the GSTIN has 15 characters, a real state code, a correctly formed PAN and a matching check digit. To see whether it is registered and active, and the business name, search it on the GST portal under Search Taxpayer.' },
    { q: 'What is the format of a GSTIN?', a: 'A GSTIN has 15 characters: a 2-digit state code, the 10-character PAN of the business, one character for the registration number of that PAN in the state, the letter Z, and a check digit. For example, 27AAPFU0939F1ZV is a Maharashtra GSTIN.' },
    { q: 'What is the check digit in a GSTIN?', a: 'The 15th character is calculated from the first 14 using a standard formula. If any single character is mistyped, the check digit no longer matches — which is why it is the quickest way to catch a typo.' },
    { q: 'Can I find the business name from a GSTIN?', a: 'Not with this checker: it works entirely in your browser and looks nothing up. The GST portal’s Search Taxpayer shows the legal name, trade name and registration status for any GSTIN.' },
    { q: 'Why does a wrong GSTIN on an invoice matter?', a: 'Your customer claims input tax credit against the GSTIN on your invoice, and your GSTR-1 reports the sale against it. A wrong number can cost them that credit and lead to mismatches in your returns.' },
    { q: 'Is this GSTIN checker free?', a: 'Yes — free, with no sign-up, and nothing you type leaves your browser.' },
  ],
}

/** Content for the GST invoice format page (FAQ shared with its schema). */
export const GST_INVOICE_FORMAT = {
  eyebrow: 'Free template',
  h1: 'GST invoice format',
  lead: 'Download a free GST tax invoice format in Excel or PDF. It has every field Rule 46 of the CGST Rules requires, and the Excel version works out CGST and SGST, or IGST, for you.',
  fields: [
    { field: 'Supplier', what: 'Your name, address and GSTIN.' },
    { field: 'Invoice number', what: 'A consecutive number of up to 16 characters — letters, digits, hyphen (-) and slash (/) — unique for the financial year.' },
    { field: 'Date', what: 'The date the invoice is issued.' },
    { field: 'Recipient', what: 'Name, address and GSTIN (or UIN) if your customer is registered.' },
    { field: 'Unregistered recipient', what: 'Name, address, delivery address and state name and code when the taxable value is ₹50,000 or more, or when the customer asks.' },
    { field: 'HSN or SAC code', what: 'For each item, with the number of digits your turnover requires (see below).' },
    { field: 'Description', what: 'Of the goods or services supplied.' },
    { field: 'Quantity and unit', what: 'For goods.' },
    { field: 'Value', what: 'The total value, and the taxable value after any discount.' },
    { field: 'Tax rate and amount', what: 'CGST and SGST (or UTGST), or IGST, plus cess where it applies — rate and amount for each.' },
    { field: 'Place of supply', what: 'With the state name, for inter-state supplies.' },
    { field: 'Delivery address', what: 'When it differs from the place of supply.' },
    { field: 'Reverse charge', what: 'Whether tax is payable on reverse charge.' },
    { field: 'Signature', what: 'Of you or an authorised person, or a digital signature.' },
  ],
  hsn: [
    { turnover: 'Up to ₹5 crore', digits: '4 digits', note: 'Required on invoices to registered buyers; optional for unregistered buyers.' },
    { turnover: 'Above ₹5 crore', digits: '6 digits', note: 'On every tax invoice.' },
  ],
  faqs: [
    { q: 'What is the format of a GST invoice?', a: 'There is no single layout prescribed by law. Rule 46 of the CGST Rules lists the details a tax invoice must contain — supplier and recipient details with GSTINs, a unique invoice number and date, HSN or SAC codes, quantities, values, tax rates and amounts, place of supply, reverse charge and a signature. Any layout that shows all of them is valid; the free template on this page includes every one.' },
    { q: 'What is the correct format for a GST invoice number?', a: 'Up to 16 characters, using letters, digits, the hyphen (-) and the slash (/). Numbers must run consecutively and be unique for the financial year — for example INV/2026-27/001. You can keep separate series, such as one per branch.' },
    { q: 'How many digits of HSN code must an invoice show?', a: 'It depends on your aggregate turnover in the previous financial year. Up to ₹5 crore, show 4 digits on invoices to registered buyers (optional for unregistered buyers). Above ₹5 crore, show 6 digits on every tax invoice.' },
    { q: 'When must a tax invoice be issued?', a: 'For goods, before or at the time they are removed or delivered. For services, within 30 days of supplying them — 45 days for banks, insurers and other financial institutions, including NBFCs.' },
    { q: 'How many copies of a GST invoice are needed?', a: 'For goods, three: the original for the recipient, the duplicate for the transporter and the triplicate for you. For services, two: the original for the recipient and the duplicate for you.' },
    { q: 'Do I need an e-invoice instead?', a: 'If your aggregate turnover has exceeded ₹5 crore in any financial year since 2017-18, your B2B invoices must also be reported to the Invoice Registration Portal to get an IRN and QR code. A template like this one is not an e-invoice on its own.' },
    { q: 'Is this GST invoice template free?', a: 'Yes. Download it in Excel or PDF with no sign-up. The Excel version works in Microsoft Excel, Google Sheets and LibreOffice, and calculates the taxable value, tax and totals as you type.' },
  ],
}

/** Content for the GST due dates page (FAQ shared with its schema). Dates themselves come from lib/dueDates.ts. */
export const GST_DUE_DATES = {
  eyebrow: 'Free tool',
  lead: 'Every GST return date in one place — monthly and quarterly (QRMP) returns, composition and annual returns — with the TDS, PF, ESI and advance tax dates that sit beside them. See what is due next for your business, or download the dates to your calendar.',
  faqs: [
    { q: 'What is the due date for GSTR-3B?', a: 'For monthly filers, the 20th of the following month — GSTR-3B for October is due by 20 November. Quarterly (QRMP) filers file it by the 22nd or the 24th of the month after the quarter, depending on their state, and pay the tax for the first two months of the quarter by the 25th in challan PMT-06.' },
    { q: 'What is the due date for GSTR-1?', a: 'The 11th of the following month for monthly filers. Quarterly (QRMP) filers file it by the 13th of the month after the quarter, and may upload B2B invoices for the first two months through the Invoice Furnishing Facility (IFF) by the 13th of the next month.' },
    { q: 'What is the QRMP scheme?', a: 'Quarterly Return Monthly Payment lets businesses with aggregate turnover up to ₹5 crore file GSTR-1 and GSTR-3B every quarter instead of every month, while still paying tax monthly. Whether GSTR-3B is due on the 22nd or the 24th depends on the state the business is registered in.' },
    { q: 'What is the late fee for filing GSTR-3B or GSTR-1 late?', a: '₹50 a day — ₹25 each under CGST and SGST — or ₹20 a day for a nil return. The total is capped by turnover: ₹500 for a nil return; otherwise ₹2,000 for turnover up to ₹1.5 crore, ₹5,000 from ₹1.5 crore to ₹5 crore and ₹10,000 above ₹5 crore. Tax paid after the due date also carries interest at 18% a year.' },
    { q: 'When is the GST annual return due?', a: 'GSTR-9 is due by 31 December after the end of the financial year, together with GSTR-9C (the reconciliation statement) where turnover is above ₹5 crore. Composition taxpayers file GSTR-4 by 30 April instead, and pay tax each quarter in CMP-08 by the 18th of the month after the quarter.' },
    { q: 'Is there a time limit for filing old GST returns?', a: 'Yes. A return can no longer be filed once three years have passed since its due date. This covers GSTR-1, GSTR-3B, GSTR-4, GSTR-5, GSTR-6, GSTR-7, GSTR-8 and GSTR-9, so old returns should be filed well before then.' },
    { q: 'What if a due date falls on a Sunday or a holiday?', a: 'The dates on this page are as the law sets them. When a deadline is moved — for a holiday, a portal problem or a natural calamity — the government announces the extension by notification, so check the news on the GST portal before relying on a later date.' },
  ],
}

/** Content for the free tools hub (FAQ shared with its schema). */
export const FREE_TOOLS = {
  eyebrow: 'Free GST tools',
  h1: 'Free GST tools for Indian businesses',
  lead: 'Work out GST, check a GST number, make a proper tax invoice and keep track of every filing date — free, with no sign-up, and nothing you type is stored.',
  tools: [
    { key: 'gstCalculator' as const, action: 'Calculate GST',
      text: 'Add GST to a price or take it out of one, at the GST 2.0 rates, and see the split into CGST and SGST or IGST. Works for any amount, to the paisa.' },
    { key: 'gstinChecker' as const, action: 'Check a GSTIN',
      text: 'Check that a 15-character GST number is correctly formed — state code, PAN and check digit — before it goes on an invoice. It runs in your browser and looks nothing up.' },
    { key: 'gstInvoiceFormat' as const, action: 'Get the template',
      text: 'A GST tax invoice template in Excel and PDF with every field Rule 46 requires. The Excel version works out the tax and totals as you type.' },
    { key: 'gstDueDates' as const, action: 'See the dates',
      text: 'Every GST return date for the year — monthly and quarterly — plus TDS, PF, ESI and advance tax. See what is due next and download the dates to your calendar.' },
  ],
  sections: [
    { h2: 'Why these tools are free', paragraphs: [
      'They answer the questions Indian businesses and their accountants look up every week — what is the GST on this amount, is this GSTIN right, what must an invoice show, when is GSTR-3B due. Each tool does one job properly and shows its working, so you can rely on the answer and explain it to someone else.',
      'They are made by the team behind Finvosmart, which does the same work inside your books every day: the right GST on every invoice line, GSTR-1 and GSTR-3B prepared from your records, and the coming due dates on your dashboard.',
    ] },
    { h2: 'Your data stays with you', paragraphs: [
      'The calculator, the GSTIN checker and the due-date planner run entirely in your browser: nothing you type is sent to us or stored. The invoice templates are ordinary files — fill them in on your own computer.',
    ] },
  ],
  faqs: [
    { q: 'Are these GST tools really free?', a: 'Yes. There is no sign-up, no limit on how often you use them, and no trial that runs out. They are free because they are useful, and because some of the people who use them later try Finvosmart.' },
    { q: 'Do you store what I enter?', a: 'No. The GST calculator, the GSTIN checker and the due-date planner work entirely in your browser — nothing is sent anywhere. The invoice templates are files you download and fill in yourself.' },
    { q: 'Can I add the GST calculator to my own website?', a: 'Yes. The calculator page has a short piece of code to copy into your site, in a light or dark style. It shows the full calculator, and a link back to Finvosmart sits under it.' },
    { q: 'Can the GSTIN checker tell me the business name?', a: 'No — it checks the number’s format and check digit only, which catches most typing mistakes. To see the registered name and whether the registration is active, search the GSTIN on the GST portal under Search Taxpayer.' },
  ],
}
