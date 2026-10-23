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
import {
  AlertTriangle, BadgeCheck, CalendarClock, CalendarDays, ClipboardCheck, FileCheck2, Info, IndianRupee, PackageMinus, Wallet,
  type LucideIcon,
} from 'lucide-react'

/** How each kind of notification looks — the bell and the notifications page share this. */
export const NOTIFICATION_TYPES: Record<string, { label: string; color: string; bg: string; icon: LucideIcon }> = {
  APPROVAL:  { label: 'Approvals',     color: '#B45309', bg: 'rgba(217,119,6,0.12)',   icon: ClipboardCheck },
  PAYMENT:   { label: 'Payments in',   color: '#047857', bg: 'rgba(5,150,105,0.12)',   icon: IndianRupee },
  OVERDUE:   { label: 'Overdue',       color: '#B91C1C', bg: 'rgba(220,38,38,0.12)',   icon: AlertTriangle },
  DUE_SOON:  { label: 'Bills due',     color: '#C2410C', bg: 'rgba(234,88,12,0.12)',   icon: CalendarClock },
  LOW_STOCK: { label: 'Low stock',     color: '#1D4ED8', bg: 'rgba(37,99,235,0.12)',   icon: PackageMinus },
  PAYROLL:   { label: 'Payroll',       color: '#0F766E', bg: 'rgba(13,148,136,0.12)',  icon: Wallet },
  LEAVE:     { label: 'Leave',         color: '#6D28D9', bg: 'rgba(124,58,237,0.12)',  icon: CalendarDays },
  REVIEW:    { label: 'Reviews',       color: '#9D174D', bg: 'rgba(219,39,119,0.12)',  icon: FileCheck2 },
  SALES:     { label: 'Sales',         color: '#15803D', bg: 'rgba(22,163,74,0.12)',   icon: BadgeCheck },
  SYSTEM:    { label: 'System',        color: '#4B5563', bg: 'rgba(107,114,128,0.12)', icon: Info },
}

export const notificationType = (t: string) => NOTIFICATION_TYPES[t] ?? NOTIFICATION_TYPES.SYSTEM

/**
 * The server sends times as Indian local time without a zone ("2026-10-20T14:30:00"); read them as
 * IST so "5 min ago" is right whatever time zone the browser is in.
 */
export function serverTime(iso: string): number {
  if (!iso) return NaN
  const zoned = /([zZ]|[+-]\d{2}:?\d{2})$/.test(iso) || !iso.includes('T')
  return new Date(zoned ? iso : iso + '+05:30').getTime()
}

/** "just now", "5 min ago", "3 h ago", "yesterday", "4 days ago", then the date. */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const t = serverTime(iso)
  if (Number.isNaN(t)) return ''
  const s = Math.max(0, (now - t) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  const days = Math.floor(s / 86400)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  return new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: days > 300 ? 'numeric' : undefined })
}

/** Today / Yesterday / Earlier this week / Older — headings for the notifications page. */
export function dayGroup(iso: string, now: Date = new Date()): string {
  const d = new Date(serverTime(iso))
  if (Number.isNaN(d.getTime())) return 'Older'
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((start(now) - start(d)) / 86400000)
  if (diff <= 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return 'Earlier this week'
  return 'Older'
}

/** Only links inside the app are followed (a notice never sends anyone off-site). */
export const safeLink = (link?: string | null) => (link && link.startsWith('/') && !link.startsWith('//') ? link : null)
