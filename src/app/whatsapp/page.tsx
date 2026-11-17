'use client'
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

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { MessageCircle, Send, CheckCircle, AlertTriangle } from 'lucide-react'
import { api } from '@/lib/api/client'
import { apiError } from '@/lib/utils'
import { useDebounce } from '@/lib/hooks'

interface InvoiceRow { id: string; invoiceNumber: string; status: string }
const SENDABLE = (s: string) => s !== 'DRAFT' && s !== 'CANCELLED'
const PHONE_RE = /^(\+?91[\s-]?)?0?[6-9]\d{4}[\s-]?\d{5}$|^\+?[1-9]\d{10,14}$/

export default function WhatsAppPage() {
  const [form, setForm] = useState({ invoiceId: '', recipientName: '', recipientPhone: '' })
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: () => api.get('/whatsapp/status').then(r => r.data.data as { configured: boolean; invoiceTemplate: string }),
  })
  // the latest invoices, or those matching a search by number or customer — so an older one can be sent too
  const [find, setFind] = useState('')
  const q = useDebounce(find.trim(), 300)
  const { data: invoices = [], isFetching: finding } = useQuery<InvoiceRow[]>({
    queryKey: ['whatsapp-invoices', q],
    queryFn: () => api.get('/invoices', { params: { page: 0, size: 50, query: q || undefined } })
      .then(r => ((r.data.data?.content ?? []) as InvoiceRow[]).filter(i => SENDABLE(String(i.status)))),
  })
  const send = useMutation({
    mutationFn: () => api.post('/whatsapp/invoices/send', {
      invoiceId: form.invoiceId,
      recipientPhone: form.recipientPhone.trim(),
      recipientName: form.recipientName.trim() || undefined,
    }).then(r => r.data.data),
    onSuccess: () => { toast.success('Accepted by WhatsApp for delivery'); setForm(f => ({ ...f, recipientPhone: '' })) },
    onError: (e: any) => toast.error(apiError(e, 'Could not send on WhatsApp')),
  })
  const onSend = () => {
    if (!form.invoiceId) { toast.error('Choose an invoice'); return }
    if (!PHONE_RE.test(form.recipientPhone.trim())) { toast.error('Enter a valid WhatsApp number, e.g. 98765 43210'); return }
    send.mutate()
  }
  const configured = !!status?.configured

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">WhatsApp</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Send invoices to customers on WhatsApp</p>
      </div>

      {!statusLoading && (configured ? (
        <div className="card flex items-start gap-3" style={{ borderColor: '#22c55e55' }}>
          <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#22c55e' }} />
          <div className="text-sm">
            <p className="font-semibold">WhatsApp is connected</p>
            <p style={{ color: 'var(--text-muted)' }}>Invoices are sent with your approved template “{status?.invoiceTemplate}”.</p>
          </div>
        </div>
      ) : (
        <div className="card flex items-start gap-3" style={{ borderColor: '#f59e0b55' }}>
          <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: '#f59e0b' }} />
          <div className="text-sm" style={{ lineHeight: 1.6 }}>
            <p className="font-semibold mb-1">WhatsApp isn&apos;t set up yet</p>
            <p style={{ color: 'var(--text-muted)' }}>To send invoices on WhatsApp, your administrator needs to:</p>
            <ol className="list-decimal pl-5 mt-1" style={{ color: 'var(--text-muted)' }}>
              <li>Create a WhatsApp Business account on Meta and register a phone number.</li>
              <li>Get a message template approved with four variables: customer name, invoice number, amount and due date.</li>
              <li>Add the phone number ID, access token and template name to the server settings.</li>
            </ol>
          </div>
        </div>
      ))}

      <div className="card max-w-xl">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><MessageCircle className="w-4 h-4" style={{ color: '#22c55e' }} />Send an invoice</h3>
        <div className="space-y-3">
          <div>
            <label className="label" htmlFor="wa-find">Invoice</label>
            <input id="wa-find" className="input h-10 mb-2" type="search" placeholder="Search by invoice number or customer"
                   value={find} onChange={e => setFind(e.target.value)} />
            <select id="wa-invoice" aria-label="Invoice to send" className="input h-10" value={form.invoiceId} onChange={e => setForm(f => ({ ...f, invoiceId: e.target.value }))}>
              <option value="">{finding ? 'Looking…' : invoices.length ? (q ? 'Choose a matching invoice…' : 'Choose one of the latest invoices…')
                : q ? 'No issued invoice matches — try its number or the customer’s name' : 'No issued invoice among the latest — search for it above'}</option>
              {invoices.map(i => <option key={i.id} value={i.id}>{i.invoiceNumber} · {String(i.status).toLowerCase()}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Customer&apos;s WhatsApp number</label>
            <input className="input h-10" inputMode="tel" placeholder="98765 43210" value={form.recipientPhone}
                   onChange={e => setForm(f => ({ ...f, recipientPhone: e.target.value }))} />
          </div>
          <div>
            <label className="label">Name to greet <span style={{ color: 'var(--text-muted)' }}>(optional — defaults to the invoice&apos;s customer)</span></label>
            <input className="input h-10" value={form.recipientName} onChange={e => setForm(f => ({ ...f, recipientName: e.target.value }))} />
          </div>
          <button className="btn-primary h-10 text-sm w-full" disabled={!configured || send.isPending} onClick={onSend}>
            <Send className="w-4 h-4" />{send.isPending ? 'Sending…' : 'Send on WhatsApp'}
          </button>
          {!configured && !statusLoading && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sending is switched off until WhatsApp is set up.</p>
          )}
        </div>
      </div>
    </div>
  )
}
