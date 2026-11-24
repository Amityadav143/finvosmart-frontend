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

/** pdf.js, loaded once when first needed, its worker served from /pdfjs (the same version). */
const WORKER = '/pdfjs/pdf.worker-6.5.438.min.mjs'
/** Its WebAssembly image decoders (JBIG2 and JPEG 2000 — common in scanned bills) and colour profiles, also from /pdfjs. */
export const PDFJS_WASM = '/pdfjs/wasm/'
export const PDFJS_ICC = '/pdfjs/iccs/'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let loader: Promise<any> | null = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function pdfjs(): Promise<any> {
  if (!loader) {
    loader = import('pdfjs-dist/legacy/build/pdf.mjs').then(m => {
      m.GlobalWorkerOptions.workerSrc = WORKER
      return m
    })
    loader.catch(() => { loader = null })
  }
  return loader
}
