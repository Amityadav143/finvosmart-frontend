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
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'

interface StatCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  format?: 'number' | 'currency' | 'plain'
  trend?: { value: number; label: string }
  accent?: string
  delay?: number
  subtext?: string
  className?: string
}

function useCountUp(target: number, delay = 0, duration = 600) {
  const [value, setValue] = useState(0)
  const frame = useRef<number>(0)
  useEffect(() => {
    setValue(0)
    const timeout = setTimeout(() => {
      const start = performance.now()
      const tick = (now: number) => {
        const elapsed = now - start
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setValue(Math.floor(eased * target))
        if (progress < 1) frame.current = requestAnimationFrame(tick)
      }
      frame.current = requestAnimationFrame(tick)
    }, delay)
    return () => { clearTimeout(timeout); cancelAnimationFrame(frame.current) }
  }, [target, delay, duration])
  return value
}

export function StatCard({ label, value, icon: Icon, format = 'plain', trend, accent = '#f59e0b', delay = 0, subtext, className }: StatCardProps) {
  const numVal = typeof value === 'number' ? value : parseFloat(String(value)) || 0
  const count = useCountUp(numVal, delay)

  const fmt = (n: number) => {
    if (format === 'currency') return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0, notation: n >= 10000000 ? 'compact' : 'standard' }).format(n)
    if (format === 'number')   return new Intl.NumberFormat('en-IN').format(n)
    return value
  }

  const displayValue = format === 'plain' ? value : fmt(count)

  const TrendIcon = !trend ? null : trend.value > 0 ? TrendingUp : trend.value < 0 ? TrendingDown : Minus
  const trendColor = !trend ? '' : trend.value > 0 ? '#22c55e' : trend.value < 0 ? '#ef4444' : 'var(--text-muted)'

  return (
    <div className={cn('stat-card animate-[slideUp_0.4s_ease_both]', className)}
      style={{ ['--stat-accent' as string]: accent, animationDelay: `${delay}ms` }}>
      {/* Glow */}
      <div className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-[0.05] pointer-events-none"
        style={{ background: accent, transform: 'translate(30%, -30%)' }} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest mb-2.5"
            style={{ color: 'var(--text-muted)', letterSpacing: '0.07em', fontSize: '10px' }}>
            {label}
          </p>
          <p className="metric-value mb-1.5 animate-[slideUp_0.35s_ease_both]" style={{ animationDelay: `${delay + 50}ms` }}>
            {displayValue}
          </p>
          {subtext && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{subtext}</p>}
          {trend && TrendIcon && (
            <div className="inline-flex items-center gap-1 mt-2 text-xs font-semibold px-2 py-1 rounded-full"
              style={{ background: `${trendColor}12`, color: trendColor, border: `1px solid ${trendColor}20` }}>
              <TrendIcon className="w-3 h-3" />
              {Math.abs(trend.value)}% {trend.label}
            </div>
          )}
        </div>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent}15`, border: `1px solid ${accent}22` }}>
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
      </div>
    </div>
  )
}
