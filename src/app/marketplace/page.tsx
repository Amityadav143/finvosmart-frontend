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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import {
  Plug, Key, ShoppingCart, CreditCard, BookOpen, Plus, Copy, Trash2,
  CheckCircle2, RefreshCw, AlertTriangle, Code, X
} from 'lucide-react'
import toast from 'react-hot-toast'

type Tab = 'integrations' | 'api-keys'

interface Integration {
  id: string; provider: string; category: string; displayName: string
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'SYNCING'
  lastSyncAt?: string; lastSyncStatus?: string; syncedRecords?: number
}
interface ApiKeyRow {
  id: string; name: string; keyPrefix: string; scopes: string
  rateTier: string; status: 'ACTIVE' | 'REVOKED'; lastUsedAt?: string; callCount?: number
}

const PROVIDERS = {
  ECOMMERCE: [
    { id: 'AMAZON', name: 'Amazon', icon: '📦' }, { id: 'FLIPKART', name: 'Flipkart', icon: '🛒' },
    { id: 'MEESHO', name: 'Meesho', icon: '🏪' }, { id: 'SHOPIFY', name: 'Shopify', icon: '🛍️' },
  ],
  PAYMENTS: [
    { id: 'RAZORPAY', name: 'Razorpay', icon: '💳' }, { id: 'PAYU', name: 'PayU', icon: '💰' },
    { id: 'CASHFREE', name: 'Cashfree', icon: '🏦' }, { id: 'PHONEPE', name: 'PhonePe', icon: '📱' },
  ],
  ACCOUNTING: [
    { id: 'TALLY', name: 'Tally', icon: '📒' }, { id: 'ZOHO_BOOKS', name: 'Zoho Books', icon: '📊' },
    { id: 'QUICKBOOKS', name: 'QuickBooks', icon: '📗' },
  ],
}

const CATEGORY_META: Record<string, { label: string; icon: any; color: string }> = {
  ECOMMERCE:  { label: 'E-Commerce',  icon: ShoppingCart, color: '#7C3AED' },
  PAYMENTS:   { label: 'Payments',    icon: CreditCard,   color: '#059669' },
  ACCOUNTING: { label: 'Accounting',  icon: BookOpen,     color: '#2563EB' },
}

