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

/**
 * Invoice totals in the browser — the exact same rules and rounding as the server's
 * InvoiceMath.java, so the preview on screen always equals the saved invoice to the paisa.
 * Both are checked against the same test vectors (tests/java/invoice_math_vectors.txt) and
 * against each other on thousands of random invoices.
 *
 * Decimal arithmetic is exact (BigInt with a scale), never JavaScript floating point.
 */

/** An exact decimal: value × 10^-scale. */
interface Dec { v: bigint; s: number }

const TEN = BigInt(10)
const ZERO = BigInt(0)
const ONE = BigInt(1)
const pow10 = (n: number): bigint => { let r = ONE; for (let i = 0; i < n; i++) r *= TEN; return r }

export function dec(x: string | number | null | undefined): Dec {
  if (x === null || x === undefined || x === '') return { v: ZERO, s: 0 }
  let str = typeof x === 'number' ? numberToString(x) : String(x).trim().replace(/,/g, '')
  if (!/^[-+]?(\d+(\.\d*)?|\.\d+)$/.test(str)) throw new Error(`Not a number: ${x}`)
  let neg = false
  if (str.startsWith('-') || str.startsWith('+')) { neg = str[0] === '-'; str = str.slice(1) }
  const [int, frac = ''] = str.split('.')
  const v = BigInt((int || '0') + frac)
  return { v: neg ? -v : v, s: frac.length }
}

function numberToString(n: number): string {
  if (!isFinite(n)) throw new Error('Not a number')
  const s = String(n)
  if (!/e/i.test(s)) return s
  return n.toFixed(20).replace(/0+$/, '').replace(/\.$/, '')   // tiny/huge numbers written in exponent form
}

const align = (a: Dec, b: Dec): [bigint, bigint, number] => {
  const s = Math.max(a.s, b.s)
  return [a.v * pow10(s - a.s), b.v * pow10(s - b.s), s]
}
const add = (a: Dec, b: Dec): Dec => { const [x, y, s] = align(a, b); return { v: x + y, s } }
const sub = (a: Dec, b: Dec): Dec => { const [x, y, s] = align(a, b); return { v: x - y, s } }
const mul = (a: Dec, b: Dec): Dec => ({ v: a.v * b.v, s: a.s + b.s })
const cmp = (a: Dec, b: Dec): number => { const [x, y] = align(a, b); return x < y ? -1 : x > y ? 1 : 0 }
const sign = (a: Dec): number => (a.v < ZERO ? -1 : a.v > ZERO ? 1 : 0)
const abs = (x: bigint): bigint => (x < ZERO ? -x : x)

/** num / den rounded half-up (away from zero on .5), like Java's RoundingMode.HALF_UP. */
function divHalfUp(num: bigint, den: bigint): bigint {
  const q = num / den, r = num % den
  if (abs(r) * BigInt(2) >= abs(den)) return q + ((num < ZERO) !== (den < ZERO) ? -ONE : ONE)
  return q
}

/** BigDecimal.setScale(scale, HALF_UP) */
export function setScale(a: Dec, scale: number): Dec {
  if (scale >= a.s) return { v: a.v * pow10(scale - a.s), s: scale }
  return { v: divHalfUp(a.v, pow10(a.s - scale)), s: scale }
}

/** BigDecimal.divide(b, scale, HALF_UP) */
function div(a: Dec, b: Dec, scale: number): Dec {
  if (b.v === ZERO) throw new Error('Division by zero')
  const e = b.s - a.s + scale
  const num = e >= 0 ? a.v * pow10(e) : a.v
  const den = e >= 0 ? b.v : b.v * pow10(-e)
  return { v: divHalfUp(num, den), s: scale }
}

/** "1234.50" with exactly `scale` decimals. */
export function str(a: Dec, scale = 2): string {
  const x = setScale(a, scale)
  const neg = x.v < ZERO
  const digits = abs(x.v).toString().padStart(scale + 1, '0')
  const out = scale === 0 ? digits : digits.slice(0, digits.length - scale) + '.' + digits.slice(digits.length - scale)
  return (neg ? '-' : '') + out
}

/** A rate without trailing zeros: "9", "2.5", "0.125". */
function strip(a: Dec): string {
  let s = str(a, a.s)
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '')
  return s === '-0' ? '0' : s
}

const money = (a: Dec) => setScale(a, 2)
const HUNDRED = dec(100)
const Z = dec('0.00')

export interface LineInput { quantity: string | number; rate: string | number; discountPct?: string | number | null; gstRate: string | number }

export interface LineResult {
  gross: string; discount: string; taxable: string; gstRate: string
  cgstRate: string; sgstRate: string; igstRate: string
  cgst: string; sgst: string; igst: string; total: string
}

export interface InvoiceTotals {
  lines: LineResult[]
  subtotal: string; discount: string; taxable: string
  cgst: string; sgst: string; igst: string; tax: string
  totalBeforeRounding: string; roundOff: string; total: string
}

/**
 * Same as InvoiceMath.compute on the server:
 *  - a line's taxable value is quantity × rate less its discount (tax is charged after discount);
 *  - an invoice-level discount is shared across lines in proportion to their value;
 *  - intra-state: CGST and SGST at half the rate each; inter-state: IGST at the full rate;
 *  - half-up to the paisa per line; the total optionally rounded to the rupee.
 * Throws Error with a readable message for invalid input.
 */
