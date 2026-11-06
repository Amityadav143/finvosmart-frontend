'use client'
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
import { useQuery } from '@tanstack/react-query'
import { LEGAL_ENTITY } from './legal'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

/** Finvosmart's public details, as set in the platform console (GET /public/platform). */
export interface PlatformInfo {
  supportEmail: string
  salesEmail?: string | null
  phone?: string | null
  whatsapp?: string | null
  hours?: string | null
  address?: string | null
  legalName?: string | null
  cin?: string | null
  /** new companies can sign up; while paused, what the sign-up page says */
  signupsOpen: boolean
  signupsClosedMessage?: string | null
  /** shown to everyone (planned maintenance…); null when there is none */
  notice?: { text: string; tone: 'INFO' | 'WARNING'; until?: string | null } | null
}

/** What is shown before the server answers (and if it can't be reached): the details printed on the site. */
export const PLATFORM_DEFAULTS: PlatformInfo = {
  supportEmail: LEGAL_ENTITY.email,
  salesEmail: LEGAL_ENTITY.email,
  legalName: LEGAL_ENTITY.name,
  cin: LEGAL_ENTITY.cin,
  signupsOpen: true,
  notice: null,
}

export async function fetchPlatformInfo(): Promise<PlatformInfo> {
  const res = await fetch(`${API_URL}/public/platform`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const body = await res.json()
  const d = body?.data
  if (!d || typeof d.supportEmail !== 'string') throw new Error('no platform details')
  return { ...PLATFORM_DEFAULTS, ...Object.fromEntries(Object.entries(d).filter(([, v]) => v !== null && v !== undefined)) } as PlatformInfo
}

/**
 * The details in force: the built-in ones at first (so a page never waits for them), the platform console's once
 * the server answers. Kept for 5 minutes; a server that can't be reached leaves the built-in ones.
 */
export function usePlatformInfo(): PlatformInfo {
  const { data } = useQuery({
    queryKey: ['platform-info'],
    queryFn: fetchPlatformInfo,
    staleTime: 5 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
    meta: { refresh: false },        // not fetched again after every save in the app: only the console's change it
  })
  return data ?? PLATFORM_DEFAULTS
}

/** wa.me link for a WhatsApp number ("+91 98300 12345" → https://wa.me/919830012345). */
export function whatsappLink(number?: string | null): string | null {
  const digits = (number ?? '').replace(/\D/g, '')
  return digits.length >= 8 ? `https://wa.me/${digits}` : null
}

/** tel: link for a phone number. */
export function phoneLink(number?: string | null): string | null {
  const n = (number ?? '').replace(/[^\d+]/g, '')
  return n.replace(/\D/g, '').length >= 8 ? `tel:${n}` : null
}
