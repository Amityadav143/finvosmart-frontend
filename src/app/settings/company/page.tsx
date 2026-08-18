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
import { useAuthStore } from '@/lib/store/slices/authStore'
import { Building2, Globe, Phone, Mail, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const TABS = ['General','Financial','Branding','Modules','Security']

export default function CompanySettingsPage(){
  const {user} = useAuthStore()
  const [tab, setTab] = useState('General')
  const [form, setForm] = useState({
    name:'Navgrow Engineering Service Pvt. Ltd.',legalName:'Navgrow Engineering Service Pvt. Ltd.',
    gstin:'27AABCN1234A1Z5',pan:'AABCN1234A',cin:'U72900MH2020PTC123456',
    email:'info@nvgrow.in',phone:'+91 98765 43210',website:'https://nvgrow.in',
    address:'Level 5, DLF Cybercity, Powai',city:'Mumbai',state:'Maharashtra',pincode:'400076',
    currency:'INR',fyStart:'4',timezone:'Asia/Kolkata',
  })

  return(
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Company Settings</h1>
          <p className="text-sm mt-0.5" style={{color:'var(--text-muted)'}}>Manage your organisation profile</p>
        </div>
        <button onClick={()=>toast.success('Settings saved')} className="btn-primary h-9 text-sm">
          <Save className="w-4 h-4"/>Save Changes
        </button>
      </div>

      {/* Tab bar */}
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

      {tab==='General' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{background:'var(--btn-primary-bg)'}}>
                <Building2 className="w-6 h-6" style={{color:'var(--text-on-gold)'}}/>
              </div>
              <div>
                <h3 className="font-semibold">Company Identity</h3>
                <p className="text-xs" style={{color:'var(--text-muted)'}}>Code: NVGROW001</p>
              </div>
            </div>
            <div className="space-y-4">
              {[['Company Name *','name','text'],['Legal Name','legalName','text'],['GSTIN','gstin','text'],['PAN','pan','text'],['CIN','cin','text']].map(([l,k,t])=>(
                <div key={k as string}>
                  <label className="label">{l as string}</label>
                  <input className="input h-10" type={t as string} value={(form as any)[k as string]}
                    onChange={e=>setForm(f=>({...f,[k as string]:e.target.value}))}/>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="card">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Globe className="w-4 h-4" style={{color:'var(--gold)'}}/>Contact & Online</h3>
              <div className="space-y-3">
                {[['Email','email','email'],['Phone','phone','tel'],['Website','website','url']].map(([l,k,t])=>(
                  <div key={k as string}>
                    <label className="label">{l as string}</label>
                    <input className="input h-10" type={t as string} value={(form as any)[k as string]}
                      onChange={e=>setForm(f=>({...f,[k as string]:e.target.value}))}/>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="font-semibold mb-4">Registered Address</h3>
              <div className="space-y-3">
                {[['Address','address','text'],['City','city','text'],['State','state','text'],['Pincode','pincode','text']].map(([l,k,t])=>(
                  <div key={k as string}>
                    <label className="label">{l as string}</label>
                    <input className="input h-10" value={(form as any)[k as string]}
                      onChange={e=>setForm(f=>({...f,[k as string]:e.target.value}))}/>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab==='Financial' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card">
            <h3 className="font-semibold mb-4">Financial Year Settings</h3>
            <div className="space-y-4">
              <div><label className="label">Base Currency</label>
                <select className="input h-10" value={form.currency} onChange={e=>setForm(f=>({...f,currency:e.target.value}))}>
                  <option value="INR">INR — Indian Rupee</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="EUR">EUR — Euro</option>
                </select></div>
              <div><label className="label">Financial Year Start Month</label>
                <select className="input h-10" value={form.fyStart} onChange={e=>setForm(f=>({...f,fyStart:e.target.value}))}>
                  {['April (Recommended)','January','July','October'].map((m,i)=>(
                    <option key={i} value={String([4,1,7,10][i])}>{m}</option>
                  ))}
                </select></div>
              <div><label className="label">Timezone</label>
                <select className="input h-10" value={form.timezone} onChange={e=>setForm(f=>({...f,timezone:e.target.value}))}>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC+5:30)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST, UTC+4)</option>
                  <option value="UTC">UTC</option>
                </select></div>
            </div>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-4">GST Configuration</h3>
            <div className="space-y-3">
              {[['Company GSTIN','27AABCN1234A1Z5'],['State of Registration','Maharashtra'],['Tax Scheme','Regular'],['E-Invoice Enabled','Yes']].map(([k,v])=>(
                <div key={k} className="flex items-center justify-between py-2.5" style={{borderBottom:'1px solid var(--border)'}}>
                  <span className="text-sm" style={{color:'var(--text-secondary)'}}>{k}</span>
                  <span className="text-sm font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {['Branding','Modules','Security'].includes(tab) && (
        <div className="card flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{background:'var(--btn-primary-bg)'}}>
            <Save className="w-6 h-6" style={{color:'var(--text-on-gold)'}}/>
          </div>
          <p className="font-semibold">{tab} Settings</p>
          <p className="text-sm" style={{color:'var(--text-muted)'}}>Configuration for {tab.toLowerCase()} is coming in the next release.</p>
        </div>
      )}
    </div>
  )
}
