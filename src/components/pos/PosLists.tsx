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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Play, Printer, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { posApi } from '@/lib/api/store'
import { apiError } from '@/lib/apiError'
import { inr } from '@/lib/money'
import type { HeldBill, Receipt } from '@/types/store'

const time = (iso: string) => new Date(/([zZ]|[+-]\d{2}:?\d{2})$/.test(iso) ? iso : iso + '+05:30')
  .toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

/** How many lines a held bill has, from its saved cart (a cart that can't be read counts none). */
export function heldLines(h: HeldBill): number {
  try { const v = JSON.parse(h.cart); return Array.isArray(v?.lines) ? v.lines.length : 0 } catch { return 0 }
}

/** Bills put on hold at this counter (a customer who went to fetch something): take one back up, or drop it. */
export function HeldBills({ registerId, onRecall, onClose }: { registerId: string; onRecall: (h: HeldBill) => void; onClose: () => void }) {
  const qc = useQueryClient()
  const { data: held = [], isLoading } = useQuery({ queryKey: ['pos-held', registerId], queryFn: () => posApi.held(registerId) })
  const drop = useMutation({
    mutationFn: (id: string) => posApi.dropHeld(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pos-held', registerId] }),
    onError: (e: any) => toast.error(apiError(e, 'The held bill could not be removed')),
  })
  return (
    <Modal open onClose={onClose} title="Held bills" subtitle="Bills put aside at this counter. Taking one up puts it back on the screen." size="md">
      <div className="space-y-2" data-testid="pos-held">
        {isLoading ? <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p>
          : held.length === 0 ? <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No bills are on hold.</p>
          : held.map(h => (
            <div key={h.id} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5" style={{ border: '1px solid var(--border)' }}>
              <div><p className="font-medium">{h.label}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{heldLines(h)} line{heldLines(h) === 1 ? '' : 's'} · {time(h.at)}{h.by ? ` · ${h.by}` : ''}</p></div>
              <div className="flex gap-2">
                <button className="btn-primary h-9" onClick={() => onRecall(h)}><Play className="w-4 h-4" aria-hidden />Take up</button>
                <button className="btn-icon w-9 h-9" aria-label={`Remove ${h.label}`} disabled={drop.isPending} onClick={() => drop.mutate(h.id)}><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
      </div>
    </Modal>
  )
}

/** The shift's bills and returns, newest first; any receipt can be printed again. */
export function BillsList({ sessionId, onReceipt, onClose }: { sessionId: string; onReceipt: (r: Receipt) => void; onClose: () => void }) {
  const [page, setPage] = useState(0)
  const { data, isLoading } = useQuery({ queryKey: ['pos-bills', sessionId, page], queryFn: () => posApi.bills({ sessionId, page, size: 20 }) })
  const open = useMutation({
    mutationFn: (saleId: string) => posApi.receipt(saleId),
    onSuccess: r => onReceipt(r),
    onError: (e: any) => toast.error(apiError(e, 'The receipt could not be opened')),
  })
  const rows = data?.content ?? []
  return (
    <Modal open onClose={onClose} title="This shift's bills" subtitle="Bills and returns made on this shift. Open one to print its receipt again or send it on WhatsApp." size="lg">
      <div className="space-y-3" data-testid="pos-bills">
        {isLoading ? <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p>
          : rows.length === 0 ? <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No bills yet on this shift.</p> : (
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead><tr>{['Number', 'Time', 'Customer', 'Paid by', 'Total', ''].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map(b => (
                  <tr key={b.saleId} className="table-row">
                    <td className="table-cell font-mono">{b.number}{b.kind === 'RETURN' && <span className="badge ml-1.5" style={{ background: 'rgba(220,38,38,0.10)', color: '#b91c1c' }}>Return</span>}</td>
                    <td className="table-cell">{time(b.at)}</td>
                    <td className="table-cell">{b.customer}</td>
                    <td className="table-cell text-xs">{b.modes ?? ''}</td>
                    <td className="table-cell font-mono">{b.kind === 'RETURN' ? '−' : ''}{inr(b.total)}</td>
                    <td className="table-cell"><button className="btn-ghost h-8 text-xs" disabled={open.isPending} onClick={() => open.mutate(b.saleId)}><Printer className="w-3.5 h-3.5" aria-hidden />Receipt</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {(data?.totalPages ?? 0) > 1 && (
          <div className="flex justify-between items-center text-sm">
            <button className="btn-secondary h-9" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Newer</button>
            <span style={{ color: 'var(--text-muted)' }}>Page {page + 1} of {data?.totalPages}</span>
            <button className="btn-secondary h-9" disabled={page + 1 >= (data?.totalPages ?? 1)} onClick={() => setPage(p => p + 1)}>Older</button>
          </div>
        )}
      </div>
    </Modal>
  )
}
