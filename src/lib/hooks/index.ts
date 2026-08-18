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

import { useState, useEffect, useCallback, useRef } from 'react'

export function useDebounce<T>(value: T, delay = 400): T {
  const [dv, setDv] = useState<T>(value)
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return dv
}

export function useLocalStorage<T>(key: string, initial: T): [T, (val: T) => void] {
  const [stored, setStored] = useState<T>(() => {
    if (typeof window === 'undefined') return initial
    try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : initial }
    catch { return initial }
  })
  const setValue = useCallback((val: T) => {
    setStored(val)
    if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(val))
  }, [key])
  return [stored, setValue]
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(query)
    setMatches(mq.matches)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [query])
  return matches
}

export function useClickOutside(ref: React.RefObject<HTMLElement>, handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) handler() }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [ref, handler])
}

export function useCountUp(target: number, delay = 0, duration = 600) {
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