export function computeInvoice(inputs: LineInput[], interState: boolean, invoiceDiscount?: string | number | null,
                               roundToRupee = true): InvoiceTotals {
  if (!inputs || inputs.length === 0) throw new Error('Add at least one line')
  const n = inputs.length
  const gross: Dec[] = [], lineDisc: Dec[] = [], after: Dec[] = []
  let sumAfter = Z
  for (let i = 0; i < n; i++) {
    const inp = inputs[i]
    const qty = req(inp.quantity, 'Quantity', i), rate = req(inp.rate, 'Rate', i)
    const pct = inp.discountPct === null || inp.discountPct === undefined || inp.discountPct === '' ? dec(0) : dec(inp.discountPct)
    const gst = req(inp.gstRate, 'GST rate', i)
    if (sign(qty) <= 0) throw new Error(`Line ${i + 1}: quantity must be more than zero`)
    if (sign(rate) < 0) throw new Error(`Line ${i + 1}: rate can't be negative`)
    if (sign(pct) < 0 || cmp(pct, HUNDRED) > 0) throw new Error(`Line ${i + 1}: discount must be between 0 and 100%`)
    if (sign(gst) < 0 || cmp(gst, HUNDRED) > 0) throw new Error(`Line ${i + 1}: GST rate must be between 0 and 100%`)
    gross[i] = money(mul(qty, rate))
    lineDisc[i] = money(div(mul(gross[i], pct), HUNDRED, 10))
    after[i] = sub(gross[i], lineDisc[i])
    sumAfter = add(sumAfter, after[i])
  }
  const invDisc = invoiceDiscount === null || invoiceDiscount === undefined || invoiceDiscount === '' ? Z : money(dec(invoiceDiscount))
  if (sign(invDisc) < 0) throw new Error("Discount can't be negative")
  if (cmp(invDisc, sumAfter) > 0) throw new Error('Discount is more than the invoice value')
  const share: Dec[] = []
  let allocated = Z
  let last = -1
  for (let i = 0; i < n; i++) if (sign(after[i]) > 0) last = i
  for (let i = 0; i < n; i++) {
    if (sign(invDisc) === 0 || sign(sumAfter) === 0 || sign(after[i]) === 0) { share[i] = Z; continue }
    share[i] = i === last ? sub(invDisc, allocated) : money(div(mul(invDisc, after[i]), sumAfter, 10))
    allocated = add(allocated, share[i])
  }
  const lines: LineResult[] = []
  let subtotal = Z, discount = Z, taxable = Z, cgst = Z, sgst = Z, igst = Z
  for (let i = 0; i < n; i++) {
    const rate = dec(inputs[i].gstRate)
    const t = sub(after[i], share[i])
    const half = div(rate, dec(2), 4)
    const c = interState ? Z : money(div(mul(t, half), HUNDRED, 10))
    const s = c
    const g = interState ? money(div(mul(t, rate), HUNDRED, 10)) : Z
    const d = add(lineDisc[i], share[i])
    lines.push({
      gross: str(gross[i]), discount: str(d), taxable: str(t), gstRate: strip(rate),
      cgstRate: interState ? '0' : strip(half), sgstRate: interState ? '0' : strip(half), igstRate: interState ? strip(rate) : '0',
      cgst: str(c), sgst: str(s), igst: str(g), total: str(add(add(add(t, c), s), g)),
    })
    subtotal = add(subtotal, gross[i]); discount = add(discount, d); taxable = add(taxable, t)
    cgst = add(cgst, c); sgst = add(sgst, s); igst = add(igst, g)
  }
  const before = add(add(add(taxable, cgst), sgst), igst)
  const total = roundToRupee ? setScale(setScale(before, 0), 2) : before
  return {
    lines, subtotal: str(subtotal), discount: str(discount), taxable: str(taxable),
    cgst: str(cgst), sgst: str(sgst), igst: str(igst), tax: str(add(add(cgst, sgst), igst)),
    totalBeforeRounding: str(before), roundOff: str(sub(total, before)), total: str(total),
  }
}

function req(v: string | number | null | undefined, what: string, i: number): Dec {
  if (v === null || v === undefined || v === '') throw new Error(`Line ${i + 1}: ${what} is required`)
  try { return dec(v) } catch { throw new Error(`Line ${i + 1}: ${what} must be a number`) }
}

/** Exact sum of money strings, to the paisa ("10.10" + "-0.41" → "9.69"). */
export function addMoney(...xs: (string | number | null | undefined)[]): string {
  let t: Dec = Z
  for (const x of xs) if (x !== null && x !== undefined && x !== '') t = add(t, dec(x))
  return str(t, 2)
}

/** Rounds money to the rupee, half up ("1179.41" → "1179.00"). */
export function roundRupee(x: string | number): string {
  return str(setScale(dec(x), 0), 2)
}

/** Exact a − b for money strings ("10.00" − "-0.41" → "10.41"). */
export function subMoney(a: string | number, b: string | number): string {
  return str(sub(dec(a), dec(b)), 2)
}

/**
 * A purchase order's totals, worked out the way the server does (ProcurementService): GST on
 * each line rounded to the paisa, half up.
 */
export function purchaseOrderTotals(lines: { quantity: string | number; unitPrice: string | number; gstRate: string | number }[]):
  { subtotal: string; tax: string; total: string } {
  let sub: Dec = Z, tax: Dec = Z
  for (const l of lines) {
    let amount: Dec, rate: Dec
    try { amount = mul(dec(l.quantity), dec(l.unitPrice)) } catch { continue }
    try { rate = dec(l.gstRate) } catch { rate = Z }
    sub = add(sub, amount)
    tax = add(tax, div(mul(amount, rate), HUNDRED, 2))
  }
  const subtotal = money(sub)
  return { subtotal: str(subtotal), tax: str(tax), total: str(add(subtotal, tax)) }
}
