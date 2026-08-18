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

import Link from 'next/link'
import { LucideIcon, Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  /** Primary call-to-action */
  action?: { label: string; onClick?: () => void; href?: string }
  /** Optional secondary hint below the action */
  hint?: string
  compact?: boolean
}

/**
 * A friendly, consistent empty state for lists and panels with no data yet.
 * Replaces blank areas with guidance and a clear next step, which makes new
 * accounts feel intentional and helps users understand what to do.
 */
export function EmptyState({ icon: Icon = Inbox, title, description, action, hint, compact }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      padding: compact ? '36px 24px' : '64px 24px',
    }}>
      <div style={{
        width: compact ? '52px' : '64px', height: compact ? '52px' : '64px', borderRadius: '16px',
        background: 'var(--gold-muted)', color: 'var(--gold)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px',
      }}>
        <Icon size={compact ? 24 : 28} />
      </div>
      <h3 style={{ fontSize: compact ? '16px' : '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>{title}</h3>
      {description && (
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '380px', marginBottom: action ? '22px' : 0 }}>{description}</p>
      )}
      {action && (
        action.href
          ? <Link href={action.href} className="btn-primary" style={{ textDecoration: 'none' }}>{action.label}</Link>
          : <button onClick={action.onClick} className="btn-primary">{action.label}</button>
      )}
      {hint && <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '14px' }}>{hint}</p>}
    </div>
  )
}
