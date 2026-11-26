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

import { useEffect } from 'react'
import Link from 'next/link'
import { Download, Lock, Printer, Send, Sparkles } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { DEFAULT_DOCUMENTS_MESSAGE, useDocumentsGate } from '@/lib/billing/documentsGate'

/**
 * Keeps the documents rule of the plan status (whether documents may leave Finvosmart now) where the download,
 * print and send helpers can ask it, and — without a plan — stops the browser's own Print (Ctrl+P) from printing the
 * page, saying why on the paper instead. Mounted once, in the app frame.
 */
export function DocumentsGate() {
  const { data: s } = useSubscription()
  const setPlan = useDocumentsGate(g => g.setPlan)
  const locked = !!s && s.documentsAllowed === false
  useEffect(() => { setPlan(locked, s?.documentsMessage ?? null) }, [locked, s?.documentsMessage, setPlan])
  if (!locked) return null
  return (
    <style media="print" data-testid="print-guard">{`
      body * { display: none !important; }
      body::before {
        content: "Printing comes with a Finvosmart plan. Choose a plan under Settings → Subscription to print, download and send your documents — everything you made is kept.";
        display: block; padding: 48px; font: 16px/1.5 sans-serif; color: #111;
      }
    `}</style>
  )
}

/** Says why a document can't leave Finvosmart now, and how to get a plan (or who can). */
export function DocumentsDialog() {
  const { open, message, close } = useDocumentsGate()
  const { data: s } = useSubscription()
  const { can } = usePermissions()
  const admin = can('SETTINGS_COMPANY')
  const trial = s?.access === 'TRIAL'
  return (
    <Modal open={open} onClose={close} size="sm"
      title={trial ? 'Downloads come with a plan' : 'Choose a plan to carry on'}
      subtitle={trial ? 'Your free trial includes everything inside Finvosmart' : undefined}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className="btn-secondary h-9" onClick={close} data-testid="documents-dialog-close">Not now</button>
          {admin && (
            <Link href="/settings/subscription" className="btn-primary h-9" style={{ textDecoration: 'none' }} onClick={close}
              data-testid="documents-dialog-plans">
              <Sparkles size={14} /> See the plans
            </Link>
          )}
        </div>
      }>
      <div className="space-y-3 text-sm" data-testid="documents-dialog" role="alert">
        <p className="flex items-center gap-2 font-semibold" style={{ color: 'var(--gold)' }}>
          <Lock size={15} aria-hidden /> <span><Download size={14} className="inline" aria-hidden /> Download · <Printer size={14} className="inline" aria-hidden /> Print · <Send size={14} className="inline" aria-hidden /> Send</span>
        </p>
        <p style={{ color: 'var(--text-secondary)' }} data-testid="documents-dialog-message">{message || DEFAULT_DOCUMENTS_MESSAGE}</p>
        {trial && (
          <p style={{ color: 'var(--text-muted)' }}>
            Nothing is lost: every invoice, bill and report you make now can be downloaded, printed and sent the moment you subscribe —
            and subscribing during the trial keeps its free days.
          </p>
        )}
        {!admin && (
          <p style={{ color: 'var(--text-muted)' }} data-testid="documents-dialog-ask">
            Your company&apos;s administrator can choose a plan under Settings → Subscription.
          </p>
        )}
      </div>
    </Modal>
  )
}
