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
    alt: 'Finvosmart — GST billing, accounting, payroll and HRMS software for Indian businesses',
  },
  // Only profiles that actually exist. Add more as they go live.
  sameAs: ['https://www.linkedin.com/company/finvosmart'],
} as const

export type PageKey = 'home' | 'features' | 'pricing' | 'customPlan' | 'about' | 'contact' | 'login'
  | 'gstBilling' | 'eInvoicing' | 'gstCalculator' | 'register' | 'privacy' | 'terms' | 'tallyAlternative'

export interface PageSeo {
  path: string
  label: string
  title: string
  absoluteTitle: boolean   // true = shown as-is; false = gets the " | Finvosmart" suffix
  description: string      // 100–155 chars so Google shows it in full
  priority: number
  changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
}

/** Indexable public pages. Titles ≤ 60 chars incl. suffix; descriptions ≤ 155. */
export const PAGES: Record<PageKey, PageSeo> = {
  home: { path: "/", label: "Home", title: "Finvosmart — GST Billing & Accounting Software for India", absoluteTitle: true,
    description: "All-in-one business software for Indian SMEs: GST billing, e-invoicing, e-way bills, accounting, payroll, HRMS, CRM and inventory. Start a free trial.",
    priority: 1.0, changeFrequency: "weekly" },
  features: { path: "/features", label: "Features", title: "GST Billing, Accounting & Payroll Features", absoluteTitle: false,
    description: "Explore every Finvosmart module: GST invoicing with e-invoice and e-way bill, accounting, TDS, payroll, HRMS, CRM, inventory and AI cash-flow insights.",
    priority: 0.9, changeFrequency: "monthly" },
  pricing: { path: "/pricing", label: "Pricing", title: "Pricing — GST Billing & ERP from ₹3,999/mo", absoluteTitle: false,
    description: "Simple rupee pricing for Indian businesses. Plans from ₹3,999/month billed annually — GST billing, accounting, payroll and HRMS in one. Free 14-day trial.",
    priority: 0.9, changeFrequency: "weekly" },
  customPlan: { path: "/custom-plan", label: "Custom Plan", title: "Custom Plan — Pay Only for the Modules You Use", absoluteTitle: false,
    description: "Pick only the Finvosmart modules your business needs — GST billing, accounting, payroll, HRMS, CRM or inventory — and pay for nothing else.",
    priority: 0.8, changeFrequency: "monthly" },
  about: { path: "/about", label: "About", title: "About Us — Built in India for Indian Businesses", absoluteTitle: false,
    description: "Finvosmart is built in India by Navgrow Engineering to give every Indian SME one affordable platform for GST billing, accounting, payroll and HRMS.",
    priority: 0.6, changeFrequency: "monthly" },
  contact: { path: "/contact", label: "Contact", title: "Contact Sales & Book a Free Demo", absoluteTitle: false,
    description: "Talk to the Finvosmart team: book a free demo, get help moving from Tally or Excel, or ask about pricing. Support available in English and Hindi.",
    priority: 0.7, changeFrequency: "monthly" },
  login: { path: "/login", label: "Sign In", title: "Sign In", absoluteTitle: false,
    description: "Sign in to your Finvosmart account to manage GST billing, accounting, payroll, HRMS and more for your business.",
    priority: 0.3, changeFrequency: "yearly" },
  gstBilling: { path: "/gst-billing-software", label: "GST Billing Software", title: "GST Billing Software for Indian Businesses", absoluteTitle: false,
    description: "Create GST invoices with CGST, SGST and IGST, HSN codes, e-invoice IRN, e-way bills, GSTR-1 exports and WhatsApp sharing — built for Indian SMEs.",
    priority: 0.9, changeFrequency: "monthly" },
  eInvoicing: { path: "/e-invoicing-software", label: "E-Invoice & E-Way Bill", title: "E-Invoice & E-Way Bill Software for GST", absoluteTitle: false,
    description: "Generate e-invoice IRNs and QR codes on the government IRP and create e-way bills from your GST invoices — no re-entry on the portal. Built for India.",
    priority: 0.8, changeFrequency: "monthly" },
  gstCalculator: { path: "/gst-calculator", label: "GST Calculator", title: "Free GST Calculator — GST 2.0 Rates", absoluteTitle: false,
    description: "Free GST calculator with the latest GST 2.0 rates (5%, 18%, 40%). Add or remove GST and split it into CGST, SGST or IGST instantly. No sign-up needed.",
    priority: 0.9, changeFrequency: "monthly" },
  register: { path: "/register", label: "Sign Up", title: "Start Your Free Trial", absoluteTitle: false,
    description: "Create your Finvosmart account in a minute and try GST billing, e-invoicing, inventory, CRM and HR for 14 days — free, with no credit card needed.",
    priority: 0.7, changeFrequency: "yearly" },
  privacy: { path: "/privacy", label: "Privacy Policy", title: "Privacy Policy", absoluteTitle: false,
    description: "How Finvosmart collects, uses and protects your personal data, and how to exercise your rights under India's Digital Personal Data Protection Act.",
    priority: 0.3, changeFrequency: "yearly" },
  terms: { path: "/terms", label: "Terms of Service", title: "Terms of Service", absoluteTitle: false,
    description: "The terms for using Finvosmart: your account and company code, the free trial, your data, acceptable use, liability, and how disputes are handled.",
    priority: 0.3, changeFrequency: "yearly" },
  tallyAlternative: { path: "/tally-alternative", label: "Tally Alternative", title: "Tally Alternative — Cloud Accounting with GST", absoluteTitle: false,
    description: "Looking for a Tally alternative? Finvosmart keeps double-entry books, posts every GST invoice to the ledger for you, and runs in your browser.",
    priority: 0.9, changeFrequency: "monthly" },
}

