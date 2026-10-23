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
 * SEO single source of truth: every public page's title, description, canonical
 * URL, social preview, sitemap entry and schema.org data comes from here, so they
 * can't drift apart. Tests in tests/run_tests.py validate this file (lengths,
 * uniqueness, prices vs the pricing page, FAQ vs the landing page, JSON-LD).
 */
import type { Metadata } from 'next'

export const SITE = {
  name: 'Finvosmart',
  alternateNames: ['Finvo Smart', 'Finvosmart ERP'],
  url: 'https://finvosmart.com',
  legalName: 'Navgrow Engineering Service Pvt. Ltd.',
  cin: 'U29302WB2025PTC281015',
  email: 'contact@finvosmart.com',
  locale: 'en_IN',
  language: 'en-IN',
  logo: '/android-chrome-512x512.png',
  ogImage: {
    url: '/og-image.png', width: 1200, height: 630,
    alt: 'Finvosmart — GST billing, accounting and HRMS software for Indian businesses',
  },
  // Only profiles that actually exist. Add more as they go live.
  sameAs: ['https://www.linkedin.com/company/finvosmart'],
} as const

export type PageKey = 'home' | 'features' | 'pricing' | 'customPlan' | 'about' | 'contact' | 'login'
  | 'gstBilling' | 'eInvoicing' | 'gstCalculator' | 'register' | 'privacy' | 'terms' | 'tallyAlternative' | 'developers' | 'gstinChecker' | 'gstInvoiceFormat'
  | 'accountingSoftware' | 'payrollSoftware' | 'hrmsSoftware' | 'gstDueDates' | 'freeTools' | 'hindiHome'

export interface PageSeo {
  path: string
  label: string
  title: string
  absoluteTitle: boolean   // true = shown as-is; false = gets the " | Finvosmart" suffix
  description: string      // 100–155 chars so Google shows it in full
  priority: number
  changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  ogImage?: string        // page-specific 1200×630 share image in public/ (default: SITE.ogImage)
  lang?: 'hi-IN'          // the page's language when it isn't English (en-IN)
  parent?: PageKey        // the hub page it sits under, for breadcrumbs (default: home)
}

/**
 * The Indian financial year (April to March) a moment falls in, as "2026-27" — in India's time zone,
 * so it turns over at midnight IST on 1 April. Pages that name the year read it when they render.
 */
