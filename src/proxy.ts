/*
 * FINVOSMART — Finvosmart by Navgrow
 *
 * Copyright (c) 2025-2026 Navgrow Engineering Service Pvt. Ltd.
 * CIN: U29302WB2025PTC281015
 *
 * All rights reserved. This source code is proprietary and confidential.
 * Unauthorized copying, distribution, modification, or use of this file,
 * via any medium, is strictly prohibited without prior written permission.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { CANONICAL_HOST, hostDecision } from '@/lib/canonicalHost'

/**
 * One address for the website (lib/canonicalHost.ts): other names for it are sent to finvosmart.com, or kept out of
 * search. Next.js 16's proxy (what Next.js 14 and 15 called middleware), run on Node.js before each page.
 */
export function proxy(req: NextRequest) {
  const decision = hostDecision(req.headers.get('host'),
    process.env.NEXT_PUBLIC_EXTRA_HOSTS || '', process.env.NEXT_PUBLIC_CANONICAL_REDIRECT || 'on')
  if (decision === 'redirect')
    return NextResponse.redirect(`https://${CANONICAL_HOST}${req.nextUrl.pathname}${req.nextUrl.search}`, 301)
  const res = NextResponse.next()
  if (decision === 'noindex') res.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return res
}

// Pages only: not the build's own files, images and icons, or the API (nginx sends /api/ to the backend anyway).
export const config = {
  matcher: ['/((?!_next/|api/|favicon|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif|woff2?|js|css|map)$).*)'],
}