/** Plan prices (₹ per month). Must match the pricing page — a test checks this. */
export const PLANS = [
  { name: 'Starter',    monthly: 4999,  annual: 3999,  users: 'Up to 10 users · 1 branch' },
  { name: 'Growth',     monthly: 12999, annual: 10399, users: 'Up to 50 users · Multi-branch' },
  { name: 'Enterprise', monthly: 29999, annual: 23999, users: 'Unlimited users & branches' },
] as const

/** Landing-page FAQ. Rendered by the page AND used for FAQPage schema, so they always match. */
export const HOME_FAQ: ReadonlyArray<{ q: string; a: string }> = [
  { q: "How is FINVOSMART different from Tally?", a: "Tally is desktop accounting software. FINVOSMART is a complete cloud business platform — accounting plus HRMS, CRM, inventory, projects, AI and WhatsApp billing — all integrated and accessible from anywhere." },
  { q: "Is my data secure and GST-compliant?", a: "Yes. We are fully GST-compliant with e-invoicing and e-way bills built in. Data is encrypted at rest and in transit, with role-based access control and complete audit trails." },
  { q: "Can I migrate from my existing software?", a: "Absolutely. Our team helps you import customers, items, opening balances and historical data from Tally, Excel or any other system during onboarding." },
  { q: "Do you support multiple branches and GSTINs?", a: "Yes. Growth and Enterprise plans support multi-branch operations and multiple GSTINs with consolidated reporting across your whole organisation." },
  { q: "What kind of support do I get?", a: "All plans include support in English and Hindi. Growth gets priority support; Enterprise gets a dedicated account manager with an SLA. Onboarding assistance is included for everyone." },
]

const FEATURES = [
  'GST invoicing with e-invoice (IRN) and e-way bill',
  'Accounting and financial reports',
  'TDS compliance',
  'HRMS and payroll',
  'CRM and sales pipeline',
  'Inventory and procurement',
  'AI cash-flow forecasting',
  'WhatsApp invoice sharing',
]

const SUFFIX = ' | Finvosmart'

export function absoluteUrl(path: string): string {
  return path === '/' ? `${SITE.url}/` : `${SITE.url}${path}`
}

export function fullTitle(key: PageKey): string {
  const p = PAGES[key]
  return p.absoluteTitle ? p.title : p.title + SUFFIX
}

/**
 * Complete metadata for one page. Next.js REPLACES (doesn't merge) a parent's
 * openGraph/twitter when a page sets its own, so every page gets the full set
 * here — otherwise shared links on WhatsApp/LinkedIn lose their preview image.
 */
export function pageMetadata(key: PageKey): Metadata {
  const p = PAGES[key]
  const title = fullTitle(key)
  return {
    title: p.absoluteTitle ? { absolute: p.title } : p.title,
    description: p.description,
    alternates: {
      canonical: p.path,
      languages: { 'en-IN': p.path, 'x-default': p.path },
    },
    openGraph: {
      type: 'website',
      locale: SITE.locale,
      siteName: SITE.name,
      url: absoluteUrl(p.path),
      title,
      description: p.description,
      images: [{ ...SITE.ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: p.description,
      images: [SITE.ogImage.url],
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
    applicationSubCategory: 'GST billing, accounting, payroll and HRMS software',
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

export function breadcrumbSchema(key: PageKey): JsonLdNode {
  const p = PAGES[key]
  return {
    '@type': 'BreadcrumbList',
    '@id': `${absoluteUrl(p.path)}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: PAGES.home.label, item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: p.label, item: absoluteUrl(p.path) },
    ],
  }
}

/** Serialise a graph. `<` is escaped so no value can ever close the <script> tag. */
export function jsonLdGraph(nodes: JsonLdNode[]): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes }).replace(/</g, '\\u003c')
}
