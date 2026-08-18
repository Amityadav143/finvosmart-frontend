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
import { financeApi } from '@/lib/api/finance'
import { DataTable } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'
import { Account } from '@/types'
import { Plus, TrendingUp, TrendingDown, DollarSign, BarChart2 } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'

const ACCOUNT_COLORS: Record<string, string> = {
  ASSET:     '#3b82f6',
  LIABILITY: '#ef4444',
  EQUITY:    '#8b5cf6',
  INCOME:    '#22c55e',
  EXPENSE:   '#f59e0b',
}

export default function AccountsPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [form, setForm] = useState({ accountCode: '', accountName: '', accountType: 'ASSET', openingBalance: '0', description: '' })

  const { data: accounts, isLoading } = useQuery({ queryKey: ['accounts'], queryFn: financeApi.accounts.list })

  const createMutation = useMutation({
    mutationFn: (d: any) => financeApi.accounts.create({ ...d, openingBalance: parseFloat(d.openingBalance) || 0 }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); setShowCreate(false); toast.success('Account created') },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed'),
  })

  const filtered = filterType ? (accounts ?? []).filter((a: any) => a.accountType === filterType) : (accounts ?? [])

  // Aggregate for pie chart
  const pieData = ['ASSET','LIABILITY','EQUITY','INCOME','EXPENSE'].map(type => ({
    name: type,
    value: Math.abs((accounts ?? []).filter((a: any) => a.accountType === type).reduce((s: any, a: any) => s + (a.currentBalance ?? 0), 0)),
    color: ACCOUNT_COLORS[type],
  })).filter(d => d.value > 0)

  const columns = [
    { header: 'Code', render: (a: Account) => <span className="font-mono text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--gold-light)' }}>{a.accountCode}</span> },
    { header: 'Account Name', render: (a: Account) => <span className="font-medium text-sm">{a.accountName}</span> },
    { header: 'Type', render: (a: Account) => (
      <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
        style={{ background: `${ACCOUNT_COLORS[a.accountType] ?? '#94a3b8'}18`, color: ACCOUNT_COLORS[a.accountType] ?? '#94a3b8' }}>
        {a.accountType}
      </span>
    )},
    { header: 'Opening Balance', render: (a: Account) => <span className="text-sm font-mono">{formatCurrency(a.openingBalance)}</span> },
    { header: 'Current Balance', render: (a: Account) => (
      <span className={`text-sm font-bold font-mono ${a.currentBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {formatCurrency(a.currentBalance)}
      </span>
    )},
    { header: 'Leaf', render: (a: Account) => a.isLeaf ? <Badge variant="success">Leaf</Badge> : <Badge variant="default">Group</Badge> },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-base">Chart of Accounts</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{accounts?.length ?? 0} accounts configured</p>
            </div>
            <div className="flex items-center gap-2">
              <select className="input w-36 h-9 text-xs" value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="">All Types</option>
                {['ASSET','LIABILITY','EQUITY','INCOME','EXPENSE'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button onClick={() => setShowCreate(true)} className="btn-primary h-9"><Plus className="w-4 h-4" />Add</button>
            </div>
          </div>
          <DataTable columns={columns} data={filtered} loading={isLoading} keyExtractor={a => a.id} emptyMessage="No accounts found" />
        </div>

        <div className="card">
          <h2 className="font-semibold text-base mb-4">Balance Distribution</h2>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={72} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent" />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatCurrency(v)} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-xs flex-1" style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                    <span className="text-xs font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center py-12 gap-3">
              <BarChart2 className="w-12 h-12" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No data yet</p>
            </div>
          )}
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Account" subtitle="Add to your Chart of Accounts">
        <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form) }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Account Code *</label><input className="input h-10" required value={form.accountCode} onChange={e => setForm(f => ({...f, accountCode: e.target.value}))} placeholder="e.g. 1001" /></div>
            <div><label className="label">Account Type *</label>
              <select className="input h-10" value={form.accountType} onChange={e => setForm(f => ({...f, accountType: e.target.value}))}>
                {['ASSET','LIABILITY','EQUITY','INCOME','EXPENSE'].map(t => <option key={t} value={t}>{t}</option>)}
              </select></div>
          </div>
          <div><label className="label">Account Name *</label><input className="input h-10" required value={form.accountName} onChange={e => setForm(f => ({...f, accountName: e.target.value}))} /></div>
          <div><label className="label">Opening Balance (₹)</label><input className="input h-10" type="number" step="0.01" value={form.openingBalance} onChange={e => setForm(f => ({...f, openingBalance: e.target.value}))} /></div>
          <div><label className="label">Description</label><textarea className="input resize-none" rows={2} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">{createMutation.isPending ? 'Creating...' : 'Create Account'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
