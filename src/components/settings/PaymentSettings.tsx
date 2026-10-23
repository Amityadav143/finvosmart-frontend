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

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Banknote, BellRing, CreditCard, FileText, QrCode, Save, ShieldCheck } from 'lucide-react'
import { companyPaymentsApi, type CompanyPaymentSettings } from '@/lib/api/invoicing'
import { apiError } from '@/lib/utils'

const VPA = /^[a-zA-Z0-9][a-zA-Z0-9._-]{1,255}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/
const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/
const UDYAM = /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/

type Form = Required<Pick<CompanyPaymentSettings, 'upiId' | 'upiPayeeName' | 'bankName' | 'bankAccountName' | 'bankAccountNumber' | 'bankIfsc'
  | 'bankBranch' | 'udyamNumber' | 'msmeCategory' | 'msmeActivity' | 'defaultPaymentTerms' | 'invoiceTerms' | 'invoiceNotes'>> & { remindersEnabled: boolean }
const KEYS = ['upiId', 'upiPayeeName', 'bankName', 'bankAccountName', 'bankAccountNumber', 'bankIfsc', 'bankBranch', 'udyamNumber',
  'msmeCategory', 'msmeActivity', 'defaultPaymentTerms', 'invoiceTerms', 'invoiceNotes'] as const

function check(f: Form): string | null {
  if (f.upiId && !VPA.test(f.upiId.trim())) return 'UPI ID: enter it like yourbusiness@okhdfcbank'
  if (f.bankAccountNumber && !/^\d{9,18}$/.test(f.bankAccountNumber.replace(/[\s-]/g, ''))) return 'Bank account number: 9 to 18 digits'
  if (f.bankAccountNumber && !f.bankIfsc) return 'Add the IFSC of the branch'
  if (f.bankIfsc && !IFSC.test(f.bankIfsc.trim().toUpperCase())) return 'IFSC: 11 characters like HDFC0001234 (the fifth is a zero)'
  if (f.udyamNumber && !UDYAM.test(f.udyamNumber.trim().toUpperCase())) return 'Udyam number: like UDYAM-MH-19-0012345'
  if (f.msmeCategory && !f.udyamNumber) return 'Add your Udyam registration number for the MSME category to apply'
  return null
}

