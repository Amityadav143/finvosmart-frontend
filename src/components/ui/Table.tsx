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

interface Column<T> {
  header: string; key?: keyof T; render?: (row: T) => React.ReactNode; className?: string
}
interface TableProps<T> {
  columns: Column<T>[]; data: T[]; loading?: boolean; emptyMessage?: string
  onRowClick?: (row: T) => void; keyExtractor: (row: T) => string
}

export function DataTable<T>({ columns, data, loading, emptyMessage = 'No records found', onRowClick, keyExtractor }: TableProps<T>) {
  return (
    <div className="table-wrap">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {columns.map(c => <th key={c.header} className={cn('table-header', c.className)}>{c.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="table-row">
                {columns.map((_, j) => (
                  <td key={j} className="table-cell">
                    <div className="skeleton h-4" style={{ width: `${50 + (j * 19 + i * 13) % 40}%`, animationDelay: `${i * 0.06}s` }} />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="table-cell text-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: 'var(--bg-hover)' }}>📭</div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr key={keyExtractor(row)}
                className={cn('table-row', onRowClick && 'cursor-pointer')}
                style={{ animationDelay: `${idx * 0.025}s` }}
                onClick={() => onRowClick?.(row)}>
                {columns.map(c => (
                  <td key={c.header} className={cn('table-cell', c.className)}>
                    {c.render ? c.render(row) : c.key ? String(row[c.key] ?? '—') : '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
