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

import { ReactNode } from 'react'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { Shield } from 'lucide-react'

interface PermissionGateProps {
  /** Single permission required */
  permission?: string
  /** Any of these permissions (OR) */
  anyOf?: string[]
  /** All of these permissions (AND) */
  allOf?: string[]
  /** Content to show when access is denied (default: null = hide) */
  fallback?: ReactNode
  /** Show a visual denied message instead of null */
  showDenied?: boolean
  children: ReactNode
}

/**
 * Wraps UI sections with permission gates.
 *
 * Usage:
 *   <PermissionGate permission="INVOICE_CREATE">
 *     <button>New Invoice</button>
 *   </PermissionGate>
 *
 *   <PermissionGate anyOf={['LEAVE_APPROVE','LEAVE_ADMIN']} showDenied>
 *     <ApprovalPanel />
 *   </PermissionGate>
 */
export function PermissionGate({
  permission, anyOf, allOf, fallback = null, showDenied = false, children
}: PermissionGateProps) {
  const { can, canAny, canAll } = usePermissions()

  const allowed =
    (permission && can(permission)) ||
    (anyOf && canAny(...anyOf)) ||
    (allOf && canAll(...allOf)) ||
    (!permission && !anyOf && !allOf) // no restriction = always show

  if (allowed) return <>{children}</>

  if (showDenied) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', gap: '12px', borderRadius: '12px',
      background: 'var(--bg-card)', border: '1px solid var(--border)',
    }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Shield size={22} color="#EF4444" />
      </div>
      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Access Denied</p>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '300px' }}>
        You don&apos;t have permission to view this section. Contact your administrator.
      </p>
    </div>
  )

  return <>{fallback}</>
}

/** Inline variant — hides a single element */
export function Can({ do: perm, children }: { do: string; children: ReactNode }) {
  return <PermissionGate permission={perm}>{children}</PermissionGate>
}
