/*
 * FINVOSMART — India's Business Operating System
 *
 * Copyright (c) 2025-2026 Navgrow Engineering Service Pvt. Ltd.
 * CIN: U29302WB2025PTC281015
 *
 * All rights reserved. This source code is proprietary and confidential.
 * Unauthorized copying, distribution, modification, or use of this file,
 * via any medium, is strictly prohibited without prior written permission.
 */

import Link from 'next/link'
import { Mail, Linkedin, Monitor, MessageSquare, CalendarCheck, Rocket } from 'lucide-react'
import { DemoRequestForm } from '@/components/marketing/DemoRequestForm'

// Server component; only the form runs in the browser. (Metadata and schema: ./layout.tsx.)

const NEXT_STEPS = [
  { icon: MessageSquare, title: 'We reply by email', text: 'Someone from the team writes back to agree a time — in English or Hindi, as you prefer.' },
  { icon: CalendarCheck, title: 'A walkthrough for your business', text: 'We show the parts you care about — GST billing, accounting, payroll, inventory — using examples like yours, and answer every question.' },
  { icon: Rocket, title: 'Start with help', text: 'Begin the 14-day free trial. We help you bring customers, items, employees and balances in from Excel or Tally.' },
]

const QUICK = [
  { href: '/pricing', label: 'Plans and pricing', text: 'Starter, Growth and Enterprise, or build your own plan.' },
  { href: '/features', label: 'Everything Finvosmart does', text: 'Each module, the compliance it handles, and what is coming.' },
  { href: '/tally-alternative', label: 'Moving from Tally', text: 'What stays familiar, what gets easier, and how to switch.' },
  { href: '/developers', label: 'API documentation', text: 'Connect your own systems to Finvosmart.' },
]

export default function ContactPage() {
  return (
    <div style={{ background: 'var(--bg-base)', paddingTop: '88px' }}>

      {/* Hero */}
      <section style={{ padding: '72px 0 56px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '16px' }}>
            <span style={{ width: '28px', height: '2px', background: 'var(--gold)', display: 'inline-block' }} />
            Contact us
          </div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: 'clamp(28px,4vw,44px)', color: 'var(--text-primary)', marginBottom: '14px', lineHeight: 1.15 }}>Talk to our team</h1>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '560px', lineHeight: 1.7 }}>
            Book a free demo, ask about moving from Tally or Excel, check which plan fits, or discuss an enterprise deployment — we respond within 4 business hours.
          </p>
        </div>
      </section>

      {/* Content */}
      <section style={{ padding: '64px 0 48px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div className="auto-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '64px' }}>

            {/* Left: details and what happens next */}
            <div>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: '24px', color: 'var(--text-primary)', marginBottom: '14px' }}>Contact details</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '28px' }}>Our team is based in India and works with Indian businesses every day.</p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '36px', listStyle: 'none' }}>
                {[
                  { icon: Mail, label: 'Email', val: 'contact@finvosmart.com', href: 'mailto:contact@finvosmart.com' },
                  { icon: Linkedin, label: 'LinkedIn', val: 'linkedin.com/company/finvosmart', href: 'https://www.linkedin.com/company/finvosmart' },
                  { icon: Monitor, label: 'Live demo', val: 'demo.finvosmart.com' },
                ].map(({ icon: Icon, label, val, href }) => (
                  <li key={label} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--gold-muted)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', flexShrink: 0 }} aria-hidden="true">
                      <Icon size={18} />
                    </span>
                    <span>
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                      {href
                        ? <a href={href} {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener' } : {})} style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500, textDecoration: 'none' }}>{val}</a>
                        : <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{val}</span>}
                    </span>
                  </li>
                ))}
              </ul>

              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: '24px', color: 'var(--text-primary)', marginBottom: '16px' }}>What happens next</h2>
              <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                {NEXT_STEPS.map(({ icon: Icon, title, text }, i) => (
                  <li key={title} style={{ display: 'flex', gap: '14px' }}>
                    <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gold-muted)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} aria-hidden="true"><Icon size={16} /></span>
                    <span>
                      <span style={{ display: 'block', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>{i + 1}. {title}</span>
                      <span style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{text}</span>
                    </span>
                  </li>
                ))}
              </ol>

              {/* Company card */}
              <div style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Navgrow Engineering Service Pvt. Ltd.</div>
                CIN: U29302WB2025PTC281015<br />
                Registered in West Bengal, India<br />
                MSME Registered · ISO in process
              </div>
            </div>

            {/* Right: form */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '36px', position: 'relative' }}>
              <DemoRequestForm />
            </div>
          </div>
        </div>
      </section>

      {/* Before you write */}
      <section style={{ padding: '24px 0 88px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: '26px', color: 'var(--text-primary)', marginBottom: '18px' }}>Looking for something specific?</h2>
          <div className="auto-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
            {QUICK.map(q => (
              <Link key={q.href} href={q.href} className="lp-card" style={{ display: 'block', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', textDecoration: 'none' }}>
                <span style={{ display: 'block', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>{q.label} →</span>
                <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{q.text}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
