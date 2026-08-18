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
import { formatDate } from '@/lib/utils'
import { CheckCircle, Clock, Eye, Send, MessageCircle, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'

const MESSAGES = [
  {id:'1',customer:'Priya S.',invoice:'INV-000044',amount:'₹1,24,500',status:'PAID',     readAt:'10:32 AM',paidAt:'10:47 AM',dueDate:'15 Apr 2025'},
  {id:'2',customer:'Rajesh Kumar',invoice:'INV-000043',amount:'₹2,80,000',status:'READ', readAt:'09:15 AM',paidAt:null,dueDate:'20 Apr 2025'},
  {id:'3',customer:'TCS Ltd.',invoice:'INV-000042',amount:'₹8,40,000',status:'DELIVERED',readAt:null,paidAt:null,dueDate:'12 Apr 2025'},
  {id:'4',customer:'Wipro Tech',invoice:'INV-000041',amount:'₹4,20,000',status:'SENT',   readAt:null,paidAt:null,dueDate:'10 Apr 2025'},
]

const STATUS_CONFIG: Record<string,{label:string,color:string,icon:any}> = {
  PAID:      {label:'Payment received',  color:'#22c55e',icon:CreditCard},
  READ:      {label:'Message read',      color:'#3b82f6',icon:Eye},
  DELIVERED: {label:'Delivered',         color:'#8b5cf6',icon:CheckCircle},
  SENT:      {label:'Sent',              color:'#64748b',icon:Send},
}

const CONVERSATION = [
  {dir:'out', type:'invoice', text:'*FINVOSMART Invoice*\nINV-000044 — ₹1,24,500\nDue: 15 Apr 2025\n\n[Pay via UPI ₹1,24,500]', time:'09:00 AM'},
  {dir:'out', type:'status',  text:'✓✓ Read 10:32 AM', time:'10:32 AM'},
  {dir:'in',  type:'text',    text:'Okay will process today', time:'10:35 AM'},
  {dir:'out', type:'payment', text:'✅ Payment received: ₹1,24,500\nUPI Ref: HDFC0028349\nThank you!', time:'10:47 AM'},
]

export default function WhatsAppHubPage(){
  const [selected, setSelected] = useState(MESSAGES[0])
  const [sendModal, setSendModal] = useState(false)
  const [form, setForm] = useState({invoice:'INV-000045',phone:'9876543210',amount:'₹50,000',customer:'New Customer'})

  return(
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <MessageCircle className="w-4 h-4" style={{color:'#22c55e'}}/>
          <span className="text-xs font-bold uppercase tracking-widest" style={{color:'#22c55e',letterSpacing:'.08em'}}>Native Integration — USP 02</span>
        </div>
        <h1 className="page-title">WhatsApp Business Hub</h1>
        <p className="text-sm mt-0.5" style={{color:'var(--text-muted)'}}>Send invoices, collect UPI payments & track delivery — all via WhatsApp</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {label:'Sent Today',     val:'12', color:'#64748b'},
          {label:'Delivered',      val:'11', color:'#8b5cf6'},
          {label:'Read',           val:'8',  color:'#3b82f6'},
          {label:'Paid via UPI',   val:'4',  color:'#22c55e'},
        ].map(s=>(
          <div key={s.label} className="card">
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{color:'var(--text-muted)',fontSize:'9px',letterSpacing:'.07em'}}>{s.label}</p>
            <p className="font-serif text-2xl" style={{color:s.color}}>{s.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Message list */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Recent Deliveries</h2>
            <button onClick={()=>setSendModal(true)} className="btn-primary h-9 text-sm"><Send className="w-4 h-4"/>Send Invoice</button>
          </div>
          <div className="space-y-2">
            {MESSAGES.map(m=>{
              const cfg = STATUS_CONFIG[m.status]
              return(
                <button key={m.id} onClick={()=>setSelected(m)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all"
                  style={{background:selected.id===m.id?'var(--gold-muted)':'var(--bg-hover)',
                          border:`1px solid ${selected.id===m.id?'rgba(245,158,11,.2)':'var(--border)'}`}}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{background:'rgba(34,197,94,.12)',color:'#22c55e'}}>
                    {m.customer.split(' ').map(w=>w[0]).join('').slice(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{m.customer}</p>
                    <p className="text-xs font-mono" style={{color:'var(--text-muted)'}}>{m.invoice} · {m.amount}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="flex items-center gap-1 text-xs font-semibold" style={{color:cfg.color}}>
                      <cfg.icon className="w-3.5 h-3.5"/>{cfg.label}
                    </span>
                    <p className="text-xs mt-0.5" style={{color:'var(--text-muted)'}}>Due {selected.dueDate}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Conversation view */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4 pb-4" style={{borderBottom:'1px solid var(--border)'}}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
              style={{background:'rgba(34,197,94,.12)',color:'#22c55e'}}>
              {selected.customer.split(' ').map(w=>w[0]).join('').slice(0,2)}
            </div>
            <div>
              <p className="font-semibold text-sm">{selected.customer}</p>
              <p className="text-xs" style={{color:'#22c55e'}}>● WhatsApp Business</p>
            </div>
          </div>
          <div className="space-y-3 min-h-48">
            {CONVERSATION.map((m,i)=>(
              <div key={i} className={`flex ${m.dir==='in'?'justify-start':'justify-end'}`}>
                <div className="max-w-xs rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed"
                  style={{background:m.dir==='in'?'var(--bg-hover)':m.type==='payment'?'rgba(34,197,94,.1)':'rgba(37,99,235,.1)',
                          border:`1px solid ${m.dir==='in'?'var(--border)':m.type==='payment'?'rgba(34,197,94,.2)':'rgba(37,99,235,.2)'}`,
                          color:'var(--text-primary)',whiteSpace:'pre-line',
                          borderBottomLeftRadius:m.dir==='in'?'4px':'',
                          borderBottomRightRadius:m.dir==='out'?'4px':''}}>
                  {m.text}
                  <p className="text-right mt-1 text-xs" style={{color:'var(--text-muted)'}}>{m.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Send modal */}
      {sendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,.5)',backdropFilter:'blur(8px)'}} onClick={()=>setSendModal(false)}>
          <div className="w-full max-w-md rounded-2xl p-6 animate-[scaleIn_.2s_ease]" style={{background:'var(--bg-elevated)',border:'1px solid var(--border-strong)'}} onClick={(e: any) =>e.stopPropagation()}>
            <h2 className="font-serif text-xl mb-4">Send Invoice via WhatsApp</h2>
            <div className="space-y-3">
              <div><label className="label">Invoice</label><input className="input h-10" value={form.invoice} onChange={e=>setForm(f=>({...f,invoice:e.target.value}))}/></div>
              <div><label className="label">Customer WhatsApp Number</label><input className="input h-10" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/></div>
              <div><label className="label">Amount</label><input className="input h-10" value={form.amount} readOnly/></div>
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{background:'rgba(34,197,94,.08)',border:'1px solid rgba(34,197,94,.2)'}}>
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0"/>
                <p className="text-xs" style={{color:'#22c55e'}}>UPI payment link will be auto-generated and included in the message</p>
              </div>
              <div className="flex justify-end gap-3 pt-2" style={{borderTop:'1px solid var(--border)'}}>
                <button onClick={()=>setSendModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={()=>{toast.success('Invoice sent to +91 '+form.phone+' via WhatsApp!');setSendModal(false)}} className="btn-primary">
                  <Send className="w-4 h-4"/>Send via WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