export function fyLabel(at: Date = new Date()): string {
  const ist = new Date(at.getTime() + 330 * 60_000)
  const start = ist.getUTCMonth() >= 3 ? ist.getUTCFullYear() : ist.getUTCFullYear() - 1
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`
}

/** Indexable public pages. Titles ≤ 60 chars incl. suffix; descriptions ≤ 155. */
export const PAGES: Record<PageKey, PageSeo> = {
  home: { path: "/", label: "Home", title: "Finvosmart — GST Billing & Accounting Software for India", absoluteTitle: true,
    description: "All-in-one business software for Indian SMEs: GST billing and returns, accounting, payroll, HRMS, CRM and inventory. Start a free trial.",
    priority: 1.0, changeFrequency: "weekly" },
  features: { path: "/features", label: "Features", title: "Features — GST Billing, Accounting & Payroll", absoluteTitle: false,
    description: "Every Finvosmart module: GST invoicing and returns, purchases, accounting, TDS, payroll, HRMS, CRM and inventory — and what is coming next.",
    priority: 0.9, changeFrequency: "monthly" },
  pricing: { path: "/pricing", label: "Pricing", title: "Pricing — GST Billing & ERP from ₹3,999/mo", absoluteTitle: false,
    description: "Simple rupee pricing for Indian businesses. Plans from ₹3,999/month billed annually — GST billing, accounting, CRM and HRMS in one. Free 14-day trial.",
    priority: 0.9, changeFrequency: "weekly" },
  customPlan: { path: "/custom-plan", label: "Custom Plan", title: "Custom Plan — Pay Only for the Modules You Use", absoluteTitle: false,
    description: "Pick only the Finvosmart modules your business needs — GST billing, accounting, HRMS, CRM or inventory — and pay for nothing else.",
    priority: 0.8, changeFrequency: "monthly" },
  about: { path: "/about", label: "About", title: "About Us — Built in India for Indian Businesses", absoluteTitle: false,
    description: "Finvosmart is built in India by Navgrow Engineering to give every Indian SME one affordable platform for GST billing, accounting, CRM and HRMS.",
    priority: 0.6, changeFrequency: "monthly" },
  contact: { path: "/contact", label: "Contact", title: "Contact Us — Book a Free Demo", absoluteTitle: false,
    description: "Talk to the Finvosmart team: book a free demo, get help moving from Tally or Excel, or ask about pricing. Support available in English and Hindi.",
    priority: 0.7, changeFrequency: "monthly" },
  login: { path: "/login", label: "Sign In", title: "Sign In", absoluteTitle: false,
    description: "Sign in to your Finvosmart account to manage GST billing, accounting, HRMS and more for your business.",
    priority: 0.3, changeFrequency: "yearly" },
  gstBilling: { path: "/gst-billing-software", label: "GST Billing Software", title: "GST Billing Software for Indian Businesses", absoluteTitle: false,
    description: "Create GST invoices with CGST, SGST and IGST, HSN codes and UPI pay links, then prepare GSTR-1 and GSTR-3B — built for Indian SMEs.",
    ogImage: "/og/gst-billing-software.png", priority: 0.9, changeFrequency: "monthly" },
  eInvoicing: { path: "/e-invoicing-software", label: "E-Invoice & E-Way Bill", title: "E-Invoice & E-Way Bill Rules for GST (2026)", absoluteTitle: false,
    description: "Who must e-invoice in 2026, the 30-day reporting rule, how e-invoices differ from e-way bills, and how Finvosmart keeps invoices ready for the IRP.",
    ogImage: "/og/e-invoicing-software.png", priority: 0.8, changeFrequency: "monthly" },
  gstCalculator: { path: "/gst-calculator", label: "GST Calculator", parent: "freeTools", title: "GST Calculator — Free, with GST 2.0 Rates", absoluteTitle: false,
    description: "Free GST calculator with the latest GST 2.0 rates (5%, 18%, 40%). Add or remove GST and split it into CGST, SGST or IGST instantly. No sign-up needed.",
    ogImage: "/og/gst-calculator.png", priority: 0.9, changeFrequency: "monthly" },
  register: { path: "/register", label: "Sign Up", title: "Sign Up — Start Your 14-Day Free Trial", absoluteTitle: false,
    description: "Create your Finvosmart account in a minute and try GST billing, accounting, inventory, CRM, HR and payroll for 14 days — free, no credit card needed.",
    priority: 0.7, changeFrequency: "yearly" },
  privacy: { path: "/privacy", label: "Privacy Policy", title: "Privacy Policy", absoluteTitle: false,
    description: "How Finvosmart collects, uses and protects your personal data, and how to exercise your rights under India's Digital Personal Data Protection Act.",
    priority: 0.3, changeFrequency: "yearly" },
  terms: { path: "/terms", label: "Terms of Service", title: "Terms of Service", absoluteTitle: false,
    description: "The terms for using Finvosmart: your account and company code, the free trial, your data, acceptable use, liability, and how disputes are handled.",
    priority: 0.3, changeFrequency: "yearly" },
  tallyAlternative: { path: "/tally-alternative", label: "Tally Alternative", title: "Tally Alternative — Cloud Accounting with GST", absoluteTitle: false,
    description: "Looking for a Tally alternative? Finvosmart keeps double-entry books, posts every GST invoice to the ledger for you, and runs in your browser.",
    ogImage: "/og/tally-alternative.png", priority: 0.9, changeFrequency: "monthly" },
  developers: { path: "/developers", label: "Developers", title: "API Documentation for Developers", absoluteTitle: false,
    description: "Connect your systems to Finvosmart: sign in with tokens, create GST invoices, sync customers and items, read your books and verify webhook signatures.",
    priority: 0.5, changeFrequency: "monthly" },
  gstinChecker: { path: "/gstin-checker", label: "GSTIN Checker", parent: "freeTools", title: "GSTIN Checker \u2014 Validate a GST Number Free", absoluteTitle: false,
    description: "Check if a GST number (GSTIN) is valid: format, state code, PAN and check digit. Free, instant and private \u2014 nothing leaves your browser.",
    ogImage: "/og/gstin-checker.png", priority: 0.8, changeFrequency: "yearly" },
  gstInvoiceFormat: { path: "/gst-invoice-format", label: "GST Invoice Format", parent: "freeTools", title: "GST Invoice Format — Free Excel & PDF Template", absoluteTitle: false,
    description: "Free GST invoice format in Excel and PDF with every field Rule 46 requires. CGST, SGST and IGST calculate automatically. No sign-up needed.",
    ogImage: "/og/gst-invoice-format.png", priority: 0.8, changeFrequency: "yearly" },
  accountingSoftware: { path: "/accounting-software", label: "Accounting Software", title: "Online Accounting Software for Small Business", absoluteTitle: false,
    description: "Double-entry books that keep themselves: invoices, bills, payroll and payments post to your ledgers, with Trial Balance, P&L and Balance Sheet.",
    ogImage: "/og/accounting-software.png", priority: 0.9, changeFrequency: "monthly" },
  payrollSoftware: { path: "/payroll-software", label: "Payroll Software", title: "Payroll Software with PF, ESI, TDS & Payslips", absoluteTitle: false,
    description: "Monthly payroll under India's labour codes: pay from attendance, PF, ESI, professional tax and TDS, payslips, and the ECR, ESI and bank files.",
    ogImage: "/og/payroll-software.png", priority: 0.9, changeFrequency: "monthly" },
  hrmsSoftware: { path: "/hrms-software", label: "HRMS Software", title: "HRMS Software — Attendance, Leave & Payroll", absoluteTitle: false,
    description: "Employee records, a monthly attendance register, leave approvals, payroll, hiring and performance reviews in one HR system for Indian SMEs.",
    ogImage: "/og/hrms-software.png", priority: 0.8, changeFrequency: "monthly" },
  freeTools: { path: "/free-gst-tools", label: "Free GST Tools", title: "Free GST Tools for Indian Businesses", absoluteTitle: false,
    description: "Free GST tools with no sign-up: GST calculator, GSTIN checker, GST invoice format in Excel and PDF, and the due dates for GST, TDS, PF and ESI.",
    ogImage: "/og/free-gst-tools.png", priority: 0.8, changeFrequency: "monthly" },
  // The year in the title and description follows the calendar (read when the page renders).
  gstDueDates: { path: "/gst-due-dates", label: "GST Due Dates", parent: "freeTools", absoluteTitle: false,
    get title() { return `GST Due Dates ${fyLabel()} — GSTR-1, GSTR-3B & More` },
    get description() { return `Every GST return due date for FY ${fyLabel()}: GSTR-1, GSTR-3B, QRMP, CMP-08 and GSTR-9, plus TDS, PF, ESI and advance tax. Free calendar file.` },
    ogImage: "/og/gst-due-dates.png", priority: 0.8, changeFrequency: "monthly" },
  hindiHome: { path: "/hi", label: "हिंदी", lang: "hi-IN", title: "Finvosmart — GST बिलिंग, अकाउंटिंग और पेरोल सॉफ्टवेयर", absoluteTitle: true,
    description: "भारतीय छोटे और मझोले व्यवसायों के लिए एक ही सॉफ्टवेयर: GST बिलिंग और रिटर्न, अकाउंटिंग, पेरोल, HR, CRM और इन्वेंटरी। 14 दिन मुफ़्त आज़माएँ।",
    ogImage: "/og/hi.png", priority: 0.7, changeFrequency: "monthly" },
}

/**
 * When each page's content last changed (YYYY-MM-DD). Bump a page's date when you edit it:
 * the sitemap reports it as <lastmod>, and search engines only trust a lastmod that changes
 * when the content does — not on every deploy. Privacy and terms must equal LEGAL_VERSION.
 */
export const CONTENT_UPDATED: Record<PageKey, string> = {
  home: '2026-10-22', features: '2026-10-22', pricing: '2026-10-22', customPlan: '2026-10-15',
  about: '2026-10-21', contact: '2026-10-21', login: '2026-10-21', register: '2026-10-21',
  privacy: '2026-10-05', terms: '2026-10-05',   // must equal LEGAL_VERSION (validated)
  gstBilling: '2026-10-22', eInvoicing: '2026-10-15', gstCalculator: '2026-10-21',
  tallyAlternative: '2026-10-22', developers: '2026-10-22', gstinChecker: '2026-10-21',
  gstInvoiceFormat: '2026-10-21', accountingSoftware: '2026-10-21', payrollSoftware: '2026-10-21',
  hrmsSoftware: '2026-10-21', freeTools: '2026-10-21', gstDueDates: '2026-10-21', hindiHome: '2026-10-21',
}

/** Plan prices (₹ per month). Must match the pricing page — a test checks this. */
export const PLANS = [
  { name: 'Starter',    monthly: 4999,  annual: 3999,  users: 'Up to 10 users · 1 branch' },
  { name: 'Growth',     monthly: 12999, annual: 10399, users: 'Up to 50 users · Multi-branch' },
  { name: 'Enterprise', monthly: 29999, annual: 23999, users: 'Unlimited users & branches' },
] as const

/** Landing-page FAQ. Rendered by the page AND used for FAQPage schema, so they always match. */
export const HOME_FAQ: ReadonlyArray<{ q: string; a: string }> = [
  { q: "How is FINVOSMART different from Tally?", a: "Tally is desktop accounting software. FINVOSMART is a cloud business platform — accounting plus GST returns, purchases, payroll, HRMS, CRM, inventory, projects and WhatsApp billing — all connected and open from anywhere." },
  { q: "Is my data secure and GST-compliant?", a: "Invoices carry every detail GST law requires, and GSTR-1 and GSTR-3B are prepared from your own books. Data travels over HTTPS, payment-gateway keys are stored encrypted, access is controlled by roles, and every change to the books is kept in an append-only audit trail. Direct e-invoice (IRN) and e-way bill generation is coming soon." },
  { q: "Can I migrate from my existing software?", a: "Yes. Import customers, suppliers, items, employees, opening balances and unpaid invoices and bills from Excel — including what you export from Tally. Every import is checked and previewed before anything is saved, and our team can help during onboarding." },
  { q: "Do you support multiple branches and GSTINs?", a: "Branches, yes — Growth and Enterprise plans support as many branches and departments as you need. Each company in FINVOSMART files under one GSTIN, so a business registered in several states sets up each GSTIN as its own company." },
  { q: "What kind of support do I get?", a: "All plans include support in English and Hindi. Growth gets priority support; Enterprise gets a dedicated account manager with an SLA. Onboarding assistance is included for everyone." },
]

const FEATURES = [
  'GST invoicing with UPI payment links',
  'GST returns: GSTR-1, GSTR-3B and the GSTR-2B credit check',
  'Double-entry accounting: ledgers, Trial Balance, Profit & Loss and Balance Sheet',
  'Supplier bills, TDS and MSME payment dates',
  'Payroll under the labour codes: PF, ESI, professional tax, TDS on salary and payslips',
  'HRMS: attendance register, leave, recruitment and performance reviews',
  'Bank statement matching and statements of account',
  'CRM and sales pipeline, with quotations that become invoices',
  'Inventory that moves with invoices and supplier bills; purchase orders',
  'Invoice PDFs and bulk export',
]

const SUFFIX = ' | Finvosmart'

export function absoluteUrl(path: string): string {
  return path === '/' ? `${SITE.url}/` : `${SITE.url}${path}`
}

export function fullTitle(key: PageKey): string {
  const p = PAGES[key]
  return p.absoluteTitle ? p.title : p.title + SUFFIX
}

/** The English homepage and its Hindi version point at each other (hreflang must be two-way). */
const LANGUAGE_PAIRS: Partial<Record<PageKey, Record<string, string>>> = {
  home: { 'en-IN': '/', 'hi-IN': '/hi', 'x-default': '/' },
  hindiHome: { 'en-IN': '/', 'hi-IN': '/hi', 'x-default': '/' },
}

/** hreflang alternates for a page: its language pair, or just itself in English. */
export function languagesFor(key: PageKey): Record<string, string> {
  const p = PAGES[key]
  return LANGUAGE_PAIRS[key] ?? { 'en-IN': p.path, 'x-default': p.path }
}

/**
 * Complete metadata for one page. Next.js REPLACES (doesn't merge) a parent's
 * openGraph/twitter when a page sets its own, so every page gets the full set
 * here — otherwise shared links on WhatsApp/LinkedIn lose their preview image.
 */
export function pageMetadata(key: PageKey): Metadata {
  const p = PAGES[key]
  const title = fullTitle(key)
  const image = p.ogImage
    ? { url: p.ogImage, width: 1200, height: 630, alt: `${p.label} — Finvosmart` }
    : { ...SITE.ogImage }
  const pair = LANGUAGE_PAIRS[key]
  return {
    title: p.absoluteTitle ? { absolute: p.title } : p.title,
    description: p.description,
    alternates: {
      canonical: p.path,
      languages: languagesFor(key),
    },
    openGraph: {
      type: 'website',
      locale: p.lang === 'hi-IN' ? 'hi_IN' : SITE.locale,
      ...(pair ? { alternateLocale: [p.lang === 'hi-IN' ? SITE.locale : 'hi_IN'] } : {}),
      siteName: SITE.name,
      url: absoluteUrl(p.path),
      title,
      description: p.description,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: p.description,
      images: [image.url],
    },
  }
}

// ── schema.org (JSON-LD) ─────────────────────────────────────────────────────
// Nodes reference each other by @id so search engines read one connected graph.

export type JsonLdNode = Record<string, unknown>

const ORG_ID = `${SITE.url}/#organization`
const WEBSITE_ID = `${SITE.url}/#website`
const SOFTWARE_ID = `${SITE.url}/#software`
const inr = (n: number) => n.toLocaleString('en-IN')

export function organizationSchema(): JsonLdNode {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE.name,
    alternateName: [...SITE.alternateNames],
    legalName: SITE.legalName,
    url: absoluteUrl('/'),
    logo: { '@type': 'ImageObject', url: `${SITE.url}${SITE.logo}`, width: 512, height: 512 },
    image: `${SITE.url}${SITE.ogImage.url}`,
    description: PAGES.home.description,
    foundingDate: '2025',
    identifier: { '@type': 'PropertyValue', propertyID: 'CIN', value: SITE.cin },
    address: { '@type': 'PostalAddress', addressRegion: 'West Bengal', addressCountry: 'IN' },
    areaServed: { '@type': 'Country', name: 'India' },
    contactPoint: ['sales', 'customer support'].map(contactType => ({
      '@type': 'ContactPoint', contactType, email: SITE.email,
      areaServed: 'IN', availableLanguage: ['English', 'Hindi'],
    })),
    sameAs: [...SITE.sameAs],
  }
}

