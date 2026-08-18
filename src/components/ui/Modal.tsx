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

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean; onClose: () => void; title: string; subtitle?: string
  children: React.ReactNode; size?: 'sm'|'md'|'lg'|'xl'; footer?: React.ReactNode
}

export function Modal({ open, onClose, title, subtitle, children, size = 'md', footer }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) { document.addEventListener('keydown', handler); document.body.style.overflow = 'hidden' }
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = '' }
  }, [open, onClose])

  if (!open) return null
  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}>
      <div className={cn('w-full animate-[scaleIn_0.2s_cubic-bezier(0.16,1,0.3,1)]', widths[size])}
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: '20px', boxShadow: 'var(--shadow-modal)' }}
        onClick={(e: any) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between p-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="font-serif text-xl" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{title}</h2>
            {subtitle && <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} className="btn-icon w-8 h-8 ml-4 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Body */}
        <div className="p-6">{children}</div>
        {/* Footer */}
        {footer && <div className="px-6 pb-6 pt-0">{footer}</div>}
      </div>
    </div>
  )
}
