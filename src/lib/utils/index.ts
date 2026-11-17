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

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, isValid } from 'date-fns'
import { csvCell } from '../csv'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export function formatDate(date: string | Date | undefined | null, fmt = 'dd MMM yyyy'): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return isValid(d) ? format(d, fmt) : '—'
  } catch { return '—' }
}

export function formatCurrency(amount: number | undefined | null, currency = 'INR'): string {
  if (amount == null) return '—'
  const n = Number(amount)
  if (isNaN(n)) return '—'
  if (Math.abs(n) >= 10000000)
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 1, notation: 'compact' }).format(n)
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

export function formatNumber(n: number | undefined | null): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-IN').format(n)
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n) + '…' : str
}

export function relativeTime(date: string | Date): string {
  const d   = typeof date === 'string' ? new Date(date) : date
  const diff = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return format(d, 'dd MMM')
}

export function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
}

export function hashColor(seed: string): { bg: string; text: string } {
  let hash = 0
  for (const c of seed) hash = c.charCodeAt(0) + ((hash << 5) - hash)
  const hue = Math.abs(hash) % 360
  return { bg: `hsl(${hue}deg 50% 20%)`, text: `hsl(${hue}deg 80% 75%)` }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  // let go of a second after the download starts, as the app's other downloads do
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Export an array of objects to a downloadable CSV file (client-side), with a byte-order mark so Excel reads ₹ and
 * names in any script correctly. Returns how many rows went into the file (0: nothing to export, no file made).
 */
export function exportToCsv(filename: string, rows: Record<string, any>[]): number {
  if (!rows || rows.length === 0) return 0
  const headers = Object.keys(rows[0])
  const csv = [
    headers.map(csvCell).join(','),
    ...rows.map(r => headers.map(h => csvCell(r[h])).join(',')),
  ].join('\r\n')
  downloadBlob(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }), filename.endsWith('.csv') ? filename : `${filename}.csv`)
  return rows.length
}

// The message for a failed API call lives on its own (no dependencies), so plain-TS checks can load it too.
/**
 * A web address someone typed (a tender portal, a résumé), or null when it isn't an http(s) link —
 * so a saved "javascript:…" address can never run when the link is clicked.
 */
export function webLink(url: string | null | undefined): string | null {
  const u = (url ?? '').trim()
  return /^https?:\/\/[^\s<>"]+$/i.test(u) ? u : null
}

export { apiError } from '../apiError'
export { csvCell } from '../csv'
