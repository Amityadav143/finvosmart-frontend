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

import { useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileCheck2, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { caReviewsApi, REVIEW_STATUS, type ReviewDocType } from '@/lib/api/caReviews'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { timeAgo } from '@/lib/notifications'
import { apiError } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'

const NOUN: Record<ReviewDocType, string> = { INVOICE: 'invoice', BILL: 'bill', JOURNAL: 'journal entry' }

/**
 * Review by the accountant, shown on the document itself: where it stands (waiting, approved,
 * changes asked for, rejected — with the reviewer's note) and a button to send it for review.
 */
export function DocumentReview({ type, id }: { type: ReviewDocType; id: string }) {
  const qc = useQueryClient()
  const { can, canAny } = usePermissions()
  const maySend = type === 'INVOICE' ? canAny('INVOICE_CREATE', 'INVOICE_EDIT', 'FINANCE_CREATE')
               : type === 'BILL' ? canAny('PROCUREMENT_CREATE', 'FINANCE_CREATE')
               : can('FINANCE_CREATE')
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')

  const { data: review, isError } = useQuery({
    queryKey: ['doc-review', type, id],
    queryFn: () => caReviewsApi.forDocument(type, id),
    enabled: !!id, retry: false, staleTime: 30_000,
  })
  const send = useMutation({
    mutationFn: () => caReviewsApi.send(type, id, note.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doc-review', type, id] })
      qc.invalidateQueries({ queryKey: ['ca-reviews'] })
      setOpen(false); setNote('')
      toast.success('Sent for review — the reviewers have been told')
    },
    onError: (e: any) => toast.error(apiError(e, 'It could not be sent for review')),
  })

  if (isError || (!review && !maySend)) return null
  const meta = review ? REVIEW_STATUS[review.status] : null
  const waiting = review?.status === 'PENDING_REVIEW'
  const who = review?.checkerName ? ` by ${review.checkerName}` : ''
  const label = !review ? null
    : review.status === 'PENDING_REVIEW' ? 'Waiting for review'
    : review.status === 'APPROVED' ? `Approved${who}`
    : review.status === 'REJECTED' ? `Rejected${who}`
    : `Changes asked for${who}`

  return (
    <div data-testid="doc-review" className="flex items-center gap-2 flex-wrap">
      {review && meta && (
        <span data-testid="review-chip" title={review.checkerNote || review.makerNote || ''}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '100px',
            fontSize: '12px', fontWeight: 600, background: meta.bg, color: meta.color, maxWidth: '100%' }}>
          <FileCheck2 size={13} />
          <span>{label}</span>
          {review.checkerNote && review.status !== 'PENDING_REVIEW' && (
            <span style={{ fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '320px' }}>— {review.checkerNote}</span>
          )}
          {waiting && review.updatedAt && <span style={{ fontWeight: 400 }}>· sent {timeAgo(review.updatedAt)}</span>}
        </span>
      )}
      {maySend && !waiting && (
        <button type="button" data-testid="send-for-review" className="btn-secondary h-8 text-xs" onClick={() => setOpen(true)}>
          <Send size={13} /> {review ? 'Send for review again' : 'Send for review'}
        </button>
      )}
      {waiting && can('FINANCE_APPROVE') && (
        <Link href="/ca-workspace" className="text-xs" style={{ color: 'var(--gold)', fontWeight: 600 }}>Review it</Link>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Send for review"
        subtitle={`Your accountant (anyone who approves accounts) checks this ${NOUN[type]} and approves it, asks for changes or rejects it. You'll get a notification either way.`}>
        <label className="label" htmlFor="doc-review-note">Note for the reviewer (optional)</label>
        <textarea id="doc-review-note" className="input" rows={3} maxLength={500} value={note}
          placeholder={review?.status === 'CHANGES_REQUESTED' ? 'What you changed' : 'e.g. First invoice to this customer — please check the place of supply'}
          onChange={e => setNote(e.target.value)} />
        <div className="flex justify-end gap-2" style={{ marginTop: '16px' }}>
          <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button type="button" className="btn-primary" disabled={send.isPending} onClick={() => send.mutate()}>
            {send.isPending ? 'Sending…' : 'Send for review'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
