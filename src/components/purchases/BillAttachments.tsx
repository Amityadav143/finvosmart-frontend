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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Download, Eye, FileText, Image as ImageIcon, Paperclip, Trash2, Upload } from 'lucide-react'
import { billsApi } from '@/lib/api/purchases'
import { ACCEPT, fileProblem, forKeeping } from '@/lib/billReader/read'
import { Modal } from '@/components/ui/Modal'
import { PdfViewer } from '@/components/pdf/PdfViewer'
import { apiError, downloadBlob, formatDate } from '@/lib/utils'
import type { BillAttachment } from '@/types/purchases'

const size = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)

/** The files kept with a bill or an expense — the supplier's invoice, the receipt: seen, saved, added, removed. */
export function BillAttachments({ billId, canEdit }: { billId: string; canEdit: boolean }) {
  const qc = useQueryClient()
  const input = useRef<HTMLInputElement>(null)
  const [viewing, setViewing] = useState<BillAttachment | null>(null)
  const [removing, setRemoving] = useState<BillAttachment | null>(null)
  const { data: files = [], isLoading, error } = useQuery({ queryKey: ['bill-attachments', billId], queryFn: () => billsApi.attachments(billId) })
  const refresh = () => qc.invalidateQueries({ queryKey: ['bill-attachments', billId] })

  const add = useMutation({
    mutationFn: async (f: File) => {
      const bad = fileProblem(f)
      if (bad) throw new Error(bad)
      return billsApi.attach(billId, await forKeeping(f))
    },
    onSuccess: a => { refresh(); toast.success(`${a.fileName} kept with it`) },
    onError: (e: unknown) => toast.error(e instanceof Error && !(e as any).response ? e.message : apiError(e, 'The file could not be kept')),
  })
  const remove = useMutation({
    mutationFn: (a: BillAttachment) => billsApi.detach(billId, a.id),
    onSuccess: () => { refresh(); setRemoving(null); toast.success('Removed') },
    onError: (e: unknown) => toast.error(apiError(e, 'The file could not be removed')),
  })
  const save = async (a: BillAttachment) => {
    try { downloadBlob(await billsApi.attachment(billId, a.id), a.fileName, { always: true }) }   // the company's own file, as uploaded
    catch (e) { toast.error(apiError(e, 'The file could not be downloaded')) }
  }

  return (
    <div className="card" data-testid="bill-attachments">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm flex items-center gap-1.5"><Paperclip size={14} />Invoice and receipts</h3>
        {canEdit && (
          <>
            <button type="button" className="btn-ghost h-8 text-xs" onClick={() => input.current?.click()} disabled={add.isPending} data-action="attach">
              <Upload size={13} />{add.isPending ? 'Keeping…' : 'Add a file'}
            </button>
            <input ref={input} type="file" hidden accept={ACCEPT} data-testid="attach-file"
              onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) add.mutate(f) }} />
          </>
        )}
      </div>
      {isLoading && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p>}
      {error && <p className="text-sm" style={{ color: '#dc2626' }}>{apiError(error, 'The files could not be loaded')}</p>}
      {!isLoading && !error && files.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No file kept yet{canEdit ? ' — add the supplier’s invoice or the receipt (PDF or photo).' : '.'}</p>
      )}
      <div className="space-y-1.5">
        {files.map(a => (
          <div key={a.id} className="rounded-xl px-3 py-2 text-sm flex items-center gap-2" style={{ background: 'var(--bg-surface)' }} data-testid="attachment">
            {a.contentType === 'application/pdf' ? <FileText size={15} aria-hidden /> : <ImageIcon size={15} aria-hidden />}
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium">{a.fileName}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{size(a.size)} · {formatDate(a.uploadedAt)}{a.uploadedBy ? ` · ${a.uploadedBy}` : ''}</p>
            </div>
            <button type="button" className="btn-icon w-8 h-8" aria-label={`Show ${a.fileName}`} onClick={() => setViewing(a)}><Eye size={14} /></button>
            <button type="button" className="btn-icon w-8 h-8" aria-label={`Save ${a.fileName}`} onClick={() => save(a)}><Download size={14} /></button>
            {canEdit && <button type="button" className="btn-icon w-8 h-8" aria-label={`Remove ${a.fileName}`} onClick={() => setRemoving(a)}><Trash2 size={14} /></button>}
          </div>
        ))}
      </div>
      {viewing && <Viewer billId={billId} file={viewing} onClose={() => setViewing(null)} />}
      {removing && (
        <Modal open onClose={() => setRemoving(null)} title={`Remove ${removing.fileName}?`} size="sm">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>It is no longer kept with this bill. The bill and its entries stay as they are.</p>
          <div className="flex justify-end gap-2 mt-4">
            <button className="btn-secondary h-9" onClick={() => setRemoving(null)}>Keep it</button>
            <button className="btn-primary h-9" style={{ background: '#dc2626' }} disabled={remove.isPending} onClick={() => remove.mutate(removing)} data-action="confirm-remove">Remove</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

/** A kept file, shown in place: a PDF drawn page by page, a photo as it is. */
function Viewer({ billId, file, onClose }: { billId: string; file: BillAttachment; onClose: () => void }) {
  const { data, error } = useQuery({ queryKey: ['bill-attachment', billId, file.id], queryFn: () => billsApi.attachment(billId, file.id), staleTime: 300_000 })
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!data || file.contentType === 'application/pdf') return
    const u = URL.createObjectURL(data)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [data, file.contentType])
  return (
    <Modal open onClose={onClose} title={file.fileName} size="lg">
      {error && <p className="text-sm" style={{ color: '#dc2626' }}>{apiError(error, 'The file could not be loaded')}</p>}
      {!error && !data && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p>}
      {data && file.contentType === 'application/pdf' && <PdfViewer data={data} title={file.fileName} maxWidth={760} testId="attachment-pdf" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {data && url && <img src={url} alt={file.fileName} style={{ maxWidth: '100%', height: 'auto', borderRadius: 8 }} data-testid="attachment-image" />}
    </Modal>
  )
}
