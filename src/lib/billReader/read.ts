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

import { pdfjs } from '../pdfjs'
import { parseInvoiceText, readQr, type InvoiceRead, type QrRead } from './parse'

/**
 * Reads a supplier's invoice or a receipt in the browser — nothing is sent anywhere to be read:
 *  - a PDF with text: its own text, with pdf.js (exact);
 *  - its QR codes: the signed QR of a GST e-invoice (exact GSTINs, number, date, value), or a UPI QR;
 *  - a photo, or a scanned PDF: OCR with Tesseract (served from /ocr, run in a worker), which can misread — the form
 *    shows what was read for checking.
 * Then parseInvoiceText makes the fields of it.
 */
export type ReadKind = 'pdf' | 'scan' | 'photo'
export interface ReadResult { read: InvoiceRead; kind: ReadKind; text: string }

/**
 * Why a file couldn't be read, in words for the person. notKept: the file isn't really a PDF or a picture (renamed,
 * damaged) — the server would refuse to keep it too, so it isn't kept with the bill.
 */
export class ReadProblem extends Error {
  constructor(message: string, readonly notKept = false) { super(message) }
}

export const MAX_BYTES = 10 * 1024 * 1024
export const ACCEPT = 'application/pdf,image/jpeg,image/png,image/webp,image/*,.pdf,.jpg,.jpeg,.png,.webp'

export function fileKind(file: File): 'pdf' | 'image' | 'heic' | null {
  const n = file.name.toLowerCase()
  if (file.type === 'application/pdf' || n.endsWith('.pdf')) return 'pdf'
  if (/^image\/hei[cf]/.test(file.type) || /\.hei[cf]$/.test(n)) return 'heic'
  if (/^image\/(jpeg|png|webp)$/.test(file.type) || /\.(jpe?g|png|webp)$/.test(n)) return 'image'
  return null
}

const HEIC = 'Photos in HEIC format can’t be read here. Send the photo as JPEG (on an iPhone: Settings → Camera → Formats → Most Compatible), or upload a PDF.'

/** Why the file can't be kept or read at all, by its name, type and size; null: it can. */
export function fileProblem(file: File): string | null {
  const kind = fileKind(file)
  if (kind === 'heic') return HEIC
  if (!kind) return 'Only a PDF or a photo (JPEG, PNG or WebP) can be read.'
  if (file.size === 0) return 'The file is empty.'
  if (kind === 'pdf' && file.size > MAX_BYTES) return `The PDF is ${(file.size / 1048576).toFixed(1)} MB; at most 10 MB can be kept. Save it smaller, or type the details.`
  return null
}

/**
 * What the file is by its first bytes — as the server tells the files it keeps apart (AttachmentRules.kind): a PDF
 * ("%PDF-" in its first kilobyte), a JPEG, PNG or WebP photo, an iPhone HEIC photo (refused), or none of them.
 */
export async function contentKind(file: Blob): Promise<'pdf' | 'jpeg' | 'png' | 'webp' | 'heic' | null> {
  const b = new Uint8Array(await file.slice(0, 1029).arrayBuffer())
  const at = (i: number, s: string) => i + s.length <= b.length && [...s].every((c, k) => b[i + k] === c.charCodeAt(0))
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg'
  if (b[0] === 0x89 && at(1, 'PNG\r\n\x1a\n')) return 'png'
  if (at(0, 'RIFF') && at(8, 'WEBP')) return 'webp'
  for (let i = 0; i <= Math.min(1024, b.length - 5); i++) if (at(i, '%PDF-')) return 'pdf'
  if (at(4, 'ftyp')) {
    const brand = String.fromCharCode(...b.slice(8, 12))
    if (/^he[iv]/.test(brand) || brand === 'mif1' || brand === 'msf1') return 'heic'
  }
  return null
}

export async function readInvoiceFile(file: File, opts: { ourGstin?: string; today: string; onStep?: (s: string) => void }): Promise<ReadResult> {
  const problem = fileProblem(file)
  if (problem) throw new ReadProblem(problem)
  const step = opts.onStep ?? (() => {})
  // by what is inside, not the name: a renamed file is read as what it is, or refused as the server would refuse it
  const inside = await contentKind(file)
  if (inside === 'heic') throw new ReadProblem(HEIC, true)
  if (!inside) throw new ReadProblem('This file isn’t a PDF or a photo (JPEG, PNG or WebP) inside, whatever its name says. Upload the PDF or the photo itself.', true)
  if (inside === 'pdf') {
    step('Opening the PDF…')
    const lib = await pdfjs()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let doc: any
    try {
      doc = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise
    } catch (e: any) {
      if (e?.name === 'PasswordException') throw new ReadProblem('This PDF is locked with a password. Open it, print it to a new PDF and upload that — or type the details.')
      throw new ReadProblem('This file couldn’t be opened as a PDF — it may be damaged, or not a PDF. Upload the PDF again, or type the details.', true)
    }
    try {
      step('Reading the text…')
      const text = await pdfText(doc, 3)
      const page = await pageCanvas(doc, 1, 2000)
      step('Looking for a QR code…')
      const qr = await qrCodes(page, opts.today)
      if (text.replace(/\s/g, '').length >= 40) return { kind: 'pdf', text, read: parseInvoiceText(text, { ourGstin: opts.ourGstin, today: opts.today, qr }) }
      step('A scanned PDF: reading the page…')
      const seen = await ocr(page, step)
      return { kind: 'scan', text: seen, read: parseInvoiceText(seen, { ourGstin: opts.ourGstin, today: opts.today, qr }) }
    } finally {
      doc.destroy?.()
    }
  }
  step('Opening the photo…')
  const canvas = await imageCanvas(file, 2400)
  step('Looking for a QR code…')
  const qr = await qrCodes(canvas, opts.today)
  step('Reading the photo…')
  const seen = await ocr(canvas, step)
  return { kind: 'photo', text: seen, read: parseInvoiceText(seen, { ourGstin: opts.ourGstin, today: opts.today, qr }) }
}

