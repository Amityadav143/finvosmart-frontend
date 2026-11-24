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

// On its own (only ../gstin), so plain-TS checks can load it too.
import { checkGstin, GST_STATES } from '../gstin'

/**
 * What a supplier's invoice or a receipt says, read from its text (a PDF's own text, or what OCR saw in a photo) and
 * from its QR codes (the signed QR of a GST e-invoice; a UPI payment QR). Nothing is guessed to fill a gap: a field
 * that can't be found is left out, and `notes` says what to check. Each value keeps the line it was read from.
 */
export interface Found<T> { value: T; text: string }

export interface InvoiceRead {
  supplierName?: Found<string>
  supplierGstin?: Found<string>
  buyerGstin?: Found<string>
  invoiceNumber?: Found<string>
  /** yyyy-mm-dd */
  invoiceDate?: Found<string>
  /** a GST state code: "27" */
  placeOfSupply?: Found<string>
  reverseCharge?: Found<boolean>
  hsn?: Found<string>
  /** amounts as "1234.50" */
  taxable?: Found<string>
  cgst?: Found<string>
  sgst?: Found<string>
  igst?: Found<string>
  cess?: Found<string>
  total?: Found<string>
  /** the value before GST at each GST rate, when it can be told (one rate: the whole taxable value) */
  rates: { rate: string; taxable: string }[]
  /** the e-invoice's IRN, when its signed QR was read */
  irn?: string
  notes: string[]
}

/** GST rates a line can carry (lib/money GST_RATE_OPTIONS). */
export const GST_RATES = [0, 0.25, 3, 5, 12, 18, 28, 40]

// ── amounts ─────────────────────────────────────────────────────────────────

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 }

/** "1,23,456.7" → "123456.70"; null when it isn't an amount. */
export function money(s: string): string | null {
  const t = s.replace(/[₹\s]/g, '').replace(/^(rs\.?|inr)/i, '')
  if (!/^-?(\d{1,3}(,\d{2,3})+|\d+)(\.\d{1,2})?$/.test(t)) return null
  const n = Number(t.replace(/,/g, ''))
  return Number.isFinite(n) ? n.toFixed(2) : null
}

/**
 * The amounts on a line, left to right — not percentages, dates, times, quantities with units, GSTINs, phone or
 * account numbers (ten digits or more without separators).
 */
export function amountsIn(line: string): string[] {
  const out: string[] = []
  const cleaned = line
    .replace(/\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b/g, ' ')               // dates
    .replace(/\b\d{1,2}:\d{2}(:\d{2})?\b/g, ' ')                        // times
    .replace(/\b\d{2}[A-Z]{5}\d{4}[A-Z][0-9A-Z]{3}\b/gi, ' ')           // GSTINs
  const re = /(?:₹|\brs\.?|\binr)?\s*(-?\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?|-?\d+(?:\.\d{1,2})?)(?![\d,]*\s*%)(?![\d.,]*\d)/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(cleaned))) {
    const raw = m[1]
    const after = cleaned.slice(m.index + m[0].length, m.index + m[0].length + 4)
    if (/^\s*%/.test(after)) continue
    if (/^\s*(kg|gm|g|ml|ltr|l|nos|pcs|units?|qty|x)\b/i.test(after) && !raw.includes('.')) continue
    if (!raw.includes(',') && !raw.includes('.') && raw.replace('-', '').length >= 10) continue
    const v = money(raw)
    if (v !== null) out.push(v)
  }
  return out
}

/** Percentages on a line: "CGST @ 9%" → ["9"]. */
function percentsIn(line: string): number[] {
  return [...line.matchAll(/(\d{1,2}(?:\.\d{1,2})?)\s*%/g)].map(m => Number(m[1]))
}

const add = (a: string, b: string) => (Number(a) + Number(b)).toFixed(2)
const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol

// ── dates ───────────────────────────────────────────────────────────────────

