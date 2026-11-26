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

import {
  ArrowLeftRight, BarChart3, BookOpen, Boxes, Brain, Briefcase, Building, Building2, CalendarDays, ClipboardList, Clock,
  CreditCard, Factory, FileCheck2, FileSpreadsheet, FileText, FileUp, FolderOpen, Gavel, Globe, HeartPulse, History,
  IndianRupee, Landmark, Layers, LayoutDashboard, LineChart, ListTree, Mail, MessageCircle, PackageCheck, Palette,
  PenLine, Percent, Plug, Receipt, Repeat, Scale, ScanLine, Settings, ShieldAlert, ShieldCheck, ShieldPlus, ShoppingCart, Sparkles,
  Timer, TrendingUp, Truck, UserCheck, Users, Wallet, Webhook, Zap, Activity, Camera, Bell, Lock, Wrench, UserCircle,
  Monitor, ShoppingBag, Store, Warehouse, ListChecks, ClipboardCheck, Settings2, DoorOpen, RotateCcw, CalendarClock,
  type LucideIcon,
} from 'lucide-react'

/**
 * The app's navigation — the one place every page is named and placed. The menu, the page titles and the trail above
 * them ("Sales › Invoices"), search (Ctrl K) and the "G" shortcuts all read it, so a page is called the same
 * everywhere and sits in one section.
 *
 * Sections follow the order of the day's work: selling, buying, stock, money in the bank, the books, tax, reports,
 * people, projects, then settings. Pages still on demo data (lib/previews.ts) are listed where they belong and stay
 * hidden unless previews are switched on.
 */

/** Any one of these permissions is enough (none: everyone signed in). */
export type Perm = string | string[]

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  perm?: Perm
  /** only for a company whose industry needs it (drugRegister: medicines with a schedule — a pharmacy) */
  when?: 'drugRegister'
  /**
   * 'console': a page of the platform console, for Finvosmart's own administrators only (the server checks every
   * call too); 'hint': in its place, for a login that might expect it — the page then says how the console opens.
   */
  platform?: 'console' | 'hint'
  /** the menu entry a sector template switches on or off for it (Settings → Industry); its own href by default */
  module?: string
  /** more words search finds it by */
  keywords?: string
  /** the page's title, when it says more than the menu's word */
  title?: string
  /** a shorter word, for the phone's tab bar */
  short?: string
}

export interface NavSection {
  id: string
  label: string
  icon: LucideIcon
  items: NavItem[]
}

const CONSOLE: Perm = 'SETTINGS_VIEW'