/**
 * The file as it is to be kept with the bill: a photo over 3 MB (or over 2,400 pixels a side) saved again as a JPEG of
 * 2,400 pixels at most — still sharp enough to read; anything else as it is.
 */
export async function forKeeping(file: File): Promise<File> {
  if (fileKind(file) !== 'image' || (file.size <= 3 * 1024 * 1024)) return file
  try {
    const canvas = await imageCanvas(file, 2400, false)
    const blob: Blob | null = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.85))
    if (!blob || blob.size >= file.size) return file
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    return file
  }
}

// ── PDF text, as lines in reading order ─────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function pdfText(doc: any, pages: number): Promise<string> {
  const out: string[] = []
  for (let p = 1; p <= Math.min(pages, doc.numPages); p++) {
    const page = await doc.getPage(p)
    const content = await page.getTextContent()
    type Item = { s: string; x: number; y: number; w: number; h: number }
    const items: Item[] = content.items
      .filter((it: any) => typeof it.str === 'string' && it.str.trim() !== '')
      .map((it: any) => ({ s: it.str, x: it.transform[4], y: it.transform[5], w: it.width ?? 0, h: Math.abs(it.transform[3]) || it.height || 10 }))
    items.sort((a, b) => b.y - a.y || a.x - b.x)
    const rows: Item[][] = []
    for (const it of items) {
      const row = rows.find(r => Math.abs(r[0].y - it.y) <= Math.max(2, Math.min(r[0].h, it.h) * 0.5))
      if (row) row.push(it); else rows.push([it])
    }
    rows.sort((a, b) => b[0].y - a[0].y)
    for (const r of rows) {
      r.sort((a, b) => a.x - b.x)
      let line = '', end = -Infinity
      for (const it of r) {
        line += (line && it.x - end > Math.max(1, it.h * 0.15) ? ' ' : '') + it.s
        end = it.x + it.w
      }
      const clean = line.replace(/\s+/g, ' ').trim()
      if (clean) out.push(clean)
    }
  }
  return out.join('\n')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function pageCanvas(doc: any, n: number, width: number): Promise<HTMLCanvasElement> {
  const page = await doc.getPage(n)
  const scale = Math.min(4, width / page.getViewport({ scale: 1 }).width)
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
  await page.render({ canvasContext: ctx, viewport }).promise
  return canvas
}

/** A photo on a canvas: at most maxSide pixels a side; a small one doubled, so OCR sees its letters. */
async function imageCanvas(file: File, maxSide: number, enlarge = true): Promise<HTMLCanvasElement> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new ReadProblem('This picture couldn’t be opened — it may be damaged. Take the photo again, or upload a PDF.', true)
  }
  const side = Math.max(bitmap.width, bitmap.height)
  const scale = Math.min(maxSide / side, enlarge && side < 1200 ? 2 : 1)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()
  return canvas
}

// ── QR codes ────────────────────────────────────────────────────────────────

/** The e-invoice QR when there is one (else a UPI QR): up to three codes, each found blanked before looking again. */
async function qrCodes(canvas: HTMLCanvasElement, today: string): Promise<QrRead | null> {
  const jsQR = (await import('jsqr')).default
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  let einvoice: QrRead | null = null, upi: QrRead | null = null
  for (let i = 0; i < 3; i++) {
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })
    if (!code) break
    const q = readQr(code.data, today)
    if (q && (q.irn || q.supplierGstin || q.invoiceNumber)) einvoice ??= q
    else if (q) upi ??= q
    const pts = [code.location.topLeftCorner, code.location.topRightCorner, code.location.bottomLeftCorner, code.location.bottomRightCorner]
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y)
    const pad = 8
    ctx.fillStyle = '#fff'
    ctx.fillRect(Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) - Math.min(...xs) + 2 * pad, Math.max(...ys) - Math.min(...ys) + 2 * pad)
  }
  return einvoice ?? upi
}

// ── OCR ─────────────────────────────────────────────────────────────────────

/** WebAssembly SIMD, which the OCR engine served here needs (every current browser has it). */
export function ocrSupported(): boolean {
  try {
    return typeof WebAssembly === 'object'
      && WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11]))
  } catch {
    return false
  }
}

async function ocr(canvas: HTMLCanvasElement, step: (s: string) => void): Promise<string> {
  if (!ocrSupported()) throw new ReadProblem('This browser can’t read photos. Upload the bill as a PDF, or type the details — or use a current browser.')
  const base = `${window.location.origin}/ocr`
  step('Getting the reader ready…')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const T: any = (await import(/* webpackIgnore: true */ `${base}/tesseract.esm.min.js`)).default
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let worker: any
  try {
    worker = await T.createWorker('eng', 1, {
      workerPath: `${base}/worker.min.js`, corePath: `${base}/tesseract-core-simd-lstm.wasm.js`, langPath: base, gzip: true, cacheMethod: 'none',
      logger: (m: { status: string; progress: number }) => { if (m.status === 'recognizing text') step(`Reading the text… ${Math.round(m.progress * 100)}%`) },
    })
  } catch {
    throw new ReadProblem('The photo reader couldn’t start. Try again, or type the details.')
  }
  try {
    await worker.setParameters({ preserve_interword_spaces: '1', user_defined_dpi: '300' })
    const { data } = await worker.recognize(canvas)
    return String(data?.text ?? '')
  } finally {
    await worker.terminate().catch(() => {})
  }
}
