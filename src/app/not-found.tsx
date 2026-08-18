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
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background:'var(--bg-base)' }}>
      <div className="text-center max-w-md">
        <p className="font-serif" style={{ fontSize:'120px', lineHeight:1, color:'var(--border-strong)', fontWeight:400 }}>
          404
        </p>
        <h1 className="font-serif text-2xl mb-3" style={{ color:'var(--text-primary)', marginTop:'-20px' }}>
          Page not found
        </h1>
        <p className="text-sm mb-8" style={{ color:'var(--text-muted)', lineHeight:1.7 }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard" className="btn-primary h-10 px-6 text-sm" style={{ textDecoration:'none' }}>
            <Home size={15} />Dashboard
          </Link>
          <Link href="/" className="btn-secondary h-10 px-6 text-sm" style={{ textDecoration:'none' }}>
            <ArrowLeft size={15} />Home
          </Link>
        </div>
      </div>
    </div>
  )
}
