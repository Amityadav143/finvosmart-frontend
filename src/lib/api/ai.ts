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

import { api } from './client'
import type { ApiResponse } from '@/types'

export const aiApi = {
  cashflow: {
    forecast: async () => (await api.get('/ai/cashflow/forecast')).data.data,
  },
  wellness: {
    scores: async (department?: string) =>
      (await api.get('/ai/wellness/scores', { params: { department } })).data.data ?? [],
    companySummary: async () => (await api.get('/ai/wellness/company-summary')).data.data ?? [],
  },
  scanner: {
    scan: async (file: File) => {
      const form = new FormData(); form.append('file', file)
      return (await api.post('/ai/scanner/scan', form, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data!
    },
    post: async (scanId: string, createJE: boolean) =>
      (await api.post('/ai/scanner/post', { scanId, createJournalEntry: createJE })).data.data,
  },
  voice: {
    command: async (audio: Blob, lang = 'auto') => {
      const form = new FormData(); form.append('audio', audio, 'command.webm'); form.append('lang', lang)
      return (await api.post('/voice/command', form, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data!
    },
    history: async () => (await api.get('/voice/history')).data.data ?? [],
  },
  gst: {
    reconcile: async (period: string) =>
      (await api.post('/gst/reconcile', null, { params: { period } })).data.data!,
  },
  whatsapp: {
    send: async (invoiceId: string, phone: string, name: string) =>
      (await api.post('/whatsapp/invoices/send', { invoiceId, recipientPhone: phone, recipientName: name, includePaymentLink: true })).data.data!,
    status: async (invoiceId: string) =>
      (await api.get(`/whatsapp/invoices/${invoiceId}/status`)).data.data ?? [],
    conversation: async (phone: string) =>
      (await api.get(`/whatsapp/conversations/${phone}`)).data.data,
  },
  // ── AI CFO — financial advisor ──────────────────────────────────────────
  cfo: {
    briefing: async () => (await api.get('/ai/cfo/briefing')).data.data,
    ask: async (question: string) => (await api.post('/ai/cfo/ask', { question })).data.data,
  },
  // ── Business Health Score ───────────────────────────────────────────────
  health: {
    report: async () => (await api.get('/ai/health-score')).data.data,
  },
  // ── AI Fraud Detection ──────────────────────────────────────────────────
  fraud: {
    scan: async () => (await api.get('/ai/fraud/scan')).data.data,
  },
}
