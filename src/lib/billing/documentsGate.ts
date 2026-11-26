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

import { create } from 'zustand'

/**
 * Documents leave Finvosmart with a plan: downloading, printing, exporting and sending to customers or suppliers. The
 * server is the judge (402, reason PLAN_FOR_DOCUMENTS); this keeps what it said (DocumentsGate sets it from the plan
 * status) so a file the browser makes itself (a CSV of a list, a print) is held back the same way, and the dialog that
 * says why — instead of a file that never comes. A server older than this sends no rule: nothing is held back.
 */
export const DOCUMENTS_REASON = 'PLAN_FOR_DOCUMENTS'
export const DEFAULT_DOCUMENTS_MESSAGE =
  'Downloading, printing and sending documents come with a plan. Everything you make in Finvosmart is kept, ready for when you choose one.'

interface DocumentsGateState {
  /** documents can't leave now (the free trial, or after a trial or plan) */
  locked: boolean
  /** the server's words for why */
  message: string | null
  /** the dialog is open */
  open: boolean
  setPlan: (locked: boolean, message: string | null) => void
  show: (message?: string | null) => void
  close: () => void
}

export const useDocumentsGate = create<DocumentsGateState>((set, get) => ({
  locked: false,
  message: null,
  open: false,
  setPlan: (locked, message) => set({ locked, message }),
  show: (message) => set({ open: true, message: message || get().message || DEFAULT_DOCUMENTS_MESSAGE }),
  close: () => set({ open: false }),
}))

/**
 * Asked before a download, a print, an export or a send: true when it may go ahead; otherwise the dialog says why
 * (and how to get a plan) and it is false.
 */
export function documentsAllowed(): boolean {
  const s = useDocumentsGate.getState()
  if (!s.locked) return true
  s.show()
  return false
}

/**
 * As documentsAllowed, for helpers whose callers go on after them (a download wrapper awaited, then "Downloaded"): it
 * throws what the server would have answered (402, PLAN_FOR_DOCUMENTS) — a caller's catch then says nothing more,
 * the dialog having said it (app/providers.tsx).
 */
export function requireDocuments(): void {
  if (documentsAllowed()) return
  const message = useDocumentsGate.getState().message || DEFAULT_DOCUMENTS_MESSAGE
  const err: any = new Error(message)
  err.response = { status: 402, data: { success: false, error: message, reason: DOCUMENTS_REASON } }
  err.documentsRefused = true
  throw err
}

/** A refusal from the server for a document without a plan: the dialog says it, in the server's words. */
export function showDocumentsRefusal(message?: string | null) {
  const s = useDocumentsGate.getState()
  s.setPlan(true, message || s.message)
  s.show(message)
}
