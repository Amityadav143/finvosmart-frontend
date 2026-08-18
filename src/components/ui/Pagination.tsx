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

import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Pagination({ currentPage, totalPages, onPageChange, totalElements, pageSize }: {
  currentPage: number; totalPages: number; onPageChange: (p: number) => void;
  totalElements?: number; pageSize?: number
}) {
  if (totalPages <= 1) return null
  const start = totalElements && pageSize ? Math.min(currentPage * pageSize + 1, totalElements) : null
  const end   = totalElements && pageSize ? Math.min((currentPage + 1) * pageSize, totalElements) : null
  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {start && end ? `${start}–${end} of ${totalElements?.toLocaleString()}` : `Page ${currentPage + 1} of ${totalPages}`}
      </p>
      <div className="flex items-center gap-2">
        <button disabled={currentPage === 0} onClick={() => onPageChange(currentPage - 1)} className="btn-secondary h-8 px-3 text-xs">
          <ChevronLeft className="w-3.5 h-3.5" />Prev
        </button>
        <span className="text-xs px-3 py-1.5 rounded-xl font-semibold"
          style={{ background: 'var(--gold-muted)', border: '1px solid rgba(245,158,11,0.15)', color: 'var(--gold)' }}>
          {currentPage + 1} / {totalPages}
        </span>
        <button disabled={currentPage >= totalPages - 1} onClick={() => onPageChange(currentPage + 1)} className="btn-secondary h-8 px-3 text-xs">
          Next <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
