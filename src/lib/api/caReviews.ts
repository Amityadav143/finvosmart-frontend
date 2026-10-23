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
import { api } from './client'

/** What can be sent to the accountant for review. */
export type ReviewDocType = 'INVOICE' | 'BILL' | 'JOURNAL'
export type ReviewStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED'
export type ReviewDecision = 'approve' | 'reject' | 'request-changes'

export interface DocReview {
  id: string
  entityType: ReviewDocType | string
  entityId: string
  entityLabel?: string
  status: ReviewStatus
  makerId?: string; makerName?: string; makerNote?: string
  checkerId?: string; checkerName?: string; checkerNote?: string
  createdAt?: string; updatedAt?: string
}

export interface ReviewCounts { pendingReview: number; approved: number; rejected: number; changesRequested: number }

export const caReviewsApi = {
  /** The latest review of one document, or null. */
  forDocument: async (type: ReviewDocType, id: string): Promise<DocReview | null> =>
    (await api.get('/ca/reviews/for', { params: { type, id } })).data.data ?? null,
  send: async (type: ReviewDocType, id: string, note: string): Promise<DocReview> =>
    (await api.post('/ca/reviews', { entityType: type, entityId: id, makerNote: note })).data.data,
  list: async (status?: ReviewStatus): Promise<DocReview[]> =>
    (await api.get('/ca/reviews', { params: { status: status || undefined, size: 100 } })).data.data?.content ?? [],
  counts: async (): Promise<ReviewCounts> => (await api.get('/ca/reviews/counts')).data.data,
  decide: async (id: string, decision: ReviewDecision, note: string): Promise<DocReview> =>
    (await api.post(`/ca/reviews/${id}/${decision}`, { checkerNote: note })).data.data,
}

/** Where a reviewed document opens. */
export function reviewLink(type: string, id: string): string {
  switch (type) {
    case 'INVOICE': return `/invoicing/${id}`
    case 'BILL': return `/purchases/bills/${id}`
    case 'JOURNAL': return `/finance/vouchers?open=${id}`
    default: return '/ca-workspace'
  }
}

export const REVIEW_STATUS: Record<ReviewStatus, { label: string; color: string; bg: string }> = {
  PENDING_REVIEW:    { label: 'Waiting for review', color: '#B45309', bg: 'rgba(217,119,6,0.12)' },
  CHANGES_REQUESTED: { label: 'Changes asked for',  color: '#1D4ED8', bg: 'rgba(37,99,235,0.12)' },
  APPROVED:          { label: 'Approved',           color: '#047857', bg: 'rgba(5,150,105,0.12)' },
  REJECTED:          { label: 'Rejected',           color: '#B91C1C', bg: 'rgba(220,38,38,0.12)' },
}
