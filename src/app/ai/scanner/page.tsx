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

import { useState, useRef } from 'react'
import { Upload, Camera, CheckCircle, AlertTriangle, FileText, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

const MOCK_RESULT = {
  vendor: 'Acer India Private Limited',
  gstin: '27AABCA1234B1Z5',
  invoiceNo: 'AIN-2025-3841',
  invoiceDate: '03 April 2025',
  subtotal: '₹1,05,932',
  gstAmount: '₹19,068 (18%)',
  totalAmount: '₹1,25,000',
  glAccount: '7001 — Computer Equipment',
  isDuplicate: false,
  confidence: 97.3,
  fields: [
    {name:'Vendor Name',    value:'Acer India Private Limited', conf:98.2, ok:true},
    {name:'GSTIN',         value:'27AABCA1234B1Z5',            conf:97.1, ok:true},
    {name:'Invoice No.',   value:'AIN-2025-3841',              conf:96.8, ok:true},
    {name:'Date',          value:'03-04-2025',                  conf:99.1, ok:true},
    {name:'Total Amount',  value:'₹1,25,000',                  conf:99.5, ok:true},
    {name:'GST 18%',       value:'₹19,068',                    conf:98.7, ok:true},
    {name:'HSN Code',      value:'84713010',                    conf:89.2, ok:false},
  ]
}

export default function SmartScannerPage(){
  const [stage, setStage] = useState<'idle'|'scanning'|'review'|'posted'>('idle')
  const [progress, setProgress] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const simulateScan = () => {
    setStage('scanning')
    setProgress(0)
    const id = setInterval(()=>{
      setProgress(p=>{
        if(p>=100){ clearInterval(id); setStage('review'); return 100 }
        return p + Math.random()*15
      })
    }, 180)
  }

  return(
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Camera className="w-4 h-4" style={{color:'#8b5cf6'}}/>
          <span className="text-xs font-bold uppercase tracking-widest" style={{color:'#8b5cf6',letterSpacing:'.08em'}}>AI Feature — USP 03</span>
        </div>
        <h1 className="page-title">Smart Bill Scanner</h1>
        <p className="text-sm mt-0.5" style={{color:'var(--text-muted)'}}>OCR + AI extraction from photos, PDFs and WhatsApp forwarded receipts</p>
      </div>

      {stage==='idle' && (
        <div className="card flex flex-col items-center justify-center py-16 gap-5">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{background:'rgba(139,92,246,.1)',border:'2px dashed rgba(139,92,246,.3)'}}>
            <Upload className="w-9 h-9" style={{color:'#8b5cf6'}}/>
          </div>
          <div className="text-center">
            <p className="font-serif text-xl mb-2">Upload a bill, receipt or challan</p>
            <p className="text-sm" style={{color:'var(--text-muted)'}}>JPG, PNG, PDF · Max 20MB · WhatsApp-forwarded images supported</p>
          </div>
          <div className="flex gap-3">
            <button onClick={simulateScan} className="btn-primary">
              <Camera className="w-4 h-4"/>Scan Demo Bill
            </button>
            <button onClick={()=>fileRef.current?.click()} className="btn-secondary">
              <FileText className="w-4 h-4"/>Upload File
            </button>
            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={simulateScan}/>
          </div>
        </div>
      )}

      {stage==='scanning' && (
        <div className="card flex flex-col items-center justify-center py-16 gap-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{background:'rgba(139,92,246,.1)'}}>
            <Zap className="w-8 h-8" style={{color:'#8b5cf6',animation:'pulse 1s ease infinite'}}/>
          </div>
          <div className="w-full max-w-sm">
            <div className="flex justify-between text-xs mb-2" style={{color:'var(--text-muted)'}}>
              <span>Extracting with OCR + AI...</span>
              <span className="font-mono">{Math.round(Math.min(progress,100))}%</span>
            </div>
            <div style={{height:'6px',borderRadius:'4px',background:'var(--border)',overflow:'hidden'}}>
              <div style={{height:'100%',borderRadius:'4px',background:'linear-gradient(90deg,#8b5cf6,#ec4899)',width:`${Math.min(progress,100)}%`,transition:'width .15s ease'}}/>
            </div>
          </div>
          <div className="text-center space-y-1">
            {['Detecting document type...','Extracting vendor details...','Reading GST breakdown...','Mapping to GL account...','Checking for duplicates...']
              .map((s,i)=>(
              <p key={i} className="text-xs" style={{color:progress>i*20?'var(--text-secondary)':'var(--text-muted)',opacity:progress>i*20?1:.4}}>{s}</p>
            ))}
          </div>
        </div>
      )}

      {stage==='review' && (
        <div className="space-y-4">
          {/* Confidence banner */}
          <div className="flex items-center justify-between p-4 rounded-xl"
            style={{background:'rgba(34,197,94,.08)',border:'1px solid rgba(34,197,94,.2)'}}>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400"/>
              <div>
                <p className="text-sm font-semibold" style={{color:'#22c55e'}}>Extraction successful — {MOCK_RESULT.confidence}% confidence</p>
                <p className="text-xs" style={{color:'var(--text-muted)'}}>No duplicate found · Ready to post</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>setStage('posted')} className="btn-primary">Post to Books</button>
              <button onClick={()=>setStage('idle')} className="btn-secondary">Discard</button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Summary card */}
            <div className="card">
              <h3 className="section-title mb-4">Extracted Summary</h3>
              <div className="space-y-0">
                {[
                  ['Vendor',      MOCK_RESULT.vendor],
                  ['GSTIN',       MOCK_RESULT.gstin],
                  ['Invoice No.', MOCK_RESULT.invoiceNo],
                  ['Date',        MOCK_RESULT.invoiceDate],
                  ['Subtotal',    MOCK_RESULT.subtotal],
                  ['GST',         MOCK_RESULT.gstAmount],
                  ['Total',       MOCK_RESULT.totalAmount],
                  ['GL Account',  MOCK_RESULT.glAccount],
                ].map(([k,v])=>(
                  <div key={k} className="flex items-center justify-between py-2.5" style={{borderBottom:'1px solid var(--border)'}}>
                    <span className="text-xs font-semibold" style={{color:'var(--text-muted)'}}>{k}</span>
                    <span className="text-sm font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Field confidence */}
            <div className="card">
              <h3 className="section-title mb-4">Field Confidence</h3>
              <div className="space-y-2.5">
                {MOCK_RESULT.fields.map(f=>(
                  <div key={f.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {f.ok ? <CheckCircle className="w-3.5 h-3.5 text-green-400"/> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400"/>}
                        <span className="text-xs" style={{color:'var(--text-secondary)'}}>{f.name}</span>
                      </div>
                      <span className="text-xs font-mono font-semibold" style={{color:f.ok?'#22c55e':'#f59e0b'}}>{f.conf.toFixed(1)}%</span>
                    </div>
                    <div style={{height:'4px',borderRadius:'4px',background:'var(--border)',overflow:'hidden'}}>
                      <div style={{height:'100%',borderRadius:'4px',background:f.ok?'#22c55e':'#f59e0b',width:`${f.conf}%`}}/>
                    </div>
                    <p className="text-xs mt-0.5 font-mono" style={{color:'var(--text-muted)'}}>{f.value}</p>
                  </div>
                ))}
              </div>
              {MOCK_RESULT.fields.some(f=>!f.ok) && (
                <div className="mt-3 p-3 rounded-xl" style={{background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.2)'}}>
                  <p className="text-xs" style={{color:'#f59e0b'}}>1 field below 90% confidence — please verify HSN code before posting</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {stage==='posted' && (
        <div className="card flex flex-col items-center py-16 gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{background:'rgba(34,197,94,.12)'}}>
            <CheckCircle className="w-8 h-8 text-green-400"/>
          </div>
          <div className="text-center">
            <p className="font-serif text-2xl mb-2">Posted to Books!</p>
            <p className="text-sm" style={{color:'var(--text-muted)'}}>Journal entry JE-2025-00045 created · Vendor payable updated · ITC claim recorded</p>
          </div>
          <button onClick={()=>setStage('idle')} className="btn-primary">Scan Another Bill</button>
        </div>
      )}
    </div>
  )
}