/** The dates on a line as yyyy-mm-dd, Indian order (day first) when a date could be read either way. */
export function datesIn(line: string, today: string): string[] {
  const out: string[] = []
  const push = (y: number, mo: number, d: number) => {
    if (y < 100) y += 2000
    if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 2000) return
    const dt = new Date(Date.UTC(y, mo - 1, d))
    if (dt.getUTCMonth() !== mo - 1) return                        // 31 Feb
    const iso = dt.toISOString().slice(0, 10)
    if (iso <= today) out.push(iso)
  }
  for (const m of line.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)) push(+m[1], +m[2], +m[3])
  for (const m of line.matchAll(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})\b/g)) {
    const a = +m[1], b = +m[2]
    if (a > 12 || b <= 12) push(+m[3], b, a)                       // day first: 05/11/2026 is 5 November
    else push(+m[3], a, b)                                         // 11/25/2026: only month first can be
  }
  for (const m of line.matchAll(/\b(\d{1,2})(?:st|nd|rd|th)?[\s/.-]*([a-z]{3,9})[\s/.,'-]*(\d{4}|\d{2})\b/gi)) {
    const mo = MONTHS[m[2].slice(0, 4).toLowerCase()] ?? MONTHS[m[2].slice(0, 3).toLowerCase()]
    if (mo) push(+m[3], mo, +m[1])
  }
  for (const m of line.matchAll(/\b([a-z]{3,9})[\s.]+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/gi)) {
    const mo = MONTHS[m[1].slice(0, 4).toLowerCase()] ?? MONTHS[m[1].slice(0, 3).toLowerCase()]
    if (mo) push(+m[3], mo, +m[2])
  }
  return out
}

// ── GSTINs, as printed or as OCR read them ──────────────────────────────────

const DIGIT_FIX: Record<string, string> = { O: '0', D: '0', Q: '0', I: '1', L: '1', Z: '2', S: '5', B: '8', G: '6', T: '7' }
const LETTER_FIX: Record<string, string> = { '0': 'O', '1': 'I', '2': 'Z', '5': 'S', '8': 'B', '6': 'G', '7': 'T' }

/** The valid GSTINs on a line — fixing OCR's usual mix-ups (O/0, I/1, S/5, B/8) only where that makes the check digit right. */
export function gstinsIn(line: string): string[] {
  const out: string[] = []
  const up = line.toUpperCase().replace(/[‐-―]/g, '-')
  for (const m of up.matchAll(/\b[0-9A-Z]{2}[0-9A-Z]{5}[0-9A-Z]{4}[0-9A-Z][0-9A-Z]{3}\b/g)) {
    const raw = m[0]
    if (checkGstin(raw).valid) { out.push(raw); continue }
    const fixed = raw.split('').map((c, i) => {
      if (i < 2 || (i >= 7 && i <= 10)) return DIGIT_FIX[c] ?? c                 // digits: the state and PAN's 4 digits
      if ((i >= 2 && i <= 6) || i === 11) return LETTER_FIX[c] ?? c               // letters: PAN's 5 and its last
      if (i === 13) return c === '2' ? 'Z' : c
      return c
    }).join('')
    if (checkGstin(fixed).valid) { out.push(fixed); continue }
    // the 13th character (which registration of the PAN) can be a letter or a digit: OCR's I for 1, S for 5…
    const alt = fixed.slice(0, 12) + (DIGIT_FIX[fixed[12]] ?? fixed[12]) + fixed.slice(13)
    if (alt !== fixed && checkGstin(alt).valid) out.push(alt)
  }
  return out
}

// ── the e-invoice QR and the UPI QR ─────────────────────────────────────────

export interface QrRead {
  supplierGstin?: string; buyerGstin?: string; invoiceNumber?: string; invoiceDate?: string; total?: string; hsn?: string; irn?: string
  payeeName?: string
}

function b64urlJson(part: string): any {
  const t = part.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(t + '==='.slice((t.length + 3) % 4))
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes))
}

