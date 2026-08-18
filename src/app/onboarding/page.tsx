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
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api/client'
import { CheckCircle2, ArrowRight, ArrowLeft, Building2, Users, FileText, CreditCard, Zap, Rocket } from 'lucide-react'
import toast from 'react-hot-toast'

type Step = 'welcome' | 'company' | 'team' | 'invoice' | 'integrations' | 'done'

const STEPS: { id: Step; label: string; icon: any }[] = [
  { id: 'welcome',      label: 'Welcome',      icon: Rocket      },
  { id: 'company',      label: 'Company',       icon: Building2   },
  { id: 'team',         label: 'First Employee',icon: Users       },
  { id: 'invoice',      label: 'First Invoice', icon: FileText    },
  { id: 'integrations', label: 'Integrations',  icon: Zap         },
  { id: 'done',         label: 'Done',          icon: CheckCircle2},
]

const stepIdx = (id: Step) => STEPS.findIndex(s => s.id === id)

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('welcome')
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState<Step[]>([])

  const [company, setCompany] = useState({
    name: '', legalName: '', gstin: '', address: '', city: '', pincode: '', phone: '', website: '',
  })
  const [employee, setEmployee] = useState({
    fullName: '', email: '', phone: '', designation: 'Director',
  })
  const [invoice, setInvoice] = useState({
    customerName: '', customerEmail: '', amount: '', description: 'Professional Services',
  })

  const curr = stepIdx(step)
  const next = () => {
    setCompleted(c => [...c, step])
    setStep(STEPS[Math.min(curr + 1, STEPS.length - 1)].id)
  }
  const back = () => setStep(STEPS[Math.max(curr - 1, 0)].id)

  const saveCompany = async () => {
    if (!company.name) { toast.error('Company name is required'); return }
    setLoading(true)
    try {
      await api.patch('/admin/company', company)
      toast.success('Company details saved')
      next()
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Failed to save — you can update this in Settings later')
      next() // Don't block — let them continue
    } finally { setLoading(false) }
  }

  const saveEmployee = async () => {
    if (!employee.fullName || !employee.email) { toast.error('Name and email required'); return }
    setLoading(true)
    try {
      // The employee API needs a department. Fetch existing ones; if none exist yet,
      // create a default "General" department so onboarding stays frictionless.
      let departmentId: string | undefined
      try {
        const deptRes = await api.get('/admin/departments')
        const depts = deptRes.data?.data ?? []
        departmentId = depts[0]?.id
        if (!departmentId) {
          const created = await api.post('/admin/departments', { name: 'General' })
          departmentId = created.data?.data?.id
        }
      } catch {
        // Department lookup/creation not available — fall through and let the
        // employee call surface a friendly skip message below.
      }

      // Map the simple onboarding form to the employee create contract.
      const parts = employee.fullName.trim().split(/\s+/)
      const firstName = parts[0]
      const lastName = parts.length > 1 ? parts.slice(1).join(' ') : parts[0]

      await api.post('/employees', {
        firstName,
        lastName,
        officialEmail: employee.email,
        phonePrimary: employee.phone || undefined,
        departmentId,
        employmentType: 'PERMANENT',
        dateOfJoining: new Date().toISOString().split('T')[0],
      })
      toast.success('First employee added!')
      next()
    } catch {
      toast.error('You can add employees anytime from the HRMS module — skipping for now')
      next()
    }
    finally { setLoading(false) }
  }

  const sendInvoice = async () => {
    if (!invoice.customerName || !invoice.amount) { next(); return }
    setLoading(true)
    try {
      // An invoice needs a customerId. Create the customer first so the whole
      // flow works end-to-end during onboarding.
      const custRes = await api.post('/crm/customers', {
        name: invoice.customerName,
        email: invoice.customerEmail || undefined,
      })
      const customerId = custRes.data?.data?.id

      await api.post('/invoices', {
        invoiceType: 'TAX_INVOICE',
        invoiceDate: new Date().toISOString().split('T')[0],
        customerId,
        customerName: invoice.customerName,
        lineItems: [{
          description: invoice.description || 'Professional Services',
          quantity: 1,
          unit: 'Nos',
          unitPrice: Number(invoice.amount),
          discountPct: 0,
          gstRate: 18,
          isIgst: false,
        }],
      })
      toast.success('First invoice created!')
      next()
    } catch {
      toast.error('You can create invoices anytime from the Invoicing module — skipping for now')
      next()
    }
    finally { setLoading(false) }
  }

  const cardStyle = {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: '20px', padding: '36px', maxWidth: '560px', margin: '0 auto',
  }
  const inputCls = "input h-11 mb-3"

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
      {/* Progress */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '32px', alignItems: 'center' }}>
        {STEPS.map((s, i) => {
          const done = completed.includes(s.id)
          const active = s.id === step
          const Icon = s.icon
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done ? '#059669' : active ? 'var(--btn-primary-bg)' : 'var(--bg-card)',
                  border: `2px solid ${done ? '#059669' : active ? 'var(--gold)' : 'var(--border)'}`,
                  transition: 'all 0.3s',
                }}>
                  {done ? <CheckCircle2 size={16} color="white" /> : <Icon size={14} color={active ? 'var(--text-on-gold)' : 'var(--text-muted)'} />}
                </div>
                <span style={{ fontSize: '9px', fontWeight: 600, color: active ? 'var(--gold)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: '24px', height: '2px', background: done ? '#059669' : 'var(--border)', borderRadius: '1px', marginBottom: '20px', transition: 'all 0.3s' }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Welcome */}
      {step === 'welcome' && (
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'var(--btn-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Rocket size={28} color="var(--text-on-gold)" />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Welcome to FINVOSMART 🎉
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Let's set up your account in 4 quick steps. It takes less than 5 minutes.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '28px' }}>
            {[
              ['🏢', 'Company Profile', 'Your business details and GST info'],
              ['👤', 'First Employee', 'Add yourself or a team member'],
              ['📄', 'First Invoice', 'Create your first GST invoice'],
              ['⚡', 'Integrations', 'Connect payments and WhatsApp'],
            ].map(([icon, title, desc]) => (
              <div key={title as string} style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '20px', marginBottom: '4px' }}>{icon}</p>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{desc}</p>
              </div>
            ))}
          </div>
          <button className="btn-primary h-12 w-full text-base" onClick={next}>
            Get Started <ArrowRight size={17} />
          </button>
          <button className="btn-ghost h-10 w-full mt-2 text-sm" onClick={() => router.push('/dashboard')}>
            Skip setup — I'll configure later
          </button>
        </div>
      )}

      {/* Company */}
      {step === 'company' && (
        <div style={cardStyle}>
          <Building2 size={28} style={{ color: 'var(--gold)', marginBottom: '12px' }} />
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Your Company Details</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>This appears on all your invoices and documents</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="label label-required">Company / Trade Name</label>
              <input className={inputCls} placeholder="e.g. Acme Technologies Pvt. Ltd." value={company.name} onChange={e => setCompany(c => ({ ...c, name: e.target.value }))} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="label">Legal Name (for invoices)</label>
              <input className={inputCls} placeholder="Same as above or registered name" value={company.legalName} onChange={e => setCompany(c => ({ ...c, legalName: e.target.value }))} />
            </div>
            <div>
              <label className="label">GSTIN</label>
              <input className={inputCls} placeholder="22AAAAA0000A1Z5" value={company.gstin} onChange={e => setCompany(c => ({ ...c, gstin: e.target.value.toUpperCase() }))} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className={inputCls} placeholder="+91 98765 00001" value={company.phone} onChange={e => setCompany(c => ({ ...c, phone: e.target.value }))} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="label">Registered Address</label>
              <input className={inputCls} placeholder="Street address, area" value={company.address} onChange={e => setCompany(c => ({ ...c, address: e.target.value }))} />
            </div>
            <div>
              <label className="label">City</label>
              <input className={inputCls} placeholder="Mumbai" value={company.city} onChange={e => setCompany(c => ({ ...c, city: e.target.value }))} />
            </div>
            <div>
              <label className="label">PIN Code</label>
              <input className={inputCls} placeholder="400001" value={company.pincode} onChange={e => setCompany(c => ({ ...c, pincode: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button aria-label="Go back" className="btn-secondary h-11 flex-shrink-0" onClick={back}><ArrowLeft size={15} /></button>
            <button className="btn-primary h-11 flex-1" onClick={saveCompany} disabled={loading}>
              {loading ? 'Saving...' : <>Save & Continue <ArrowRight size={15} /></>}
            </button>
          </div>
          <button className="btn-ghost h-9 w-full mt-2 text-sm" onClick={next}>Skip for now</button>
        </div>
      )}

      {/* Team */}
      {step === 'team' && (
        <div style={cardStyle}>
          <Users size={28} style={{ color: 'var(--gold)', marginBottom: '12px' }} />
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Add Your First Employee</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>Start with yourself or a key team member</p>

          <label className="label label-required">Full Name</label>
          <input className={inputCls} placeholder="Rahul Sharma" value={employee.fullName} onChange={e => setEmployee(em => ({ ...em, fullName: e.target.value }))} />

          <label className="label label-required">Work Email</label>
          <input type="email" className={inputCls} placeholder="rahul@yourcompany.com" value={employee.email} onChange={e => setEmployee(em => ({ ...em, email: e.target.value }))} />

          <label className="label">Phone</label>
          <input className={inputCls} placeholder="9876543210" value={employee.phone} onChange={e => setEmployee(em => ({ ...em, phone: e.target.value }))} />

          <label className="label">Designation</label>
          <input className={inputCls} placeholder="Director, Manager, Engineer..." value={employee.designation} onChange={e => setEmployee(em => ({ ...em, designation: e.target.value }))} />

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button aria-label="Go back" className="btn-secondary h-11 flex-shrink-0" onClick={back}><ArrowLeft size={15} /></button>
            <button className="btn-primary h-11 flex-1" onClick={saveEmployee} disabled={loading}>
              {loading ? 'Adding...' : <>Add Employee <ArrowRight size={15} /></>}
            </button>
          </div>
          <button className="btn-ghost h-9 w-full mt-2 text-sm" onClick={next}>Skip — add employees from HRMS later</button>
        </div>
      )}

      {/* Invoice */}
      {step === 'invoice' && (
        <div style={cardStyle}>
          <FileText size={28} style={{ color: 'var(--gold)', marginBottom: '12px' }} />
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Create Your First Invoice</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>Send a test invoice to see the full workflow</p>

          <label className="label label-required">Customer / Client Name</label>
          <input className={inputCls} placeholder="Tata Steel Ltd." value={invoice.customerName} onChange={e => setInvoice(inv => ({ ...inv, customerName: e.target.value }))} />

          <label className="label">Description</label>
          <input className={inputCls} placeholder="Professional Services / Software Development" value={invoice.description} onChange={e => setInvoice(inv => ({ ...inv, description: e.target.value }))} />

          <label className="label label-required">Amount (₹) before GST</label>
          <input type="number" className={inputCls} placeholder="50000" value={invoice.amount} onChange={e => setInvoice(inv => ({ ...inv, amount: e.target.value }))} />

          {invoice.amount && (
            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.2)', marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', color: '#059669', margin: 0 }}>
                Subtotal: ₹{Number(invoice.amount).toLocaleString('en-IN')} + GST 18% (₹{(Number(invoice.amount)*0.18).toLocaleString('en-IN')}) = <b>₹{(Number(invoice.amount)*1.18).toLocaleString('en-IN')}</b>
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button aria-label="Go back" className="btn-secondary h-11 flex-shrink-0" onClick={back}><ArrowLeft size={15} /></button>
            <button className="btn-primary h-11 flex-1" onClick={sendInvoice} disabled={loading}>
              {loading ? 'Creating...' : <>Create Invoice <ArrowRight size={15} /></>}
            </button>
          </div>
          <button className="btn-ghost h-9 w-full mt-2 text-sm" onClick={next}>Skip — I'll create invoices later</button>
        </div>
      )}

      {/* Integrations */}
      {step === 'integrations' && (
        <div style={cardStyle}>
          <Zap size={28} style={{ color: 'var(--gold)', marginBottom: '12px' }} />
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Connect Integrations</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>Optional — configure later in Settings</p>

          {[
            { icon: '💳', title: 'Razorpay Payment Gateway', desc: 'Accept UPI, cards, netbanking. Auto-mark invoices as PAID on payment.', cta: 'Configure in Settings → Integrations', href: '/settings/company' },
            { icon: '💬', title: 'WhatsApp Business API', desc: 'Send invoices and payment reminders directly on WhatsApp.', cta: 'Configure in Settings → Integrations', href: '/settings/company' },
            { icon: '🏦', title: 'Bank Statement Import', desc: 'Import SBI, HDFC, ICICI, Axis statements for auto-reconciliation.', cta: 'Go to Bank Import', href: '/bank-import' },
            { icon: '📊', title: 'GSTN IRP (e-Invoice)', desc: 'Auto-generate IRN for B2B invoices above Rs 5 crore.', cta: 'Configure in Settings → Company', href: '/settings/company' },
          ].map(item => (
            <div key={item.title} style={{ display: 'flex', gap: '14px', padding: '14px', borderRadius: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', marginBottom: '10px' }}>
              <span style={{ fontSize: '24px', flexShrink: 0 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>{item.title}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>{item.desc}</p>
                <a href={item.href} style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 600, textDecoration: 'none' }}>{item.cta} →</a>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button aria-label="Go back" className="btn-secondary h-11 flex-shrink-0" onClick={back}><ArrowLeft size={15} /></button>
            <button className="btn-primary h-11 flex-1" onClick={next}>
              Continue <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Done */}
      {step === 'done' && (
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(5,150,105,0.1)', border: '3px solid #059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle2 size={36} style={{ color: '#059669' }} />
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            You're all set! 🚀
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '28px' }}>
            FINVOSMART is ready. All 15 modules are available in the left sidebar.
            Use <kbd style={{ padding: '2px 8px', borderRadius: '6px', background: 'var(--bg-hover)', border: '1px solid var(--border)', fontSize: '12px', fontFamily: 'monospace' }}>⌘K</kbd> to quickly navigate anywhere.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
            {[
              { href: '/invoicing',   label: '📄 Create Invoice' },
              { href: '/hrms/employees', label: '👥 Manage Employees' },
              { href: '/crm/leads',   label: '🎯 View CRM Pipeline' },
              { href: '/dashboard',   label: '📊 Go to Dashboard' },
            ].map(btn => (
              <a key={btn.href} href={btn.href} style={{
                padding: '12px', borderRadius: '12px', background: 'var(--bg-surface)',
                border: '1px solid var(--border)', textDecoration: 'none',
                fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)',
                display: 'block', transition: 'all 0.15s',
              }}>
                {btn.label}
              </a>
            ))}
          </div>
          <button className="btn-primary h-12 w-full text-base" onClick={() => router.push('/dashboard')}>
            Go to Dashboard <ArrowRight size={17} />
          </button>
        </div>
      )}
    </div>
  )
}