export default function MarketplacePage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('integrations')
  const [showKey, setShowKey] = useState(false)
  const [newKey, setNewKey] = useState<{ key: string; name: string } | null>(null)
  const [keyForm, setKeyForm] = useState({ name: '', scopes: 'invoices:read,customers:read', rateTier: 'FREE' })

  const { data: integrations = [] } = useQuery({
    queryKey: ['mkt-integrations'],
    queryFn: () => api.get('/marketplace/integrations').then(r => r.data.data ?? []),
    enabled: tab === 'integrations',
  })
  const { data: apiKeys = [] } = useQuery({
    queryKey: ['mkt-apikeys'],
    queryFn: () => api.get('/marketplace/api-keys').then(r => r.data.data ?? []),
    enabled: tab === 'api-keys',
  })

  const connect = useMutation({
    mutationFn: (p: { provider: string; category: string; displayName: string }) =>
      api.post('/marketplace/integrations/connect', { ...p, configJson: '{}' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mkt-integrations'] }); toast.success('Integration connected') },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to connect'),
  })
  const disconnect = useMutation({
    mutationFn: (id: string) => api.post(`/marketplace/integrations/${id}/disconnect`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mkt-integrations'] }); toast.success('Disconnected') },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to disconnect'),
  })
  const sync = useMutation({
    mutationFn: (id: string) => api.post(`/marketplace/integrations/${id}/sync`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mkt-integrations'] }); toast.success('Sync triggered') },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Sync failed'),
  })
  const issueKey = useMutation({
    mutationFn: () => api.post('/marketplace/api-keys', keyForm).then(r => r.data.data),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['mkt-apikeys'] })
      setShowKey(false); setNewKey({ key: data.key, name: data.name })
      setKeyForm({ name: '', scopes: 'invoices:read,customers:read', rateTier: 'FREE' })
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to issue key'),
  })
  const revokeKey = useMutation({
    mutationFn: (id: string) => api.post(`/marketplace/api-keys/${id}/revoke`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mkt-apikeys'] }); toast.success('Key revoked') },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to revoke'),
  })

  const connectedMap = new Map((integrations as Integration[]).map(i => [i.provider, i]))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Plug size={22} style={{ color: 'var(--gold)' }} /> Marketplace & Open API
        </h1>
        <p className="page-subtitle">Connect e-commerce, payments & accounting tools · issue developer API keys</p>
      </div>

      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)' }}>
        {[['integrations', 'Integrations', Plug], ['api-keys', 'Developer API', Key]].map(([id, label, Icon]: any) => (
          <button key={id} onClick={() => setTab(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 16px',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none',
              color: tab === id ? 'var(--gold)' : 'var(--text-muted)',
              borderBottom: tab === id ? '2px solid var(--gold)' : '2px solid transparent',
            }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* INTEGRATIONS */}
      {tab === 'integrations' && (
        <div className="space-y-5">
          {Object.entries(PROVIDERS).map(([cat, provs]) => {
            const meta = CATEGORY_META[cat]
            const Icon = meta.icon
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={16} style={{ color: meta.color }} />
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{meta.label}</h3>
                </div>
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                  {provs.map(prov => {
                    const conn = connectedMap.get(prov.id)
                    const isConnected = conn?.status === 'CONNECTED'
                    return (
                      <div key={prov.id} className="card" style={{ borderColor: isConnected ? meta.color : 'var(--border)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <span style={{ fontSize: '26px' }}>{prov.icon}</span>
                          {isConnected && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px',
                              fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
                              background: 'rgba(5,150,105,0.1)', color: '#059669' }}>
                              <CheckCircle2 size={10} /> Connected
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>{prov.name}</p>
                        {isConnected ? (
                          <div className="flex gap-1">
                            <button className="btn-secondary h-8 text-xs flex-1" onClick={() => sync.mutate(conn!.id)}>
                              <RefreshCw size={12} /> Sync
                            </button>
                            <button className="h-8 text-xs px-2 rounded-lg"
                              style={{ background: 'rgba(220,38,38,0.1)', color: '#DC2626' }}
                              onClick={() => disconnect.mutate(conn!.id)}>
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <button className="btn-secondary h-8 text-xs w-full"
                            onClick={() => connect.mutate({ provider: prov.id, category: cat, displayName: prov.name })}>
                            <Plus size={12} /> Connect
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* API KEYS */}
      {tab === 'api-keys' && (
        <div className="space-y-4">
          <div className="card" style={{ background: 'rgba(37,99,235,0.05)', borderColor: 'rgba(37,99,235,0.2)' }}>
            <div className="flex items-start gap-3">
              <Code size={18} style={{ color: '#2563EB', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Public REST API</p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Build on FINVOSMART. Pass your key as <code style={{ fontFamily: 'monospace', background: 'var(--bg-hover)', padding: '1px 5px', borderRadius: '4px' }}>Authorization: Bearer fk_live_...</code>
                  {' '}to <code style={{ fontFamily: 'monospace', background: 'var(--bg-hover)', padding: '1px 5px', borderRadius: '4px' }}>/api/v1/public/*</code>. Rate tiers: FREE 60/min · STANDARD 600/min · PREMIUM 6000/min.
                </p>
              </div>
            </div>
          </div>

          <button className="btn-primary h-9" onClick={() => setShowKey(true)}>
            <Plus size={15} /> Issue New API Key
          </button>

          <div className="space-y-2">
            {(apiKeys as ApiKeyRow[]).map(k => (
              <div key={k.id} className="card flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Key size={14} style={{ color: 'var(--gold)' }} />
                    <p style={{ fontSize: '13px', fontWeight: 600 }}>{k.name}</p>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
                      background: k.status === 'ACTIVE' ? 'rgba(5,150,105,0.1)' : 'rgba(220,38,38,0.1)',
                      color: k.status === 'ACTIVE' ? '#059669' : '#DC2626' }}>{k.status}</span>
                  </div>
                  <p style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', marginTop: '3px' }}>
                    {k.keyPrefix}••••••••  ·  {k.rateTier}  ·  {k.scopes}
                  </p>
                </div>
                {k.status === 'ACTIVE' && (
                  <button className="h-8 text-xs px-3 rounded-lg font-medium"
                    style={{ background: 'rgba(220,38,38,0.1)', color: '#DC2626' }}
                    onClick={() => revokeKey.mutate(k.id)}>
                    <Trash2 size={12} /> Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New key result modal */}
      {newKey && (
        <div className="modal-overlay" onClick={() => setNewKey(null)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e: any) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={20} style={{ color: '#059669' }} />
              <h3 className="text-lg font-semibold">API Key Created</h3>
            </div>
            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(217,119,6,0.08)',
              border: '1px solid rgba(217,119,6,0.2)', marginBottom: '14px' }}>
              <p style={{ fontSize: '12px', color: '#B45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={13} /> Copy this key now — for security it will never be shown again.
              </p>
            </div>
            <label className="label">{newKey.name}</label>
            <div className="flex gap-2">
              <input readOnly className="input h-10 flex-1" style={{ fontFamily: 'monospace', fontSize: '12px' }} value={newKey.key} />
              <button className="btn-secondary h-10" onClick={() => { navigator.clipboard.writeText(newKey.key); toast.success('Copied') }}>
                <Copy size={15} />
              </button>
            </div>
            <div className="flex justify-end mt-4">
              <button className="btn-primary h-9" onClick={() => setNewKey(null)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Issue key modal */}
      {showKey && (
        <div className="modal-overlay" onClick={() => setShowKey(false)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e: any) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Issue New API Key</h3>
            <label className="label">Key Name</label>
            <input className="input h-10 mb-3" placeholder="e.g. Production Server"
              value={keyForm.name} onChange={e => setKeyForm(f => ({ ...f, name: e.target.value }))} />
            <label className="label">Scopes (comma-separated)</label>
            <input className="input h-10 mb-3" placeholder="invoices:read,customers:read"
              value={keyForm.scopes} onChange={e => setKeyForm(f => ({ ...f, scopes: e.target.value }))} />
            <label className="label">Rate Tier</label>
            <select className="input h-10 mb-4" value={keyForm.rateTier}
              onChange={e => setKeyForm(f => ({ ...f, rateTier: e.target.value }))}>
              <option value="FREE">FREE — 60 requests/min</option>
              <option value="STANDARD">STANDARD — 600 requests/min</option>
              <option value="PREMIUM">PREMIUM — 6000 requests/min</option>
            </select>
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary h-9" onClick={() => setShowKey(false)}>Cancel</button>
              <button className="btn-primary h-9" onClick={() => issueKey.mutate()} disabled={!keyForm.name || issueKey.isPending}>
                {issueKey.isPending ? 'Creating...' : 'Create Key'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
