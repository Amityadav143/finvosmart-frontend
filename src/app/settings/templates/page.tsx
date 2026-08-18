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

interface TemplateConfig {
  primaryColor: string; accentColor: string; fontFamily: string; logoPosition: string
  showHsnColumn: boolean; showFooterTerms: boolean; showBankDetails: boolean; showSignature: boolean
  footerNote: string; headerNote: string; accentStyle: string
}
interface Template {
  id: string; name: string; docType: string; baseTheme: string
  configJson: string; isDefault: boolean; isSystem: boolean
}

const DOC_TYPES = ['INVOICE','PROFORMA','QUOTATION','PURCHASE_ORDER','CREDIT_NOTE','DELIVERY_CHALLAN','RECEIPT']
const FONTS = [['serif','Serif (classic)'],['sans-serif','Sans-serif (modern)']]
const LOGO_POS = [['TOP_LEFT','Top Left'],['TOP_CENTER','Top Center'],['TOP_RIGHT','Top Right']]

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

  // Seed presets the first time the gallery is empty
  const seed = useMutation({
    mutationFn: () => api.post('/templates/seed-presets'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
    onError: () => {},
  })
  useEffect(() => {
    if (!isLoading && (templates as Template[]).length === 0) seed.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading])

  const setDefaultMut = useMutation({
    mutationFn: (id: string) => api.post(`/templates/${id}/set-default`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['templates'] }); toast.success('Default template set') },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed'),
  })
  const duplicateMut = useMutation({
    mutationFn: (id: string) => api.post(`/templates/${id}/duplicate`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['templates'] }); toast.success('Template duplicated — now customise it') },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed'),
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/templates/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['templates'] }); toast.success('Template deleted') },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Cannot delete this template'),
  })
  const saveMut = useMutation({
    mutationFn: () => api.patch(`/templates/${editing!.id}`, { name: editName, configJson: JSON.stringify(cfg) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['templates'] }); toast.success('Template saved'); setEditing(null) },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to save'),
  })
  const createMut = useMutation({
    mutationFn: () => api.post('/templates', {
      name: `Custom ${docType.replace('_',' ').toLowerCase()}`, docType, baseTheme: 'CLASSIC',
      configJson: JSON.stringify(DEFAULT_CFG),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['templates'] }); toast.success('Template created') },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed'),
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
          <p className="page-subtitle">Customise how your invoices, POs and quotations look — colours, fonts, layout & footer</p>
        </div>
        <button className="btn-primary h-9" onClick={() => createMut.mutate()}>
          <Plus size={15} /> New Template
        </button>
      </div>

      {/* Doc type tabs */}
      <div style={{ display:'flex', gap:'4px', flexWrap:'wrap', borderBottom:'1px solid var(--border)' }}>
        {DOC_TYPES.map(dt => (
          <button key={dt} onClick={() => setDocType(dt)}
            style={{
              padding:'8px 14px', fontSize:'12px', fontWeight:600, cursor:'pointer', background:'none', border:'none',
              color: docType===dt ? 'var(--gold)' : 'var(--text-muted)',
              borderBottom: docType===dt ? '2px solid var(--gold)' : '2px solid transparent',
            }}>
            {dt.replace('_',' ')}
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
              <div style={{ height:'140px', padding:'14px', background:'#fff', position:'relative', fontFamily:c.fontFamily }}>
                <div style={{ display:'flex', justifyContent: c.logoPosition==='TOP_CENTER'?'center':c.logoPosition==='TOP_RIGHT'?'flex-end':'flex-start' }}>
                  <div style={{ width:'42px', height:'14px', borderRadius:'3px', background:c.primaryColor }} />
                </div>
                <div style={{ marginTop:'8px', height:'6px', width:'55%', background:'#e5e7eb', borderRadius:'2px' }} />
                <div style={{ marginTop:'4px', height:'5px', width:'40%', background:'#eef0f3', borderRadius:'2px' }} />
                <div style={{ marginTop:'10px', height:'8px', width:'100%', background:c.accentColor, opacity:0.85, borderRadius:'2px' }} />
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
                    <p style={{ fontSize:'10px', color:'var(--text-muted)' }}>
                      {t.baseTheme}{t.isSystem ? ' · built-in' : ' · custom'}
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
            <p style={{ fontWeight:600, color:'var(--text-secondary)' }}>Setting up your templates…</p>
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Primary Colour</label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={cfg.primaryColor} onChange={e => setCfg(c => ({ ...c, primaryColor:e.target.value }))}
                        style={{ width:'36px', height:'36px', borderRadius:'8px', border:'1px solid var(--border)', cursor:'pointer' }} />
                      <input className="input h-9 flex-1" value={cfg.primaryColor} onChange={e => setCfg(c => ({ ...c, primaryColor:e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Accent Colour</label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={cfg.accentColor} onChange={e => setCfg(c => ({ ...c, accentColor:e.target.value }))}
                        style={{ width:'36px', height:'36px', borderRadius:'8px', border:'1px solid var(--border)', cursor:'pointer' }} />
                      <input className="input h-9 flex-1" value={cfg.accentColor} onChange={e => setCfg(c => ({ ...c, accentColor:e.target.value }))} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Font</label>
                    <select className="input h-10" value={cfg.fontFamily} onChange={e => setCfg(c => ({ ...c, fontFamily:e.target.value }))}>
                      {FONTS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Logo Position</label>
                    <select className="input h-10" value={cfg.logoPosition} onChange={e => setCfg(c => ({ ...c, logoPosition:e.target.value }))}>
                      {LOGO_POS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  {([['showHsnColumn','Show HSN/SAC column'],['showFooterTerms','Show terms & conditions'],
                     ['showBankDetails','Show bank details'],['showSignature','Show signature block']] as const).map(([k,label]) => (
                    <label key={k} className="flex items-center gap-2" style={{ fontSize:'13px', cursor:'pointer' }}>
                      <input type="checkbox" checked={cfg[k] as boolean}
                        onChange={e => setCfg(c => ({ ...c, [k]: e.target.checked }))} />
                      {label}
                    </label>
                  ))}
                </div>
                <div>
                  <label className="label">Header Note</label>
                  <input className="input h-10" placeholder="e.g. Original for Recipient" value={cfg.headerNote}
                    onChange={e => setCfg(c => ({ ...c, headerNote:e.target.value }))} />
                </div>
                <div>
                  <label className="label">Footer Note</label>
                  <input className="input h-10" placeholder="Thank you for your business." value={cfg.footerNote}
                    onChange={e => setCfg(c => ({ ...c, footerNote:e.target.value }))} />
                </div>
              </div>

              {/* Live preview */}
              <div>
                <label className="label flex items-center gap-1"><Eye size={13}/> Live Preview</label>
                <div style={{ background:'#fff', borderRadius:'10px', border:'1px solid var(--border)', padding:'18px', fontFamily:cfg.fontFamily, minHeight:'380px' }}>
                  <div style={{ display:'flex', justifyContent: cfg.logoPosition==='TOP_CENTER'?'center':cfg.logoPosition==='TOP_RIGHT'?'flex-end':'space-between', alignItems:'center' }}>
                    <div style={{ fontWeight:700, fontSize:'18px', color:cfg.primaryColor }}>Your Company</div>
                    {cfg.logoPosition==='TOP_LEFT' && <div style={{ fontSize:'10px', color:'#9ca3af', textAlign:'right' }}>INVOICE<br/>#INV/2026/0042</div>}
                  </div>
                  {cfg.headerNote && <p style={{ fontSize:'9px', color:'#6b7280', marginTop:'4px' }}>{cfg.headerNote}</p>}
                  <div style={{ height:'2px', background:cfg.accentColor, margin:'12px 0' }} />
                  <div style={{ fontSize:'10px', color:'#374151' }}>
                    <p style={{ fontWeight:600 }}>Bill To: Acme Industries Pvt Ltd</p>
                    <p style={{ color:'#9ca3af' }}>GSTIN: 27AAAAA0000A1Z5</p>
                  </div>
                  <table style={{ width:'100%', marginTop:'12px', fontSize:'9px', borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ background:cfg.primaryColor, color:'#fff' }}>
                        <th style={{ padding:'4px 6px', textAlign:'left' }}>Item</th>
                        {cfg.showHsnColumn && <th style={{ padding:'4px 6px' }}>HSN</th>}
                        <th style={{ padding:'4px 6px' }}>Qty</th>
                        <th style={{ padding:'4px 6px', textAlign:'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[['Consulting Services','9983','2','₹50,000'],['Software License','8523','1','₹18,000']].map((row,i) => (
                        <tr key={i} style={{ borderBottom:'1px solid #f0f0f0' }}>
                          <td style={{ padding:'4px 6px' }}>{row[0]}</td>
                          {cfg.showHsnColumn && <td style={{ padding:'4px 6px', textAlign:'center' }}>{row[1]}</td>}
                          <td style={{ padding:'4px 6px', textAlign:'center' }}>{row[2]}</td>
                          <td style={{ padding:'4px 6px', textAlign:'right' }}>{row[3]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ marginTop:'8px', textAlign:'right', fontSize:'10px' }}>
                    <span style={{ fontWeight:700, color:cfg.primaryColor }}>Total: ₹80,240</span>
                  </div>
                  {cfg.showBankDetails && (
                    <div style={{ marginTop:'10px', fontSize:'8px', color:'#6b7280' }}>
                      <p style={{ fontWeight:600 }}>Bank: HDFC Bank · A/C 50200012345678 · IFSC HDFC0001234</p>
                    </div>
                  )}
                  {cfg.showFooterTerms && cfg.footerNote && (
                    <p style={{ marginTop:'10px', fontSize:'8px', color:'#9ca3af', fontStyle:'italic' }}>{cfg.footerNote}</p>
                  )}
                  {cfg.showSignature && (
                    <div style={{ marginTop:'16px', textAlign:'right', fontSize:'9px', color:'#374151' }}>
                      <div style={{ display:'inline-block', borderTop:'1px solid #d1d5db', paddingTop:'3px' }}>Authorised Signatory</div>
                    </div>
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
