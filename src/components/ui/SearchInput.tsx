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

import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SearchInput({ value, onChange, placeholder = 'Search...', className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
      <input type="search" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} className="input pl-10 pr-9 h-10" />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 btn-icon w-6 h-6">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
