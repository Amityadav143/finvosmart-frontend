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

import { useEffect, useRef, useState } from 'react'

/** pdf.js's worker, served from public/ (the same version as the pdfjs-dist package). */
const WORKER = '/pdfjs/pdf.worker-3.11.174.min.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let loader: Promise<any> | null = null
function pdfjs() {
  if (!loader) {
    loader = import('pdfjs-dist/legacy/build/pdf').then(m => {
      m.GlobalWorkerOptions.workerSrc = WORKER
      return m
    })
    loader.catch(() => { loader = null })
  }
  return loader
}

/**
 * Shows a PDF on the page, every page drawn by pdf.js — the very file that is downloaded and sent, so what is seen
 * here is exactly what the customer gets, on any device (phones don't show PDFs in frames). A new file replaces
 * the pages only once it is drawn, so editing a template doesn't flicker.
 */
export function PdfViewer({ data, title, maxWidth = 900, testId = 'pdf-viewer', onPages }: {
  data: Blob | null
  title: string
  maxWidth?: number
  testId?: string
  onPages?: (pages: number) => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const holder = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'waiting' | 'drawing' | 'ready' | 'failed'>('waiting')
  const [pages, setPages] = useState(0)
  const [width, setWidth] = useState(0)
  const [fallback, setFallback] = useState<string | null>(null)
  const told = useRef(onPages)
  told.current = onPages

  useEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => {
      const w = Math.floor(el.getBoundingClientRect().width)
      setWidth(prev => (Math.abs(prev - w) > 8 ? w : prev))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!data || !width) return
    let cancelled = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let doc: any = null
    setState('drawing')
    ;(async () => {
      try {
        const lib = await pdfjs()
        const bytes = new Uint8Array(await data.arrayBuffer())
        doc = await lib.getDocument({ data: bytes, isEvalSupported: false }).promise
        const drawn: HTMLCanvasElement[] = []
        const cssWidth = Math.min(width, maxWidth)
        const ratio = Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, 2)
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i)
          if (cancelled) return
          const base = page.getViewport({ scale: 1 })
          const viewport = page.getViewport({ scale: (cssWidth / base.width) * ratio })
          const canvas = document.createElement('canvas')
          canvas.width = Math.floor(viewport.width)
          canvas.height = Math.floor(viewport.height)
          canvas.style.width = `${Math.floor(viewport.width / ratio)}px`
          canvas.style.height = `${Math.floor(viewport.height / ratio)}px`
          canvas.style.display = 'block'
          canvas.style.margin = '0 auto 12px'
          canvas.style.background = '#fff'
          canvas.style.boxShadow = '0 1px 4px rgba(15, 23, 42, 0.18)'
          canvas.dataset.page = String(i)
          canvas.setAttribute('role', 'img')
          canvas.setAttribute('aria-label', `${title} — page ${i} of ${doc.numPages}`)
          const context = canvas.getContext('2d')
          if (!context) throw new Error('no canvas')
          await page.render({ canvasContext: context, viewport }).promise
          drawn.push(canvas)
        }
        if (cancelled || !holder.current) return
        holder.current.replaceChildren(...drawn)
        setPages(doc.numPages)
        told.current?.(doc.numPages)
        setState('ready')
      } catch {
        if (!cancelled) setState('failed')
      }
    })()
    return () => {
      cancelled = true
      try { doc?.destroy?.() } catch { /* already gone */ }
    }
  }, [data, width, maxWidth, title])

  // a link to the file itself, for when it can't be drawn here
  useEffect(() => {
    if (!data || state !== 'failed') return
    const url = URL.createObjectURL(data)
    setFallback(url)
    return () => URL.revokeObjectURL(url)
  }, [data, state])

  return (
    <div ref={box} className="relative w-full" data-testid={testId} data-state={state} data-pages={pages || undefined}>
      {state === 'drawing' && pages > 0 && (
        <div className="absolute right-3 top-2 z-10 rounded-full px-3 py-1 text-xs font-medium shadow"
             style={{ background: 'var(--surface, #fff)', color: 'var(--text-muted)' }} aria-live="polite">Updating preview…</div>
      )}
      {(state === 'waiting' || (state === 'drawing' && pages === 0)) && (
        <div className="p-6 text-sm" style={{ color: 'var(--text-muted)' }} aria-live="polite">Preparing the PDF…</div>
      )}
      {state === 'failed' && (
        <div className="p-6 text-sm" role="alert" style={{ color: 'var(--text-muted)' }}>
          The PDF couldn&apos;t be shown here.{' '}
          {fallback && <a className="underline font-medium" href={fallback} target="_blank" rel="noopener noreferrer">Open the PDF</a>}
        </div>
      )}
      <div ref={holder} data-pages-holder style={{ opacity: state === 'drawing' && pages > 0 ? 0.6 : 1, transition: 'opacity 150ms' }} />
    </div>
  )
}
