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
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { CheckCircle2, Mail, Phone, RotateCcw } from 'lucide-react'
import { platformApi, moment, PLAN_NAMES, type LeadFilter, type LeadRow } from '@/lib/api/platform'
import { Pagination } from '@/components/ui/Pagination'
import { SearchInput } from '@/components/ui/SearchInput'
import { Badge } from '@/components/ui/Badge'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { ConsoleHeading, FilterChips, NoteDialog, useConsoleList } from '@/components/platform/ConsoleKit'
import { apiError } from '@/lib/apiError'

const FILTERS: LeadFilter[] = ['NEW', 'HANDLED']

/**
 * What people sent through the website's contact and demo form, newest first: who, from which company, what they
 * asked — and whether someone followed up (who, when, a note), kept in the platform company's audit log.
 */
export default function PlatformLeadsPage() {
  const qc = useQueryClient()
  const list = useConsoleList(FILTERS)
  const [handling, setHandling] = useState<LeadRow | null>(null)
  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['platform', 'leads', list.q, list.filter, list.page],
    queryFn: () => platformApi.leads(list.q, list.filter, list.page),
    placeholderData: keepPreviousData,
  })
  const changed = (message: string) => {
    qc.invalidateQueries({ queryKey: ['platform', 'leads'] })
    qc.invalidateQueries({ queryKey: ['platform', 'overview'] })
    setHandling(null)
    toast.success(message)
  }
  const reopen = useMutation({
    mutationFn: (l: LeadRow) => platformApi.leadReopen(l.id),
    onSuccess: () => changed('Back to waiting'),
    onError: (e: unknown) => toast.error(apiError(e, 'That could not be done.')),
  })

  const c = data?.counts
  return (
    <div className="space-y-4" data-testid="platform-leads">
      <ConsoleHeading title="Website enquiries"
        line={<>{c ? `${c.waiting.toLocaleString('en-IN')} waiting for a reply · ${c.last7Days.toLocaleString('en-IN')} in the last 7 days` : 'What people sent through the website’s contact form'}
          {isFetching && data ? ' · updating…' : ''}</>}>
        <SearchInput value={list.typed} onChange={list.setTyped} placeholder="Name, email, phone or company" className="w-full sm:w-80" />
      </ConsoleHeading>

      <FilterChips value={list.filter} onChange={list.setFilter} options={[
        { value: '', label: 'All', count: c?.all }, { value: 'NEW', label: 'Waiting', count: c?.waiting }, { value: 'HANDLED', label: 'Followed up' },
      ]} />

      {isError ? (
        <div className="card text-sm" role="alert" style={{ color: '#dc2626' }}>{apiError(error, 'The enquiries could not be loaded.')}</div>
      ) : isLoading ? <SkeletonCard lines={4} /> : (
        <>
          {(data?.items.length ?? 0) === 0 ? (
            <div className="card text-sm" style={{ color: 'var(--text-muted)' }}>
              {list.q || list.filter ? 'No enquiry matches — try another search or filter.' : 'No enquiries yet: they arrive here from the website’s contact form.'}
            </div>
          ) : (
            <ul className="space-y-3" data-testid="lead-list">
              {data!.items.map(l => (
                <li key={l.id} className="card space-y-2" data-lead={l.email} data-handled={String(!!l.handledAt)}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{l.name} <span className="font-normal" style={{ color: 'var(--text-secondary)' }}>· {l.company}</span></p>
                      <p className="text-xs flex flex-wrap gap-x-3 gap-y-1 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        <a className="inline-flex items-center gap-1 text-link" href={`mailto:${l.email}`}><Mail size={12} aria-hidden />{l.email}</a>
                        {l.phone && <a className="inline-flex items-center gap-1 text-link" href={`tel:${l.phone}`}><Phone size={12} aria-hidden />{l.phone}</a>}
                        <span>received {moment(l.receivedAt)}</span>
                        {l.companySize && <span>{l.companySize} people</span>}
                        {l.plan && <span>interested in {PLAN_NAMES[l.plan.toUpperCase()] ?? l.plan}</span>}
                        {l.sourcePage && <span>from {l.sourcePage}</span>}
                      </p>
                    </div>
                    {l.handledAt
                      ? <Badge variant="success">Followed up</Badge>
                      : <Badge variant="warning">Waiting</Badge>}
                  </div>
                  {l.message && <p className="text-sm whitespace-pre-line break-words" style={{ color: 'var(--text-secondary)' }}>{l.message}</p>}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {l.handledAt ? <>Followed up {moment(l.handledAt)}{l.handledBy ? ` by ${l.handledBy}` : ''}{l.handledNote ? ` — ${l.handledNote}` : ''}</> : 'Nobody has followed up yet.'}
                    </p>
                    {l.handledAt
                      ? <button type="button" className="btn-ghost h-8 px-2 text-xs" disabled={reopen.isPending} onClick={() => reopen.mutate(l)} data-action="reopen">
                          <RotateCcw size={13} /> Back to waiting</button>
                      : <button type="button" className="btn-secondary h-8 px-3 text-xs" onClick={() => setHandling(l)} data-action="handled">
                          <CheckCircle2 size={13} /> Mark followed up</button>}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {data && data.total > data.size && <Pagination currentPage={data.page} totalPages={Math.ceil(data.total / data.size)} onPageChange={list.setPage}
            totalElements={data.total} pageSize={data.size} />}
        </>
      )}

      {handling && <NoteDialog title={`Followed up: ${handling.name}`} testId="lead-dialog" action="Mark followed up"
        label="What was done (kept with the enquiry)" placeholder="e.g. Called on 9 Nov, demo booked for Thursday"
        text={`${handling.name} of ${handling.company} (${handling.email}) moves out of the waiting list. You can put it back any time.`}
        run={note => platformApi.leadHandled(handling.id, note)} onClose={() => setHandling(null)} onDone={() => changed('Marked as followed up')} />}
    </div>
  )
}
