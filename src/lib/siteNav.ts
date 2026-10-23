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
 * The public site's navigation, in one place: the top menu, its two drop-downs, the footer
 * columns and the homepage's "Explore" links all read from here.
 *
 * Why it matters for search: Google decides which pages to list under the site's own result
 * (sitelinks) largely from the site's navigation. Every entry is a real page (never a #section
 * of the homepage), its link text is the page's own name, and the links are plain <a href> in the
 * server HTML — so crawlers see the same structure visitors do.
 *
 * Rule for this file: list only pages that exist and features that are built.
 */
import { PAGES, type PageKey } from './seo'

export interface NavItem { key: PageKey; blurb: string }
export interface NavLink { href: string; label: string }

/** Software pages, by what a business searches for. */
export const SOLUTIONS_MENU: NavItem[] = [
  { key: 'gstBilling',         blurb: 'GST invoices, pay links, GSTR-1 and GSTR-3B' },
  { key: 'accountingSoftware', blurb: 'Double-entry books that post themselves' },
  { key: 'payrollSoftware',    blurb: 'PF, ESI, TDS, payslips and bank files' },
  { key: 'hrmsSoftware',       blurb: 'Attendance, leave, hiring and reviews' },
  { key: 'tallyAlternative',   blurb: 'Cloud books your accountant knows' },
  { key: 'eInvoicing',         blurb: 'Who must e-invoice in 2026, and how' },
]

/** Free tools — no sign-up. */
export const TOOLS_MENU: NavItem[] = [
  { key: 'gstCalculator',    blurb: 'Add or remove GST and see the split' },
  { key: 'gstinChecker',     blurb: 'Catch a mistyped GST number' },
  { key: 'gstInvoiceFormat', blurb: 'Invoice template in Excel and PDF' },
  { key: 'gstDueDates',      blurb: 'GST, TDS, PF and ESI dates' },
]

export const link = (key: PageKey, label?: string): NavLink => ({ href: PAGES[key].path, label: label ?? PAGES[key].label })

/** The top menu, left to right. A `menu` entry opens a drop-down; its `hub` is the page it leads to. */
export const TOP_NAV: ({ kind: 'link'; link: NavLink } | { kind: 'menu'; label: string; items: NavItem[]; hub?: NavLink })[] = [
  { kind: 'link', link: link('features') },
  { kind: 'menu', label: 'Solutions', items: SOLUTIONS_MENU },
  { kind: 'menu', label: 'Free tools', items: TOOLS_MENU, hub: link('freeTools', 'All free GST tools') },
  { kind: 'link', link: link('pricing') },
  { kind: 'link', link: link('customPlan', 'Custom Plan') },
  { kind: 'link', link: link('about') },
  { kind: 'link', link: link('contact') },
]

/** The same menu flattened into groups, for the phone menu. */
export const MOBILE_NAV: { title?: string; links: NavLink[] }[] = [
  { links: [link('features'), link('pricing'), link('customPlan', 'Custom Plan')] },
  { title: 'Solutions', links: SOLUTIONS_MENU.map(i => link(i.key)) },
  { title: 'Free tools', links: [...TOOLS_MENU.map(i => link(i.key)), link('freeTools', 'All free GST tools')] },
  { links: [link('about'), link('contact'), link('hindiHome', 'हिंदी में देखें')] },
]

export const FOOTER_COLUMNS: { title: string; links: NavLink[] }[] = [
  { title: 'Product', links: [link('features', 'All features'), link('pricing'), link('customPlan', 'Custom plan'),
                              { href: '/contact', label: 'Book a demo' }, link('developers', 'API documentation')] },
  { title: 'Software', links: SOLUTIONS_MENU.map(i => link(i.key)) },
  { title: 'Free GST tools', links: [...TOOLS_MENU.map(i => link(i.key)), link('freeTools', 'All free tools')] },
  { title: 'Company', links: [link('about', 'About us'), link('contact', 'Contact sales'), link('privacy', 'Privacy policy'),
                              link('terms', 'Terms of service'), link('hindiHome', 'हिंदी में देखें')] },
]
