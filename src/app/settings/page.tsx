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

import { shown } from '@/lib/previews'
import Link from 'next/link'
import { Building2, Users, ShieldCheck, Lock, LayoutGrid, GitBranch, Mail, FileText, ChevronRight, History, Webhook } from 'lucide-react'

// Settings hub: /settings had no page, so links to it (e.g. the onboarding checklist) were 404s.
const SECTIONS = [
  { href: '/settings/company',   icon: Building2,   title: 'Company',          text: 'Business name, GSTIN, address and financial year.' },
  { href: '/settings/users',     icon: Users,       title: 'Users',            text: 'Invite people and manage who can sign in.' },
  { href: '/settings/roles',     icon: ShieldCheck, title: 'Roles & permissions', text: 'Decide what each role can see and do.' },
  { href: '/settings/security',  icon: Lock,        title: 'Sign-in & security', text: 'Your password, two-step sign-in and signed-in devices.' },
  { href: '/settings/modules',   icon: LayoutGrid,  title: 'Modules',          text: 'Turn product modules on or off for your company.' },
  { href: '/settings/workflow',  icon: GitBranch,   title: 'Approval workflows', text: 'Who approves leave, purchases and expenses.' },
  { href: '/settings/email',     icon: Mail,        title: 'Email',            text: 'Email delivery and notification settings.' },
  { href: '/settings/templates', icon: FileText,    title: 'Document templates', text: 'Invoice, quotation and other document designs.' },
  { href: '/settings/audit-log', icon: History,     title: 'Audit log',        text: 'Who changed what, and when — kept automatically and tamper-proof.' },
  { href: '/webhooks',           icon: Webhook,     title: 'Webhooks',         text: 'Send invoices, payments, bills and approvals to your own systems as they happen.' },
]

export default function SettingsHub() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Manage your company, people, security and documents</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {SECTIONS.filter(x => shown(x.href)).map(({ href, icon: Icon, title, text }) => (
          <Link key={href} href={href} className="card flex items-start gap-3" style={{ textDecoration: 'none' }}>
            <span className="rounded-xl flex items-center justify-center" style={{ width: '38px', height: '38px', flexShrink: 0, background: 'var(--gold-muted)', color: 'var(--gold)' }}>
              <Icon size={18} />
            </span>
            <span className="flex-1">
              <span className="block font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{title}</span>
              <span className="block text-xs mt-1" style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>{text}</span>
            </span>
            <ChevronRight size={16} style={{ color: 'var(--text-muted)', marginTop: '2px' }} />
          </Link>
        ))}
      </div>
    </div>
  )
}
