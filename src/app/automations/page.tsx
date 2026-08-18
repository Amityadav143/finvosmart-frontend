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
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Zap, Plus, Play, Pause, CheckCircle, Activity } from 'lucide-react'
import toast from 'react-hot-toast'

const RULES = [
  {id:'r1',name:'Invoice > 15 days → WhatsApp reminder',   trigger:'Invoice Overdue (≥15 days)',    action:'Send WhatsApp',     runs:8,  active:true,  color:'#3b82f6'},
  {id:'r2',name:'Stock below reorder → Draft PO',           trigger:'Stock Below Reorder Level',     action:'Create Draft PO',   runs:3,  active:true,  color:'#16a34a'},
  {id:'r3',name:'Leave > 5 days → MD approval required',   trigger:'Leave Application Submitted',   action:'Escalate to MD',    runs:0,  active:true,  color:'#8b5cf6'},
  {id:'r4',name:'Invoice > 60 days → Credit hold',          trigger:'Invoice Overdue (≥60 days)',    action:'Credit Hold',       runs:1,  active:true,  color:'#ef4444'},
  {id:'r5',name:'PO approved → Notify supplier via email',  trigger:'PO Status = Approved',          action:'Send Email',        runs:4,  active:false, color:'#f59e0b'},
  {id:'r6',name:'Employee birthday → Send wishes',          trigger:'Employee Birthday (Today)',     action:'Send WhatsApp',     runs:2,  active:true,  color:'#ec4899'},
]

const TRIGGERS=['Invoice Overdue','Stock Below Reorder','Leave Submitted','PO Approved','Payment Received','Expense Submitted','Employee Birthday']
const ACTIONS=['Send WhatsApp','Send Email','Credit Hold','Create Task','Notify Manager','Generate Invoice','Auto-Approve']

export default function AutomationsPage(){
  const [showCreate,setShowCreate]=useState(false)
  const [rules,setRules]=useState(RULES)

  const toggle=(id:string)=>setRules(r=>r.map(rule=>rule.id===id?{...rule,active:!rule.active}:rule))
  const totalRuns=rules.reduce((s,r)=>s+r.runs,0)

  return(
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest" style={{color:'#57534e',letterSpacing:'.08em'}}>F-08 — New Feature</span>
          <h1 className="page-title">Smart Automation Rules</h1>
          <p className="text-sm mt-0.5" style={{color:'var(--text-muted)'}}>No-code if-then rules that run your business on autopilot</p>
        </div>
        <button onClick={()=>setShowCreate(true)} className="btn-primary h-9"><Plus className="w-4 h-4"/>New Rule</button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[{l:'Active Rules',v:rules.filter(r=>r.active).length,c:'#22c55e'},
          {l:'Ran Today',v:totalRuns,c:'#3b82f6'},
          {l:'Hours Saved/Month',v:'~28',c:'var(--gold)'}].map(s=>(
          <div key={s.l} className="card flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:`${s.c}15`}}>
              <Activity className="w-4 h-4" style={{color:s.c}}/>
            </div>
            <div><p className="font-serif text-2xl" style={{color:s.c}}>{s.v}</p>
              <p className="text-xs" style={{color:'var(--text-muted)'}}>{s.l}</p></div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {rules.map(rule=>(
          <div key={rule.id} className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{background:`${rule.color}12`}}>
              <Zap className="w-5 h-5" style={{color:rule.color}}/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{rule.name}</p>
              <div className="flex items-center gap-2 mt-1 text-xs flex-wrap" style={{color:'var(--text-muted)'}}>
                <span className="px-2 py-0.5 rounded-full" style={{background:'var(--bg-hover)',border:'1px solid var(--border)'}}>IF: {rule.trigger}</span>
                <span>→</span>
                <span className="px-2 py-0.5 rounded-full" style={{background:`${rule.color}10`,color:rule.color,border:`1px solid ${rule.color}20`}}>THEN: {rule.action}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right">
                <p className="text-lg font-serif" style={{color:rule.runs>0?'var(--gold)':'var(--text-muted)'}}>{rule.runs}×</p>
                <p className="text-xs" style={{color:'var(--text-muted)'}}>today</p>
              </div>
              <button onClick={()=>toggle(rule.id)}
                className="relative rounded-full cursor-pointer transition-all duration-300"
                style={{width:'44px',height:'24px',padding:'3px',
                        background:rule.active?'var(--btn-primary-bg)':'var(--border)',
                        border:`1px solid ${rule.active?'transparent':'var(--border-strong)'}`}}>
                <div className="absolute inset-y-0 rounded-full transition-all duration-300"
                  style={{width:'18px',height:'18px',top:'3px',background:'white',boxShadow:'0 1px 3px rgba(0,0,0,.2)',
                          left:rule.active?'23px':'3px'}}/>
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={showCreate} onClose={()=>setShowCreate(false)} title="Create Automation Rule" subtitle="No code needed — choose trigger and action">
        <div className="space-y-4">
          <div><label className="label">Rule Name</label><input className="input h-10" placeholder="e.g. Invoice overdue → notify manager"/></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Trigger (IF)</label>
              <select className="input h-10">{TRIGGERS.map(t=><option key={t}>{t}</option>)}</select></div>
            <div><label className="label">Then Action</label>
              <select className="input h-10">{ACTIONS.map(a=><option key={a}>{a}</option>)}</select></div>
          </div>
          <div><label className="label">Condition (optional)</label>
            <div className="flex gap-2">
              <select className="input h-10 w-36"><option>daysOverdue</option><option>amount</option><option>totalDays</option></select>
              <select className="input h-10 w-24"><option>≥</option><option>≤</option><option>=</option></select>
              <input className="input h-10 flex-1" type="number" placeholder="15"/>
            </div></div>
          <div className="flex justify-end gap-3 pt-2" style={{borderTop:'1px solid var(--border)'}}>
            <button onClick={()=>setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button onClick={()=>{toast.success('Automation rule activated');setShowCreate(false)}} className="btn-primary"><Zap className="w-4 h-4"/>Activate Rule</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