/** Drives the site name Google shows above results; must be on the homepage. */
export function websiteSchema(): JsonLdNode {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: absoluteUrl('/'),
    name: SITE.name,
    alternateName: [...SITE.alternateNames],
    description: PAGES.home.description,
    inLanguage: SITE.language,
    publisher: { '@id': ORG_ID },
  }
}

export function softwareSchema(): JsonLdNode {
  return {
    '@type': 'SoftwareApplication',
    '@id': SOFTWARE_ID,
    name: SITE.name,
    url: absoluteUrl('/'),
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'GST billing, accounting and HRMS software',
    operatingSystem: 'Web',
    browserRequirements: 'Runs in any modern browser on desktop or mobile',
    inLanguage: SITE.language,
    description: PAGES.home.description,
    image: `${SITE.url}${SITE.ogImage.url}`,
    publisher: { '@id': ORG_ID },
    provider: { '@id': ORG_ID },
    featureList: FEATURES,
    // No aggregateRating/review on purpose: add them only from real, verifiable
    // customer reviews — fabricated ratings violate Google's guidelines.
    offers: PLANS.map(plan => ({
      '@type': 'Offer',
      name: `${SITE.name} ${plan.name}`,
      url: absoluteUrl('/pricing'),
      category: 'Subscription',
      price: String(plan.annual),
      priceCurrency: 'INR',
      description: `${plan.users}. ₹${inr(plan.annual)}/month billed annually, or ₹${inr(plan.monthly)}/month billed monthly.`,
      priceSpecification: [
        { '@type': 'UnitPriceSpecification', price: plan.annual,  priceCurrency: 'INR', unitCode: 'MON', description: 'Per month, billed annually' },
        { '@type': 'UnitPriceSpecification', price: plan.monthly, priceCurrency: 'INR', unitCode: 'MON', description: 'Per month, billed monthly' },
      ],
    })),
  }
}

