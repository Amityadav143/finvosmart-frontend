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

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { NOTIFICATION_KEYS, notificationsApi, type AppNotification } from '@/lib/api/notifications'
import { NOTIFICATION_TYPES, dayGroup, notificationType, safeLink, serverTime, timeAgo } from '@/lib/notifications'
import { apiError } from '@/lib/utils'
import { goTo } from '@/lib/hooks/useUrlParams'

const PAGE = 30

export default function NotificationsPage() {
  const qc = useQueryClient()
  const router = useRouter()
  const [show, setShow] = useState<'ALL' | 'UNREAD'>('ALL')
  const [type, setType] = useState<string>('')

  const q = useInfiniteQuery({
    queryKey: [...NOTIFICATION_KEYS.list, 'page'],
    queryFn: ({ pageParam }) => notificationsApi.list(pageParam as number, PAGE),
    initialPageParam: 0,
    getNextPageParam: (last, all) => (last.length === PAGE ? all.length : undefined),
    refetchInterval: 60000,
  })
  const all: AppNotification[] = useMemo(() => (q.data?.pages ?? []).flat(), [q.data])

  const refresh = () => {
    qc.invalidateQueries({ queryKey: NOTIFICATION_KEYS.list })
    qc.invalidateQueries({ queryKey: NOTIFICATION_KEYS.count })
  }
  const markRead = useMutation({ mutationFn: notificationsApi.markRead, onSuccess: refresh, onError: () => {} })
  const markAll = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: n => { refresh(); toast.success(n === 1 ? '1 notification marked as read' : `${n} notifications marked as read`) },
    onError: (e: any) => toast.error(apiError(e, 'Could not mark notifications as read')),
  })

  const unread = all.filter(n => !n.read).length
  const typesHere = useMemo(() => Array.from(new Set(all.map(n => n.type))).filter(t => NOTIFICATION_TYPES[t]), [all])
  const shown = all.filter(n => (show === 'ALL' || !n.read) && (!type || n.type === type))
  const groups = useMemo(() => {
    const out: { label: string; items: AppNotification[] }[] = []
    for (const n of shown) {
      const label = dayGroup(n.createdAt)
      const g = out.find(x => x.label === label)
      if (g) g.items.push(n); else out.push({ label, items: [n] })
    }
    return out
  }, [shown])

  const open = (n: AppNotification) => {
    if (!n.read) markRead.mutate(n.id)
    const to = safeLink(n.link)
    if (to) goTo(router, to)
  }

  const chip = (active: boolean) => ({
    padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
    background: active ? 'var(--gold-muted)' : 'var(--bg-card)', color: active ? 'var(--gold)' : 'var(--text-secondary)',
  })

  return (
    <div style={{ maxWidth: '720px' }}>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">
            {q.isLoading ? 'Loading…' : unread > 0 ? <><b style={{ color: 'var(--gold)' }}>{unread} unread</b> · newest first</> : "You're all caught up"}
          </p>
        </div>
        {unread > 0 && (
          <button className="btn-secondary h-9" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      {all.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-4" role="group" aria-label="Filter notifications">
          <button style={chip(show === 'ALL' && !type)} onClick={() => { setShow('ALL'); setType('') }}>All</button>
          <button style={chip(show === 'UNREAD')} onClick={() => setShow(s => (s === 'UNREAD' ? 'ALL' : 'UNREAD'))}>Unread{unread ? ` (${unread})` : ''}</button>
          {typesHere.map(t => (
            <button key={t} style={chip(type === t)} onClick={() => setType(x => (x === t ? '' : t))}>{NOTIFICATION_TYPES[t].label}</button>
          ))}
        </div>
      )}

      {q.isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card" style={{ height: '76px', background: 'var(--bg-surface)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      )}

      {q.isError && (
        <div className="card" style={{ padding: '20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
          Notifications couldn't be loaded. <button className="btn-ghost text-xs h-7 px-2" onClick={() => q.refetch()}>Try again</button>
        </div>
      )}

      {!q.isLoading && !q.isError && shown.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '52px 24px' }}>
          <Bell size={34} style={{ color: 'var(--text-muted)', margin: '0 auto 14px', display: 'block' }} />
          <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            {all.length === 0 ? 'No notifications yet' : 'Nothing matches this filter'}
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto', lineHeight: 1.6 }}>
            {all.length === 0
              ? 'You will hear here when a customer pays, an invoice goes overdue, a supplier bill falls due, stock runs low, payslips are ready, or something is waiting for your approval.'
              : 'Clear the filter to see everything.'}
          </p>
        </div>
      )}

      {groups.map(g => (
        <section key={g.label} className="mb-4" aria-label={g.label}>
          <h2 style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 8px 2px' }}>{g.label}</h2>
          <div className="space-y-2">
            {g.items.map(n => {
              const meta = notificationType(n.type)
              const Icon = meta.icon
              const link = safeLink(n.link)
              return (
                <button
                  key={n.id}
                  onClick={() => open(n)}
                  className="w-full text-left"
                  data-testid="notification-item"
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '14px', fontFamily: 'inherit',
                    padding: '14px 16px', borderRadius: '14px', cursor: 'pointer',
                    background: n.read ? 'var(--bg-card)' : meta.bg,
                    border: `1px solid ${n.read ? 'var(--border)' : meta.color + '40'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: n.read ? 'var(--bg-hover)' : 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={17} style={{ color: meta.color }} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="flex items-center gap-2" style={{ marginBottom: '3px' }}>
                      <span style={{ fontSize: '13px', fontWeight: n.read ? 500 : 700, color: 'var(--text-primary)' }}>{n.title}</span>
                      {!n.read && <span aria-label="unread" style={{ width: '7px', height: '7px', borderRadius: '50%', background: meta.color, flexShrink: 0 }} />}
                      {n.priority === 'HIGH' && (
                        <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '20px', background: 'rgba(220,38,38,0.1)', color: '#B91C1C', fontWeight: 700, marginLeft: 'auto', flexShrink: 0 }}>
                          Important
                        </span>
                      )}
                    </span>
                    {n.message && <span style={{ display: 'block', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{n.message}</span>}
                    <span className="flex items-center gap-3" style={{ marginTop: '5px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }} title={new Date(serverTime(n.createdAt)).toLocaleString('en-IN')}>{timeAgo(n.createdAt)}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{meta.label}</span>
                      {link && (
                        <span style={{ fontSize: '11px', color: meta.color, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          Open <ArrowRight size={10} />
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      ))}

      {q.hasNextPage && (
        <div className="flex justify-center mt-2">
          <button className="btn-secondary h-9" onClick={() => q.fetchNextPage()} disabled={q.isFetchingNextPage}>
            {q.isFetchingNextPage ? 'Loading…' : 'Show older notifications'}
          </button>
        </div>
      )}
    </div>
  )
}
