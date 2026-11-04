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

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, Eye, Lock, Palette, Pencil, Sparkles, Star, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiError } from '@/lib/utils'
import { PdfViewer } from '@/components/pdf/PdfViewer'
import { DOC_TYPES, templatesApi, type CompanyTemplate, type TemplateConfig, type TemplateDocType, type TemplateStyle } from '@/lib/api/templates'
import { DesignSketch } from '@/components/templates/DesignSketch'

/**
 * Settings → Templates: the ten ready-made designs and the company's own templates for each kind of document.
 * Choosing a design is free on every plan; customising one opens the editor (paid plans). Every preview is the
 * real PDF, drawn by the same renderer as the invoices.
 */
export default function TemplatesPage() {
  const qc = useQueryClient()
  const router = useRouter()
  const [docType, setDocType] = useState<TemplateDocType>('INVOICE')
  const [preview, setPreview] = useState<{ title: string; config: TemplateConfig; style?: string } | null>(null)

  const library = useQuery({ queryKey: ['templates', 'library'], queryFn: templatesApi.library })
  const templates = useQuery({ queryKey: ['templates', 'list', docType], queryFn: () => templatesApi.list(docType) })
  const mine = templates.data ?? []
  const paid = library.data?.paidFeatures ?? false

  const refresh = () => qc.invalidateQueries({ queryKey: ['templates'] })
  const use = useMutation({
    mutationFn: (s: TemplateStyle) => templatesApi.create({ docType, style: s.code, name: s.name }),
    onSuccess: t => {
      refresh()
      toast.success(t.isDefault ? `${t.name} is now used for your ${label(docType).toLowerCase()}s` : `${t.name} added to your templates`)
      setPreview(null)
    },
    onError: e => toast.error(apiError(e, 'The design could not be added')),
  })
  const setDefault = useMutation({
    mutationFn: (t: CompanyTemplate) => templatesApi.setDefault(t.id),
    onSuccess: () => { refresh(); toast.success('Default template set') },
    onError: e => toast.error(apiError(e, 'The default could not be changed')),
  })
  const duplicate = useMutation({
    mutationFn: (t: CompanyTemplate) => templatesApi.duplicate(t.id),
    onSuccess: () => { refresh(); toast.success('Template copied') },
    onError: e => toast.error(apiError(e, 'The template could not be copied')),
  })
  const remove = useMutation({
    mutationFn: (t: CompanyTemplate) => templatesApi.remove(t.id),
    onSuccess: () => { refresh(); toast.success('Template deleted') },
    onError: e => toast.error(apiError(e, 'The template could not be deleted')),
  })

  const defaultTemplate = mine.find(t => t.isDefault)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2"><Palette size={22} style={{ color: 'var(--gold)' }} /> Invoice templates</h1>
          <p className="page-subtitle">
            Choose how your invoices, quotations and notes look. Every design prints all the particulars GST requires; the
            preview is the actual PDF your customer receives.
          </p>
        </div>
      </div>

      {library.data && !paid && (
        <div className="card flex flex-wrap items-center justify-between gap-3" data-testid="templates-paid-lock"
             style={{ borderColor: 'var(--gold)', background: 'rgba(201, 162, 39, 0.07)' }}>
          <div className="flex items-start gap-3">
            <Lock size={18} style={{ color: 'var(--gold)', marginTop: 2 }} />
            <div>
              <p className="font-semibold text-sm">All ten designs are free to use on your plan</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Customising them — your logo and signature, colours, fonts, page size, sections, columns and texts — is part of the paid plans.
              </p>
            </div>
          </div>
          <Link href="/settings/subscription" className="btn-primary h-9" data-testid="templates-upgrade">See plans</Link>
        </div>
      )}

      <div role="tablist" aria-label="Kind of document" className="flex flex-wrap gap-1" style={{ borderBottom: '1px solid var(--border)' }}>
        {DOC_TYPES.map(d => (
          <button key={d.value} role="tab" aria-selected={docType === d.value} data-doc-type={d.value} onClick={() => setDocType(d.value)}
            style={{
              padding: '8px 14px', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer',
              color: docType === d.value ? 'var(--gold)' : 'var(--text-muted)',
              borderBottom: docType === d.value ? '2px solid var(--gold)' : '2px solid transparent',
            }}>{d.label}</button>
        ))}
      </div>

      <section aria-labelledby="mine-heading" className="space-y-3">
        <div>
          <h2 id="mine-heading" className="text-base font-semibold">Your {label(docType).toLowerCase()} templates</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {defaultTemplate
              ? <>New and existing {label(docType).toLowerCase()} PDFs print with <strong>{defaultTemplate.name}</strong>.</>
              : docType === 'INVOICE'
                ? <>Your invoices print in the <strong>Professional GST Invoice</strong> design until you choose one below.</>
                : <>{label(docType)}s print with your default invoice template until you choose one for them.</>}
          </p>
        </div>
        {templates.isLoading ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading your templates…</p>
        ) : templates.isError ? (
          <p className="text-sm" role="alert" style={{ color: 'var(--danger, #b91c1c)' }}>{apiError(templates.error, 'Your templates could not be loaded')}</p>
        ) : mine.length === 0 ? (
          <div className="card text-sm" data-testid="templates-empty" style={{ color: 'var(--text-muted)' }}>
            No {label(docType).toLowerCase()} templates yet — pick a design from the library below.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" data-testid="my-templates">
            {mine.map(t => (
              <div key={t.id} className="card" style={{ padding: 0, overflow: 'hidden' }} data-template={t.id} data-template-name={t.name}>
                <DesignSketch config={t.config} />
                <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{t.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.styleName}{t.customised ? ' · customised' : ''}</p>
                    </div>
                    {t.isDefault && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" data-testid="template-default"
                            style={{ background: 'rgba(5,150,105,0.12)', color: '#047857' }}><Check size={10} /> DEFAULT</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <button className="btn-secondary h-8 text-xs" onClick={() => setPreview({ title: t.name, config: t.config })} data-action="preview">
                      <Eye size={13} /> Preview
                    </button>
                    <button className="btn-secondary h-8 text-xs" onClick={() => router.push(`/settings/templates/${t.id}`)} data-action="edit">
                      <Pencil size={13} /> {paid ? 'Edit' : 'Open'}
                    </button>
                    {!t.isDefault && (
                      <button className="btn-secondary h-8 text-xs" onClick={() => setDefault.mutate(t)} disabled={setDefault.isPending} data-action="default">
                        <Star size={13} /> Make default
                      </button>
                    )}
                    <button className="btn-icon w-8 h-8" title="Copy" aria-label={`Copy ${t.name}`} onClick={() => duplicate.mutate(t)}
                            disabled={duplicate.isPending} data-action="duplicate"><Copy size={13} /></button>
                    {!t.isDefault && !t.isSystem && (
                      <button className="btn-icon w-8 h-8" title="Delete" aria-label={`Delete ${t.name}`} style={{ color: '#dc2626' }}
                              onClick={() => { if (window.confirm(`Delete the template “${t.name}”?`)) remove.mutate(t) }} data-action="delete">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="library-heading" className="space-y-3">
        <div>
          <h2 id="library-heading" className="text-base font-semibold">Design library</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Ten professionally designed layouts. Use one as it is, or customise it on a paid plan.</p>
        </div>
        {library.isError && <p className="text-sm" role="alert">{apiError(library.error, 'The design library could not be loaded')}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" data-testid="template-library">
          {(library.data?.styles ?? []).map(s => (
            <div key={s.code} className="card" style={{ padding: 0, overflow: 'hidden' }} data-style={s.code}>
              <DesignSketch config={s.defaults} />
              <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm">{s.name}</p>
                  {s.recommended && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" data-testid="style-recommended"
                          style={{ background: 'rgba(201,162,39,0.15)', color: '#8a6d0b' }}><Sparkles size={10} /> SUGGESTED FOR YOU</span>
                  )}
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.description}</p>
                <div className="flex gap-1.5 mt-3">
                  <button className="btn-secondary h-8 text-xs" onClick={() => setPreview({ title: s.name, config: s.defaults, style: s.code })} data-action="preview">
                    <Eye size={13} /> Preview
                  </button>
                  <button className="btn-primary h-8 text-xs" onClick={() => use.mutate(s)} disabled={use.isPending} data-action="use">
                    Use this design
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {preview && (
        <PreviewDialog title={preview.title} config={preview.config} docType={docType} onClose={() => setPreview(null)}
          onUse={preview.style ? () => { const s = library.data?.styles.find(x => x.code === preview.style); if (s) use.mutate(s) } : undefined}
          using={use.isPending} />
      )}
    </div>
  )
}

function label(d: TemplateDocType) {
  return DOC_TYPES.find(x => x.value === d)?.label ?? 'Document'
}

/** The real PDF of a design, in a dialog. */
function PreviewDialog({ title, config, docType, onClose, onUse, using }: {
  title: string; config: TemplateConfig; docType: string; onClose: () => void; onUse?: () => void; using: boolean
}) {
  const [pdf, setPdf] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    const ctl = new AbortController()
    setPdf(null); setError(null)
    templatesApi.preview(config, docType, undefined, ctl.signal).then(setPdf)
      .catch(e => { if (!ctl.signal.aborted) setError(apiError(e, 'The preview could not be made')) })
    return () => ctl.abort()
  }, [config, docType])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3" style={{ background: 'rgba(15,23,42,0.55)' }}
         role="dialog" aria-modal="true" aria-label={`${title} preview`} data-testid="template-preview-dialog" onClick={onClose}>
      <div className="card w-full max-w-3xl flex flex-col" style={{ maxHeight: '92vh', padding: 0 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="font-semibold text-sm">{title} — preview</p>
          <div className="flex items-center gap-2">
            {onUse && <button className="btn-primary h-8 text-xs" onClick={onUse} disabled={using}>Use this design</button>}
            <button className="btn-icon w-8 h-8" onClick={onClose} aria-label="Close preview"><X size={15} /></button>
          </div>
        </div>
        <div className="overflow-auto p-3" style={{ background: 'var(--bg-subtle, #eef0f4)' }}>
          {error ? <p className="p-4 text-sm" role="alert">{error}</p> : <PdfViewer data={pdf} title={`${title} preview`} maxWidth={760} />}
        </div>
        <p className="px-4 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          Shown with your latest document of this kind, or a sample marked SAMPLE if you have none yet.
        </p>
      </div>
    </div>
  )
}
