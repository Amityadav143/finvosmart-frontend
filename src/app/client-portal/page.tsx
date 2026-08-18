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

import { Globe, Users, CreditCard, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ClientPortalPage(){
  return(
    <div className="space-y-5">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest" style={{color:'#7c3aed',letterSpacing:'.08em'}}>F-03 — New Feature</span>
        <h1 className="page-title">Client Self-Service Portal</h1>
        <p className="text-sm mt-0.5" style={{color:'var(--text-muted)'}}>Branded portal where your customers view invoices, pay online and raise tickets — without calling you</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {icon:Globe,title:'Branded URL',desc:'portal.yourdomain.com — your brand, our technology',color:'#7c3aed'},
          {icon:Users,title:'OTP Login',desc:'No password setup needed — customers login via mobile OTP',color:'#3b82f6'},
          {icon:CreditCard,title:'UPI / Net Banking',desc:'Pay outstanding invoices directly from the portal',color:'#22c55e'},
          {icon:MessageCircle,title:'Raise Tickets',desc:'Customers dispute invoices or request statements in-app',color:'#f59e0b'},
        ].map(f=>(
          <div key={f.title} className="card flex flex-col items-start gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{background:`${f.color}12`}}>
              <f.icon className="w-6 h-6" style={{color:f.color}}/>
            </div>
            <div>
              <p className="font-semibold text-sm mb-1">{f.title}</p>
              <p className="text-xs leading-relaxed" style={{color:'var(--text-muted)'}}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <h2 className="section-title mb-4">Portal Configuration</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Portal Subdomain</label><div className="flex items-center gap-2"><input className="input h-10 flex-1" placeholder="yourcompany"/><span className="text-sm" style={{color:'var(--text-muted)'}}>.finvosmart.in</span></div></div>
          <div><label className="label">Brand Colour</label><input className="input h-10" type="color" defaultValue="#f59e0b"/></div>
          <div><label className="label">Company Logo URL</label><input className="input h-10" placeholder="https://..."/></div>
          <div><label className="label">Support Email</label><input className="input h-10" type="email" placeholder="accounts@yourcompany.com"/></div>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={()=>toast.success('Portal configuration saved — live at yourcompany.finvosmart.in')} className="btn-primary">Activate Portal</button>
        </div>
      </div>
    </div>
  )
}
