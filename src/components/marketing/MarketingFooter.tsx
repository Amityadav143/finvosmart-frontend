'use client'
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
import { Zap } from 'lucide-react'

const COLS = [
  { title: 'Product',   links: [['/#features','14 Modules'],['/#ai-features','AI Features (6 USPs)'],['/#features','Smart Automations'],['/pricing','Pricing'],['https://demo.finvosmart.com','Live Demo']] },
  { title: 'Solutions', links: [['/gst-billing-software','GST Billing Software'],['/e-invoicing-software','E-Invoice & E-Way Bill'],['/tally-alternative','Tally Alternative'],['/features#manufacturing','Manufacturing SMEs'],['/features#services','IT & Services'],['/features#retail','Retail & Distribution'],['/features#enterprise','Enterprise']] },
  { title: 'Resources', links: [['/gst-calculator','Free GST Calculator'],['https://docs.finvosmart.com','API Documentation'],['https://docs.finvosmart.com/swagger','Swagger UI'],['https://docs.finvosmart.com/deploy','Deployment Guide'],['/about#security','Security']] },
  { title: 'Company',   links: [['/about','About Us'],['/contact','Contact Sales'],['/about#careers','Careers'],['/about#legal','Legal & Privacy']] },
]

export default function MarketingFooter() {
  return (
    <footer style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', padding: '56px 0 32px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
          gap: '40px',
          marginBottom: '48px',
        }}>
          {/* Brand */}
          <div>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '14px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--btn-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={14} color="var(--text-on-gold)" />
              </div>
              <span className="font-serif" style={{ fontSize: '16px', background: 'var(--btn-primary-bg)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 700, display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                FINVOSMART
                <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)', WebkitTextFillColor: 'var(--text-muted)' }}>by Navgrow</span>
              </span>
            </Link>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: '4px', marginBottom: '20px' }}>
              India's most complete Business Operating System — ERP, HRMS, Invoicing, AI and more in one platform.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[['in','https://linkedin.com/company/finvosmart'],['𝕏','https://twitter.com/finvosmart'],['⌥','https://github.com/nvgrow']].map(([lbl, href]) => (
                <a key={lbl} href={href} target="_blank" rel="noreferrer" style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none',
                  transition: 'border-color 0.2s, color 0.2s',
                }}
                  onMouseEnter={(e: any) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--gold)'; el.style.color = 'var(--gold)' }}
                  onMouseLeave={(e: any) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.color = 'var(--text-secondary)' }}
                >{lbl}</a>
              ))}
            </div>
          </div>

          {/* Nav cols */}
          {COLS.map(col => (
            <div key={col.title}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', letterSpacing: '0.04em' }}>{col.title}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                {col.links.map(([href, label]) => (
                  <Link key={href} href={href} style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={(e: any) => (e.target as HTMLElement).style.color = 'var(--gold)'}
                    onMouseLeave={(e: any) => (e.target as HTMLElement).style.color = 'var(--text-secondary)'}
                  >{label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            © 2026 Navgrow Engineering Service Pvt. Ltd. · CIN: U29302WB2025PTC281015 · All rights reserved.
          </span>
          <div style={{ display: 'flex', gap: '20px' }}>
            {[['Privacy','/privacy'],['Terms','/terms'],['Security','/about#security']].map(([l, h]) => (
              <Link key={l} href={h} style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={(e: any) => (e.target as HTMLElement).style.color = 'var(--gold)'}
                onMouseLeave={(e: any) => (e.target as HTMLElement).style.color = 'var(--text-muted)'}
              >{l}</Link>
            ))}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 1024px) {
          footer > div > div:first-of-type { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 640px) {
          footer > div > div:first-of-type { grid-template-columns: 1fr !important; }
        }
      ` }} />
    </footer>
  )
}
