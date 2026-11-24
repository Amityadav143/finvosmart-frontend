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

import { useEffect, useRef, useState } from 'react'
import { Modal } from '@/components/ui/Modal'

const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'code_93', 'itf', 'codabar', 'qr_code']

/** Whether this browser can read barcodes from the camera (the BarcodeDetector of Chrome on Android, Edge and others). */
export function cameraScanAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && 'BarcodeDetector' in window && !!navigator.mediaDevices?.getUserMedia
  } catch {
    return false
  }
}

/**
 * Scanning with the phone's or tablet's camera: each code read is handed over once (the same code again after a
 * pause, for a second piece). A USB or Bluetooth barcode scanner needs none of this — it types into the search box.
 */
export function CameraScan({ onCode, onClose }: { onCode: (code: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const handler = useRef(onCode)
  handler.current = onCode
  const [error, setError] = useState<string | null>(null)
  const [last, setLast] = useState<string | null>(null)

  useEffect(() => {
    let stream: MediaStream | null = null
    let timer: ReturnType<typeof setTimeout> | undefined
    let stopped = false
    const seen = new Map<string, number>()
    ;(async () => {
      try {
        const BD = (window as any).BarcodeDetector
        let formats = FORMATS
        try {
          const have: string[] = await BD.getSupportedFormats()
          if (Array.isArray(have) && have.length) formats = FORMATS.filter(f => have.includes(f))
        } catch { /* every format asked for */ }
        const detector = new BD({ formats })
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
        if (stopped) { stream.getTracks().forEach(t => t.stop()); return }
        const v = video.current
        if (!v) return
        v.srcObject = stream
        await v.play()
        const tick = async () => {
          if (stopped) return
          try {
            const found = await detector.detect(v)
            const code: string | undefined = found?.[0]?.rawValue?.trim()
            const now = Date.now()
            if (code && now - (seen.get(code) ?? 0) > 1500) {
              seen.set(code, now)
              setLast(code)
              try { navigator.vibrate?.(60) } catch { /* no vibration */ }
              handler.current(code)
            }
          } catch { /* a frame that could not be read */ }
          timer = setTimeout(tick, 180)
        }
        tick()
      } catch (e: any) {
        setError(e?.name === 'NotAllowedError'
          ? 'The camera was not allowed. Allow it for this site in the browser, then try again.'
          : 'The camera could not be started on this device. Use a barcode scanner or type the code.')
      }
    })()
    return () => {
      stopped = true
      if (timer) clearTimeout(timer)
      stream?.getTracks().forEach(t => t.stop())
    }
  }, [])

  return (
    <Modal open onClose={onClose} title="Scan with the camera" subtitle="Hold the barcode inside the frame. Each item scanned goes on the bill." size="sm">
      {error ? <p className="text-sm" role="alert" style={{ color: '#b91c1c' }}>{error}</p> : (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3]">
            <video ref={video} className="w-full h-full object-cover" muted playsInline aria-label="Camera" />
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-24 rounded-lg pointer-events-none" style={{ border: '2px solid rgba(255,255,255,0.85)' }} aria-hidden />
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }} aria-live="polite">{last ? `Last read: ${last}` : 'Waiting for a barcode…'}</p>
        </div>
      )}
      <div className="flex justify-end pt-3"><button className="btn-secondary h-10" onClick={onClose}>Done</button></div>
    </Modal>
  )
}
