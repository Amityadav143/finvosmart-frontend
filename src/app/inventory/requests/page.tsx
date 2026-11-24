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

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, Check, PackageMinus, PackagePlus, Plus, Printer, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useAuthStore } from '@/lib/store/slices/authStore'
import { godownsApi, materialApi } from '@/lib/api/store'
import { hrmsApi } from '@/lib/api/hrms'
import { apiError } from '@/lib/apiError'
import { inr, todayIST } from '@/lib/money'
import { qty } from '@/lib/inventory'
import { printHtml } from '@/lib/storeHelpers'
import { DocLinesTable, DocStatus, DraftLines, draftKey, fmtDate, linesOut, type DraftLine } from '@/components/godown/GodownParts'
import { issueHtml, seller } from '@/components/godown/print'
import type { MaterialRequest } from '@/types/store'

const REQUEST_LABEL: Record<string, string> = {
  SUBMITTED: 'Waiting for approval', APPROVED: 'Approved', REJECTED: 'Rejected', PARTLY_ISSUED: 'Partly issued', ISSUED: 'Issued',
  CLOSED: 'Closed', CANCELLED: 'Cancelled',
}

export default function Page() {
  return <Suspense fallback={null}><MaterialRequestsPage /></Suspense>
}

/** Material asked for by a department, a site or a production line — approved, then issued from a godown (and returned). */
function MaterialRequestsPage() {
  const { canAny } = usePermissions()
  const allowed = canAny('MATERIAL_REQUEST', 'MATERIAL_APPROVE', 'INVENTORY_VIEW', 'INVENTORY_ADJUST', 'INVENTORY_ADMIN')
  const asker = canAny('MATERIAL_REQUEST', 'MATERIAL_APPROVE', 'INVENTORY_ADJUST', 'INVENTORY_ADMIN')
  const stores = canAny('INVENTORY_ADJUST', 'INVENTORY_ADMIN')
  const seesIssues = canAny('INVENTORY_VIEW', 'INVENTORY_ADJUST', 'INVENTORY_ADMIN')
  const params = useSearchParams()
  const [tab, setTab] = useState<'requests' | 'issues'>('requests')
  const [status, setStatus] = useState('')
  const [mine, setMine] = useState(false)
  const [page, setPage] = useState(0)
  const [asking, setAsking] = useState(false)
  const [open, setOpen] = useState<string | null>(params.get('open'))
  const [issuing, setIssuing] = useState<{ kind: 'ISSUE' | 'RETURN'; request?: MaterialRequest } | null>(null)
  const [openIssue, setOpenIssue] = useState<string | null>(null)
  const { data, isLoading } = useQuery({ queryKey: ['material-requests', status, mine, page], queryFn: () => materialApi.requests({ status: status || undefined, mine, page, size: 20 }), enabled: allowed && tab === 'requests' })
  const { data: issues, isLoading: loadingIssues } = useQuery({ queryKey: ['material-issues', page], queryFn: () => materialApi.issues({ page, size: 20 }), enabled: seesIssues && tab === 'issues' })
  if (!allowed) return <PermissionGate anyOf={['MATERIAL_REQUEST', 'MATERIAL_APPROVE', 'INVENTORY_VIEW']} showDenied><span /></PermissionGate>
  const list = tab === 'requests' ? data : issues
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link href="/inventory/godowns" className="text-xs inline-flex items-center gap-1 mb-1" style={{ color: 'var(--text-muted)' }}><ArrowLeft className="w-3 h-3" aria-hidden />Godowns</Link>
          <h1 className="page-title">Material requests and release</h1>
          <p className="page-subtitle">Ask the stores for material; an approver says yes, the stores release it from a godown with an issue slip, and what isn&apos;t used comes back.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {stores && <button className="btn-secondary h-10" onClick={() => setIssuing({ kind: 'ISSUE' })}><PackageMinus className="w-4 h-4" aria-hidden />Issue without a request</button>}
          {stores && <button className="btn-secondary h-10" onClick={() => setIssuing({ kind: 'RETURN' })}><PackagePlus className="w-4 h-4" aria-hidden />Return to store</button>}
          {asker && <button className="btn-primary h-10" onClick={() => setAsking(true)} data-testid="request-new"><Plus className="w-4 h-4" aria-hidden />Ask for material</button>}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 p-1 rounded-xl" role="tablist" style={{ border: '1px solid var(--border)' }}>
          {(['requests', ...(seesIssues ? ['issues'] : [])] as ('requests' | 'issues')[]).map(t => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => { setTab(t); setPage(0) }} className="px-3 h-8 rounded-lg text-sm"
              style={{ background: tab === t ? 'var(--gold-muted)' : 'transparent', fontWeight: tab === t ? 600 : 400 }}>{t === 'requests' ? 'Requests' : 'Issues & returns'}</button>
          ))}
        </div>
        {tab === 'requests' && (
          <div className="flex gap-2 items-center">
            <select className="input h-9 w-48" aria-label="Status" value={status} onChange={e => { setStatus(e.target.value); setPage(0) }}>
              <option value="">Every status</option>{Object.entries(REQUEST_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            {seesIssues && <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={mine} onChange={e => { setMine(e.target.checked); setPage(0) }} />Mine</label>}
          </div>
        )}
      </div>
      <div className="table-wrap">
        <table className="w-full text-sm" data-testid={tab === 'requests' ? 'request-list' : 'issue-list'}>
          <thead><tr>{(tab === 'requests' ? ['Number', 'Date', 'Department', 'Lines', 'Asked by', 'Status'] : ['Number', 'Date', 'Kind', 'Godown', 'Whom', 'Lines', 'Value', 'Status']).map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
          <tbody>
            {(tab === 'requests' ? isLoading : loadingIssues) ? <tr><td className="table-cell" colSpan={8}>Loading…</td></tr>
              : (list?.content ?? []).length === 0 ? <tr><td className="table-cell" colSpan={8} style={{ color: 'var(--text-muted)' }}>{tab === 'requests' ? 'No material requests yet.' : 'Nothing issued or returned yet.'}</td></tr>
              : list!.content.map(d => tab === 'requests' ? (
                <tr key={d.id} className="table-row cursor-pointer" onClick={() => setOpen(d.id)}>
                  <td className="table-cell font-mono">{d.number}</td><td className="table-cell">{fmtDate(d.date)}</td><td className="table-cell">{d.from ?? '—'}</td>
                  <td className="table-cell">{d.lines}</td><td className="table-cell">{d.by ?? ''}</td><td className="table-cell"><DocStatus status={d.status} label={REQUEST_LABEL[d.status]} /></td>
                </tr>
              ) : (
                <tr key={d.id} className="table-row cursor-pointer" onClick={() => setOpenIssue(d.id)}>
                  <td className="table-cell font-mono">{d.number}</td><td className="table-cell">{fmtDate(d.date)}</td><td className="table-cell">{d.kind === 'RETURN' ? 'Returned' : 'Issued'}</td>
                  <td className="table-cell">{d.from}</td><td className="table-cell">{d.to ?? '—'}</td><td className="table-cell">{d.lines}</td>
                  <td className="table-cell font-mono">{d.value != null ? inr(d.value) : ''}</td><td className="table-cell"><DocStatus status={d.status} /></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {(list?.totalPages ?? 0) > 1 && (
        <div className="flex justify-between items-center text-sm">
          <button className="btn-secondary h-9" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Newer</button>
          <span style={{ color: 'var(--text-muted)' }}>Page {page + 1} of {list?.totalPages}</span>
          <button className="btn-secondary h-9" disabled={page + 1 >= (list?.totalPages ?? 1)} onClick={() => setPage(p => p + 1)}>Older</button>
        </div>
      )}
      {asking && <AskForm onClose={() => setAsking(false)} onMade={id => { setAsking(false); setOpen(id) }} />}
      {open && <RequestView id={open} stores={stores} onClose={() => setOpen(null)} onIssue={r => { setOpen(null); setIssuing({ kind: 'ISSUE', request: r }) }} />}
      {issuing && <IssueForm kind={issuing.kind} request={issuing.request} onClose={() => setIssuing(null)} onMade={id => { setIssuing(null); setTab('issues'); setOpenIssue(id) }} />}
      {openIssue && <IssueView id={openIssue} stores={stores} onClose={() => setOpenIssue(null)} />}
    </div>
  )
}

function useDepartments() {
  return useQuery({ queryKey: ['departments'], queryFn: () => hrmsApi.employees.departments(), staleTime: 300_000, retry: false })
}

function AskForm({ onClose, onMade }: { onClose: () => void; onMade: (id: string) => void }) {
  const qc = useQueryClient()
  const { data: departments = [] } = useDepartments()
  const { data: godowns = [] } = useQuery({ queryKey: ['godowns'], queryFn: godownsApi.list, retry: false })
  const [f, setF] = useState({ neededBy: '', departmentId: '', godownId: '', purpose: '' })
  const [lines, setLines] = useState<DraftLine[]>([])
  const out = linesOut(lines)
  const save = useMutation({
    mutationFn: () => materialApi.ask({ neededBy: f.neededBy || null, departmentId: f.departmentId || null, godownId: f.godownId || null, purpose: f.purpose.trim() || undefined, lines: out.lines.map(l => ({ itemId: l.itemId, quantity: l.quantity })) }),
    onSuccess: r => { toast.success(`Request ${r.number} sent for approval`); qc.invalidateQueries({ queryKey: ['material-requests'] }); onMade(r.id) },
    onError: (e: any) => toast.error(apiError(e, 'The request could not be sent')),
  })
  return (
    <Modal open onClose={onClose} title="Ask for material" subtitle="What you need, how much and by when. It goes to an approver, then to the stores." size="xl">
      <div className="space-y-4" data-testid="request-form">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><label className="label">Needed by</label><input className="input h-10" type="date" min={todayIST()} value={f.neededBy} onChange={e => setF({ ...f, neededBy: e.target.value })} /></div>
          <div><label className="label">For the department</label>
            <select className="input h-10" value={f.departmentId} onChange={e => setF({ ...f, departmentId: e.target.value })} aria-label="Department">
              <option value="">—</option>{departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
          <div><label className="label">From the godown</label>
            <select className="input h-10" value={f.godownId} onChange={e => setF({ ...f, godownId: e.target.value })} aria-label="Godown">
              <option value="">Whichever the stores choose</option>{godowns.filter(g => g.active).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
        </div>
        <div><label className="label">What it is for</label><input className="input h-10" maxLength={500} value={f.purpose} onChange={e => setF({ ...f, purpose: e.target.value })} placeholder="Site B slab work, line 2 maintenance…" /></div>
        <DraftLines lines={lines} onChange={setLines} godownId={f.godownId || null} batches={false} />
        <div className="flex items-center justify-between gap-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-sm" style={{ color: out.problem ? '#b91c1c' : 'var(--text-muted)' }}>{out.problem ?? `${lines.length} item${lines.length === 1 ? '' : 's'}`}</p>
          <div className="flex gap-2"><button className="btn-secondary h-10" onClick={onClose}>Cancel</button>
            <button className="btn-primary h-10" disabled={!!out.problem || save.isPending} onClick={() => save.mutate()} data-testid="request-save">{save.isPending ? 'Sending…' : 'Send for approval'}</button></div>
        </div>
      </div>
    </Modal>
  )
}

function RequestView({ id, stores, onClose, onIssue }: { id: string; stores: boolean; onClose: () => void; onIssue: (r: MaterialRequest) => void }) {
  const qc = useQueryClient()
  const { canAny } = usePermissions()
  const me = useAuthStore(s => s.user?.userId)
  const approver = canAny('MATERIAL_APPROVE', 'INVENTORY_ADMIN')
  const { data: r, isLoading, error } = useQuery({ queryKey: ['material-request', id], queryFn: () => materialApi.request(id) })
  const [note, setNote] = useState('')
  const done = (msg: string) => { toast.success(msg); qc.invalidateQueries({ queryKey: ['material-request', id] }); qc.invalidateQueries({ queryKey: ['material-requests'] }) }
  const act = useMutation({
    mutationFn: (what: 'approve' | 'reject' | 'cancel' | 'close') =>
      what === 'approve' ? materialApi.approve(id, note.trim() || undefined) : what === 'reject' ? materialApi.reject(id, note.trim())
        : what === 'cancel' ? materialApi.cancel(id) : materialApi.close(id),
    onSuccess: (_r, what) => done(what === 'approve' ? 'Approved' : what === 'reject' ? 'Rejected' : what === 'cancel' ? 'Request cancelled' : 'Request closed'),
    onError: (e: any) => toast.error(apiError(e, 'That could not be done')),
  })
  const mineReq = !!r && r.requestedById === me
  return (
    <Modal open onClose={onClose} title={r ? `Request ${r.number}` : 'Material request'} subtitle={r ? `${r.requestedBy ?? ''} · ${fmtDate(r.date)}${r.neededBy ? ` · needed by ${fmtDate(r.neededBy)}` : ''}` : undefined} size="xl">
      {error ? <p className="text-sm" role="alert" style={{ color: '#b91c1c' }}>{apiError(error, 'The request could not be opened')}</p>
        : isLoading || !r ? <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p> : (
        <div className="space-y-4" data-testid="request-view">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm items-center">
            <DocStatus status={r.status} label={r.statusLabel} />
            {r.department && <span>For <b>{r.department}</b></span>}
            {r.godown && <span>From <b>{r.godown}</b></span>}
            {r.decidedBy && <span style={{ color: 'var(--text-muted)' }}>{r.status === 'REJECTED' ? 'Rejected' : 'Approved'} by {r.decidedBy}</span>}
          </div>
          {r.purpose && <p className="text-sm">{r.purpose}</p>}
          {r.decisionNote && <p className="text-sm rounded-lg px-3 py-2" style={{ background: 'var(--gold-muted)' }}>{r.decisionNote}</p>}
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead><tr>{['Item', 'Asked', 'Issued', 'Still to issue', ...(stores ? ['In the godown'] : [])].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
              <tbody>{r.lines.map(l => (
                <tr key={l.id} className="table-row">
                  <td className="table-cell"><span className="font-medium">{l.itemName}</span><span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{l.itemCode}</span></td>
                  <td className="table-cell font-mono">{qty(l.quantity)} {l.unit ?? ''}</td><td className="table-cell font-mono">{qty(l.issued)}</td>
                  <td className="table-cell font-mono">{qty(l.left)}</td>
                  {stores && <td className="table-cell font-mono" style={{ color: Number(l.inGodown) < Number(l.left) ? '#b91c1c' : undefined }}>{qty(l.inGodown)}</td>}
                </tr>
              ))}</tbody>
            </table>
          </div>
          {r.status === 'SUBMITTED' && approver && (
            <div className="rounded-xl p-3 space-y-2" style={{ border: '1px solid var(--border)' }}>
              <input className="input h-10" maxLength={300} placeholder="A note (needed to reject)" aria-label="Note" value={note} onChange={e => setNote(e.target.value)} />
              <div className="flex justify-end gap-2">
                <button className="btn-secondary h-9" disabled={!note.trim() || act.isPending} onClick={() => act.mutate('reject')}><X className="w-4 h-4" aria-hidden />Reject</button>
                <button className="btn-primary h-9" disabled={act.isPending} onClick={() => act.mutate('approve')} data-testid="request-approve"><Check className="w-4 h-4" aria-hidden />Approve</button>
              </div>
            </div>
          )}
          <div className="flex justify-between gap-2 flex-wrap">
            <div className="flex gap-2">
              {['SUBMITTED', 'APPROVED'].includes(r.status) && (mineReq || approver) && <button className="btn-ghost h-10" disabled={act.isPending} onClick={() => act.mutate('cancel')}>Cancel request</button>}
              {['APPROVED', 'PARTLY_ISSUED'].includes(r.status) && (mineReq || approver || stores) && <button className="btn-ghost h-10" disabled={act.isPending} onClick={() => act.mutate('close')}>Close — the rest isn&apos;t needed</button>}
            </div>
            {['APPROVED', 'PARTLY_ISSUED'].includes(r.status) && stores && <button className="btn-primary h-10" onClick={() => onIssue(r)} data-testid="request-issue"><PackageMinus className="w-4 h-4" aria-hidden />Issue material</button>}
          </div>
        </div>
      )}
    </Modal>
  )
}

function IssueForm({ kind, request, onClose, onMade }: { kind: 'ISSUE' | 'RETURN'; request?: MaterialRequest; onClose: () => void; onMade: (id: string) => void }) {
  const qc = useQueryClient()
  const { data: departments = [] } = useDepartments()
  const { data: godowns = [] } = useQuery({ queryKey: ['godowns'], queryFn: godownsApi.list })
  const active = godowns.filter(g => g.active)
  const [godownId, setGodownId] = useState(request?.godownId ?? active.find(g => g.main)?.id ?? active[0]?.id ?? '')
  const [f, setF] = useState({ departmentId: request?.departmentId ?? '', issuedTo: request?.requestedBy ?? '', purpose: request?.purpose ?? '', date: todayIST() })
  const [lines, setLines] = useState<DraftLine[]>(() => (request?.lines ?? []).filter(l => Number(l.left) > 0).map(l => ({
    key: draftKey(), itemId: l.itemId, itemCode: l.itemCode, itemName: l.itemName, unit: l.unit, batches: false, batchId: '', quantity: String(l.left), requestLineId: l.id, inSource: null,
  })))
  const out = linesOut(lines)
  const problem = !godownId ? 'Choose the godown.' : out.problem
  const save = useMutation({
    mutationFn: () => materialApi.give({ kind, godownId, requestId: request?.id ?? null, departmentId: f.departmentId || null, issuedTo: f.issuedTo.trim() || undefined,
      purpose: f.purpose.trim() || undefined, date: f.date, lines: out.lines }),
    onSuccess: m => {
      toast.success(`${kind === 'ISSUE' ? 'Issue' : 'Return'} ${m.number} done`)
      qc.invalidateQueries({ queryKey: ['material-issues'] }); qc.invalidateQueries({ queryKey: ['material-requests'] }); qc.invalidateQueries({ queryKey: ['godown-stock'] })
      if (request) qc.invalidateQueries({ queryKey: ['material-request', request.id] })
      onMade(m.id)
    },
    onError: (e: any) => toast.error(apiError(e, kind === 'ISSUE' ? 'The material could not be issued' : 'The return could not be made')),
  })
  return (
    <Modal open onClose={onClose} title={kind === 'ISSUE' ? (request ? `Issue against ${request.number}` : 'Issue material') : 'Return material to the store'}
      subtitle={kind === 'ISSUE' ? 'The stock leaves the godown. Batches go first-to-expire unless you choose one.' : 'What wasn\'t used comes back into the godown.'} size="xl">
      <div className="space-y-4" data-testid="issue-form">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div><label className="label label-required">{kind === 'ISSUE' ? 'From the godown' : 'Into the godown'}</label>
            <select className="input h-10" value={godownId} onChange={e => { setGodownId(e.target.value); setLines(ls => ls.map(l => ({ ...l, batchId: '' }))) }} aria-label="Godown">
              {active.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
          <div><label className="label">{kind === 'ISSUE' ? 'Issued to' : 'Returned by'}</label><input className="input h-10" maxLength={200} value={f.issuedTo} onChange={e => setF({ ...f, issuedTo: e.target.value })} /></div>
          <div><label className="label">Department</label>
            <select className="input h-10" value={f.departmentId} onChange={e => setF({ ...f, departmentId: e.target.value })} aria-label="Department">
              <option value="">—</option>{departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
          <div><label className="label">Date</label><input className="input h-10" type="date" max={todayIST()} value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></div>
        </div>
        <div><label className="label">For</label><input className="input h-10" maxLength={500} value={f.purpose} onChange={e => setF({ ...f, purpose: e.target.value })} /></div>
        <DraftLines lines={lines} onChange={setLines} godownId={godownId} batches={kind === 'ISSUE'} showStock={kind === 'ISSUE'} />
        <div className="flex items-center justify-between gap-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-sm" style={{ color: problem ? '#b91c1c' : 'var(--text-muted)' }}>{problem ?? `${lines.length} item${lines.length === 1 ? '' : 's'}`}</p>
          <div className="flex gap-2"><button className="btn-secondary h-10" onClick={onClose}>Cancel</button>
            <button className="btn-primary h-10" disabled={!!problem || save.isPending} onClick={() => save.mutate()} data-testid="issue-save">{save.isPending ? 'Saving…' : kind === 'ISSUE' ? 'Issue' : 'Take it back'}</button></div>
        </div>
      </div>
    </Modal>
  )
}

function IssueView({ id, stores, onClose }: { id: string; stores: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const { data: m, isLoading } = useQuery({ queryKey: ['material-issue', id], queryFn: () => materialApi.issue(id) })
  const [reason, setReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const cancel = useMutation({
    mutationFn: () => materialApi.cancelIssue(id, reason.trim()),
    onSuccess: () => { toast.success('Cancelled — the stock is put back'); setCancelling(false); qc.invalidateQueries({ queryKey: ['material-issue', id] }); qc.invalidateQueries({ queryKey: ['material-issues'] }); qc.invalidateQueries({ queryKey: ['material-requests'] }); qc.invalidateQueries({ queryKey: ['godown-stock'] }) },
    onError: (e: any) => toast.error(apiError(e, 'It could not be cancelled')),
  })
  return (
    <Modal open onClose={onClose} title={m ? `${m.kind === 'ISSUE' ? 'Issue' : 'Return'} ${m.number}` : 'Issue'} subtitle={m ? `${m.godown} · ${fmtDate(m.date)}${m.requestNumber ? ` · request ${m.requestNumber}` : ''}` : undefined} size="xl">
      {isLoading || !m ? <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p> : (
        <div className="space-y-4" data-testid="issue-view">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm items-center">
            <DocStatus status={m.status} />
            {m.issuedTo && <span>{m.kind === 'ISSUE' ? 'To' : 'By'} <b>{m.issuedTo}</b></span>}
            {m.department && <span>{m.department}</span>}
            <span className="font-mono">{inr(m.value)}</span>
          </div>
          {m.purpose && <p className="text-sm">{m.purpose}</p>}
          {m.status === 'CANCELLED' && <p className="text-sm" style={{ color: '#b91c1c' }}>Cancelled{m.cancelReason ? `: ${m.cancelReason}` : ''}</p>}
          <DocLinesTable lines={m.lines} value />
          {cancelling ? (
            <div className="rounded-xl p-3 space-y-2" style={{ border: '1px solid #fca5a5' }}>
              <input className="input h-10" maxLength={300} autoFocus placeholder="Why it is cancelled" aria-label="Why it is cancelled" value={reason} onChange={e => setReason(e.target.value)} />
              <div className="flex justify-end gap-2"><button className="btn-secondary h-9" onClick={() => setCancelling(false)}>Keep it</button>
                <button className="btn-danger h-9" disabled={!reason.trim() || cancel.isPending} onClick={() => cancel.mutate()}>Cancel it</button></div>
            </div>
          ) : (
            <div className="flex justify-between gap-2">
              {stores && m.status === 'DONE' ? <button className="btn-ghost h-10" onClick={() => setCancelling(true)}>Cancel</button> : <span />}
              <button className="btn-primary h-10" onClick={async () => printHtml(issueHtml(m, await seller()))}><Printer className="w-4 h-4" aria-hidden />Print slip</button>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