export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'platform', label: 'Finvosmart admin', icon: Globe,
    items: [
      { href: '/platform',           label: 'Console overview',  icon: Globe,         perm: CONSOLE, platform: 'console', title: 'Platform console' },
      { href: '/platform/companies', label: 'All companies',     icon: Building2,     perm: CONSOLE, platform: 'console', keywords: 'suspend trial plan' },
      { href: '/platform/users',     label: 'All logins',        icon: Users,         perm: CONSOLE, platform: 'console', keywords: 'users across companies' },
      { href: '/platform/payments',  label: 'Plan payments',     icon: CreditCard,    perm: CONSOLE, platform: 'console', keywords: 'subscription payments of every company' },
      { href: '/platform/plans',     label: 'Plans on offer',    icon: Layers,        perm: CONSOLE, platform: 'console', title: 'Plans', keywords: 'pricing prices per user subscription catalogue retire' },
      { href: '/platform/discounts', label: 'Discount codes',    icon: Percent,       perm: CONSOLE, platform: 'console', keywords: 'coupons promo codes offers' },
      { href: '/platform/leads',     label: 'Website enquiries', icon: Mail,          perm: CONSOLE, platform: 'console' },
      { href: '/platform/acquisition', label: 'Where sign-ups come from', icon: TrendingUp, perm: CONSOLE, platform: 'console', keywords: 'acquisition marketing campaigns utm google ads SEO AI search channels' },
      { href: '/platform/activity',  label: 'Console activity',  icon: ClipboardList, perm: CONSOLE, platform: 'console', keywords: 'log' },
      { href: '/platform/admins',    label: 'Administrators',    icon: ShieldCheck,   perm: CONSOLE, platform: 'console', title: 'Console administrators' },
      { href: '/platform/settings',  label: 'Platform settings', icon: Settings,      perm: CONSOLE, platform: 'console', keywords: 'contact details email server SMTP payment gateway sign-in' },
      { href: '/platform',           label: 'Platform console',  icon: ShieldAlert,   perm: CONSOLE, platform: 'hint' },
    ],
  },
  {
    id: 'home', label: 'Home', icon: LayoutDashboard,
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, perm: 'DASHBOARD_VIEW', keywords: 'home overview' },
    ],
  },
  {
    id: 'sales', label: 'Sales', icon: IndianRupee,
    items: [
      { href: '/crm/customers',         label: 'Customers',            icon: Users,          perm: 'CRM_VIEW', keywords: 'clients debtors statement of account' },
      { href: '/quotations',            label: 'Quotations',           icon: ClipboardList,  perm: 'INVOICE_VIEW', keywords: 'estimates proforma' },
      { href: '/invoicing',             label: 'Invoices',             icon: FileText,       perm: 'INVOICE_VIEW', keywords: 'sales bills credit notes delivery challans receipts' },
      { href: '/invoicing/h1-register', label: 'Schedule H1 register', icon: ClipboardList,  perm: 'INVOICE_VIEW', when: 'drugRegister' },
      { href: '/warranty',              label: 'Warranty claims',      icon: ShieldPlus,         perm: 'WARRANTY_CLAIMS', keywords: 'warranty guarantee claim RMA faulty defective repair replacement service complaint after-sales supplier recovery' },
      { href: '/subscriptions',         label: 'Recurring invoices',   icon: Repeat,         perm: 'SUBSCRIPTIONS_VIEW', title: 'Recurring billing' },
      { href: '/client-portal',         label: 'Client portal',        icon: Globe,          perm: 'PORTAL_VIEW' },
      { href: '/crm/leads',             label: 'Leads',                icon: TrendingUp,     perm: 'CRM_VIEW', title: 'Leads pipeline', keywords: 'CRM pipeline prospects' },
      { href: '/whatsapp',              label: 'WhatsApp',             icon: MessageCircle,  perm: 'WHATSAPP_VIEW', keywords: 'messages reminders' },
    ],
  },
  {
    id: 'store', label: 'Store', icon: Store,
    items: [
      { href: '/pos',                   label: 'Counter billing',     icon: Monitor,     perm: ['POS_SELL', 'POS_MANAGE'], title: 'Counter billing (POS)', short: 'Counter', keywords: 'POS point of sale cash register till retail shop billing receipt barcode' },
      { href: '/pos/shifts',            label: 'Shifts',              icon: Clock,       perm: ['POS_SELL', 'POS_MANAGE'], module: '/pos', title: 'Counter shifts', keywords: 'Z report day end cash drawer closing' },
      { href: '/pos/counters',          label: 'Counters',            icon: Settings2,   perm: 'POS_MANAGE', module: '/pos', keywords: 'registers tills receipt printer 58 mm 80 mm' },
      { href: '/online-store',          label: 'Online orders',       icon: ShoppingBag, perm: ['SHOP_VIEW', 'SHOP_MANAGE'], title: 'Online store orders', keywords: 'ecommerce web shop orders delivery pickup WhatsApp' },
      { href: '/online-store/settings', label: 'Online store set-up', icon: Store,       perm: 'SHOP_MANAGE', module: '/online-store', keywords: 'catalogue website link QR code product photos' },
    ],
  },
  {
    id: 'purchases', label: 'Purchases', icon: ShoppingCart,
    items: [
      { href: '/procurement/vendors', label: 'Suppliers',        icon: Truck,         perm: 'PROCUREMENT_VIEW', keywords: 'vendors creditors MSME' },
      { href: '/procurement/orders',  label: 'Purchase orders',  icon: ShoppingCart,  perm: 'PROCUREMENT_VIEW', keywords: 'PO' },
      { href: '/procurement/store',   label: 'Purchase store',   icon: Warehouse,     perm: ['GATE_ENTRY', 'PROCUREMENT_VIEW', 'PROCUREMENT_RECEIVE', 'QUALITY_INSPECT'], module: '/procurement/orders', keywords: 'stores inward receiving gate GRN inspection QC rejection material release' },
      { href: '/procurement/gate',    label: 'Gate entries',     icon: DoorOpen,      perm: ['GATE_ENTRY', 'PROCUREMENT_VIEW', 'PROCUREMENT_RECEIVE'], module: '/procurement/orders', title: 'Gate entries (inward register)', keywords: 'consignment arrival security inward register vehicle LR e-way bill gate pass' },
      { href: '/procurement/grn',     label: 'Goods receipts',   icon: PackageCheck,  perm: ['PROCUREMENT_VIEW', 'PROCUREMENT_RECEIVE', 'QUALITY_INSPECT', 'INVENTORY_VIEW'], module: '/procurement/orders', title: 'Goods receipts (GRN)', keywords: 'GRN goods received note receiving inspection quality check QC accept reject' },
      { href: '/procurement/returns', label: 'Returns to suppliers', icon: RotateCcw,  perm: ['PROCUREMENT_VIEW', 'PROCUREMENT_RECEIVE'], module: '/procurement/orders', keywords: 'rejection out rejected goods purchase return debit note challan' },
      { href: '/procurement/pending', label: 'Pending deliveries', icon: CalendarClock, perm: ['PROCUREMENT_VIEW', 'PROCUREMENT_RECEIVE', 'GATE_ENTRY'], module: '/procurement/orders', keywords: 'PO pending order outstanding overdue late supplier follow up' },
      { href: '/procurement/reports', label: 'Purchase store reports', icon: BarChart3, perm: ['PROCUREMENT_VIEW', 'PROCUREMENT_RECEIVE', 'QUALITY_INSPECT', 'FINANCE_VIEW'], module: '/procurement/orders', short: 'Store reports', keywords: 'GRN register received not billed GRNI rejections supplier performance on time delivery' },
      { href: '/procurement/planner', label: 'Reorder planner',  icon: TrendingUp,    perm: ['PROCUREMENT_VIEW', 'INVENTORY_VIEW'], module: '/procurement/orders', keywords: 'demand forecast reorder level replenishment purchase planning MRP indent' },
      { href: '/purchases',           label: 'Bills & expenses', icon: Receipt,       perm: ['PROCUREMENT_VIEW', 'FINANCE_VIEW'], title: 'Bills and payables', short: 'Bills', keywords: 'supplier bills payables expenses payments made' },
      { href: '/expense-claims',      label: 'Expense claims',   icon: Wallet,        perm: 'EXPENSE_VIEW' },
    ],
  },
  {
    id: 'inventory', label: 'Inventory', icon: Boxes,
    items: [
      { href: '/inventory/items',   label: 'Items',           icon: Boxes,          perm: 'INVENTORY_VIEW', title: 'Inventory items', keywords: 'products stock reorder HSN' },
      { href: '/inventory/stock',   label: 'Stock ledger',    icon: ArrowLeftRight, perm: 'INVENTORY_VIEW', module: '/inventory/items', keywords: 'stock movements' },
      { href: '/inventory/godowns',   label: 'Godowns',           icon: Warehouse,      perm: ['INVENTORY_VIEW', 'INVENTORY_ADMIN'], module: '/inventory/items', title: 'Godowns and stock by godown', keywords: 'warehouses stores locations branches shops sites stock by location' },
      { href: '/inventory/transfers', label: 'Stock transfers',   icon: Truck,          perm: ['INVENTORY_VIEW', 'INVENTORY_ADJUST', 'INVENTORY_ADMIN'], module: '/inventory/items', keywords: 'move stock between godowns delivery challan branch transfer' },
      { href: '/inventory/requests',  label: 'Material requests', icon: ClipboardCheck, perm: ['MATERIAL_REQUEST', 'MATERIAL_APPROVE', 'INVENTORY_VIEW', 'INVENTORY_ADJUST', 'INVENTORY_ADMIN'], module: '/inventory/items', title: 'Material requests and release', keywords: 'indent requisition issue slip store issue material release return to store' },
      { href: '/inventory/counts',    label: 'Stock counts',      icon: ListChecks,     perm: ['INVENTORY_VIEW', 'INVENTORY_ADJUST', 'INVENTORY_ADMIN'], module: '/inventory/items', keywords: 'physical stock verification stocktake audit shrinkage' },
      { href: '/inventory/scanner', label: 'Stock scanner',   icon: ScanLine,       perm: ['INVENTORY_ADJUST', 'INVENTORY_ADMIN'], module: '/inventory/items', keywords: 'barcode count' },
    ],
  },
  {
    id: 'banking', label: 'Banking', icon: Landmark,
    items: [
      { href: '/bank-reconciliation', label: 'Bank reconciliation', icon: ArrowLeftRight, perm: 'BANK_RECON_RUN', keywords: 'match bank payments statement upload' },
      { href: '/cash-flow',           label: 'Cash-flow forecast',  icon: LineChart,      perm: ['FINANCE_VIEW', 'FINANCE_REPORTS'], keywords: 'cash forecast next 13 weeks money in out' },
    ],
  },
  {
    id: 'accounting', label: 'Accounting', icon: BookOpen,
    items: [
      { href: '/finance/accounts', label: 'Chart of accounts', icon: ListTree,    perm: 'FINANCE_VIEW', keywords: 'accounts ledger heads opening balances' },
      { href: '/finance/vouchers', label: 'Journal entries',   icon: FileText,    perm: ['FINANCE_VIEW', 'FINANCE_REPORTS'], keywords: 'vouchers journals' },
      { href: '/finance/ledger',   label: 'Ledgers',           icon: BookOpen,    perm: ['FINANCE_VIEW', 'FINANCE_REPORTS'], title: 'Account ledger', keywords: 'account ledger bank cash debtors creditors' },
      { href: '/assets',           label: 'Fixed assets',      icon: Building,    perm: 'FINANCE_VIEW', keywords: 'depreciation' },
      { href: '/ca-workspace',     label: 'CA workspace',      icon: ShieldCheck, perm: ['CA_WORKSPACE_VIEW', 'FINANCE_APPROVE'], keywords: 'accountant review approve lock period' },
    ],
  },
  {
    id: 'tax', label: 'GST & taxes', icon: Scale,
    items: [
      { href: '/gst-export',     label: 'GST returns',      icon: Landmark,   perm: 'GST_RECON_VIEW', keywords: 'GSTR-1 GSTR-3B JSON filing' },
      { href: '/gst-reconciler', label: 'GST credit check', icon: FileCheck2, perm: 'GST_RECON_VIEW', keywords: 'GSTR-2B ITC input tax credit reconcile' },
      { href: '/tds',            label: 'TDS register',     icon: Percent,    perm: 'TDS_VIEW', keywords: 'tax deducted at source 194' },
    ],
  },
  {
    id: 'reports', label: 'Reports', icon: BarChart3,
    items: [
      { href: '/finance/reports', label: 'Financial reports', icon: FileSpreadsheet, perm: 'FINANCE_REPORTS', keywords: 'profit and loss balance sheet trial balance P&L' },
      { href: '/reports',         label: 'Analytics',         icon: BarChart3,       perm: 'REPORTS_VIEW', keywords: 'revenue collections ageing top customers headcount' },
    ],
  },
  {
    id: 'people', label: 'People', icon: Users,
    items: [
      { href: '/hrms/employees',  label: 'Employees',   icon: Users,        perm: 'EMPLOYEE_VIEW', keywords: 'staff HR' },
      { href: '/hrms/attendance', label: 'Attendance',  icon: Clock,        perm: 'ATTENDANCE_VIEW' },
      { href: '/hrms/leave',      label: 'Leave',       icon: CalendarDays, perm: 'LEAVE_VIEW', keywords: 'holidays time off' },
      { href: '/hrms/payroll',    label: 'Payroll',     icon: IndianRupee,  perm: ['PAYROLL_PROCESS', 'PAYROLL_ADMIN', 'PAYROLL_REPORTS'], keywords: 'salary payslips PF ESI' },
      { href: '/timesheet',       label: 'Timesheets',  icon: Timer,        perm: 'ATTENDANCE_VIEW' },
      { href: '/recruitment',     label: 'Recruitment', icon: UserCheck,    perm: 'EMPLOYEE_VIEW', keywords: 'hiring jobs candidates' },
      { href: '/performance',     label: 'Performance', icon: TrendingUp,   perm: ['EMPLOYEE_VIEW', 'LEAVE_APPLY'], title: 'Performance reviews', keywords: 'appraisal reviews' },
      { href: '/self-service',    label: 'My portal',   icon: UserCircle,   perm: 'ATTENDANCE_VIEW', keywords: 'my payslips my leave self service' },
    ],
  },
  {
    id: 'work', label: 'Projects & contracts', icon: Briefcase,
    items: [
      { href: '/projects',  label: 'Projects',        icon: FolderOpen, perm: 'PROJECT_VIEW' },
      { href: '/contracts', label: 'Contracts',       icon: FileCheck2, perm: ['SETTINGS_COMPANY', 'FINANCE_VIEW', 'PROCUREMENT_VIEW'], keywords: 'agreements renewals' },
      { href: '/tenders',   label: 'Tenders',         icon: Gavel,      perm: 'TENDER_VIEW', keywords: 'GeM bids EMD government' },
      { href: '/esign',     label: 'Digital signing', icon: PenLine,    perm: 'ESIGN_USE' },
    ],
  },
  {
    id: 'ai', label: 'AI', icon: Sparkles,
    items: [
      { href: '/ai/cfo',          label: 'AI CFO',           icon: Brain,       perm: 'AI_CFO_VIEW' },
      { href: '/ai/health-score', label: 'Health score',     icon: Activity,    perm: 'AI_HEALTH_VIEW' },
      { href: '/ai/fraud',        label: 'Fraud detection',  icon: ShieldAlert, perm: 'AI_FRAUD_VIEW' },
      { href: '/ai/cashflow',     label: 'Cash Flow Oracle', icon: Zap,         perm: 'AI_CASHFLOW_VIEW' },
      { href: '/ai/wellness',     label: 'Wellness',         icon: HeartPulse,  perm: 'WELLNESS_VIEW' },
      { href: '/ai/scanner',      label: 'Bill scanner',     icon: Camera,      perm: 'AI_SCANNER_USE' },
    ],
  },
  {
    id: 'settings', label: 'Settings', icon: Settings,
    items: [
      { href: '/settings/company',      label: 'Company',             icon: Building2,     perm: 'SETTINGS_VIEW', title: 'Company settings', keywords: 'GSTIN address logo financial year bank UPI' },
      { href: '/settings/users',        label: 'Users',               icon: Users,         perm: 'SETTINGS_USERS', title: 'Users & access', keywords: 'invite logins' },
      { href: '/settings/roles',        label: 'Roles & permissions', icon: ShieldCheck,   perm: 'SETTINGS_ROLES' },
      { href: '/settings/templates',    label: 'Document templates',  icon: Palette,       perm: 'SETTINGS_VIEW', keywords: 'invoice design logo signature' },
      { href: '/settings/email',        label: 'Email alerts',        icon: Mail,          perm: 'SETTINGS_COMPANY', keywords: 'reminders notifications' },
      { href: '/settings/assistant',    label: 'AI assistant',        icon: Sparkles,      perm: ['SETTINGS_VIEW', 'SETTINGS_COMPANY'], keywords: 'chat bot ask help company data Claude' },
      { href: '/settings/industry',     label: 'Industry',            icon: Factory,       perm: 'SETTINGS_VIEW', keywords: 'sector templates menus extra fields' },
      { href: '/settings/subscription', label: 'Plan & billing',      icon: CreditCard,    perm: ['SETTINGS_VIEW', 'SETTINGS_COMPANY'], keywords: 'subscription upgrade trial' },
      { href: '/import',                label: 'Import from Excel',   icon: FileUp,        perm: ['CRM_CREATE', 'PROCUREMENT_CREATE', 'INVENTORY_CREATE', 'FINANCE_CREATE', 'EMPLOYEE_CREATE'], keywords: 'upload customers suppliers items opening balances Tally' },
      { href: '/settings/audit-log',    label: 'Audit log',           icon: History,       perm: 'AUDIT_LOG_VIEW', keywords: 'who changed what' },
      { href: '/webhooks',              label: 'Webhooks',            icon: Webhook,       perm: ['SETTINGS_VIEW', 'SETTINGS_COMPANY'], keywords: 'integrations events' },
      { href: '/automations',           label: 'Automations',         icon: Wrench,        perm: 'AUTOMATIONS_VIEW' },
      { href: '/marketplace',           label: 'Marketplace & API',   icon: Plug,          perm: 'SETTINGS_VIEW' },
    ],
  },
]

