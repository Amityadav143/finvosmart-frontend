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

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { platformApi, accessLabel, day, lastDayOf, moment, FILTERS, PLAN_NAMES, type CompanyRow } from '@/lib/api/platform'
import { DataTable } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { SearchInput } from '@/components/ui/SearchInput'
import { Badge } from '@/components/ui/Badge'
import { apiError } from '@/lib/apiError'

/** Where a company stands, in a few words: "6 days left", "Growth until 31 Mar 2027", "Suspended 2 Nov 2026". */
function standing(r: CompanyRow): string {
  if (!r.active) return r.suspendedAt ? `since ${day(r.suspendedAt)}` : ''
  if (r.access === 'TRIAL') return r.trialDaysLeft === 0 ? 'ends today' : `${r.trialDaysLeft} day${r.trialDaysLeft === 1 ? '' : 's'} left`
  if (r.access === 'FULL' && r.status !== 'LEGACY' && r.paidUntil) return `${PLAN_NAMES[r.plan ?? ''] ?? 'Paid'} until ${lastDayOf(r.paidUntil)}`
  if (r.access === 'READ_ONLY') return r.status === 'PAID' ? `plan ended ${lastDayOf(r.paidUntil)}` : r.trialEndsAt ? `trial ended ${lastDayOf(r.trialEndsAt)}` : ''
  return ''
}

/** Every company on Finvosmart: search, filter by where it stands, and open one. */
export default function PlatformCompaniesPage() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [typed, setTyped] = useState('')
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(0)

  // a filter or search in the address (from the overview's tiles), once
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const f = p.get('filter') ?? ''
    if (FILTERS.some(x => x.value === f)) setFilter(f)
    const s = p.get('q') ?? ''
    if (s) { setQ(s); setTyped(s) }
  }, [])
  // typing waits a moment before searching
  useEffect(() => {
    const t = setTimeout(() => { setQ(typed.trim()); setPage(0) }, 300)
    return () => clearTimeout(t)
  }, [typed])

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['platform', 'companies', q, filter, page],
    queryFn: () => platformApi.companies(q, filter, page),
    placeholderData: keepPreviousData,
  })

  return (
    <div className="space-y-4" data-testid="platform-companies">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">All companies</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {data ? `${data.total.toLocaleString('en-IN')} compan${data.total === 1 ? 'y' : 'ies'}` : 'Every company signed up on Finvosmart'}
            {isFetching && data ? ' · updating…' : ''}
          </p>
        </div>
        <SearchInput value={typed} onChange={setTyped} placeholder="Name, company code, GSTIN, email or phone" className="w-full sm:w-80" />
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Show">
        {FILTERS.map(f => (
          <button key={f.value || 'all'} type="button" onClick={() => { setFilter(f.value); setPage(0) }} aria-pressed={filter === f.value}
            data-filter={f.value || 'ALL'} className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{
              border: `1px solid ${filter === f.value ? 'var(--gold)' : 'var(--border)'}`,
              background: filter === f.value ? 'var(--gold-muted)' : 'transparent',
              color: filter === f.value ? 'var(--gold)' : 'var(--text-secondary)', cursor: 'pointer',
            }}>{f.label}</button>
        ))}
      </div>

      {isError ? (
        <div className="card text-sm" role="alert" style={{ color: '#dc2626' }}>{apiError(error, 'The companies could not be loaded.')}</div>
      ) : (
        <>
          <DataTable<CompanyRow>
            loading={isLoading}
            data={data?.items ?? []}
            keyExtractor={r => r.id}
            onRowClick={r => router.push(`/platform/companies/${r.id}`)}
            emptyMessage={q || filter ? 'No company matches — try another search or filter.' : 'No companies yet.'}
            columns={[
              { header: 'Company', render: r => (
                <div className="min-w-0" data-company={r.companyCode}>
                  <span className="block font-medium" style={{ color: 'var(--text-primary)' }}>{r.name}{r.platform && <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>(runs Finvosmart)</span>}</span>
                  <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{r.companyCode}{r.gstin ? ` · ${r.gstin}` : ''}</span>
                </div>
              ) },
              { header: 'Contact', render: r => (
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span className="block">{r.email || '—'}</span>
                  <span className="block">{[r.phone, r.city].filter(Boolean).join(' · ')}</span>
                </div>
              ) },
              { header: 'Signed up', render: r => <span className="text-xs">{day(r.createdAt)}</span> },
              { header: 'Plan', render: r => {
                const a = accessLabel(r)
                return (
                  <div data-access={r.active ? r.access : 'SUSPENDED'}>
                    <Badge variant={a.tone}>{a.text}</Badge>
                    <span className="block text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{standing(r)}</span>
                  </div>
                )
              } },
              { header: 'Users', render: r => <span className="tabular-nums">{r.users}</span>, className: 'text-right' },
              { header: 'Invoices', render: r => <span className="tabular-nums">{r.invoices.toLocaleString('en-IN')}</span>, className: 'text-right' },
              { header: 'Last sign-in', render: r => <span className="text-xs">{moment(r.lastSignIn)}</span> },
            ]}
          />
          {data && <Pagination currentPage={data.page} totalPages={Math.max(1, Math.ceil(data.total / data.size))} onPageChange={setPage}
            totalElements={data.total} pageSize={data.size} />}
        </>
      )}
    </div>
  )
}
