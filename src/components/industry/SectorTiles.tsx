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
import { useQuery } from '@tanstack/react-query'
import { Factory } from 'lucide-react'
import { industryApi } from '@/lib/api/industry'
import { useAuthStore } from '@/lib/store/slices/authStore'
import type { SectorTile } from '@/types/industry'

const RUPEES = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const NUM = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 })
/** Tiles whose headline is the amount (the count goes underneath); the rest lead with the count. */
const AMOUNT_FIRST = new Set(['projects_value', 'sales_today', 'stock_value', 'installations_kw'])

/** Batches about to expire, and expired ones still in stock: counted in batches, worth at purchase price. */
const BATCH_TILES: Record<string, string> = { expiring_soon: '#d97706', expired_stock: '#dc2626' }

function headline(t: SectorTile): { value: string; sub: string | null } {
  const amount = Number(t.amount ?? 0), count = Number(t.count ?? 0)
  const money = (x: number) => RUPEES.format(x)
  if (t.key in BATCH_TILES) return { value: `${NUM.format(count)} batch${count === 1 ? '' : 'es'}`, sub: amount > 0 ? `${money(amount)} at purchase price` : null }
  if (t.unit === 'KW') return { value: `${NUM.format(amount)} kW`, sub: `${count} with a system size` }
  if (AMOUNT_FIRST.has(t.key) && t.unit === 'INR')
    return { value: money(amount), sub: t.key === 'stock_value' ? `${count} item${count === 1 ? '' : 's'} in stock` : `${count} in all` }
  return { value: NUM.format(count), sub: t.unit === 'INR' && amount > 0 ? money(amount) : null }
}

/** The dashboard tiles of the company's sector template, counted by the server from the company's own records. */
export function SectorTiles() {
  const { user } = useAuthStore()
  const { data } = useQuery({ queryKey: ['sector-tiles', user?.companyId ?? ''], queryFn: industryApi.tiles, enabled: !!user, staleTime: 60_000, retry: false })
  if (!data?.pack || !Array.isArray(data.tiles) || data.tiles.length === 0) return null
  return (
    <section aria-labelledby="sector-title" data-testid="sector-tiles">
      <h2 id="sector-title" className="flex items-center gap-2 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em', margin: '0 0 10px' }}>
        <Factory size={13} aria-hidden />{data.packName}
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {data.tiles.map(t => {
          const h = headline(t)
          return (
            <Link key={t.key} href={t.href} className="card block hover:opacity-95 transition-opacity" data-tile={t.key}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.label}</p>
              <p className="text-2xl font-semibold tracking-tight mt-1.5" style={{ color: t.key in BATCH_TILES && Number(t.count) > 0 ? BATCH_TILES[t.key] : 'var(--text-primary)', fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}>{h.value}</p>
              {h.sub && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{h.sub}</p>}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
