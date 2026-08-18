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

import { useState } from 'react'
import { ArrowRight, Mail, Globe, Monitor, Linkedin } from 'lucide-react'

export default function ContactPage() {
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', phone:'', company:'', size:'', plan:'Growth — ₹12,999/mo', message:'' })
  const [submitted, setSubmitted] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  const inp: React.CSSProperties = { width:'100%', padding:'11px 14px', borderRadius:'8px', background:'var(--bg-input)', border:'1px solid var(--border-strong)', color:'var(--text-primary)', fontSize:'14px', fontFamily:'inherit', outline:'none', transition:'border-color 0.2s' }
  const lbl: React.CSSProperties = { display:'block', fontSize:'12px', color:'var(--text-secondary)', marginBottom:'7px', fontWeight:500, letterSpacing:'0.04em' }

  return (
    <div style={{ background: 'var(--bg-base)', paddingTop: '88px' }}>

      {/* Hero */}
      <section style={{ padding: '72px 0 56px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '16px' }}>
            <span style={{ width: '28px', height: '2px', background: 'var(--gold)', display: 'inline-block' }} />
            Get In Touch
          </div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(28px,4vw,44px)', color: 'var(--text-primary)', marginBottom: '14px', lineHeight: 1.15 }}>Talk to Our Team</h1>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '480px', lineHeight: 1.7 }}>Whether you need a demo, have technical questions, or want to discuss an enterprise deployment — we respond within 4 business hours.</p>
        </div>
      </section>

      {/* Content */}
      <section style={{ padding: '64px 0 80px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div className="auto-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '64px' }}>

            {/* Left: info */}
            <div>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '22px', color: 'var(--text-primary)', marginBottom: '14px' }}>Contact Details</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '32px' }}>Our team is based in India and is best placed to understand your business requirements.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '36px' }}>
                {[
                  { icon: Mail,    label:'Email',    val:'contact@finvosmart.com' },
                  { icon: Globe,   label:'Website',  val:'finvosmart.com' },
                  { icon: Monitor, label:'Live Demo', val:'demo.finvosmart.com' },
                  { icon: Linkedin,label:'LinkedIn',  val:'linkedin.com/company/finvosmart' },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--gold-muted)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', flexShrink: 0 }}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                      <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{val}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Company card */}
              <div style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Navgrow Engineering Service Pvt. Ltd.</div>
                CIN: U29302WB2025PTC281015<br />
                Registered in West Bengal, India<br />
                MSME Registered · ISO in process
              </div>
            </div>

            {/* Right: form */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '36px' }}>
              {submitted ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
                  <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '24px', color: 'var(--text-primary)', marginBottom: '10px' }}>Request Sent!</h3>
                  <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>We'll reach out within 4 business hours to schedule your personalised demo.</p>
                </div>
              ) : (
                <>
                  <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '22px', color: 'var(--text-primary)', marginBottom: '6px' }}>Schedule a Demo</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>We'll set up a personalised walkthrough for your team.</p>

                  <form onSubmit={submit}>
                    <div className="auto-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                      <div><label style={lbl}>First Name</label><input style={inp} value={form.firstName} onChange={e => setForm(f => ({...f, firstName: e.target.value}))} placeholder="Rajesh" required /></div>
                      <div><label style={lbl}>Last Name</label><input style={inp} value={form.lastName} onChange={e => setForm(f => ({...f, lastName: e.target.value}))} placeholder="Kumar" required /></div>
                    </div>
                    <div className="auto-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                      <div><label style={lbl}>Business Email</label><input style={inp} type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="rajesh@company.com" required /></div>
                      <div><label style={lbl}>Mobile Number</label><input style={inp} type="tel" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="+91 98765 43210" /></div>
                    </div>
                    <div style={{ marginBottom: '14px' }}><label style={lbl}>Company Name</label><input style={inp} value={form.company} onChange={e => setForm(f => ({...f, company: e.target.value}))} placeholder="Precision Auto Parts Pvt. Ltd." required /></div>
                    <div className="auto-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                      <div>
                        <label style={lbl}>Company Size</label>
                        <select style={inp} value={form.size} onChange={e => setForm(f => ({...f, size: e.target.value}))}>
                          <option value="">Select employees</option>
                          <option>1–10 employees</option><option>11–50 employees</option><option>51–200 employees</option><option>200+ employees</option>
                        </select>
                      </div>
                      <div>
                        <label style={lbl}>Interested Plan</label>
                        <select style={inp} value={form.plan} onChange={e => setForm(f => ({...f, plan: e.target.value}))}>
                          <option>Starter — ₹4,999/mo</option>
                          <option>Growth — ₹12,999/mo</option>
                          <option>Enterprise — ₹29,999/mo</option>
                          <option>Not sure yet</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={lbl}>Message (Optional)</label>
                      <textarea style={{ ...inp, resize: 'vertical' }} rows={3} value={form.message} onChange={e => setForm(f => ({...f, message: e.target.value}))} placeholder="Tell us about your current setup or requirements…" />
                    </div>
                    <button type="submit" style={{ width: '100%', padding: '13px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: 'var(--btn-primary-bg)', color: 'var(--text-on-gold)', fontWeight: 600, fontSize: '15px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: 'var(--btn-primary-shadow)' }}>
                      Request Demo <ArrowRight size={16} />
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
