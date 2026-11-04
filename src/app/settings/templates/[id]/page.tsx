'use client'
/*
 * FINVOSMART — Finvosmart by Navgrow
 *
 * Copyright (c) 2025-2026 Navgrow Engineering Service Pvt. Ltd.
 * CIN: U29302WB2025PTC281015
 *
 * All rights reserved. This source code is proprietary and confidential.
 * Unauthorized copying, distribution, modification, or use of this file,
 * via any medium, is strictly prohibited without prior written permission.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowLeft, ArrowUp, Copy, GripVertical, ImagePlus, Lock, Plus, RotateCcw, Save, Star, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiError } from '@/lib/utils'
import { PdfViewer } from '@/components/pdf/PdfViewer'
import {
  COLUMN_LABELS, DOC_TYPES, FONT_LABELS, LAYOUT_LABELS, SECTION_LABELS, TABLE_LABELS, templatesApi,
  type TemplateAsset, type TemplateConfig, type TemplateLibrary,
} from '@/lib/api/templates'

const RETITLE_LABELS: Record<string, string> = { QUOTATION: 'Quotation title', PROFORMA: 'Proforma title', DELIVERY_CHALLAN: 'Delivery challan title' }

/**
 * The template editor: every setting of a design on the left, the live PDF on the right — redrawn by the server's
 * own renderer a moment after each change, so what is approved here is exactly what customers receive. Changing a
 * design is a paid-plan feature (the server refuses it otherwise); choosing another library design is free.
 */
