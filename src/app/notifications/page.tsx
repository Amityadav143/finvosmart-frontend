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

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { Bell, CheckCheck, ArrowRight, Info, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Notif {
  id: string; type: string; priority: 'HIGH' | 'MEDIUM' | 'LOW'
  title: string; message: string; link?: string; read: boolean; createdAt: string
}

const TYPE_META: Record<string, { color: string; bg: string; icon: any }> = {
  APPROVAL: { color: '#D97706', bg: 'rgba(217,119,6,0.1)',  icon: AlertTriangle },
  OVERDUE:  { color: '#DC2626', bg: 'rgba(220,38,38,0.1)',  icon: AlertTriangle },
  LOW_STOCK:{ color: '#2563EB', bg: 'rgba(37,99,235,0.1)',  icon: Info          },
  PAYROLL:  { color: '#059669', bg: 'rgba(5,150,105,0.1)',  icon: CheckCircle2  },
  LEAVE:    { color: '#7C3AED', bg: 'rgba(124,58,237,0.1)', icon: Info          },
  AI:       { color: '#0D9488', bg: 'rgba(13,148,136,0.1)', icon: TrendingUp    },
  SYSTEM:   { color: '#6B7280', bg: 'rgba(107,114,128,0.1)',icon: Info          },
}

function timeAgo(dt: string) {
  const diff = (Date.now() - new Date(dt).getTime()) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff/60)}m ago`
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
  return `${Math.floor(diff/86400)}d ago`
}

export default function NotificationsPage() {
  const qc = useQueryClient()

  const { data: notifs = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications?size=50').then(r => r.data.data ?? []),
    refetchInterval: 30000,
  })

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', 'notif-count'] }),
    onError: () => { /* silent — mark-read is a background convenience action */ },
  })

  const markAll = useMutation({
    mutationFn: () => api.post('/notifications/mark-all-read'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', 'notif-count'] })
      toast.success('All notifications marked as read')
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Could not mark notifications as read'),
  })

  const unread = (notifs as Notif[]).filter(n => !n.read).length

  return (
    <div style={{ maxWidth: '680px' }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">
            {unread > 0 ? <><b style={{ color: 'var(--gold)' }}>{unread} unread</b> notifications</> : 'All caught up!'}
          </p>
        </div>
        {unread > 0 && (
          <button className="btn-secondary h-9" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="card" style={{ height: '80px', background: 'var(--bg-surface)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      )}

      {!isLoading && (notifs as Notif[]).length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '56px' }}>
          <Bell size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 14px', display: 'block' }} />
          <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            No notifications yet
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Notifications for approvals, overdue invoices, low stock, and AI alerts will appear here.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {(notifs as Notif[]).map(n => {
          const meta = TYPE_META[n.type] ?? TYPE_META.SYSTEM
          const Icon = meta.icon
          return (
            <div key={n.id}
              onClick={() => { if (!n.read) markRead.mutate(n.id) }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '14px',
                padding: '14px 18px', borderRadius: '14px', cursor: 'pointer',
                background: n.read ? 'var(--bg-card)' : `${meta.bg}`,
                border: `1px solid ${n.read ? 'var(--border)' : meta.color + '44'}`,
                transition: 'all 0.15s',
                opacity: n.read ? 0.72 : 1,
              }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: meta.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} style={{ color: meta.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ fontSize: '13px', fontWeight: n.read ? 500 : 700, color: 'var(--text-primary)' }}>
                    {n.title}
                  </span>
                  {!n.read && (
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '20px',
                    background: meta.bg, color: meta.color, fontWeight: 700, marginLeft: 'auto', flexShrink: 0 }}>
                    {n.priority}
                  </span>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '4px', lineHeight: 1.5 }}>
                  {n.message}
                </p>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{timeAgo(n.createdAt)}</span>
                  {n.link && (
                    <Link href={n.link} onClick={(e: any) => e.stopPropagation()}
                      style={{ fontSize: '11px', color: meta.color, fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '3px', textDecoration: 'none' }}>
                      View <ArrowRight size={10} />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
