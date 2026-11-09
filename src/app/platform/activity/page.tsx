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

import Link from 'next/link'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { platformApi, moment, readableDetails, type ActivityKind, type ActivityRow } from '@/lib/api/platform'
import { DataTable } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { ConsoleHeading, FilterChips, useConsoleList } from '@/components/platform/ConsoleKit'
import { apiError } from '@/lib/apiError'

const KINDS: ActivityKind[] = ['SUPPORT', 'SETTINGS', 'ADMINS', 'LEADS']

/**
 * What Finvosmart's administrators did, newest first, in every company: support's actions (suspend, trial, plan,
 * reset links, unlock, switch logins off or on), the platform settings and test messages, who was given or lost
 * access to the console, website enquiries followed up — who did it, when, and the note they left. Entries are
 * never changed or removed here (they are the companies' audit logs).
 */
export default function PlatformActivityPage() {
  const list = useConsoleList(KINDS)
  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['platform', 'activity', list.filter, list.page],
    queryFn: () => platformApi.activity(list.filter, list.page),
    placeholderData: keepPreviousData,
  })

  return (
    <div className="space-y-4" data-testid="platform-activity">
      <ConsoleHeading title="Console activity"
        line={<>{data ? `${data.total.toLocaleString('en-IN')} entr${data.total === 1 ? 'y' : 'ies'}` : 'Everything the console did'} — kept in each company’s audit log, never changed
          {isFetching && data ? ' · updating…' : ''}</>} />

      <FilterChips value={list.filter} onChange={list.setFilter} options={[
        { value: '', label: 'Everything' }, { value: 'SUPPORT', label: 'Support for companies' }, { value: 'SETTINGS', label: 'Platform settings' },
        { value: 'ADMINS', label: 'Console access' }, { value: 'LEADS', label: 'Website enquiries' },
      ]} />

      {isError ? (
        <div className="card text-sm" role="alert" style={{ color: '#dc2626' }}>{apiError(error, 'The activity could not be loaded.')}</div>
      ) : (
        <>
          <DataTable<ActivityRow>
            loading={isLoading}
            data={data?.items ?? []}
            keyExtractor={r => `${r.at}|${r.action}|${r.companyId ?? ''}|${r.byEmail ?? ''}|${r.details ?? ''}`}
            emptyMessage={list.filter ? 'Nothing of this kind yet.' : 'Nothing yet: what the console does is listed here.'}
            columns={[
              { header: 'When', render: r => <span className="text-xs whitespace-nowrap">{moment(r.at)}</span> },
              { header: 'What', render: r => (
                <div className="min-w-0" data-action-code={r.action}>
                  <span className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{r.what}</span>
                  {r.details && <span className="block text-xs break-words" style={{ color: 'var(--text-secondary)' }}>{readableDetails(r.details)}</span>}
                </div>
              ) },
              { header: 'Company', render: r => r.companyId
                ? <Link href={`/platform/companies/${r.companyId}`} className="text-sm" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>{r.companyName ?? '—'}</Link>
                : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span> },
              { header: 'By', render: r => (
                <span className="text-xs">{r.byName || (r.byEmail ? '' : 'the server (a script)')}
                  {r.byEmail && <span className="block" style={{ color: 'var(--text-muted)' }}>{r.byEmail}</span>}</span>
              ) },
            ]}
          />
          {data && <Pagination currentPage={data.page} totalPages={Math.max(1, Math.ceil(data.total / data.size))} onPageChange={list.setPage}
            totalElements={data.total} pageSize={data.size} />}
        </>
      )}
    </div>
  )
}