/** Pages that aren't in the menu but are opened by name — in search, and with their place in the trail above the title. */
export const MORE_PAGES: (NavItem & { section: string })[] = [
  { section: 'home',     href: '/notifications',                 label: 'Notifications',     icon: Bell,          keywords: 'alerts' },
  { section: 'people',   href: '/hrms/payroll/setup',            label: 'Salary set-up',     icon: IndianRupee,   perm: ['PAYROLL_PROCESS', 'PAYROLL_ADMIN'], keywords: 'salary structure CTC' },
  { section: 'settings', href: '/import?kind=opening-balances',  label: 'Opening balances',  icon: Building2,     perm: 'FINANCE_CREATE', keywords: 'migrate start books' },
  { section: 'settings', href: '/settings',                      label: 'All settings',      icon: Settings,      perm: 'SETTINGS_VIEW', title: 'Settings' },
  { section: 'settings', href: '/settings/security',             label: 'Sign-in & security', icon: Lock,         keywords: 'password Google two-step devices' },
  { section: 'settings', href: '/settings/modules',              label: 'Module settings',   icon: Settings,      perm: 'SETTINGS_VIEW' },
  { section: 'settings', href: '/settings/workflow',             label: 'Approval workflows', icon: Settings,     perm: 'SETTINGS_VIEW' },
]

