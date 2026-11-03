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
import { useQuery } from '@tanstack/react-query'
import { industryApi } from '@/lib/api/industry'
import { useAuthStore } from '@/lib/store/slices/authStore'

/** Invalidate this (it is a prefix) after a template is applied or the menu is changed. */
export const INDUSTRY_KEY = ['industry-current'] as const

/**
 * How the app is lined up for the company's sector: which menu entries are on, and the words used for
 * them ("Patients" for customers in a clinic). Until it has loaded — or if it can't be — everything shows
 * with the usual words, as before templates existed.
 */
export function useIndustry() {
  const { user } = useAuthStore()
  const q = useQuery({
    queryKey: [...INDUSTRY_KEY, user?.companyId ?? ''],
    queryFn: industryApi.current,
    enabled: !!user,
    staleTime: 5 * 60_000,
    retry: 1,
  })
  const cur = q.data
  const hidden = new Set(cur?.hidden ?? [])
  return {
    current: cur,
    loading: q.isLoading,
    /** Whether a menu entry is switched on (entries no template can switch off always are). */
    visible: (href: string) => !hidden.has(href),
    /** The plural word for a menu entry ("Patients"), or the usual one. */
    name: (key: string, usual: string) => cur?.labels?.[key]?.plural ?? usual,
    /** The singular word ("Patient"), or the usual one. */
    one: (key: string, usual: string) => cur?.labels?.[key]?.singular ?? usual,
  }
}
