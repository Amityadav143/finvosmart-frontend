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

// On its own (no dependencies), so plain-TS checks can load it too.

/**
 * A file was asked for (an export, a PDF: responseType 'blob') and the server answered with its JSON explanation
 * instead: the answer is read in place, so the page shows the server's own words (apiError) rather than a general
 * sentence. Anything else — a file, an answer that isn't JSON after all — is left as it came.
 */
export async function readFileError(err: any): Promise<void> {
  const body = err?.response?.data
  if (typeof Blob === 'undefined' || !(body instanceof Blob) || !/json/i.test(body.type || '')) return
  try { err.response.data = JSON.parse(await body.text()) } catch { /* not JSON after all: left as it came */ }
}