/**
 * A QR code's text: the signed QR of a GST e-invoice (a JWT whose data holds the supplier's and buyer's GSTINs, the
 * number, date, value, main HSN and IRN), or a UPI payment link (payee's name, amount). null: neither.
 */
export function readQr(text: string, today: string): QrRead | null {
  const t = (text || '').trim()
  if (/^upi:\/\/pay\?/i.test(t)) {
    const q = new URLSearchParams(t.slice(t.indexOf('?') + 1))
    const am = q.get('am') ? money(q.get('am')!) : null
    return { payeeName: q.get('pn')?.trim() || undefined, total: am ?? undefined }
  }
  const parts = t.split('.')
  if (parts.length !== 3 || parts[1].length < 20) return null
  try {
    const payload = b64urlJson(parts[1])
    const d = typeof payload?.data === 'string' ? JSON.parse(payload.data) : payload?.data ?? payload
    if (!d?.SellerGstin && !d?.DocNo) return null
    const dt = d.DocDt ? datesIn(String(d.DocDt), today)[0] : undefined
    return {
      supplierGstin: checkGstin(String(d.SellerGstin ?? '')).valid ? String(d.SellerGstin) : undefined,
      buyerGstin: checkGstin(String(d.BuyerGstin ?? '')).valid ? String(d.BuyerGstin) : undefined,
      invoiceNumber: d.DocNo ? String(d.DocNo).trim() : undefined,
      invoiceDate: dt,
      total: d.TotInvVal != null ? money(String(d.TotInvVal)) ?? undefined : undefined,
      hsn: d.MainHsnCode ? String(d.MainHsnCode).replace(/\D/g, '').slice(0, 8) || undefined : undefined,
      irn: d.Irn ? String(d.Irn) : undefined,
    }
  } catch {
    return null
  }
}

// ── reading the text ────────────────────────────────────────────────────────

