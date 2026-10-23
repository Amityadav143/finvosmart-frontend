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

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import {
  FileText, Plus, Check, Copy, Trash2, Star, Palette, Eye, Settings2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { apiError } from '@/lib/utils'

interface TemplateConfig {
  primaryColor: string; accentColor: string; fontFamily: string; logoPosition: string
  showHsnColumn: boolean; showFooterTerms: boolean; showBankDetails: boolean; showSignature: boolean
  footerNote: string; headerNote: string; accentStyle: string
}
interface Template {
  id: string; name: string; docType: string; baseTheme: string
  configJson: string; isDefault: boolean; isSystem: boolean
}

/** The documents printed from invoicing; each uses its own default template, or else the invoice one. */
const DOC_TYPES: [string, string][] = [['INVOICE', 'Tax invoices'], ['QUOTATION', 'Quotations'], ['PROFORMA', 'Proforma invoices'],
  ['CREDIT_NOTE', 'Credit notes'], ['DELIVERY_CHALLAN', 'Delivery challans']]
const DOC_LABEL = Object.fromEntries(DOC_TYPES) as Record<string, string>

const DEFAULT_CFG: TemplateConfig = {
  primaryColor:'#1A1B4B', accentColor:'#D97706', fontFamily:'serif', logoPosition:'TOP_LEFT',
  showHsnColumn:true, showFooterTerms:true, showBankDetails:true, showSignature:true,
  footerNote:'Thank you for your business.', headerNote:'', accentStyle:'solid',
}

function parseConfig(json: string): TemplateConfig {
  try { return { ...DEFAULT_CFG, ...JSON.parse(json) } } catch { return { ...DEFAULT_CFG } }
}

export default function TemplatesPage() {
  const qc = useQueryClient()
  const [docType, setDocType] = useState('INVOICE')
  const [editing, setEditing] = useState<Template | null>(null)
  const [cfg, setCfg] = useState<TemplateConfig>(DEFAULT_CFG)
  const [editName, setEditName] = useState('')

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates', docType],
    queryFn: () => api.get(`/templates?docType=${docType}`).then(r => r.data.data ?? []),
  })

  // The built-in invoice looks are added the first time the invoice gallery is opened
  const seed = useMutation({
    mutationFn: () => api.post('/templates/seed-presets'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
    onError: () => {},
  })
  useEffect(() => {
    if (!isLoading && docType === 'INVOICE' && (templates as Template[]).length === 0 && !seed.isPending && !seed.isSuccess) seed.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, docType])

  const setDefaultMut = useMutation({
    mutationFn: (id: string) => api.post(`/templates/${id}/set-default`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['templates'] }); toast.success('Default template set') },
    onError: (e: any) => toast.error(apiError(e, 'The default template could not be changed')),
  })
  const duplicateMut = useMutation({
    mutationFn: (id: string) => api.post(`/templates/${id}/duplicate`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['templates'] }); toast.success('Template duplicated — now customise it') },
    onError: (e: any) => toast.error(apiError(e, 'The template could not be copied')),
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/templates/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['templates'] }); toast.success('Template deleted') },
    onError: (e: any) => toast.error(apiError(e, 'Cannot delete this template')),
  })
  const saveMut = useMutation({
    mutationFn: () => api.patch(`/templates/${editing!.id}`, { name: editName, configJson: JSON.stringify(cfg) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['templates'] }); toast.success('Template saved'); setEditing(null) },
    onError: (e: any) => toast.error(apiError(e, 'The template could not be saved')),
  })
  const createMut = useMutation({
    mutationFn: () => api.post('/templates', {
      name: `My ${(DOC_LABEL[docType] ?? 'document').toLowerCase().replace(/s$/, '')} template`, docType, baseTheme: 'CLASSIC',
      configJson: JSON.stringify(DEFAULT_CFG),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['templates'] }); toast.success('Template created') },
    onError: (e: any) => toast.error(apiError(e, 'The template could not be created')),
  })

  const openEditor = (t: Template) => {
    if (t.isSystem) { duplicateMut.mutate(t.id); return }
    setEditing(t); setCfg(parseConfig(t.configJson)); setEditName(t.name)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Palette size={22} style={{ color: 'var(--gold)' }} /> Document Templates
          </h1>
          <p className="page-subtitle">How your invoice PDFs look: brand colour, a note under the heading, a footer note, and whether payment details and the signature print. The default template of each kind is used; anything GST requires always prints.</p>
        </div>
        <button className="btn-primary h-9" onClick={() => createMut.mutate()}>
          <Plus size={15} /> New Template
        </button>
      </div>

      {/* Doc type tabs */}
      <div style={{ display:'flex', gap:'4px', flexWrap:'wrap', borderBottom:'1px solid var(--border)' }}>
        {DOC_TYPES.map(([dt, label]) => (
          <button key={dt} onClick={() => setDocType(dt)} role="tab" aria-selected={docType===dt}
            style={{
              padding:'8px 14px', fontSize:'12.5px', fontWeight:600, cursor:'pointer', background:'none', border:'none',
              color: docType===dt ? 'var(--gold)' : 'var(--text-muted)',
              borderBottom: docType===dt ? '2px solid var(--gold)' : '2px solid transparent',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(templates as Template[]).map(t => {
          const c = parseConfig(t.configJson)
          return (
            <div key={t.id} className="card" style={{ padding:0, overflow:'hidden' }}>
              {/* Mini preview */}
              <div style={{ height:'140px', padding:'14px', background:'#fff', position:'relative' }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <div style={{ width:'60px', height:'8px', borderRadius:'2px', background:'#374151' }} />
                  <div style={{ width:'42px', height:'10px', borderRadius:'2px', background:c.primaryColor }} />
                </div>
                <div style={{ marginTop:'8px', height:'6px', width:'55%', background:'#e5e7eb', borderRadius:'2px' }} />
                <div style={{ marginTop:'4px', height:'5px', width:'40%', background:'#eef0f3', borderRadius:'2px' }} />
                <div style={{ marginTop:'10px', height:'2px', width:'100%', background:c.primaryColor }} />
                {[0,1,2].map(i => (
                  <div key={i} style={{ marginTop:'5px', display:'flex', gap:'4px' }}>
                    <div style={{ height:'4px', flex:2, background:'#eef0f3', borderRadius:'2px' }} />
                    <div style={{ height:'4px', flex:1, background:'#eef0f3', borderRadius:'2px' }} />
                    <div style={{ height:'4px', flex:1, background:'#eef0f3', borderRadius:'2px' }} />
                  </div>
                ))}
                {t.isDefault && (
                  <span style={{ position:'absolute', top:'10px', right:'10px', display:'inline-flex', alignItems:'center', gap:'3px',
                    fontSize:'9px', fontWeight:700, padding:'2px 7px', borderRadius:'20px', background:'rgba(5,150,105,0.12)', color:'#059669' }}>
                    <Check size={9} /> DEFAULT
                  </span>
                )}
              </div>
              {/* Info + actions */}
              <div style={{ padding:'12px 14px', borderTop:'1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p style={{ fontSize:'13px', fontWeight:600 }}>{t.name}</p>
                    <p style={{ fontSize:'11px', color:'var(--text-muted)' }}>
                      {t.isSystem ? 'Built in' : 'Yours'}{t.isDefault ? ' · used for new PDFs' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button className="btn-secondary h-8 text-xs flex-1" onClick={() => openEditor(t)}>
                    {t.isSystem ? <><Copy size={12}/> Customise</> : <><Settings2 size={12}/> Edit</>}
                  </button>
                  {!t.isDefault && (
                    <button className="btn-icon w-8 h-8" title="Set as default" onClick={() => setDefaultMut.mutate(t.id)}>
                      <Star size={13}/>
                    </button>
                  )}
                  {!t.isSystem && (
                    <button className="btn-icon w-8 h-8" title="Delete" style={{ color:'#ef4444' }} onClick={() => deleteMut.mutate(t.id)}>
                      <Trash2 size={13}/>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {(templates as Template[]).length === 0 && !isLoading && (
          <div className="card" style={{ gridColumn:'1/-1', textAlign:'center', padding:'40px' }}>
            <FileText size={32} style={{ color:'var(--text-muted)', margin:'0 auto 12px', display:'block' }} />
            {docType === 'INVOICE'
              ? <p style={{ fontWeight:600, color:'var(--text-secondary)' }}>Adding the built-in looks…</p>
              : <>
                  <p style={{ fontWeight:600, color:'var(--text-secondary)', margin:0 }}>{DOC_LABEL[docType]} print with your default invoice template</p>
                  <p style={{ fontSize:'13px', color:'var(--text-muted)', margin:'6px 0 14px' }}>Make one here to give them a look of their own.</p>
                  <button className="btn-primary h-9" onClick={() => createMut.mutate()}><Plus size={15} /> New template</button>
                </>}
          </div>
        )}
      </div>

      {/* Editor modal */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-content" style={{ maxWidth:'860px' }} onClick={(e: any) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings2 size={18} style={{ color:'var(--gold)' }} /> Customise Template
            </h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>
              {/* Controls */}
              <div className="space-y-3">
                <div>
                  <label className="label">Template Name</label>
                  <input className="input h-10" value={editName} onChange={e => setEditName(e.target.value)} />
                </div>
                <div>
                  <label className="label" htmlFor="tpl-colour">Brand colour (document title and lines)</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={cfg.primaryColor} onChange={e => setCfg(c => ({ ...c, primaryColor:e.target.value }))} aria-label="Pick the colour"
                      style={{ width:'36px', height:'36px', borderRadius:'8px', border:'1px solid var(--border)', cursor:'pointer' }} />
                    <input id="tpl-colour" className="input h-9 flex-1" value={cfg.primaryColor} onChange={e => setCfg(c => ({ ...c, primaryColor:e.target.value }))} />
                  </div>
                  <p className="text-xs" style={{ color:'var(--text-muted)', marginTop:'4px' }}>Very light colours aren&apos;t used — they wouldn&apos;t show on white paper.</p>
                </div>
                <div>
                  <label className="label" htmlFor="tpl-head">Note under the heading</label>
                  <input id="tpl-head" className="input h-10" maxLength={160} placeholder="e.g. Composition taxable person, not eligible to collect tax on supplies" value={cfg.headerNote}
                    onChange={e => setCfg(c => ({ ...c, headerNote:e.target.value }))} />
                </div>
                <div>
                  <label className="label" htmlFor="tpl-foot">Footer note (every page)</label>
                  <input id="tpl-foot" className="input h-10" maxLength={160} placeholder="Thank you for your business." value={cfg.footerNote}
                    onChange={e => setCfg(c => ({ ...c, footerNote:e.target.value }))} />
                </div>
                <div className="space-y-2">
                  {([['showFooterTerms','Print the footer note'],['showBankDetails','Print how to pay (UPI QR code, bank details, pay link)'],
                     ['showSignature','Print the signature block']] as const).map(([k,label]) => (
                    <label key={k} className="flex items-center gap-2" style={{ fontSize:'13px', cursor:'pointer' }}>
                      <input type="checkbox" checked={cfg[k] as boolean}
                        onChange={e => setCfg(c => ({ ...c, [k]: e.target.checked }))} />
                      {label}
                    </label>
                  ))}
                </div>
                <p className="text-xs" style={{ color:'var(--text-muted)' }}>
                  HSN/SAC codes, the CGST/SGST or IGST split, place of supply and the other details GST rule 46 requires always print.
                </p>
              </div>

              {/* Live preview */}
              <div>
                <label className="label flex items-center gap-1"><Eye size={13}/> Live Preview</label>
                <div style={{ background:'#fff', borderRadius:'10px', border:'1px solid var(--border)', padding:'18px', minHeight:'380px', fontFamily:'Helvetica, Arial, sans-serif' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div style={{ fontWeight:700, fontSize:'15px', color:'#1a1a1a' }}>Your Company<div style={{ fontSize:'8px', fontWeight:400, color:'#6b7280' }}>GSTIN: 27AAPCA1234F1ZV</div></div>
                    <div style={{ fontSize:'12px', fontWeight:700, color:cfg.primaryColor, textAlign:'right' }}>TAX INVOICE<div style={{ fontSize:'8px', fontWeight:400, color:'#9ca3af' }}>INV/26-27/000042</div></div>
                  </div>
                  <div style={{ height:'1.5px', background:cfg.primaryColor, margin:'10px 0 6px' }} />
                  {cfg.headerNote && <p style={{ fontSize:'8.5px', color:'#6b7280', margin:'0 0 8px' }}>{cfg.headerNote}</p>}
                  <div style={{ fontSize:'10px', color:'#374151' }}>
                    <p style={{ fontWeight:600 }}>Bill To: Acme Industries Pvt Ltd</p>
                    <p style={{ color:'#9ca3af' }}>GSTIN: 27AAAAA0000A1Z5</p>
                  </div>
                  <table style={{ width:'100%', marginTop:'12px', fontSize:'9px', borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ background:'#eef0f5', color:'#1a1a1a' }}>
                        <th style={{ padding:'4px 6px', textAlign:'left' }}>Item</th>
                        <th style={{ padding:'4px 6px' }}>HSN/SAC</th>
                        <th style={{ padding:'4px 6px' }}>Qty</th>
                        <th style={{ padding:'4px 6px', textAlign:'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[['Consulting Services','9983','2','₹50,000'],['Software License','8523','1','₹18,000']].map((row,i) => (
                        <tr key={i} style={{ borderBottom:'1px solid #f0f0f0' }}>
                          <td style={{ padding:'4px 6px' }}>{row[0]}</td>
                          <td style={{ padding:'4px 6px', textAlign:'center' }}>{row[1]}</td>
                          <td style={{ padding:'4px 6px', textAlign:'center' }}>{row[2]}</td>
                          <td style={{ padding:'4px 6px', textAlign:'right' }}>{row[3]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ marginTop:'8px', textAlign:'right', fontSize:'10px' }}>
                    <span style={{ fontWeight:700, color:'#1a1a1a' }}>Total: ₹80,240</span>
                  </div>
                  {cfg.showBankDetails && (
                    <div style={{ marginTop:'10px', fontSize:'8px', color:'#6b7280', display:'flex', gap:'8px', alignItems:'center' }}>
                      <div style={{ width:'26px', height:'26px', background:'repeating-linear-gradient(45deg,#111 0 2px,#fff 2px 4px)' }} aria-hidden />
                      <p style={{ fontWeight:600, margin:0 }}>Scan to pay by UPI · Bank: HDFC Bank · A/C 50200012345678 · IFSC HDFC0001234</p>
                    </div>
                  )}
                  {cfg.showSignature && (
                    <div style={{ marginTop:'16px', textAlign:'right', fontSize:'9px', color:'#374151' }}>
                      <div style={{ display:'inline-block', borderTop:'1px solid #d1d5db', paddingTop:'3px' }}>Authorised Signatory</div>
                    </div>
                  )}
                  {cfg.showFooterTerms && cfg.footerNote && (
                    <p style={{ marginTop:'14px', fontSize:'8px', color:'#6b7280' }}>{cfg.footerNote}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-5 pt-4" style={{ borderTop:'1px solid var(--border)' }}>
              <button className="btn-secondary h-10" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-primary h-10" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
                {saveMut.isPending ? 'Saving…' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
