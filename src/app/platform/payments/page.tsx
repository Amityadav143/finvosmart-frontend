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
import { platformApi, moment, lastDayOf, PLAN_NAMES, type PaymentFilter, type PaymentRow } from '@/lib/api/platform'
import { rupeesFromPaise } from '@/lib/api/billing'
import { DataTable } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { SearchInput } from '@/components/ui/SearchInput'
import { Badge } from '@/components/ui/Badge'
import { ConsoleHeading, FilterChips, useConsoleList } from '@/components/platform/ConsoleKit'
import { apiError } from '@/lib/apiError'

const FILTERS: PaymentFilter[] = ['PAID', 'FAILED', 'CREATED']

const STATUS: Record<string, { text: string; tone: 'success' | 'danger' | 'default' }> = {
  PAID: { text: 'Paid', tone: 'success' }, FAILED: { text: 'Failed', tone: 'danger' }, CREATED: { text: 'Not finished', tone: 'default' },
}

/**
 * Every company's plan payments through Razorpay, newest first, with the totals (all time, this month, 30 days) —
 * search by company or by Razorpay's order or payment id; failed payments with Razorpay's reason. A plan paid by
 * bank transfer is recorded on the company's page and shows in its history.
 */
export default function PlatformPaymentsPage() {
  const list = useConsoleList(FILTERS)
  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['platform', 'payments', list.q, list.filter, list.page],
    queryFn: () => platformApi.payments(list.q, list.filter, list.page),
    placeholderData: keepPreviousData,
  })
  const t = data?.totals
  const tiles = t ? [
    { id: 'month', label: 'Paid this month', value: rupeesFromPaise(t.monthPaise), sub: `${t.monthCount} payment${t.monthCount === 1 ? '' : 's'} (with GST)` },
    { id: 'last30', label: 'Paid in 30 days', value: rupeesFromPaise(t.last30Paise), sub: `${t.last30Count} payment${t.last30Count === 1 ? '' : 's'}` },
    { id: 'all', label: 'Paid, all time', value: rupeesFromPaise(t.paidPaise), sub: `${t.paidCount} payment${t.paidCount === 1 ? '' : 's'}` },
    { id: 'failed', label: 'Failed in 30 days', value: t.failedLast30.toLocaleString('en-IN'), sub: 'Razorpay refused or the customer gave up' },
  ] : []

  return (
    <div className="space-y-4" data-testid="platform-payments">
      <ConsoleHeading title="Plan payments"
        line={<>{data ? `${data.total.toLocaleString('en-IN')} payment${data.total === 1 ? '' : 's'}` : 'Every company’s plan payments'}{list.filter || list.q ? ' found' : ''}
          {isFetching && data ? ' · updating…' : ''}</>}>
        <SearchInput value={list.typed} onChange={list.setTyped} placeholder="Company, order or payment id" className="w-full sm:w-80" />
      </ConsoleHeading>

      {tiles.length > 0 && (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }} data-testid="payment-totals">
          {tiles.map(x => (
            <div key={x.id} className="card" style={{ padding: '14px 16px' }} data-total={x.id}>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{x.label}</p>
              <p className="text-xl font-semibold mt-1" style={{ color: 'var(--text-primary)' }} data-value>{x.value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{x.sub}</p>
            </div>
          ))}
        </div>
      )}

      <FilterChips value={list.filter} onChange={list.setFilter} options={[
        { value: '', label: 'All' }, { value: 'PAID', label: 'Paid' }, { value: 'FAILED', label: 'Failed' }, { value: 'CREATED', label: 'Started, not finished' },
      ]} />

      {isError ? (
        <div className="card text-sm" role="alert" style={{ color: '#dc2626' }}>{apiError(error, 'The payments could not be loaded.')}</div>
      ) : (
        <>
          <DataTable<PaymentRow>
            loading={isLoading}
            data={data?.items ?? []}
            keyExtractor={r => r.id}
            emptyMessage={list.q || list.filter ? 'No payment matches — try another search or filter.'
              : 'No plan payments yet. They appear here once companies pay online (Platform settings → Payment gateway).'}
            columns={[
              { header: 'When', render: r => <span className="text-xs" data-payment={r.paymentId ?? r.orderId ?? r.id}>{moment(r.paidAt ?? r.createdAt)}</span> },
              { header: 'Company', render: r => (
                <div className="min-w-0">
                  <Link href={`/platform/companies/${r.companyId}`} className="block text-sm font-medium" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>{r.companyName}</Link>
                  <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{r.companyCode}</span>
                </div>
              ) },
              { header: 'Plan', render: r => (
                <span className="text-sm">{PLAN_NAMES[r.plan] ?? r.plan}, {r.billingCycle === 'ANNUAL' ? 'yearly' : 'monthly'}
                  {r.periodEnd && r.status === 'PAID' && <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>until {lastDayOf(r.periodEnd)}</span>}</span>
              ) },
              { header: 'Amount', className: 'text-right', render: r => (
                <span className="tabular-nums">{rupeesFromPaise(r.amountPaise)}
                  <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>GST {rupeesFromPaise(r.gstPaise)}</span></span>
              ) },
              { header: 'Status', render: r => {
                const s = STATUS[r.status] ?? { text: r.status.toLowerCase(), tone: 'default' as const }
                return <div data-status={r.status}><Badge variant={s.tone}>{s.text}</Badge>
                  {r.failureReason && <span className="block text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{r.failureReason}</span>}</div>
              } },
              { header: 'Razorpay', render: r => (
                <span className="text-xs font-mono break-all" style={{ color: 'var(--text-secondary)' }}>
                  {r.paymentId && <span className="block">{r.paymentId}</span>}
                  {r.orderId && <span className="block" style={{ color: 'var(--text-muted)' }}>{r.orderId}</span>}
                </span>
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
