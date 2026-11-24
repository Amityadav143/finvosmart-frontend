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

import { useRef, useState, type ReactNode } from 'react'
import { FileText, Loader2, RefreshCw, Upload, X } from 'lucide-react'
import { ACCEPT, fileProblem, readInvoiceFile, ReadProblem, type ReadResult } from '@/lib/billReader/read'

const size = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)

/**
 * "Read the invoice": a PDF or a photo of the supplier's invoice or the receipt, read in the browser (lib/billReader)
 * and handed to the form to fill in; the file itself is kept with the bill when it is saved. What was read is shown
 * by the form (summary), with what to check.
 */
export function InvoiceReader({ what, file, onFile, onRead, ourGstin, today, summary }: {
  what: string
  file: File | null
  onFile: (f: File | null) => void
  onRead: (r: ReadResult) => void | Promise<void>
  ourGstin?: string
  today: string
  summary?: ReactNode
}) {
  const input = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<'idle' | 'reading' | 'done' | 'failed'>('idle')
  const [step, setStep] = useState('')
  const [problem, setProblem] = useState('')
  const [over, setOver] = useState(false)
  const run = useRef(0)

  const choose = async (f: File | undefined | null) => {
    if (!f) return
    const n = ++run.current
    const bad = fileProblem(f)
    if (bad) { setProblem(bad); setState('failed'); onFile(null); return }
    onFile(f)
    setProblem(''); setState('reading'); setStep('Opening the file…')
    try {
      const r = await readInvoiceFile(f, { ourGstin, today, onStep: s => { if (run.current === n) setStep(s) } })
      if (run.current !== n) return
      await onRead(r)
      setState('done')
    } catch (e) {
      if (run.current !== n) return
      // not really a PDF or a picture: not kept either (the server would refuse it)
      if (e instanceof ReadProblem && e.notKept) onFile(null)
      setProblem(e instanceof ReadProblem ? e.message : 'The file couldn’t be read. Type the details below.')
      setState('failed')
    }
  }

  const pick = () => input.current?.click()
  const picker = (
    <input ref={input} type="file" hidden accept={ACCEPT} data-testid="invoice-file"
      onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; choose(f) }} />
  )

  if (!file) {
    return (
      <div className="card" data-testid="invoice-reader" data-state={state}>
        <div className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
          style={{ border: `1.5px dashed ${over ? 'var(--gold)' : 'var(--border-strong)'}`, background: over ? 'var(--bg-hover)' : 'var(--bg-surface)' }}
          onDragOver={e => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)}
          onDrop={e => { e.preventDefault(); setOver(false); choose(e.dataTransfer.files?.[0]) }}>
          <FileText className="w-8 h-8 flex-shrink-0" style={{ color: 'var(--gold)' }} aria-hidden />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Read the {what}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
              A PDF or a photo, up to 10 MB: the number, date, supplier, GST and total are filled in below for you to check, and the file is kept
              with it. It is read in your browser.
            </p>
            {problem && <p className="text-xs mt-1" style={{ color: '#b45309' }} role="alert" data-testid="invoice-problem">{problem}</p>}
          </div>
          <button type="button" className="btn-secondary h-9" onClick={pick} data-action="choose-invoice"><Upload size={14} />Choose a file</button>
          {picker}
        </div>
      </div>
    )
  }

  return (
    <div className="card space-y-3" data-testid="invoice-reader" data-state={state}>
      <div className="flex items-center gap-3 flex-wrap">
        <FileText className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--gold)' }} aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" data-testid="invoice-name">{file.name}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{size(file.size)} · kept with it when you save</p>
        </div>
        <button type="button" className="btn-ghost h-8 text-sm" onClick={pick} disabled={state === 'reading'}><RefreshCw size={13} />Another file</button>
        <button type="button" className="btn-ghost h-8 text-sm" onClick={() => { run.current++; onFile(null); setState('idle'); setProblem('') }}
          data-action="drop-invoice" aria-label="Don’t keep this file"><X size={13} />Don’t keep it</button>
        {picker}
      </div>
      {state === 'reading' && (
        <p className="text-sm flex items-center gap-2" role="status" data-testid="invoice-step" style={{ color: 'var(--text-secondary)' }}>
          <Loader2 size={14} className="animate-spin" aria-hidden />{step}
        </p>
      )}
      {state === 'failed' && (
        <p className="text-sm" role="alert" data-testid="invoice-problem" style={{ color: '#b45309' }}>{problem} The file is kept with it all the same.</p>
      )}
      {state === 'done' && summary}
    </div>
  )
}
