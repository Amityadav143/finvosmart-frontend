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
import { MessageSquare, CalendarCheck, Rocket } from 'lucide-react'
import { DemoRequestForm } from '@/components/marketing/DemoRequestForm'
import { CompanyCard, ContactDetails } from '@/components/marketing/PlatformContact'
import { AskAssistantButton } from '@/components/assistant/WebsiteAssistant'

// Server component; the form and the contact details (set in the platform console) run in the browser. (Metadata and schema: ./layout.tsx.)

const NEXT_STEPS = [
  { icon: MessageSquare, title: 'We reply by email', text: 'Someone from the team writes back to agree a time — in English or Hindi, as you prefer.' },
  { icon: CalendarCheck, title: 'A walkthrough for your business', text: 'We show the parts you care about — GST billing, accounting, payroll, inventory — using examples like yours, and answer every question.' },
  { icon: Rocket, title: 'Start with help', text: 'Begin the 7-day free trial. We help you bring customers, items, employees and balances in from Excel or Tally.' },
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
          {/* a quick question needn't wait: the assistant answers at once (shown only when it is on) */}
          <div style={{ marginTop: '18px' }}>
            <AskAssistantButton label="Quick question? Ask our AI assistant" className="btn-secondary h-10 px-5 text-sm" />
          </div>
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
              {/* the details set in the platform console (Contact details), the built-in ones until the server answers */}
              <ContactDetails />

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
              <CompanyCard />
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
