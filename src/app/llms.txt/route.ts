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

import { PAGES, SITE, absoluteUrl, type PageKey } from '@/lib/seo'

// A plain-text guide for AI assistants (the llms.txt convention), built from the same
// page data as the sitemap so it never describes more than the site does.
export const dynamic = 'force-static'

const link = (k: PageKey) => `- [${PAGES[k].label}](${absoluteUrl(PAGES[k].path)}): ${PAGES[k].description}`

export function GET() {
  const text = [
    `# ${SITE.name}`,
    '',
    `> ${PAGES.home.description}`,
    '',
    'Finvosmart is cloud business software for Indian small and medium businesses. It covers GST invoicing',
    '(CGST, SGST and IGST with HSN/SAC codes, UPI pay links and payment reminders), supplier bills with TDS and',
    'MSME payment dates, double-entry accounting with ledgers, Trial Balance, Profit & Loss and Balance Sheet,',
    'review by the accountant and period locks, GSTR-1 and GSTR-3B files with a GSTR-2B credit check, payroll',
    'under the labour codes (PF, ESI, professional tax, TDS on salary, payslips, ECR and ESI files), CRM,',
    'inventory kept by godown (batches and expiry, stock transfers with delivery challans, material requests and',
    'issues, stock counts), counter billing for shops (barcode scanning, cash, UPI QR and card, 58/80 mm receipts,',
    'returns, shift close), an online store for each business (its own link, pickup and delivery orders that become',
    'GST invoices), purchasing (purchase orders with approval, gate entry, goods receipts with quality inspection,',
    'returns to suppliers with challans, supplier bills matched to the order and the receipt and held for payment',
    'when they don\'t match, a supplier rating, a reorder planner), warranty claims from customers passed on to the',
    'supplier the goods came from,',
    'projects, and HR (employees, attendance register, leave, hiring and performance',
    'reviews), with customer and supplier statements of account, in-app notifications, signed webhooks and one',
    'search box across records. E-invoice (IRN) and e-way bill generation is not built yet. The app is in English;',
    'support is in English and Hindi. Prices are in Indian rupees, with a 7-day free trial.',
    '',
    '## Product',
    ...(['features', 'pricing', 'customPlan', 'erpSoftware', 'gstBilling', 'accountingSoftware', 'payrollSoftware', 'hrmsSoftware', 'posBilling', 'onlineStore', 'inventorySoftware', 'purchaseSoftware', 'warrantySoftware', 'eInvoicing', 'tallyAlternative'] as PageKey[]).map(link),
    '',
    '## Free tools',
    ...(['freeTools', 'gstCalculator', 'gstinChecker', 'gstInvoiceFormat', 'gstDueDates'] as PageKey[]).map(link),
    '',
    '## Developers',
    link('developers'),
    '',
    '## Company',
    ...(['about', 'contact', 'privacy', 'terms'] as PageKey[]).map(link),
    '',
    '## In Hindi',
    link('hindiHome'),
    '',
    '## Optional',
    `- [Everything in one file](${absoluteUrl('/llms-full.txt')}): the facts, the plans, every software page with its questions, and the free tools\' answers`,
    '',
  ].join('\n')
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' } })
}
