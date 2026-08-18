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
import { Plus, CheckCircle, Clock, Users } from 'lucide-react'
import toast from 'react-hot-toast'

const DOCS=[
  {id:'SR-001',title:'PO-2025-00118 — Acer India',type:'Purchase Order',signers:['Admin (You)'],pending:[],status:'COMPLETED',date:'09:14 AM today'},
  {id:'SR-002',title:'Offer Letter — Priya Sharma', type:'Offer Letter',  signers:['Admin (You)'],pending:['Priya Sharma'],status:'PENDING',date:'10:32 AM today'},
  {id:'SR-003',title:'Vendor NDA — Flexon Corp.',  type:'NDA',           signers:['Admin (You)'],pending:['Flexon Corp.'],status:'PENDING',date:'Yesterday'},
  {id:'SR-004',title:'IT AMC — 3 Party Contract',  type:'Contract',      signers:['Admin','Legal','Vendor'],pending:[],status:'COMPLETED',date:'6 Apr 2025'},
]

const DOCTYPE=['Purchase Order','Contract','Offer Letter','NDA','Invoice','Employment Contract']

export default function EsignPage(){
  const [showNew,setShowNew]=useState(false)
  const done=DOCS.filter(d=>d.status==='COMPLETED').length

  return(
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest" style={{color:'#c2410c',letterSpacing:'.08em'}}>F-07 — New Feature</span>
          <h1 className="page-title">Digital Signing</h1>
          <p className="text-sm mt-0.5" style={{color:'var(--text-muted)'}}>Aadhaar eSign (IT Act 2000 compliant) · DSC support · Full audit trail</p>
        </div>
        <button onClick={()=>setShowNew(true)} className="btn-primary h-9"><Plus className="w-4 h-4"/>Send for Signing</button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[{l:'Signed This Month',v:done,c:'#22c55e'},{l:'Awaiting Signature',v:DOCS.filter(d=>d.status==='PENDING').length,c:'#f59e0b'},{l:'Total Documents',v:DOCS.length,c:'#3b82f6'}].map(s=>(
          <div key={s.l} className="card">
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{color:'var(--text-muted)',fontSize:'9px'}}>{s.l}</p>
            <p className="font-serif text-2xl" style={{color:s.c}}>{s.v}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {DOCS.map((doc,i)=>(
          <div key={i} className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{background:doc.status==='COMPLETED'?'rgba(34,197,94,.1)':'rgba(245,158,11,.1)'}}>
              {doc.status==='COMPLETED'
                ?<CheckCircle className="w-5 h-5 text-green-500"/>
                :<Clock className="w-5 h-5" style={{color:'#f59e0b'}}/>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{doc.title}</p>
              <div className="flex items-center gap-3 mt-1 text-xs" style={{color:'var(--text-muted)'}}>
                <span>{doc.type}</span>
                <span>·</span>
                <span>{doc.date}</span>
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="flex items-center gap-1.5 justify-end mb-1">
                <Users className="w-3.5 h-3.5" style={{color:'var(--text-muted)'}}/>
                <span className="text-xs" style={{color:'var(--text-muted)'}}>{doc.signers.length+doc.pending.length} signers</span>
              </div>
              {doc.pending.length>0&&<p className="text-xs" style={{color:'#f59e0b'}}>Waiting: {doc.pending.join(', ')}</p>}
              <Badge variant={doc.status==='COMPLETED'?'success':'warning'} className="mt-1">{doc.status}</Badge>
            </div>
          </div>
        ))}
      </div>

      <Modal open={showNew} onClose={()=>setShowNew(false)} title="Send Document for Signing" subtitle="Aadhaar OTP-based eSign (IT Act 2000 compliant)">
        <div className="space-y-4">
          <div><label className="label">Document Type</label>
            <select className="input h-10">{DOCTYPE.map(t=><option key={t}>{t}</option>)}</select></div>
          <div><label className="label">Upload Document (PDF)</label>
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{background:'var(--bg-hover)',border:'2px dashed var(--border)'}}>
              <span className="text-xs" style={{color:'var(--text-muted)'}}>Choose PDF file…</span>
            </div></div>
          <div><label className="label">Signer 1 (You)</label>
            <div className="flex gap-2"><input className="input h-10 flex-1" placeholder="Name" defaultValue="Admin"/><input className="input h-10 w-40" placeholder="Phone" defaultValue="9876543210"/></div></div>
          <div><label className="label">Signer 2 (External)</label>
            <div className="flex gap-2"><input className="input h-10 flex-1" placeholder="Name"/><input className="input h-10 w-40" placeholder="Phone"/></div></div>
          <div className="p-3 rounded-xl" style={{background:'rgba(34,197,94,.05)',border:'1px solid rgba(34,197,94,.15)'}}>
            <p className="text-xs" style={{color:'#22c55e'}}>✓ Aadhaar OTP-based eSign · Legally valid under IT Act 2000 & eSign Act 2015 · Timestamp + IP audit trail</p>
          </div>
          <div className="flex justify-end gap-3 pt-2" style={{borderTop:'1px solid var(--border)'}}>
            <button onClick={()=>setShowNew(false)} className="btn-secondary">Cancel</button>
            <button onClick={()=>{toast.success('OTP signing invitation sent to all parties');setShowNew(false)}} className="btn-primary">Send Signing Request</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
