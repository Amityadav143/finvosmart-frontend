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
import { Shield, Users, Globe, Code, ArrowRight, CheckCircle } from 'lucide-react'

const TECH_STACK = [
  { layer:'Frontend', tech:['Next.js 14','React 18','TypeScript 5','Tailwind CSS','Recharts 2.10','Zustand 4.4','TanStack Query 5'], color:'#2563EB' },
  { layer:'Backend',  tech:['Spring Boot 3.2','Java 17','JWT Multi-tenant','Liquibase','BCrypt 12','OpenAPI 3.0','RBAC 6 roles'], color:'#E9C46A' },
  { layer:'Data',     tech:['PostgreSQL 15','Redis 7','28 DB tables','JSONB fields','Soft delete','S3 storage','Liquibase migrations'], color:'#16A34A' },
  { layer:'Infra',    tech:['Docker Compose','5 Services','Nginx','GitHub Actions CI/CD','Multi-tenant','Cloud-agnostic'], color:'#8B5CF6' },
]

export default function AboutPage() {
  return (
    <div style={{ background: 'var(--bg-base)', paddingTop: '88px' }}>

      {/* Hero */}
      <section style={{ padding: '72px 0 64px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div className="auto-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '72px', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '16px' }}>
                <span style={{ width: '28px', height: '2px', background: 'var(--gold)', display: 'inline-block' }} />
                About FINVOSMART
              </div>
              <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(28px,4vw,44px)', color: 'var(--text-primary)', marginBottom: '20px', lineHeight: 1.2 }}>
                Built for India.<br />By People Who Understand India.
              </h1>
              <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '16px' }}>
                FINVOSMART is a product of Navgrow Engineering Service Pvt. Ltd., a registered Indian technology company. We built FINVOSMART because we watched Indian businesses struggle with tools that weren't designed for India's compliance environment, business culture or technology landscape.
              </p>
              <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '28px' }}>
                Every feature — from the GST auto-reconciler to BharatVoice — was designed for a specific Indian business pain point, not retrofitted from a Western product.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['✓ India GST-native','✓ TDS auto-detection','✓ Aadhaar eSign','✓ WhatsApp-native','✓ 5 Indian languages'].map(t => (
                  <span key={t} style={{ padding: '5px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 500, border: '1px solid var(--border-strong)', background: 'var(--gold-muted)', color: 'var(--gold)' }}>{t}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="auto-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                {[['v1.0','Production-ready release'],['139','Java backend files'],['18','Integrated API modules'],['63M','MSMEs in our market']].map(([n,l]) => (
                  <div key={l} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px' }}>
                    <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '28px', color: 'var(--gold)' }}>{n}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Navgrow Engineering Service Pvt. Ltd.</strong><br />
                CIN: U29302WB2025PTC281015<br />
                Registered in West Bengal, India · MSME Registered<br />
                Website: finvosmart.com · Email: contact@finvosmart.com
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section style={{ padding: '72px 0', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(24px,3vw,36px)', color: 'var(--text-primary)', marginBottom: '14px' }}>Our Mission</h2>
            <p style={{ fontSize: '17px', color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto', lineHeight: 1.7 }}>Democratise enterprise-grade software for Indian businesses — no consultants, no six-figure licences, no Western-market assumptions.</p>
          </div>
          <div className="auto-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '20px' }}>
            {[
              { icon: Shield, color:'#E9C46A', title:'India-First Compliance', desc:'GST, TDS, PAN, GSTIN, Aadhaar eSign built into the core — not added as optional modules.' },
              { icon: Users,  color:'#2563EB', title:'Built for Real SMEs',    desc:'Designed for the 10–200 employee company that has outgrown spreadsheets but can\'t afford SAP.' },
              { icon: Globe,  color:'#16A34A', title:'WhatsApp-Native',        desc:'The world\'s most popular messaging app is the most common business tool in India. We integrate it natively.' },
              { icon: Code,   color:'#8B5CF6', title:'Open Architecture',      desc:'REST API with OpenAPI 3.0 documentation. Enterprise plan includes source code delivery.' },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, marginBottom: '16px' }}>
                  <Icon size={20} />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>{title}</h3>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section style={{ padding: '72px 0', background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }} id="security">
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(22px,3vw,32px)', color: 'var(--text-primary)', marginBottom: '8px' }}>Enterprise-Grade Architecture</h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '40px' }}>Production-ready. Cloud-native. Docker-deployable in one command.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {TECH_STACK.map(layer => (
              <div key={layer.layer} style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: layer.color, width: '80px', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{layer.layer}</div>
                <div style={{ width: '24px', height: '2px', background: 'var(--border-strong)', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {layer.tech.map(t => (
                    <span key={t} style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontFamily: 'Geist Mono, monospace', background: `${layer.color}10`, border: `1px solid ${layer.color}25`, color: 'var(--text-secondary)' }}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '72px 0', textAlign: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '32px', color: 'var(--text-primary)', marginBottom: '14px' }}>Ready to see it in action?</h2>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '32px' }}>Schedule a personalised demo or start your free trial today.</p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login?register=1" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 28px', borderRadius: '10px', background: 'var(--btn-primary-bg)', color: 'var(--text-on-gold)', textDecoration: 'none', fontWeight: 600, fontSize: '15px' }}>
              Start Free Trial <ArrowRight size={15} />
            </Link>
            <Link href="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 28px', borderRadius: '10px', border: '1px solid var(--border-strong)', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '15px' }}>
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