/** Titles of pages reached from inside others (a form, a record): the trail shows the section they belong to. */
const PAGE_TITLES: Record<string, string> = {
  '/invoicing/new':         'New invoice',
  '/invoicing/new?type=QUOTATION':          'New quotation',
  '/warranty/new':          'New warranty claim',
  '/warranty/new?kind=SUPPLIER':            'New claim on a supplier',
  '/purchases/bills':       'Bills',
  '/purchases/bills/new':   'New bill',
  '/purchases/bills/new?type=EXPENSE':      'Record an expense',
  '/purchases/bills/new?type=CREDIT_NOTE':  'Supplier credit note',
  '/statements':            'Statement of account',
}

/** What a person may see, for deciding which entries to show. */
export interface NavAccess {
  can: (perm: string) => boolean
  isPlatformAdmin: boolean
  consoleHint: boolean
  /** switched on for the company's industry */
  visible: (href: string) => boolean
  /** the company's industry has this (drugRegister) */
  has: (when: NonNullable<NavItem['when']>) => boolean
  /** not a preview page, or previews are on */
  shown: (href: string) => boolean
}

const path = (href: string) => href.split(/[?#]/)[0]

/** Whether this person sees the entry. */
export function allowed(item: NavItem, a: NavAccess): boolean {
  if (item.platform && !(item.platform === 'console' ? a.isPlatformAdmin : a.consoleHint)) return false
  if (!a.shown(item.href) || !a.visible(item.module ?? path(item.href))) return false
  if (item.when && !a.has(item.when)) return false
  if (!item.perm) return true
  return Array.isArray(item.perm) ? item.perm.some(p => a.can(p)) : a.can(item.perm)
}

/** Every menu entry with its section. */
export const MENU: (NavItem & { section: NavSection })[] = NAV_SECTIONS.flatMap(s => s.items.map(i => ({ ...i, section: s })))

const SECTION = new Map(NAV_SECTIONS.map(s => [s.id, s]))
export const sectionOf = (id: string) => SECTION.get(id)

/** The menu's word for a page ("Bills & expenses"). */
export function labelOf(href: string): string {
  return (MENU.find(i => i.href === href && i.platform !== 'hint') ?? MORE_PAGES.find(i => i.href === href))?.label ?? href
}

/**
 * Where a page sits: its section, the menu entry it is under (the most specific — "Schedule H1 register", not
 * "Invoices", on /invoicing/h1-register) and its title. A page inside an entry (/invoicing/123) takes the entry's
 * title; a page of its own (/purchases/bills/new) its own title, under the entry it belongs to.
 */
export function placeOf(pathname: string, search = ''): { section?: NavSection; entry?: NavItem; title?: string } {
  const p = path(pathname)
  // a form that is more than one kind of document says which (?type=EXPENSE: "Record an expense")
  const kind = new URLSearchParams(search).get('type')
  const kindTitle = kind ? PAGE_TITLES[`${p}?type=${kind}`] : undefined
  const under = (href: string) => p === href || p.startsWith(href + '/')
  const entry = MENU.filter(i => i.platform !== 'hint' && under(i.href)).sort((a, b) => b.href.length - a.href.length)[0]
  const more = MORE_PAGES.filter(i => under(path(i.href))).sort((a, b) => path(b.href).length - path(a.href).length)[0]
  const own = Object.keys(PAGE_TITLES).filter(k => !k.includes('?') && under(k)).sort((a, b) => b.length - a.length)[0]
  // the most specific of the three names the page
  const candidates = [
    entry && { len: entry.href.length, title: entry.title ?? entry.label, section: entry.section },
    more && { len: path(more.href).length, title: more.title ?? more.label, section: SECTION.get(more.section) },
    own && { len: own.length, title: kindTitle && own === p ? kindTitle : PAGE_TITLES[own], section: entry?.section },
  ].filter(Boolean) as { len: number; title: string; section?: NavSection }[]
  const best = candidates.sort((a, b) => b.len - a.len)[0]
  if (!best) return {}
  return { section: best.section ?? entry?.section, entry, title: best.title }
}
