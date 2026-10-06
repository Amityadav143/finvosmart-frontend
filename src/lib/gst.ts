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

/**
 * GST calculation for the public GST calculator. Pure functions, unit-tested in
 * tests/run_tests.py. Rates follow GST 2.0 (effective 22 September 2025).
 */

/** Main slabs since GST 2.0 (22 Sep 2025): nil, merit, standard, luxury/sin. */
export const GST_SLABS = [0, 5, 18, 40] as const
/** Special rates outside the main slabs. */
export const SPECIAL_RATES = [
  { rate: 3, label: 'Gold, silver & jewellery' },
  { rate: 0.25, label: 'Rough precious stones' },
] as const

export type GstMode = 'exclusive' | 'inclusive'   // GST added on top / already in the price
export type SupplyType = 'intra' | 'inter'         // same state → CGST+SGST; other state → IGST

export interface GstResult {
  taxable: number; gst: number; total: number
  cgst: number; sgst: number; igst: number
  rate: number; mode: GstMode; supply: SupplyType
}

/**
 * Rupees → integer paise, immune to binary floating-point error at any size:
 * 152.39 / 2 is really 76.19499999… in floating point; toPrecision(15) restores
 * 76.195 so it rounds half-up to 7620 paise, as a person would.
 */
function paise(x: number): number {
  return Math.round(Number((x * 100).toPrecision(15)))
}

/** Round rupees to the nearest paisa (half-up). */
export function toPaise(x: number): number {
  return paise(x) / 100
}

export function calculateGst(amount: number, rate: number, mode: GstMode, supply: SupplyType): GstResult {
  const a = Number.isFinite(amount) && amount > 0 ? amount : 0
  const r = Number.isFinite(rate) && rate >= 0 && rate <= 100 ? rate : 0
  // All arithmetic in whole paise, so totals and splits always reconcile exactly.
  const aP = paise(a)
  let taxableP: number, gstP: number, totalP: number
  if (mode === 'exclusive') {
    taxableP = aP
    gstP = Math.round(Number((aP * r / 100).toPrecision(15)))
    totalP = taxableP + gstP
  } else {
    totalP = aP
    taxableP = Math.round(Number((aP * 100 / (100 + r)).toPrecision(15)))
    gstP = totalP - taxableP
  }
  // Split so the halves always add back to the exact GST (odd paisa goes to CGST).
  const cgstP = supply === 'intra' ? Math.round(gstP / 2) : 0
  const sgstP = supply === 'intra' ? gstP - cgstP : 0
  const igstP = supply === 'inter' ? gstP : 0
  return {
    taxable: taxableP / 100, gst: gstP / 100, total: totalP / 100,
    cgst: cgstP / 100, sgst: sgstP / 100, igst: igstP / 100,
    rate: r, mode, supply,
  }
}

/** Indian digit grouping with rupee sign: 123456.5 → "₹1,23,456.50". */
export function formatINR(n: number): string {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
