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

import { cn } from '@/lib/utils'

const STATUS_MAP: Record<string, string> = {
  ACTIVE: 'status-active', APPROVED: 'status-approved', PAID: 'status-paid',
  RECEIVED: 'status-received', WON: 'status-won', PRESENT: 'status-present',
  PENDING: 'status-pending', PARTIAL: 'status-partial', ON_NOTICE: 'status-on_notice',
  HALF_DAY: 'status-half_day', PROCESSING: 'status-processing',
  REJECTED: 'status-rejected', TERMINATED: 'status-terminated', OVERDUE: 'status-overdue',
  ABSENT: 'status-absent', LOST: 'status-lost',
  SENT: 'status-sent', NEW: 'status-new', SUBMITTED: 'status-submitted', WFH: 'status-wfh',
  QUALIFIED: 'status-qualified', ON_LEAVE: 'status-on_leave', ORDERED: 'status-ordered',
  INACTIVE: 'status-inactive', DRAFT: 'status-draft', CANCELLED: 'status-cancelled',
  RESIGNED: 'status-resigned',
}

export function StatusBadge({ status, label, className }: { status: string; label?: string; className?: string }) {
  const cls = STATUS_MAP[status] ?? 'status-inactive'
  return (
    <span className={cn('badge', cls, className)}>
      {label ?? status.replace(/_/g, ' ')}
    </span>
  )
}

const VARIANTS: Record<string, string> = {
  default:  's-gray',
  success:  's-green',
  warning:  's-amber',
  danger:   's-red',
  info:     's-blue',
  gold:     'status-pending',
  purple:   's-purple',
  teal:     's-teal',
}

export function Badge({ children, variant = 'default', className }: {
  children: React.ReactNode; variant?: keyof typeof VARIANTS; className?: string
}) {
  return <span className={cn('badge', VARIANTS[variant as string], className)}>{children}</span>
}
