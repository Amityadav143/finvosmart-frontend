'use client'
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

import { Clock, Linkedin, Mail, MapPin, MessageCircle, Monitor, Phone } from 'lucide-react'
import { phoneLink, usePlatformInfo, whatsappLink } from '@/lib/platformInfo'

/**
 * Finvosmart's contact details on the website, as set in the platform console (Platform settings → Contact details):
 * the built-in ones first, the console's once the server answers.
 */
export function ContactDetails() {
  const p = usePlatformInfo()
  const rows: { icon: typeof Mail; label: string; val: string; href?: string; id: string }[] = [
    { id: 'email', icon: Mail, label: 'Email', val: p.supportEmail, href: `mailto:${p.supportEmail}` },
  ]
  if (p.salesEmail && p.salesEmail !== p.supportEmail)
    rows.push({ id: 'sales', icon: Mail, label: 'Sales', val: p.salesEmail, href: `mailto:${p.salesEmail}` })
  if (p.phone) rows.push({ id: 'phone', icon: Phone, label: 'Phone', val: p.phone, href: phoneLink(p.phone) ?? undefined })
  const wa = whatsappLink(p.whatsapp)
  if (p.whatsapp && wa) rows.push({ id: 'whatsapp', icon: MessageCircle, label: 'WhatsApp', val: p.whatsapp, href: wa })
  if (p.hours) rows.push({ id: 'hours', icon: Clock, label: 'Support hours', val: p.hours })
  if (p.address) rows.push({ id: 'address', icon: MapPin, label: 'Office', val: p.address })
  rows.push({ id: 'linkedin', icon: Linkedin, label: 'LinkedIn', val: 'linkedin.com/company/finvosmart', href: 'https://www.linkedin.com/company/finvosmart' })
  rows.push({ id: 'demo', icon: Monitor, label: 'Live demo', val: 'demo.finvosmart.com' })
  return (
    <ul style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '36px', listStyle: 'none' }} data-testid="contact-details">
      {rows.map(({ icon: Icon, label, val, href, id }) => (
        <li key={id} style={{ display: 'flex', alignItems: 'center', gap: '14px' }} data-contact={id}>
          <span style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--gold-muted)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', flexShrink: 0 }} aria-hidden="true">
            <Icon size={18} />
          </span>
          <span>
            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
            {href
              ? <a href={href} {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener' } : {})} style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500, textDecoration: 'none' }}>{val}</a>
              : <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'pre-line' }}>{val}</span>}
          </span>
        </li>
      ))}
    </ul>
  )
}

/** The company behind Finvosmart: its legal name and CIN (Platform settings → Contact details). */
export function CompanyCard() {
  const p = usePlatformInfo()
  return (
    <div style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.8 }}
      data-testid="company-card">
      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>{p.legalName}</div>
      {p.cin && <>CIN: {p.cin}<br /></>}
      Registered in West Bengal, India<br />
      MSME Registered · ISO in process
    </div>
  )
}

/** The support address as a link (the console's, else the built-in one). */
export function SupportEmail({ style }: { style?: React.CSSProperties }) {
  const p = usePlatformInfo()
  return <a href={`mailto:${p.supportEmail}`} style={{ color: 'inherit', ...style }} data-testid="support-email">{p.supportEmail}</a>
}
