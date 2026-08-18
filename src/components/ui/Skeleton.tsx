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

import { cn } from '@/lib/utils'

/**
 * Base shimmer skeleton. Compose these to build loading placeholders that
 * match the shape of the content being loaded, so the UI feels instant and
 * intentional rather than showing a blank screen or a lone spinner.
 */
export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties; key?: any }) {
  return <div className={cn('skeleton', className)} style={style} aria-hidden="true" />
}

/** A skeleton shaped like a KPI / stat card. */
export function SkeletonStat() {
  return (
    <div className="card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <Skeleton style={{ width: '40%', height: '12px' }} />
        <Skeleton style={{ width: '36px', height: '36px', borderRadius: '10px' }} />
      </div>
      <Skeleton style={{ width: '60%', height: '28px', marginBottom: '10px' }} />
      <Skeleton style={{ width: '45%', height: '11px' }} />
    </div>
  )
}

/** A grid of stat-card skeletons. */
export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="auto-grid-4">
      {Array.from({ length: count }).map((_, i) => <SkeletonStat key={i} />)}
    </div>
  )
}

/** A skeleton shaped like table rows. */
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* header */}
      <div style={{ display: 'flex', gap: '16px', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} style={{ height: '12px', flex: i === 0 ? 2 : 1 }} />
        ))}
      </div>
      {/* rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'flex', gap: '16px', padding: '16px 20px', borderBottom: r < rows - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} style={{ height: '14px', flex: c === 0 ? 2 : 1, opacity: 1 - r * 0.12 }} />
          ))}
        </div>
      ))}
    </div>
  )
}

/** A skeleton shaped like a text card / panel. */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card" style={{ padding: '24px' }}>
      <Skeleton style={{ width: '50%', height: '16px', marginBottom: '18px' }} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} style={{ width: i === lines - 1 ? '70%' : '100%', height: '12px', marginBottom: '10px' }} />
      ))}
    </div>
  )
}