/** FAQPage for a page whose FAQ is visible on that same page (Google requires this). */
export function faqSchemaFor(path: string, items: ReadonlyArray<{ q: string; a: string }>): JsonLdNode {
  return {
    '@type': 'FAQPage',
    '@id': `${absoluteUrl(path)}#faq`,
    mainEntity: items.map(f => ({
      '@type': 'Question', name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
}

/** Only for the homepage, where this FAQ is visible. */
export function faqSchema(): JsonLdNode {
  return faqSchemaFor('/', HOME_FAQ)
}

/** The free GST calculator, described as a free web application. */
export function gstCalculatorSchema(): JsonLdNode {
  const p = PAGES.gstCalculator
  return {
    '@type': 'WebApplication',
    '@id': `${absoluteUrl(p.path)}#app`,
    name: 'Finvosmart GST Calculator',
    url: absoluteUrl(p.path),
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    browserRequirements: 'Runs in any modern browser',
    inLanguage: SITE.language,
    description: p.description,
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
    publisher: { '@id': ORG_ID },
  }
}

/** Home › (hub ›) page — the trail a visitor would follow, also shown on the page where there is a hub. */
export function breadcrumbTrail(key: PageKey): PageKey[] {
  const trail: PageKey[] = [key]
  for (let p = PAGES[key].parent; p && trail.length < 4; p = PAGES[p].parent) trail.unshift(p)
  return key === 'home' ? ['home'] : ['home', ...trail]
}

export function breadcrumbSchema(key: PageKey): JsonLdNode {
  const p = PAGES[key]
  return {
    '@type': 'BreadcrumbList',
    '@id': `${absoluteUrl(p.path)}#breadcrumb`,
    itemListElement: breadcrumbTrail(key).map((k, i) => ({
      '@type': 'ListItem', position: i + 1, name: PAGES[k].label, item: absoluteUrl(PAGES[k].path),
    })),
  }
}

/** Pages that are a home page in their own right (no breadcrumb above them). */
const TOP_PAGES: ReadonlySet<PageKey> = new Set<PageKey>(['home', 'hindiHome'])

const PAGE_TYPES: Partial<Record<PageKey, string>> = {
  about: 'AboutPage', contact: 'ContactPage', freeTools: 'CollectionPage',
}

/**
 * The page itself, tied to the site, the publisher and its breadcrumb. Telling search engines
 * plainly which pages make up the site, and how they sit together, is what helps them pick
 * the main pages to list under the site's own search result (sitelinks).
 */
export function webPageSchema(key: PageKey): JsonLdNode {
  const p = PAGES[key]
  const url = absoluteUrl(p.path)
  return {
    '@type': PAGE_TYPES[key] ?? 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: fullTitle(key),
    description: p.description,
    inLanguage: p.lang ?? SITE.language,
    isPartOf: { '@id': WEBSITE_ID },
    ...(TOP_PAGES.has(key)
      ? { about: { '@id': ORG_ID }, mainEntity: { '@id': SOFTWARE_ID } }
      : { breadcrumb: { '@id': `${url}#breadcrumb` } }),
    primaryImageOfPage: { '@type': 'ImageObject', url: `${SITE.url}${p.ogImage ?? SITE.ogImage.url}` },
    dateModified: CONTENT_UPDATED[key],
  }
}

/** Everything a page says about itself: the page node, its breadcrumb, plus any extra nodes. */
export function pageSchema(key: PageKey, ...extra: JsonLdNode[]): JsonLdNode[] {
  return [webPageSchema(key), ...(TOP_PAGES.has(key) ? [] : [breadcrumbSchema(key)]), ...extra]
}

/** Serialise a graph. `<` is escaped so no value can ever close the <script> tag. */
export function jsonLdGraph(nodes: JsonLdNode[]): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes }).replace(/</g, '\\u003c')
}

export function gstinCheckerSchema(): JsonLdNode {
  const p = PAGES.gstinChecker
  return {
    '@type': 'WebApplication',
    '@id': `${absoluteUrl(p.path)}#app`,
    name: 'Finvosmart GSTIN Checker',
    url: absoluteUrl(p.path),
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    browserRequirements: 'Runs in any modern browser',
    inLanguage: SITE.language,
    description: p.description,
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
    publisher: { '@id': ORG_ID },
  }
}

/** The downloadable invoice templates, so search and AI engines can identify the files. */
export function gstInvoiceTemplateSchema(): JsonLdNode[] {
  const p = PAGES.gstInvoiceFormat
  const file = (format: string, ext: string, mime: string): JsonLdNode => ({
    '@type': 'DigitalDocument',
    '@id': `${absoluteUrl(p.path)}#${ext}`,
    name: `GST invoice format (${format})`,
    url: absoluteUrl(`/downloads/gst-invoice-format.${ext}`),
    encodingFormat: mime,
    inLanguage: SITE.language,
    isAccessibleForFree: true,
    dateModified: CONTENT_UPDATED.gstInvoiceFormat,
    publisher: { '@id': ORG_ID },
  })
  return [
    file('Excel', 'xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
    file('PDF', 'pdf', 'application/pdf'),
  ]
}
