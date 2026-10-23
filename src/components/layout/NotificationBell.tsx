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
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, BellOff, CheckCheck, ArrowRight } from 'lucide-react'
import { NOTIFICATION_KEYS, notificationsApi, type AppNotification } from '@/lib/api/notifications'
import { notificationType, safeLink, timeAgo } from '@/lib/notifications'
import { goTo } from '@/lib/hooks/useUrlParams'
import { apiError } from '@/lib/utils'
import toast from 'react-hot-toast'

/** The bell in the top bar: unread count, and the latest notices one click away. */
export function NotificationBell() {
  const qc = useQueryClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const button = useRef<HTMLButtonElement>(null)

  const { data: count = 0 } = useQuery({
    queryKey: NOTIFICATION_KEYS.count,
    queryFn: () => notificationsApi.unreadCount().catch(() => 0),
    refetchInterval: 60000,
    staleTime: 30000,
  })

  const { data: latest = [], isLoading } = useQuery({
    queryKey: [...NOTIFICATION_KEYS.list, 'latest'],
    queryFn: () => notificationsApi.list(0, 8),
    enabled: open,
    staleTime: 15000,
  })

  const refresh = () => {
    qc.invalidateQueries({ queryKey: NOTIFICATION_KEYS.list })
    qc.invalidateQueries({ queryKey: NOTIFICATION_KEYS.count })
  }
  // Marking one read is a convenience on the way to the link: a failure there is not worth a message.
  const markRead = useMutation({ mutationFn: notificationsApi.markRead, onSuccess: refresh, onError: () => {} })
  const markAll = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: refresh,
    onError: (e: any) => toast.error(apiError(e, 'Could not mark notifications as read')),
  })

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); button.current?.focus() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const openNotice = (n: AppNotification) => {
    if (!n.read) markRead.mutate(n.id)
    setOpen(false)
    const to = safeLink(n.link)
    if (to) goTo(router, to)
  }

  const label = count > 0 ? `Notifications, ${count} unread` : 'Notifications'

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={button}
        className="btn-icon"
        style={{ position: 'relative' }}
        aria-label={label}
        title={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        data-testid="notification-bell"
      >
        <Bell size={16} />
        {count > 0 && (
          <span
            data-testid="notification-count"
            style={{
              position: 'absolute', top: '-4px', right: '-4px',
              minWidth: '16px', height: '16px', padding: '0 4px',
              borderRadius: '8px', background: '#DC2626',
              color: 'white', fontSize: '10px', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
            }}
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="dialog"
            aria-label="Notifications"
            className="fixed left-3 right-3 top-16 z-50 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[380px] rounded-xl overflow-hidden slide-up"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
          >
            <div className="flex items-center justify-between" style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)', margin: 0 }}>
                Notifications{count > 0 ? <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}> · {count} unread</span> : null}
              </p>
              {count > 0 && (
                <button className="btn-ghost text-xs h-7 px-2" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
            </div>

            <div style={{ maxHeight: 'min(60vh, 440px)', overflowY: 'auto' }}>
              {isLoading && (
                <div style={{ padding: '10px 14px' }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ height: '46px', borderRadius: '8px', background: 'var(--bg-hover)', marginBottom: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  ))}
                </div>
              )}
              {!isLoading && latest.length === 0 && (
                <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                  <BellOff size={26} style={{ color: 'var(--text-muted)', margin: '0 auto 10px', display: 'block' }} />
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)', margin: '0 0 4px' }}>You're all caught up</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                    Payments received, approvals waiting for you, overdue invoices, bills falling due and low stock show up here.
                  </p>
                </div>
              )}
              {!isLoading && latest.map(n => {
                const meta = notificationType(n.type)
                const Icon = meta.icon
                return (
                  <button
                    key={n.id}
                    onClick={() => openNotice(n)}
                    className="w-full text-left transition-all"
                    style={{
                      display: 'flex', gap: '10px', padding: '10px 14px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      background: n.read ? 'transparent' : 'var(--bg-hover)', borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <span style={{ width: '30px', height: '30px', borderRadius: '8px', background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={15} style={{ color: meta.color }} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: n.read ? 500 : 700, color: 'var(--text-primary)', lineHeight: 1.35 }}>{n.title}</span>
                        {!n.read && <span aria-label="unread" style={{ width: '6px', height: '6px', borderRadius: '50%', background: meta.color, flexShrink: 0 }} />}
                      </span>
                      {n.message && (
                        <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.45, marginTop: '2px' }}>
                          {n.message}
                        </span>
                      )}
                      <span style={{ display: 'block', fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '3px' }}>{timeAgo(n.createdAt)}</span>
                    </span>
                  </button>
                )
              })}
            </div>

            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1 no-underline text-xs font-semibold"
              style={{ padding: '10px', color: 'var(--gold)' }}
            >
              See all notifications <ArrowRight size={12} />
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
