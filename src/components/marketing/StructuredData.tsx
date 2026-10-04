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

// Server component: injects JSON-LD structured data so search engines can show
// rich results (organisation knowledge panel, software app card with pricing,
// breadcrumbs). This is a major SEO signal and enables enhanced SERP listings.

const BASE_URL = 'https://finvosmart.com'

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Finvosmart',
  legalName: 'Navgrow Engineering Service Pvt. Ltd.',
  url: BASE_URL,
  logo: `${BASE_URL}/android-chrome-512x512.png`,
  description: "India's most complete cloud ERP platform — HRMS, Finance, GST Invoicing, CRM, AI and WhatsApp Billing in one system.",
  foundingDate: '2025',
  address: {
    '@type': 'PostalAddress',
    addressRegion: 'West Bengal',
    addressCountry: 'IN',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'contact@finvosmart.com',
    contactType: 'sales',
    areaServed: 'IN',
    availableLanguage: ['English', 'Hindi'],
  },
  // sameAs lists official social/brand profiles. Add each URL back once the
  // profile is live so search engines can verify the entity — omitting unknown
  // profiles is better than linking to pages that may not exist yet.
  sameAs: [
    'https://www.linkedin.com/company/finvosmart',
  ],
}

const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Finvosmart',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, iOS, Android',
  description: "All-in-one cloud ERP for Indian businesses: HRMS, Finance, GST Invoicing, CRM, Inventory, AI Cash Flow and WhatsApp Billing.",
  offers: [
    {
      '@type': 'Offer',
      name: 'Starter',
      price: '3999',
      priceCurrency: 'INR',
      description: 'Core ERP modules for up to 10 users',
    },
    {
      '@type': 'Offer',
      name: 'Growth',
      price: '10399',
      priceCurrency: 'INR',
      description: 'Everything in Starter plus AI features and WhatsApp billing for up to 50 users',
    },
    {
      '@type': 'Offer',
      name: 'Enterprise',
      price: '23999',
      priceCurrency: 'INR',
      description: 'All 14 modules, unlimited users and dedicated support',
    },
  ],
  // NOTE: aggregateRating intentionally omitted until real, verifiable customer
  // reviews exist. Publishing fabricated ratings in structured data violates
  // Google's structured-data policies and risks manual action. Add an
  // AggregateRating block here once genuine reviews are collected.
  featureList: [
    'GST e-Invoicing & e-Way Bill',
    'HRMS & Payroll',
    'Finance & Accounting',
    'CRM & Sales Pipeline',
    'Inventory Management',
    'AI Cash Flow Forecasting',
    'WhatsApp Billing',
    'TDS & Statutory Compliance',
  ],
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Finvosmart',
  url: BASE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${BASE_URL}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
}

// FAQ schema — mirrors the FAQ section on the landing page. Unlocks FAQ rich
// results (expandable Q&A) directly in Google search listings.
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How is Finvosmart different from Tally?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tally is desktop accounting software. Finvosmart is a complete cloud business platform — accounting plus HRMS, CRM, inventory, projects, AI and WhatsApp billing — all integrated and accessible from anywhere.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is my data secure and GST-compliant?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Finvosmart is fully GST-compliant with e-invoicing and e-way bills built in. Data is encrypted at rest and in transit, with role-based access control and complete audit trails.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I migrate from my existing software?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. The Finvosmart team helps you import customers, items, opening balances and historical data from Tally, Excel or any other system during onboarding.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you support multiple branches and GSTINs?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Growth and Enterprise plans support multi-branch operations and multiple GSTINs with consolidated reporting across your whole organisation.',
      },
    },
    {
      '@type': 'Question',
      name: 'What kind of support do I get?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'All plans include support in English and Hindi. Growth gets priority support; Enterprise gets a dedicated account manager with an SLA. Onboarding assistance is included for everyone.',
      },
    },
  ],
}

export function StructuredData() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  )
}