export default function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const template = useQuery({ queryKey: ['templates', 'one', id], queryFn: () => templatesApi.get(id) })
  const library = useQuery({ queryKey: ['templates', 'library'], queryFn: templatesApi.library })
  const paid = library.data?.paidFeatures ?? false
  const assets = useQuery({ queryKey: ['templates', 'assets'], queryFn: templatesApi.assets, enabled: paid })

  const [cfg, setCfg] = useState<TemplateConfig | null>(null)
  const [name, setName] = useState('')
  const [saved, setSaved] = useState<string>('')
  useEffect(() => {
    if (template.data && cfg === null) {
      setCfg(template.data.config)
      setName(template.data.name)
      setSaved(JSON.stringify(template.data.config) + template.data.name)
    }
  }, [template.data, cfg])

  const dirty = cfg !== null && JSON.stringify(cfg) + name !== saved
  const styleDefaults = useMemo(() => library.data?.styles.find(s => s.code === cfg?.style)?.defaults, [library.data, cfg?.style])
  const customised = !!cfg && !!styleDefaults && !sameDesign(cfg, styleDefaults)
  const locked = !paid

  // ── the live preview ───────────────────────────────────────────────────────
  const [pdf, setPdf] = useState<Blob | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const docType = template.data?.docType ?? 'INVOICE'
  useEffect(() => {
    if (!cfg) return
    const ctl = new AbortController()
    const t = window.setTimeout(() => {
      templatesApi.preview(cfg, docType, undefined, ctl.signal)
        .then(b => { setPdf(b); setPreviewError(null) })
        .catch(e => { if (!ctl.signal.aborted) setPreviewError(apiError(e, 'The preview could not be made')) })
    }, 450)
    return () => { window.clearTimeout(t); ctl.abort() }
  }, [cfg, docType])

  const set = useCallback(<K extends keyof TemplateConfig>(key: K, value: TemplateConfig[K]) => {
    setCfg(c => (c ? { ...c, [key]: value } : c))
  }, [])

  const refresh = () => qc.invalidateQueries({ queryKey: ['templates'] })
  const save = useMutation({
    mutationFn: () => templatesApi.update(id, { name, config: cfg! }),
    onSuccess: t => {
      setCfg(t.config); setName(t.name); setSaved(JSON.stringify(t.config) + t.name)
      refresh(); toast.success('Template saved')
    },
    onError: e => toast.error(apiError(e, 'The template could not be saved')),
  })
  const reset = useMutation({
    mutationFn: () => templatesApi.reset(id),
    onSuccess: t => { setCfg(t.config); setSaved(JSON.stringify(t.config) + name); refresh(); toast.success('Back to the original design') },
    onError: e => toast.error(apiError(e, 'The template could not be reset')),
  })
  const duplicate = useMutation({
    mutationFn: () => templatesApi.duplicate(id),
    onSuccess: t => { refresh(); toast.success('Template copied'); router.push(`/settings/templates/${t.id}`) },
    onError: e => toast.error(apiError(e, 'The template could not be copied')),
  })
  const makeDefault = useMutation({
    mutationFn: () => templatesApi.setDefault(id),
    onSuccess: () => { refresh(); toast.success('This template is now the default') },
    onError: e => toast.error(apiError(e, 'The default could not be changed')),
  })

  if (template.isError) {
    return (
      <div className="space-y-3">
        <Link href="/settings/templates" className="btn-secondary h-9 w-fit"><ArrowLeft size={15} /> Templates</Link>
        <p className="card text-sm" role="alert">{apiError(template.error, 'This template could not be opened')}</p>
      </div>
    )
  }
  if (!cfg || !library.data || !template.data) return <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Opening the template…</p>

  const lib = library.data
  const kind = DOC_TYPES.find(d => d.value === template.data!.docType)?.label ?? 'Document'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/settings/templates" className="btn-icon w-9 h-9" aria-label="Back to templates"><ArrowLeft size={16} /></Link>
          <div className="min-w-0">
            <h1 className="page-title truncate">{name || template.data.name}</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {kind} template · {lib.styles.find(s => s.code === cfg.style)?.name}{customised ? ' · customised' : ''}
              {template.data.isDefault ? ' · default' : ''}{dirty ? ' · unsaved changes' : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!template.data.isDefault && (
            <button className="btn-secondary h-9" onClick={() => makeDefault.mutate()} disabled={makeDefault.isPending || dirty}
                    title={dirty ? 'Save first' : undefined} id="tpl-make-default"><Star size={15} /> Make default</button>
          )}
          <button className="btn-secondary h-9" onClick={() => duplicate.mutate()} disabled={duplicate.isPending || dirty} id="tpl-duplicate">
            <Copy size={15} /> Copy</button>
          <button className="btn-secondary h-9" onClick={() => { if (window.confirm('Put this template back to its original design?')) reset.mutate() }}
                  disabled={reset.isPending || !customised} id="tpl-reset"><RotateCcw size={15} /> Reset design</button>
          <button className="btn-primary h-9" onClick={() => save.mutate()} disabled={save.isPending || !dirty || (locked && customised)} id="tpl-save">
            <Save size={15} /> {save.isPending ? 'Saving…' : 'Save'}</button>
        </div>
      </div>

      {locked && (
        <div className="card flex flex-wrap items-center justify-between gap-3" data-testid="tpl-locked" style={{ borderColor: 'var(--gold)', background: 'rgba(201,162,39,0.07)' }}>
          <div className="flex items-start gap-3">
            <Lock size={18} style={{ color: 'var(--gold)', marginTop: 2 }} />
            <p className="text-sm">
              You can switch this template to any of the ten designs. <strong>Customising a design</strong> — logo, signature, colours, fonts,
              page size, sections, columns and texts — is part of the paid plans.
            </p>
          </div>
          <Link href="/settings/subscription" className="btn-primary h-9">Upgrade</Link>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <div className="space-y-4" data-testid="tpl-controls">
          <Panel title="Design">
            <Field label="Template name" htmlFor="tpl-name">
              <input id="tpl-name" className="input" value={name} maxLength={120} onChange={e => setName(e.target.value)} />
            </Field>
            <Field label="Design" htmlFor="tpl-style" hint="Choosing another design starts from that design as it comes.">
              <select id="tpl-style" className="input" value={cfg.style}
                onChange={e => {
                  const next = lib.styles.find(s => s.code === e.target.value)
                  if (!next) return
                  if (customised && !window.confirm('Switch design? Your changes to this one will be replaced.')) return
                  setCfg({ ...next.defaults })
                }}>
                {lib.styles.map(s => <option key={s.code} value={s.code}>{s.name}{s.recommended ? ' (suggested)' : ''}</option>)}
              </select>
            </Field>
          </Panel>

          <fieldset disabled={locked} className="space-y-4" style={{ border: 0, padding: 0, margin: 0, minWidth: 0, opacity: locked ? 0.6 : 1 }}>
            <Panel title="Page and type">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Page size" htmlFor="tpl-page-size">
                  <select id="tpl-page-size" className="input" value={cfg.pageSize} onChange={e => set('pageSize', e.target.value as TemplateConfig['pageSize'])}>
                    {lib.pageSizes.map(p => <option key={p} value={p}>{p === 'LETTER' ? 'US Letter' : p}</option>)}
                  </select>
                </Field>
                <Field label="Text size" htmlFor="tpl-font-scale">
                  <select id="tpl-font-scale" className="input" value={String(cfg.fontScale)} onChange={e => set('fontScale', Number(e.target.value))}>
                    {[0.85, 0.9, 0.92, 0.95, 1, 1.05, 1.1, 1.15, 1.2].map(v => <option key={v} value={String(v)}>{Math.round(v * 100)}%</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Typeface" htmlFor="tpl-font">
                <select id="tpl-font" className="input" value={cfg.font} onChange={e => set('font', e.target.value as TemplateConfig['font'])}>
                  {lib.fonts.map(f => <option key={f} value={f}>{FONT_LABELS[f] ?? f}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-4 gap-2">
                {(['marginTop', 'marginRight', 'marginBottom', 'marginLeft'] as const).map(k => (
                  <Field key={k} label={k.replace('margin', '')} htmlFor={`tpl-${k}`} small>
                    <input id={`tpl-${k}`} className="input" type="number" min={k === 'marginBottom' ? 10 : 6} max={30} step={1} value={cfg[k]}
                      onChange={e => set(k, clamp(Number(e.target.value), k === 'marginBottom' ? 10 : 6, 30))} aria-label={`${k.replace('margin', '')} margin in millimetres`} />
                  </Field>
                ))}
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Margins in millimetres.</p>
            </Panel>

            <Panel title="Colours">
              <div className="grid grid-cols-3 gap-3">
                <ColourField id="tpl-primary" label="Brand" value={cfg.primaryColor} onChange={v => set('primaryColor', v)} />
                <ColourField id="tpl-accent" label="Accent" value={cfg.accentColor} onChange={v => set('accentColor', v)} />
                <ColourField id="tpl-text" label="Text" value={cfg.textColor} onChange={v => set('textColor', v)} />
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Colours too light to read on white paper are not used.</p>
            </Panel>

            <Panel title="Header and logo">
              <Field label="Header layout" htmlFor="tpl-header-layout">
                <select id="tpl-header-layout" className="input" value={cfg.headerLayout} onChange={e => set('headerLayout', e.target.value as TemplateConfig['headerLayout'])}>
                  {lib.headerLayouts.map(h => <option key={h} value={h}>{LAYOUT_LABELS[h] ?? h}</option>)}
                </select>
              </Field>
              <PictureField kind="LOGO" label="Logo" value={cfg.logoAssetId} onChange={v => set('logoAssetId', v)} assets={assets.data ?? []} disabled={locked}
                onUploaded={() => qc.invalidateQueries({ queryKey: ['templates', 'assets'] })} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Logo height (mm)" htmlFor="tpl-logo-height">
                  <input id="tpl-logo-height" className="input" type="number" min={8} max={32} value={cfg.logoHeightMm} onChange={e => set('logoHeightMm', clamp(Number(e.target.value), 8, 32))} />
                </Field>
                <div className="space-y-1 pt-5">
                  <Check id="tpl-show-logo" label="Print the logo" checked={cfg.showLogo} onChange={v => set('showLogo', v)} />
                  <Check id="tpl-footer-logo" label="Small logo in the footer" checked={cfg.footerLogo} onChange={v => set('footerLogo', v)} />
                </div>
              </div>
              <Check id="tpl-show-contact" label="Print your phone and email" checked={cfg.showCompanyContact} onChange={v => set('showCompanyContact', v)} />
              <Field label="Header text (under your details)" htmlFor="tpl-header-text">
                <input id="tpl-header-text" className="input" maxLength={300} value={cfg.headerText ?? ''} onChange={e => set('headerText', e.target.value || null)}
                  placeholder="e.g. An ISO 9001:2015 certified company" />
              </Field>
            </Panel>

            <Panel title="Sections" hint="Drag, or use the arrows, to change the order. Sections GST requires can't be hidden.">
              <SectionList cfg={cfg} lib={lib} onChange={(order, hidden) => setCfg(c => (c ? { ...c, sectionOrder: order, hiddenSections: hidden } : c))} />
            </Panel>

            <Panel title="Item table">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Table style" htmlFor="tpl-table-style">
                  <select id="tpl-table-style" className="input" value={cfg.tableStyle} onChange={e => set('tableStyle', e.target.value as TemplateConfig['tableStyle'])}>
                    {lib.tableStyles.map(t => <option key={t} value={t}>{TABLE_LABELS[t] ?? t}</option>)}
                  </select>
                </Field>
                <Field label="Tax columns" htmlFor="tpl-tax-columns">
                  <select id="tpl-tax-columns" className="input" value={cfg.taxColumns} onChange={e => set('taxColumns', e.target.value as TemplateConfig['taxColumns'])}>
                    <option value="SPLIT">CGST + SGST, or IGST</option>
                    <option value="COMBINED">One GST column (+ HSN summary)</option>
                  </select>
                </Field>
              </div>
              <p className="text-xs font-medium mt-1">Columns to show</p>
              <div className="grid grid-cols-2 gap-1">
                {lib.optionalColumns.map(col => (
                  <Check key={col} id={`tpl-col-${col}`} label={COLUMN_LABELS[col] ?? col} checked={!cfg.hiddenColumns.includes(col)} data-column={col}
                    onChange={v => set('hiddenColumns', v ? cfg.hiddenColumns.filter(x => x !== col) : [...cfg.hiddenColumns, col])} />
                ))}
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Description, quantity, taxable value, tax and amount always print. HSN/SAC leaves the table only when the HSN summary prints it.
              </p>
              <p className="text-xs font-medium mt-2">Minimum column widths (mm, 0 = as wide as needed)</p>
              <div className="grid grid-cols-4 gap-2">
                {(['HSN', 'QTY', 'RATE', 'AMOUNT'] as const).map(k => (
                  <Field key={k} label={k === 'QTY' ? 'Qty' : k === 'HSN' ? 'HSN' : k.charAt(0) + k.slice(1).toLowerCase()} htmlFor={`tpl-width-${k}`} small>
                    <input id={`tpl-width-${k}`} className="input" type="number" min={0} max={60} value={cfg.columnWidthsMm[k] ?? 0}
                      onChange={e => {
                        const v = clamp(Number(e.target.value), 0, 60)
                        const next = { ...cfg.columnWidthsMm }
                        if (v > 0) next[k] = v; else delete next[k]
                        set('columnWidthsMm', next)
                      }} />
                  </Field>
                ))}
              </div>
            </Panel>

            <Panel title="Titles and texts">
              {lib.retitlable.map(k => (
                <Field key={k} label={RETITLE_LABELS[k] ?? k} htmlFor={`tpl-title-${k}`} hint={k === 'QUOTATION' ? 'e.g. ESTIMATE. A tax invoice, credit and debit note keep their legal titles.' : undefined}>
                  <input id={`tpl-title-${k}`} className="input" maxLength={40} value={cfg.titles[k] ?? ''} placeholder={k.replace('_', ' ')}
                    onChange={e => {
                      const next = { ...cfg.titles }
                      if (e.target.value.trim()) next[k] = e.target.value.toUpperCase(); else delete next[k]
                      set('titles', next)
                    }} />
                </Field>
              ))}
              <Field label="Footer text (every page)" htmlFor="tpl-footer-text">
                <input id="tpl-footer-text" className="input" maxLength={300} value={cfg.footerText ?? ''} onChange={e => set('footerText', e.target.value || null)}
                  placeholder="e.g. Registered office address, CIN" />
              </Field>
              <Field label="Disclaimer (end of the document)" htmlFor="tpl-disclaimer">
                <textarea id="tpl-disclaimer" className="input" rows={2} maxLength={500} value={cfg.disclaimer ?? ''} onChange={e => set('disclaimer', e.target.value || null)} />
              </Field>
              <div className="grid grid-cols-1 gap-1">
                <Check id="tpl-show-words" label="Amount in words" checked={cfg.showAmountInWords} onChange={v => set('showAmountInWords', v)} />
                <Check id="tpl-show-notes" label="The document's notes" checked={cfg.showNotes} onChange={v => set('showNotes', v)} />
                <Check id="tpl-show-terms" label="The document's terms" checked={cfg.showTerms} onChange={v => set('showTerms', v)} />
                <Check id="tpl-page-numbers" label="Page numbers" checked={cfg.showPageNumbers} onChange={v => set('showPageNumbers', v)} />
              </div>
            </Panel>

            <Panel title="Payment">
              <Check id="tpl-show-upi" label="UPI QR code and pay-online link" checked={cfg.showUpiQr} onChange={v => set('showUpiQr', v)} />
              <Check id="tpl-show-bank" label="Bank details (NEFT / RTGS / IMPS)" checked={cfg.showBankDetails} onChange={v => set('showBankDetails', v)} />
              <Field label="Payment instructions" htmlFor="tpl-pay-instructions">
                <textarea id="tpl-pay-instructions" className="input" rows={2} maxLength={500} value={cfg.paymentInstructions ?? ''}
                  onChange={e => set('paymentInstructions', e.target.value || null)} placeholder="e.g. Please quote the invoice number with your payment." />
              </Field>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Your UPI ID and bank account come from Settings → Company.</p>
            </Panel>

            <Panel title="Signature">
              <Check id="tpl-show-signature" label="Print the signature block" checked={cfg.showSignature} onChange={v => set('showSignature', v)} />
              <PictureField kind="SIGNATURE" label="Signature image" value={cfg.signatureAssetId} onChange={v => set('signatureAssetId', v)} assets={assets.data ?? []}
                disabled={locked} onUploaded={() => qc.invalidateQueries({ queryKey: ['templates', 'assets'] })} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Signatory name" htmlFor="tpl-signatory">
                  <input id="tpl-signatory" className="input" maxLength={80} value={cfg.signatoryName ?? ''} onChange={e => set('signatoryName', e.target.value || null)} />
                </Field>
                <Field label="Designation" htmlFor="tpl-designation">
                  <input id="tpl-designation" className="input" maxLength={80} value={cfg.signatoryDesignation ?? ''} onChange={e => set('signatoryDesignation', e.target.value || null)} />
                </Field>
              </div>
              <Field label="Label under the signature" htmlFor="tpl-signature-label">
                <input id="tpl-signature-label" className="input" maxLength={40} value={cfg.signatureLabel} onChange={e => set('signatureLabel', e.target.value || 'Authorised Signatory')} />
              </Field>
            </Panel>

            <Panel title="Watermark and extra fields">
              <div className="grid grid-cols-[1fr_110px] gap-3">
                <Field label="Watermark text" htmlFor="tpl-watermark" hint="Drafts and cancelled documents are always marked as such.">
                  <input id="tpl-watermark" className="input" maxLength={30} value={cfg.watermarkText ?? ''} onChange={e => set('watermarkText', e.target.value || null)} placeholder="e.g. ORIGINAL" />
                </Field>
                <Field label="Strength" htmlFor="tpl-watermark-opacity">
                  <select id="tpl-watermark-opacity" className="input" value={String(cfg.watermarkOpacity)} onChange={e => set('watermarkOpacity', Number(e.target.value))}>
                    {[0.04, 0.06, 0.08, 0.12, 0.16, 0.22, 0.3].map(v => <option key={v} value={String(v)}>{Math.round(v * 100)}%</option>)}
                  </select>
                </Field>
              </div>
              <p className="text-xs font-medium">Extra fields in the document details (up to 6)</p>
              <div className="space-y-2" data-testid="tpl-custom-fields">
                {cfg.customFields.map((f, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <input className="input" aria-label={`Extra field ${i + 1} label`} maxLength={30} placeholder="Label, e.g. Vendor code" value={f.label}
                      onChange={e => set('customFields', cfg.customFields.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                    <input className="input" aria-label={`Extra field ${i + 1} value`} maxLength={80} placeholder="Value" value={f.value}
                      onChange={e => set('customFields', cfg.customFields.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                    <button type="button" className="btn-icon w-9 h-9" aria-label={`Remove extra field ${i + 1}`}
                      onClick={() => set('customFields', cfg.customFields.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
                  </div>
                ))}
                {cfg.customFields.length < 6 && (
                  <button type="button" className="btn-secondary h-8 text-xs" id="tpl-add-field"
                    onClick={() => set('customFields', [...cfg.customFields, { label: '', value: '' }])}><Plus size={13} /> Add a field</button>
                )}
              </div>
            </Panel>
          </fieldset>
        </div>

        <div className="lg:sticky lg:top-4 self-start space-y-2" data-testid="tpl-preview">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Preview — the PDF exactly as it prints</p>
            {dirty && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Not saved yet</span>}
          </div>
          <div className="rounded-lg p-3 overflow-auto" style={{ background: 'var(--bg-subtle, #eef0f4)', maxHeight: '85vh' }}>
            {previewError ? <p className="p-4 text-sm" role="alert">{previewError}</p> : <PdfViewer data={pdf} title={`${name} preview`} maxWidth={820} />}
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Shown with your latest {kind.toLowerCase()}, or a sample marked SAMPLE{locked && customised ? ' (customised designs preview on a sample until you upgrade)' : ' if you have none yet'}.
          </p>
        </div>
      </div>
    </div>
  )
}

/** Whether two settings are the same design (the server decides what is a customisation; this mirrors it for the buttons). */
function sameDesign(a: TemplateConfig, b: TemplateConfig) {
  const norm = (c: TemplateConfig) => JSON.stringify({ ...c, version: undefined })
  return norm(a) === norm(b)
}

function clamp(v: number, lo: number, hi: number) {
  return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo
}

function Panel({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-3" aria-label={title}>
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {hint && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
      </div>
      {children}
    </section>
  )
}

function Field({ label, htmlFor, hint, small, children }: { label: string; htmlFor: string; hint?: string; small?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className={small ? 'text-[11px] font-medium' : 'text-xs font-medium'}>{label}</label>
      {children}
      {hint && <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  )
}

function Check({ id, label, checked, onChange, ...rest }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void; [k: `data-${string}`]: string }) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm">
      <input id={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} {...rest} />
      {label}
    </label>
  )
}

function ColourField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium">{label}</label>
      <div className="flex items-center gap-1.5">
        <input id={id} type="color" value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#1a1b4b'} onChange={e => onChange(e.target.value.toUpperCase())}
          style={{ width: 34, height: 34, padding: 0, border: '1px solid var(--border)', borderRadius: 6, background: 'none' }} />
        <input className="input" aria-label={`${label} colour code`} value={text} maxLength={7}
          onChange={e => { setText(e.target.value); if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onChange(e.target.value.toUpperCase()) }} />
      </div>
    </div>
  )
}

/** Choose, upload or remove a template picture; the server keeps a cleaned PNG of it. */
function PictureField({ kind, label, value, onChange, assets, disabled, onUploaded }: {
  kind: 'LOGO' | 'SIGNATURE'; label: string; value: string | null; onChange: (id: string | null) => void
  assets: TemplateAsset[]; disabled: boolean; onUploaded: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [thumb, setThumb] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!value) { setThumb(null); return }
    let url: string | null = null
    let gone = false
    templatesApi.asset(value).then(b => { if (!gone) { url = URL.createObjectURL(b); setThumb(url) } }).catch(() => setThumb(null))
    return () => { gone = true; if (url) URL.revokeObjectURL(url) }
  }, [value])
  const mine = assets.filter(a => a.kind === kind)
  const upload = async (file: File) => {
    setBusy(true)
    try {
      const a = await templatesApi.upload(file, kind)
      onUploaded()
      onChange(a.id)
      toast.success(`${label} added`)
    } catch (e) {
      toast.error(apiError(e, `The ${label.toLowerCase()} could not be added`))
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }
  const idBase = kind === 'LOGO' ? 'tpl-logo' : 'tpl-signature-image'
  return (
    <div className="space-y-2" data-picture={kind}>
      <p className="text-xs font-medium">{label}</p>
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center rounded" style={{ width: 120, height: 48, border: '1px dashed var(--border)', background: '#fff' }}>
          {thumb ? <img src={thumb} alt={`${label} chosen`} style={{ maxWidth: 112, maxHeight: 42, objectFit: 'contain' }} />
            : <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>None</span>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <input ref={input} id={`${idBase}-file`} type="file" accept="image/png,image/jpeg,image/gif,image/bmp" className="sr-only" disabled={disabled || busy}
            onChange={e => { const f = e.target.files?.[0]; if (f) upload(f) }} />
          <label htmlFor={`${idBase}-file`} className="btn-secondary h-8 text-xs" aria-disabled={disabled || busy}
            style={{ cursor: disabled || busy ? 'not-allowed' : 'pointer' }}><ImagePlus size={13} /> {busy ? 'Uploading…' : 'Upload'}</label>
          {value && <button type="button" className="btn-secondary h-8 text-xs" onClick={() => onChange(null)} id={`${idBase}-remove`}>Remove</button>}
        </div>
      </div>
      {mine.length > 1 && (
        <select className="input" aria-label={`Choose an uploaded ${label.toLowerCase()}`} value={value ?? ''} onChange={e => onChange(e.target.value || null)}>
          <option value="">None</option>
          {mine.map(a => <option key={a.id} value={a.id}>{`${label} ${a.width}×${a.height}, added ${new Date(a.createdAt).toLocaleDateString('en-IN')}`}</option>)}
        </select>
      )}
      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>PNG or JPEG up to 5 MB; a transparent PNG looks best.</p>
    </div>
  )
}

/** The sections in print order: shown or hidden, moved with drag-and-drop or the arrow buttons. */
function SectionList({ cfg, lib, onChange }: { cfg: TemplateConfig; lib: TemplateLibrary; onChange: (order: string[], hidden: string[]) => void }) {
  const [dragging, setDragging] = useState<string | null>(null)
  const order = cfg.sectionOrder
  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length || from === to) return
    const next = [...order]
    const [x] = next.splice(from, 1)
    next.splice(to, 0, x)
    // the totals sum up the items: never above them (the server keeps it so too)
    const items = next.indexOf('ITEMS'), totals = next.indexOf('TOTALS')
    if (totals < items) { next.splice(totals, 1); next.splice(next.indexOf('ITEMS') + 1, 0, 'TOTALS') }
    onChange(next, cfg.hiddenSections)
  }
  return (
    <ol className="space-y-1.5" data-testid="tpl-sections">
      {order.map((s, i) => {
        const required = lib.requiredSections.includes(s)
        const shown = required || !cfg.hiddenSections.includes(s)
        return (
          <li key={s} data-section={s} draggable onDragStart={() => setDragging(s)} onDragEnd={() => setDragging(null)}
            onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (dragging) move(order.indexOf(dragging), i); setDragging(null) }}
            className="flex items-center gap-2 rounded-md px-2 py-1.5"
            style={{ border: '1px solid var(--border)', background: dragging === s ? 'var(--bg-subtle, #eef0f4)' : 'var(--surface, #fff)' }}>
            <GripVertical size={14} style={{ color: 'var(--text-muted)', cursor: 'grab' }} aria-hidden="true" />
            <label className="flex items-center gap-2 text-sm flex-1 min-w-0">
              <input type="checkbox" checked={shown} disabled={required} aria-label={`Show ${SECTION_LABELS[s] ?? s}`}
                onChange={e => onChange(order, e.target.checked ? cfg.hiddenSections.filter(x => x !== s) : [...cfg.hiddenSections, s])} />
              <span className="truncate">{SECTION_LABELS[s] ?? s}</span>
              {required && <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>REQUIRED</span>}
            </label>
            <button type="button" className="btn-icon w-7 h-7" aria-label={`Move ${SECTION_LABELS[s] ?? s} up`} disabled={i === 0} onClick={() => move(i, i - 1)} data-move="up">
              <ArrowUp size={13} /></button>
            <button type="button" className="btn-icon w-7 h-7" aria-label={`Move ${SECTION_LABELS[s] ?? s} down`} disabled={i === order.length - 1}
              onClick={() => move(i, i + 1)} data-move="down"><ArrowDown size={13} /></button>
          </li>
        )
      })}
    </ol>
  )
}
