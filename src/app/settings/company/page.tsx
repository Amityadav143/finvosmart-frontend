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

import { Suspense, useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { checkGstin } from '@/lib/gstin'
import { Building2, Globe, Phone, Mail, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'next/navigation'
import { PaymentSettings } from '@/components/settings/PaymentSettings'
import { apiError } from '@/lib/utils'

const TABS = ['General', 'Payments & invoices', 'Financial'] as const

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/
const PIN_RE = /^[1-9][0-9]{5}$/
// Exactly the fields PATCH /admin/company updates (company code and plan are never sent).
const EDITABLE = ['name', 'legalName', 'gstin', 'pan', 'cin', 'email', 'phone', 'website', 'address', 'city', 'state', 'pincode'] as const
type Editable = typeof EDITABLE[number]
type Form = Record<Editable, string>
const EMPTY = Object.fromEntries(EDITABLE.map(k => [k, ''])) as Form
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function validate(f: Form): string | null {
  if (!f.name.trim()) return 'Company name is required'
  if (f.gstin.trim()) { const g = checkGstin(f.gstin); if (!g.valid) return `GSTIN: ${g.problems[0]}` }
  if (f.pan.trim() && !PAN_RE.test(f.pan.trim().toUpperCase())) return 'PAN should be 10 characters, e.g. AAPFU0939F'
  if (f.pincode.trim() && !PIN_RE.test(f.pincode.trim())) return 'Pincode should be 6 digits'
  return null
}

function CompanySettings(){
  const qc = useQueryClient()
  const params = useSearchParams()
  const [tab, setTab] = useState<typeof TABS[number]>(params.get('tab') === 'payments' ? 'Payments & invoices' : 'General')
  const [form, setForm] = useState<Form>(EMPTY)
  const { data: company, isLoading, isError } = useQuery({
    queryKey: ['company'],
    queryFn: () => api.get('/admin/company').then(r => r.data.data),
  })
  // Show the company's real details (this form used to start with sample data).
  useEffect(() => {
    if (company) setForm(Object.fromEntries(EDITABLE.map(k => [k, (company as any)[k] ?? ''])) as Form)
  }, [company])

  const save = useMutation({
    mutationFn: () => {
      const payload: Record<string, string> = Object.fromEntries(EDITABLE.map(k => [k, form[k].trim()]))
      payload.gstin = payload.gstin.toUpperCase()
      payload.pan = payload.pan.toUpperCase()
      return api.patch('/admin/company', payload).then(r => r.data.data)
    },
    onSuccess: () => { toast.success('Company settings saved'); qc.invalidateQueries({ queryKey: ['company'] }) },
    onError: (e: any) => toast.error(apiError(e, 'Could not save company settings')),
  })
  const onSave = () => { const err = validate(form); if (err) { toast.error(err); return } save.mutate() }
  const dirty = !!company && EDITABLE.some(k => ((company as any)[k] ?? '') !== form[k])
  const field = (label: string, k: Editable, type = 'text', upper = false) => (
    <div key={k}>
      <label className="label">{label}</label>
      <input className="input h-10" type={type} value={form[k]} style={upper ? { textTransform: 'uppercase' } : undefined}
        onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}/>
    </div>
  )

  return(
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Company Settings</h1>
          <p className="text-sm mt-0.5" style={{color:'var(--text-muted)'}}>These details appear on your invoices and documents</p>
        </div>
        {tab === 'General' && (
          <button onClick={onSave} disabled={!dirty || save.isPending} className="btn-primary h-9 text-sm">
            <Save className="w-4 h-4"/>{save.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        )}
      </div>

      <div className="flex gap-1 p-1 rounded-xl" style={{background:'var(--bg-hover)',border:'1px solid var(--border)',width:'fit-content'}}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{background:tab===t?'var(--card)':'transparent',color:tab===t?'var(--gold)':'var(--text-muted)',
                    boxShadow:tab===t?'var(--shadow-sm)':'none',border:tab===t?'1px solid var(--border)':'1px solid transparent'}}>
            {t}
          </button>
        ))}
      </div>

      {(isLoading || isError) && (
        <div className="card text-sm" style={{color: isError ? '#ef4444' : 'var(--text-muted)'}}>
          {isError ? 'Could not load your company details. Please refresh the page.' : 'Loading company details…'}
        </div>
      )}

      {company && tab==='General' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{background:'var(--btn-primary-bg)'}}>
                <Building2 className="w-6 h-6" style={{color:'var(--text-on-gold)'}}/>
              </div>
              <div>
                <h3 className="font-semibold">Company Identity</h3>
                <p className="text-xs" style={{color:'var(--text-muted)'}}>Company code: <span className="font-mono">{company.companyCode ?? '—'}</span></p>
              </div>
            </div>
            <div className="space-y-4">
              {field('Company Name *','name')}
              {field('Legal Name','legalName')}
              {field('GSTIN','gstin','text',true)}
              {field('PAN','pan','text',true)}
              {field('CIN','cin','text',true)}
            </div>
          </div>
          <div className="space-y-4">
            <div className="card">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Globe className="w-4 h-4" style={{color:'var(--gold)'}}/>Contact & Online</h3>
              <div className="space-y-3">
                {field('Email','email','email')}
                {field('Phone','phone','tel')}
                {field('Website','website','url')}
              </div>
            </div>
            <div className="card">
              <h3 className="font-semibold mb-4">Registered Address</h3>
              <div className="space-y-3">
                {field('Address','address')}
                {field('City','city')}
                {field('State','state')}
                {field('Pincode','pincode')}
              </div>
            </div>
          </div>
        </div>
      )}

      {company && tab==='Payments & invoices' && <PaymentSettings/>}

      {company && tab==='Financial' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card">
            <h3 className="font-semibold mb-4">Financial Year Settings</h3>
            <div className="space-y-1">
              {[['Base currency', company.currency ?? 'INR'],
                ['Financial year starts', MONTHS[((company.financialYearStartMonth ?? 4) - 1 + 12) % 12]],
                ['Timezone', company.timezone ?? 'Asia/Kolkata']].map(([k,v])=>(
                <div key={k} className="flex items-center justify-between py-2.5" style={{borderBottom:'1px solid var(--border)'}}>
                  <span className="text-sm" style={{color:'var(--text-secondary)'}}>{k}</span>
                  <span className="text-sm font-semibold">{v}</span>
                </div>
              ))}
            </div>
            <p className="text-xs mt-4" style={{color:'var(--text-muted)', lineHeight: 1.6}}>
              These are set when your company is created. Changing the financial year affects your books, so please contact support if you need to change them.
            </p>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-4">GST Registration</h3>
            <div className="space-y-1">
              {[['GSTIN', company.gstin || 'Not added yet'], ['State', company.state || '—']].map(([k,v])=>(
                <div key={k} className="flex items-center justify-between py-2.5" style={{borderBottom:'1px solid var(--border)'}}>
                  <span className="text-sm" style={{color:'var(--text-secondary)'}}>{k}</span>
                  <span className="text-sm font-semibold font-mono">{v}</span>
                </div>
              ))}
            </div>
            <p className="text-xs mt-4" style={{color:'var(--text-muted)'}}>Edit your GSTIN on the General tab.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CompanySettingsPage(){
  return <Suspense fallback={null}><CompanySettings/></Suspense>
}