const BUYER_WORDS = /\b(buyer|bill(ed)?\s*to|ship(ped)?\s*to|recipient|customer|consignee|sold\s*to|details\s*of\s*receiver)\b/i
const SELLER_WORDS = /\b(sold\s*by|seller|supplier|billed\s*by|from|vendor|details\s*of\s*supplier)\b/i
const NOT_A_NAME = /(tax\s*invoice|^invoice\b|invoice\s*(no|number|date|#)|bill\s*of\s*supply|cash\s*memo|^receipt|original|duplicate|triplicate|gstin|\bpan\b|\bcin\b|phone|\bph\b|mob(ile)?|e-?mail|@|www\.|http|\bdate\b|page\s*\d|e-?invoice|\birn\b|ack\.?\s*(no|date)|\bqr\b|place\s*of\s*supply|state\s*(code|name)|^\d|^address|^to\b|^bill\s*to|^ship\s*to|thank|welcome|^tel\b|^fax\b|^hsn|^sac|^sl\b|^s\.?\s*no)/i
const COMPANY_WORDS = /\b(pvt|private|ltd|limited|llp|enterprises?|traders?|trading|industries|stores?|services|agenc(y|ies)|corporation|company|co\.|hotels?|restaurant|motors|petroleum|filling\s*station|fuels?|pharma|medicals?|chemists?|sons|associates|solutions|technologies|tech|logistics|travels|tours|mart|bazaar|super\s*market|foods?|caterers|electricals?|hardware|textiles|garments|clinic|hospital|labs?|printers|courier|transport)\b/i

function labelled(lines: string[], re: RegExp): { line: string; index: number }[] {
  const out: { line: string; index: number }[] = []
  lines.forEach((line, index) => { if (re.test(line)) out.push({ line, index }) })
  return out
}

/**
 * The tax on a line that carries a rate and several amounts (a table row: value, rate, tax, total): the amount that is
 * the rate of another amount on the line (18% of ₹1,694.07 is ₹304.93); else the last after the label.
 */
function taxOnLine(line: string, pct: number | undefined, after: string[]): string | undefined {
  if (pct === undefined || after.length < 2) return after[after.length - 1]
  const all = amountsIn(line)
  const hit = after.find(a => all.some(b => b !== a && near(Number(b) * pct / 100, Number(a), Math.max(0.02, Number(a) * 0.002))))
  return hit ?? after[after.length - 1]
}

/** The last amount on the line, or on the next line when the line has none (a label above its value). */
function amountAt(lines: string[], i: number): { value: string; text: string } | null {
  const here = amountsIn(lines[i].replace(/^.*?(total|value|amount|payable|due|cgst|sgst|utgst|igst|cess|tax|round(ing)?\s*off)/i, ''))
  if (here.length) return { value: here[here.length - 1], text: lines[i] }
  const next = lines[i + 1]
  if (next !== undefined && !/[a-z]{4,}/i.test(next.replace(/\b(rs|inr)\b/gi, ''))) {
    const there = amountsIn(next)
    if (there.length) return { value: there[there.length - 1], text: `${lines[i]} ${next}` }
  }
  return null
}

/**
 * Reads an invoice's text, line by line as printed. ourGstin: the reading company's own GSTIN (the buyer's, never
 * taken for the supplier's); today: yyyy-mm-dd (no date after it is read).
 */
export function parseInvoiceText(text: string, opts: { ourGstin?: string; today: string; qr?: QrRead | null }): InvoiceRead {
  const lines = text.split(/\r?\n/).map(l => l.replace(/[ \t ]+/g, ' ').trim()).filter(Boolean)
  const out: InvoiceRead = { rates: [], notes: [] }
  const our = (opts.ourGstin || '').toUpperCase().trim()
  const top = lines.slice(0, Math.max(12, Math.ceil(lines.length * 0.4)))

  // GSTINs: the supplier's is one that isn't ours and isn't marked as the buyer's
  const gstins: { value: string; line: string; index: number; buyer: boolean }[] = []
  lines.forEach((line, index) => {
    for (const g of gstinsIn(line)) {
      const around = [lines[index - 2], lines[index - 1], line].filter(Boolean).join(' ')
      const buyer = g === our || (BUYER_WORDS.test(around) && !SELLER_WORDS.test(line))
      if (!gstins.some(x => x.value === g)) gstins.push({ value: g, line, index, buyer })
    }
  })
  const supplier = gstins.find(g => !g.buyer) ?? (gstins.length > 1 ? gstins.find(g => g.value !== our) : undefined)
  if (supplier) out.supplierGstin = { value: supplier.value, text: supplier.line }
  const buyer = gstins.find(g => g !== supplier && (g.buyer || g.value === our))
  if (buyer) out.buyerGstin = { value: buyer.value, text: buyer.line }

  // the supplier's name: after "Sold by" / "Supplier", else the first line that reads like a business's name
  for (const { line } of labelled(top, /^(sold\s*by|seller|supplier|billed\s*by|from)\b\s*[:-]?\s*\S/i)) {
    const name = line.replace(/^(sold\s*by|seller|supplier|billed\s*by|from)\b\s*[:-]?\s*/i, '').replace(/\s*[,|].*$/, '').trim()
    if (name.length >= 3 && !NOT_A_NAME.test(name)) { out.supplierName = { value: name.slice(0, 100), text: line }; break }
  }
  if (!out.supplierName) {
    const candidates = top.filter(l => l.length >= 3 && l.length <= 80 && /[a-z]{2}/i.test(l) && !NOT_A_NAME.test(l) && !BUYER_WORDS.test(l)
      && (l.match(/\d/g)?.length ?? 0) <= l.length / 3)
    const best = candidates.find(l => COMPANY_WORDS.test(l)) ?? (supplier ? lines.slice(Math.max(0, supplier.index - 3), supplier.index).reverse()
      .find(l => candidates.includes(l)) : undefined) ?? candidates[0]
    if (best) out.supplierName = { value: best.replace(/^[^a-z0-9]+/i, '').slice(0, 100), text: best }
  }

  // number and date
  const numberRe = /\b(?:tax\s+)?(?:invoice|inv|bill|receipt|cash\s*memo|voucher|doc(?:ument)?)\s*(?:no\b|number|num\b|#|id\b)\.?\s*[:#.\-–]?\s*([A-Z0-9][A-Z0-9/\-_.]{0,29})/i
  const labelOnly = /\b(?:tax\s+)?(?:invoice|inv|bill|receipt|cash\s*memo|voucher|doc(?:ument)?)\s*(?:no\b|number|num\b|#|id\b)\.?\s*[:#.\-–]?\s*(dated?\b.*)?$/i
  for (const pri of [/invoice|inv\b/i, /bill|cash\s*memo/i, /receipt|voucher|doc/i]) {
    let found: Found<string> | undefined
    for (let i = 0; i < lines.length && !found; i++) {
      const l = lines[i]
      const m = l.match(numberRe)
      if (m && pri.test(m[0])) {
        const v = m[1].replace(/[.\-/]+$/, '')
        if (v && !/^(date|dated|dt)$/i.test(v) && /\d/.test(v)) found = { value: v, text: l }
      }
      // the label in a box, its value on the line below: "Invoice No.   Dated" / "SGT/145   6-Nov-26"
      if (!found && labelOnly.test(l) && pri.test(l) && lines[i + 1]) {
        const v = lines[i + 1].split(' ').find(t => /\d/.test(t) && !datesIn(t, '9999-12-31').length && /^[A-Z0-9][A-Z0-9/\-_.]{0,29}$/i.test(t)
          && !gstinsIn(t).length && !/^\d{10,}$/.test(t) && money(t) === null)
        if (v) found = { value: v.replace(/[.\-/]+$/, ''), text: `${l} ${lines[i + 1]}` }
      }
    }
    if (found) { out.invoiceNumber = found; break }
  }
  const dateLines = labelled(lines, /\b(date|dated|dt\.?)\b/i).filter(x => !/\b(due|order|delivery|supply|expiry|exp|mfg|ack|irn|challan|po)\b/i.test(x.line))
  for (const { line, index } of dateLines) {
    const d = datesIn(line, opts.today)[0] ?? (lines[index + 1] ? datesIn(lines[index + 1], opts.today)[0] : undefined)
    if (d) { out.invoiceDate = { value: d, text: line }; break }
  }
  if (!out.invoiceDate) {
    for (const line of top) { const d = datesIn(line, opts.today)[0]; if (d) { out.invoiceDate = { value: d, text: line }; break } }
  }

  // place of supply, reverse charge, HSN/SAC
  for (const { line } of labelled(lines, /place\s*of\s*supply/i)) {
    const rest = line.replace(/^.*place\s*of\s*supply\s*[:-]?/i, '')
    const code = rest.match(/\b(\d{2})\b/)?.[1]
    const byName = Object.entries(GST_STATES)
      .map(([c, n]) => [c, n.replace(/\s*\(.*\)$/, '').toLowerCase()] as const)
      .filter(([c, name]) => name.length > 3 && !['25', '28', '97', '99'].includes(c) && rest.toLowerCase().includes(name))
      .sort((a, b) => b[1].length - a[1].length)[0]?.[0]
    const pos = code && GST_STATES[code] ? code : byName
    if (pos) { out.placeOfSupply = { value: pos, text: line }; break }
  }
  const rc = lines.find(l => /reverse\s*charge/i.test(l) && /(:|-|\?)\s*(yes|no|y|n)\b/i.test(l))
  if (rc) out.reverseCharge = { value: /(:|-|\?)\s*(yes|y)\b/i.test(rc), text: rc }
  for (let i = 0; i < lines.length && !out.hsn; i++) {
    const m = lines[i].match(/\b(?:hsn|sac)(?:\s*\/\s*(?:hsn|sac))?\s*(?:code)?\s*[:\-]?\s*(\d{4,8})\b/i)
    if (m) { out.hsn = { value: m[1], text: lines[i] }; break }
    if (/\b(hsn|sac)\b/i.test(lines[i])) {
      for (const next of lines.slice(i + 1, i + 4)) {
        const c = next.match(/(?:^|\s)(\d{4}|\d{6}|\d{8})(?=\s|$)/)
        if (c) { out.hsn = { value: c[1], text: next }; break }
      }
    }
  }

  // taxes: each tax's lines added up (CGST @2.5% and CGST @9% on one bill)
  const taxRates: { kind: 'C' | 'I'; rate: number; amount: string }[] = []
  const taxSum = (re: RegExp, kind: 'C' | 'S' | 'I' | 'X'): Found<string> | undefined => {
    let sum: string | null = null, text = ''
    for (const { line, index } of labelled(lines, re)) {
      if (/\b(total\s*tax|taxable|tax\s*amount\s*\(?in\s*words|in\s*words)\b/i.test(line) && !/@|%/.test(line)) continue
      const hit = amountAt(lines, index)
      if (!hit) continue
      const pct = percentsIn(line)[0]
      if (hit.text === line) {
        const after = amountsIn(line.replace(/^.*?(cgst|sgst|utgst|igst|cess|central|state|integrated|ut\s*tax)/i, ''))
        hit.value = taxOnLine(line, pct, after) ?? hit.value
      }
      if (pct !== undefined && near(Number(hit.value), pct, 0.001)) continue           // the rate read as the amount
      sum = sum === null ? hit.value : add(sum, hit.value)
      text = text ? `${text} · ${line}` : line
      if (pct !== undefined && (kind === 'C' || kind === 'I')) taxRates.push({ kind, rate: pct, amount: hit.value })
    }
    return sum === null ? undefined : { value: sum, text }
  }
  out.cgst = taxSum(/\b(cgst|c\.g\.s\.t|central\s*(gst|tax))\b/i, 'C')
  out.sgst = taxSum(/\b(sgst|utgst|s\.g\.s\.t|state\s*(gst|tax)|ut\s*tax)\b/i, 'S')
  out.igst = taxSum(/\b(igst|i\.g\.s\.t|integrated\s*(gst|tax))\b/i, 'I')
  out.cess = taxSum(/\bcess\b/i, 'X')

  // totals: the strongest label first, the largest amount among equals
  const strong = /\b(grand\s*total|total\s*amount\s*(payable|due)?|amount\s*payable|net\s*payable|invoice\s*(total|value|amount)|total\s*invoice\s*(value|amount)|bill\s*amount|net\s*amount|amount\s*due|total\s*payable|total\s*\(?(inr|rs\.?|₹)\)?)\b/i
  const weak = /\btotal\b/i
  const notTotal = /\b(sub\s*-?\s*total|total\s*(tax|gst|cgst|sgst|igst|discount|qty|quantity|items?|units|weight|savings?)|taxable|before\s*tax|in\s*words)\b/i
  const pick = (re: RegExp) => labelled(lines, re).filter(x => !notTotal.test(x.line))
    .map(x => amountAt(lines, x.index)).filter((x): x is { value: string; text: string } => !!x)
    .sort((a, b) => Number(b.value) - Number(a.value))[0]
  const total = pick(strong) ?? pick(weak) ?? pick(/^(net\s*)?(amount|amt)\b|\b(amount|amt)\s*(\(?(rs\.?|inr|₹)\)?)?\s*[:\-]/i)
  if (total) out.total = { value: total.value, text: total.text }
  const taxableRe = /\b(taxable\s*(value|amount|amt)?|sub\s*-?\s*total|amount\s*before\s*tax|total\s*before\s*tax|assessable\s*value|net\s*value)\b/i
  const taxables = labelled(lines, taxableRe).map(x => amountAt(lines, x.index)).filter((x): x is { value: string; text: string } => !!x)
    .filter(x => !out.total || Number(x.value) <= Number(out.total.value))
    .sort((a, b) => Number(b.value) - Number(a.value))
  if (taxables[0]) out.taxable = { value: taxables[0].value, text: taxables[0].text }

  // what the QR codes say is exact: it comes before the text
  const qr = opts.qr
  if (qr) {
    if (qr.supplierGstin) out.supplierGstin = { value: qr.supplierGstin, text: 'the e-invoice QR code' }
    if (qr.buyerGstin) out.buyerGstin = { value: qr.buyerGstin, text: 'the e-invoice QR code' }
    if (qr.invoiceNumber) out.invoiceNumber = { value: qr.invoiceNumber, text: 'the e-invoice QR code' }
    if (qr.invoiceDate) out.invoiceDate = { value: qr.invoiceDate, text: 'the e-invoice QR code' }
    if (qr.total) out.total = { value: qr.total, text: qr.irn ? 'the e-invoice QR code' : 'the UPI QR code' }
    if (qr.hsn) out.hsn = { value: qr.hsn, text: 'the e-invoice QR code' }
    if (qr.irn) out.irn = qr.irn
    if (qr.payeeName && !out.supplierName) out.supplierName = { value: qr.payeeName, text: 'the UPI QR code' }
  }
  if (out.supplierGstin && out.supplierGstin.value === our) delete out.supplierGstin

  // the value before GST, and the rate(s)
  const tax = ['cgst', 'sgst', 'igst'].map(k => (out as any)[k]?.value).filter(Boolean).reduce((a: string, b: string) => add(a, b), '0.00')
  const cess = out.cess?.value ?? '0.00'
  if (!out.taxable && out.total && Number(tax) > 0) {
    const derived = (Number(out.total.value) - Number(tax) - Number(cess)).toFixed(2)
    if (Number(derived) > 0) out.taxable = { value: derived, text: 'the total less the GST shown' }
  }
  if (out.taxable && Number(out.taxable.value) > 0) {
    const taxable = Number(out.taxable.value)
    // by rate: each tax line's rate and amount gives the value it is on (CGST 9% of ₹1,000 is ₹90)
    const parts = new Map<number, number>()
    for (const t of taxRates) {
      const rate = t.kind === 'C' ? t.rate * 2 : t.rate
      if (!GST_RATES.includes(rate) || t.rate <= 0) continue
      const base = Number(t.amount) / (t.rate / 100)
      parts.set(rate, (parts.get(rate) ?? 0) + base)
    }
    const partsSum = [...parts.values()].reduce((a, b) => a + b, 0)
    if (parts.size > 1 && near(partsSum, taxable, Math.max(2, taxable * 0.002))) {
      const entries = [...parts.entries()].sort((a, b) => a[0] - b[0])
      let left = taxable
      entries.forEach(([rate, base], i) => {
        const v = i === entries.length - 1 ? left : Math.round(base * 100) / 100
        left -= v
        out.rates.push({ rate: String(rate), taxable: v.toFixed(2) })
      })
    } else if (Number(tax) > 0) {
      const eff = (Number(tax) / taxable) * 100
      const rate = GST_RATES.find(r => r > 0 && near(eff, r, 0.15))
      if (rate !== undefined) out.rates.push({ rate: String(rate), taxable: taxable.toFixed(2) })
      else out.notes.push(`The GST shown (₹${tax}) isn't one rate of the value before GST (₹${taxable.toFixed(2)}): check the rates of the lines.`)
    } else if (parts.size === 1) {
      out.rates.push({ rate: String([...parts.keys()][0]), taxable: taxable.toFixed(2) })
    } else if (out.total && near(Number(out.total.value), taxable, 1)) {
      out.rates.push({ rate: '0', taxable: taxable.toFixed(2) })
    }
  }
  if (!out.rates.length && out.total && Number(tax) === 0 && !out.taxable) {
    if (out.supplierGstin) out.notes.push('No GST amounts could be read: the line holds the total — set its GST rate and the value before GST.')
    out.rates.push({ rate: '0', taxable: out.total.value })
  }

  if (!out.total) out.notes.push('The total could not be read.')
  if (!out.invoiceNumber) out.notes.push('The invoice number could not be read.')
  if (!out.invoiceDate) out.notes.push('The date could not be read.')
  return out
}