export function PaymentSettings() {
  const qc = useQueryClient()
  const { data, isLoading, isError } = useQuery({ queryKey: ['company-payments'], queryFn: companyPaymentsApi.get })
  const [f, setF] = useState<Form | null>(null)
  const [keys, setKeys] = useState({ keyId: '', keySecret: '', webhookSecret: '' })
  useEffect(() => {
    if (data) setF({ ...(Object.fromEntries(KEYS.map(k => [k, (data as any)[k] ?? ''])) as any), remindersEnabled: data.remindersEnabled !== false })
  }, [data])

  const save = useMutation({
    mutationFn: () => companyPaymentsApi.save({ ...f!, bankAccountNumber: f!.bankAccountNumber.replace(/[\s-]/g, ''), bankIfsc: f!.bankIfsc.toUpperCase(), udyamNumber: f!.udyamNumber.toUpperCase() }),
    onSuccess: d => { qc.setQueryData(['company-payments'], d); qc.invalidateQueries({ queryKey: ['company'] }); toast.success('Saved — new invoices will carry these details') },
    onError: (e: any) => toast.error(apiError(e, 'Could not save')),
  })
  const connect = useMutation({
    mutationFn: () => companyPaymentsApi.connectRazorpay(keys),
    onSuccess: r => { qc.setQueryData(['company-payments'], (d: any) => ({ ...d, razorpay: r })); setKeys({ keyId: '', keySecret: '', webhookSecret: '' }); toast.success('Razorpay connected') },
    onError: (e: any) => toast.error(apiError(e, 'Could not connect Razorpay')),
  })
  const disconnect = useMutation({
    mutationFn: companyPaymentsApi.disconnectRazorpay,
    onSuccess: r => { qc.setQueryData(['company-payments'], (d: any) => ({ ...d, razorpay: r })); toast.success('Razorpay disconnected') },
  })

  if (isLoading || !f) return <div className="card text-sm" style={{ color: isError ? '#ef4444' : 'var(--text-muted)' }}>{isError ? 'Could not load payment settings. Only company administrators can change them.' : 'Loading…'}</div>
  const set = (k: keyof Form) => (e: any) => setF(x => ({ ...x!, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const err = check(f)
  const rp = data?.razorpay
  const input = (label: string, k: keyof Form, placeholder = '', mono = false, hint?: string) => (
    <div>
      <label className="label">{label}</label>
      <input className={`input h-10${mono ? ' font-mono' : ''}`} value={String(f[k] ?? '')} placeholder={placeholder} onChange={set(k)} />
      {hint && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><QrCode className="w-4 h-4" style={{ color: 'var(--gold)' }} />UPI</h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>Every invoice gets a UPI QR code for the balance due. Customers scan it with any UPI app and the money comes straight to you — no fees, no gateway.</p>
          {input('Your UPI ID', 'upiId', 'yourbusiness@okhdfcbank', true, 'Use your business current account UPI ID (from your bank or a merchant app).')}
          {input('Name shown in the payer\'s app', 'upiPayeeName', 'Defaults to your company name')}
        </div>
        <div className="card space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><Banknote className="w-4 h-4" style={{ color: 'var(--gold)' }} />Bank account (for NEFT / RTGS / IMPS)</h3>
          {input('Account holder name', 'bankAccountName', 'As in the bank records')}
          <div className="grid grid-cols-2 gap-3">
            {input('Account number', 'bankAccountNumber', '50200012345678', true)}
            {input('IFSC', 'bankIfsc', 'HDFC0001234', true)}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {input('Bank', 'bankName', 'HDFC Bank')}
            {input('Branch', 'bankBranch', 'Andheri West')}
          </div>
        </div>
        <div className="card space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><ShieldCheck className="w-4 h-4" style={{ color: 'var(--gold)' }} />MSME (Udyam) registration</h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Micro and small enterprises must be paid within 45 days (MSMED Act, Section 15), and buyers can claim the expense only once they pay (Income-tax Act).
            With your Udyam number, invoices carry a note saying so — it helps you get paid on time.
          </p>
          {input('Udyam registration number', 'udyamNumber', 'UDYAM-MH-19-0012345', true)}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Category</label>
              <select className="input h-10" value={f.msmeCategory} onChange={set('msmeCategory')}>
                <option value="">Not registered</option><option value="MICRO">Micro</option><option value="SMALL">Small</option><option value="MEDIUM">Medium</option>
              </select></div>
            <div><label className="label">Activity</label>
              <select className="input h-10" value={f.msmeActivity} onChange={set('msmeActivity')}>
                <option value="">—</option><option value="MANUFACTURING">Manufacturing</option><option value="SERVICES">Services</option><option value="TRADING">Trading</option>
              </select></div>
          </div>
          {data?.msmeNotePreview && <p className="text-xs rounded-lg p-2.5" style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>Printed on invoices: “{data.msmeNotePreview}”</p>}
          {f.msmeCategory === 'MEDIUM' && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>The 45-day rule covers micro and small enterprises; medium enterprises get no note.</p>}
        </div>
        <div className="card space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><FileText className="w-4 h-4" style={{ color: 'var(--gold)' }} />Invoice defaults</h3>
          <div><label className="label">Payment terms</label>
            <select className="input h-10" value={f.defaultPaymentTerms} onChange={set('defaultPaymentTerms')}>
              <option value="">30 days (standard)</option>
              {['Due on receipt', 'Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Net 90'].map(t => <option key={t} value={t}>{t.replace('Net ', '') + (t.startsWith('Net') ? ' days' : '')}</option>)}
            </select></div>
          <div><label className="label">Notes on every invoice</label><textarea className="input" rows={2} value={f.invoiceNotes} onChange={set('invoiceNotes')} placeholder="Thank you for your business." /></div>
          <div><label className="label">Terms and conditions</label><textarea className="input" rows={3} value={f.invoiceTerms} onChange={set('invoiceTerms')} placeholder="Interest at 18% p.a. on payments received after the due date. Subject to Mumbai jurisdiction." /></div>
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="mt-0.5" checked={f.remindersEnabled} onChange={set('remindersEnabled')} />
            <span><BellRing className="w-3.5 h-3.5 inline mr-1" />Send payment reminders automatically
              <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>Polite emails 3 days before the due date, on it, then 3 and 10 days after and every two weeks (six at most). Turn off per customer from the customer's page.</span></span>
          </label>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3">
        {err && <span className="text-sm" style={{ color: '#d97706' }}>{err}</span>}
        <button className="btn-primary h-10" disabled={!!err || save.isPending} onClick={() => save.mutate()}><Save className="w-4 h-4" />{save.isPending ? 'Saving…' : 'Save payment settings'}</button>
      </div>

      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-semibold flex items-center gap-2"><CreditCard className="w-4 h-4" style={{ color: 'var(--gold)' }} />Card and net-banking payments (optional)</h3>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 720 }}>
              Connect your own Razorpay account and customers can also pay by card or net banking from the invoice link. Money settles into your Razorpay account; Razorpay&apos;s fees apply. Payments are recorded against the invoice automatically.
            </p>
          </div>
          <span className="badge" style={{ background: rp?.connected ? 'rgba(22,163,74,0.12)' : 'var(--bg-hover)', color: rp?.connected ? '#16a34a' : 'var(--text-muted)' }}>{rp?.connected ? `Connected · ${rp.keyId}` : 'Not connected'}</span>
        </div>
        {rp && !rp.encryptionReady && <p className="text-sm" style={{ color: '#d97706' }}>The server&apos;s APP_ENCRYPTION_KEY isn&apos;t set, so gateway keys can&apos;t be stored yet. Ask your administrator.</p>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div><label className="label">Key ID</label><input className="input h-10 font-mono" value={keys.keyId} onChange={e => setKeys(k => ({ ...k, keyId: e.target.value.trim() }))} placeholder={rp?.keyId ?? 'rzp_live_…'} autoComplete="off" /></div>
          <div><label className="label">Key secret</label><input className="input h-10 font-mono" type="password" value={keys.keySecret} onChange={e => setKeys(k => ({ ...k, keySecret: e.target.value }))} placeholder={rp?.connected ? 'Leave empty to keep the saved one' : ''} autoComplete="new-password" /></div>
          <div><label className="label">Webhook secret</label><input className="input h-10 font-mono" type="password" value={keys.webhookSecret} onChange={e => setKeys(k => ({ ...k, webhookSecret: e.target.value }))} placeholder={rp?.webhookSecretSet ? 'Saved — leave empty to keep' : 'From the webhook you create'} autoComplete="new-password" /></div>
        </div>
        {rp && (
          <div className="text-xs rounded-lg p-3 space-y-1" style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>
            <p>In Razorpay Dashboard → Accounts &amp; Settings → Webhooks, add a webhook:</p>
            <p>URL <code className="font-mono select-all">{rp.webhookUrl}</code> · event <code className="font-mono">{rp.webhookEvents}</code> · and the same secret as above.</p>
          </div>
        )}
        <div className="flex justify-end gap-2">
          {rp?.connected && <button className="btn-secondary h-9" disabled={disconnect.isPending} onClick={() => disconnect.mutate()}>Disconnect</button>}
          <button className="btn-primary h-9" disabled={!(keys.keyId || rp?.keyId) || connect.isPending || !rp?.encryptionReady}
            onClick={() => connect.mutate()}>{connect.isPending ? 'Checking with Razorpay…' : rp?.connected ? 'Update keys' : 'Connect Razorpay'}</button>
        </div>
      </div>
    </div>
  )
}
