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
import { PermissionGate } from '@/components/ui/PermissionGate'
import { Plus, GitBranch, Users, CheckCircle, ChevronDown, ChevronRight, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

type WorkflowType = 'LEAVE' | 'EXPENSE' | 'PURCHASE_ORDER' | 'INVOICE_APPROVAL'

interface WorkflowStep {
  id: string; order: number; name: string; approverRole: string; timeoutDays: number; action: 'APPROVE_REJECT' | 'APPROVE_ONLY'
}

interface Workflow {
  id: string; name: string; type: WorkflowType; isActive: boolean; steps: WorkflowStep[]; amountThreshold?: number
}

const ROLE_LABELS: Record<string, string> = {
  MANAGER: 'Manager', HR_ADMIN: 'HR Admin', FINANCE_ADMIN: 'Finance Admin',
  COMPANY_ADMIN: 'Company Admin', SUPER_ADMIN: 'Super Admin',
}

const TYPE_LABELS: Record<WorkflowType, string> = {
  LEAVE: 'Leave Applications', EXPENSE: 'Expense Claims',
  PURCHASE_ORDER: 'Purchase Orders', INVOICE_APPROVAL: 'Invoice Approvals',
}

const INIT_WORKFLOWS: Workflow[] = [
  {
    id: '1', name: 'Standard Leave Approval', type: 'LEAVE', isActive: true,
    steps: [
      { id: '1a', order: 1, name: 'Manager Review', approverRole: 'MANAGER', timeoutDays: 3, action: 'APPROVE_REJECT' },
      { id: '1b', order: 2, name: 'HR Confirmation', approverRole: 'HR_ADMIN', timeoutDays: 2, action: 'APPROVE_REJECT' },
    ],
  },
  {
    id: '2', name: 'Expense Claims < ₹10,000', type: 'EXPENSE', isActive: true, amountThreshold: 10000,
    steps: [
      { id: '2a', order: 1, name: 'Manager Approval', approverRole: 'MANAGER', timeoutDays: 2, action: 'APPROVE_REJECT' },
    ],
  },
  {
    id: '3', name: 'Purchase Orders > ₹1,00,000', type: 'PURCHASE_ORDER', isActive: true, amountThreshold: 100000,
    steps: [
      { id: '3a', order: 1, name: 'Manager Approval',  approverRole: 'MANAGER',       timeoutDays: 2, action: 'APPROVE_REJECT' },
      { id: '3b', order: 2, name: 'Finance Review',    approverRole: 'FINANCE_ADMIN', timeoutDays: 3, action: 'APPROVE_REJECT' },
      { id: '3c', order: 3, name: 'Admin Sanctioning', approverRole: 'COMPANY_ADMIN', timeoutDays: 2, action: 'APPROVE_REJECT' },
    ],
  },
]

export default function WorkflowPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>(INIT_WORKFLOWS)
  const [expanded, setExpanded]   = useState<string | null>('1')

  const toggle = (id: string) => setExpanded(e => e === id ? null : id)

  const toggleActive = (id: string) => {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, isActive: !w.isActive } : w))
    const w = workflows.find(w => w.id === id)
    toast.success(`Workflow ${w?.isActive ? 'disabled' : 'enabled'}`)
  }

  return (
    <PermissionGate permission="SETTINGS_WORKFLOW" showDenied>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Approval Workflows</h1>
            <p className="page-subtitle">Configure multi-step approval chains for leaves, expenses, POs and invoices</p>
          </div>
          <PermissionGate permission="SETTINGS_COMPANY">
            <button className="btn-primary h-9 text-sm" onClick={()=>toast("Workflow builder — define approval chains per document type")}><Plus size={15} />New Workflow</button>
          </PermissionGate>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-3">
          {(Object.entries(TYPE_LABELS) as [WorkflowType, string][]).map(([type, label]) => {
            const count = workflows.filter(w => w.type === type).length
            const active = workflows.filter(w => w.type === type && w.isActive).length
            return (
              <div key={type} className="card">
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
                <p className="font-serif text-2xl" style={{ color: 'var(--gold)' }}>{active}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{count} total · {active} active</p>
              </div>
            )
          })}
        </div>

        {/* Workflow list */}
        <div className="space-y-3">
          {workflows.map(wf => (
            <div key={wf.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <button
                onClick={() => toggle(wf.id)}
                className="w-full flex items-center gap-4 px-5 py-4"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: wf.isActive ? 'rgba(34,197,94,0.1)' : 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <GitBranch size={17} style={{ color: wf.isActive ? '#22c55e' : 'var(--text-muted)' }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{wf.name}</p>
                    <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: wf.isActive ? 'rgba(34,197,94,0.1)' : 'var(--bg-hover)', color: wf.isActive ? '#22c55e' : 'var(--text-muted)' }}>
                      {wf.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {TYPE_LABELS[wf.type]} · {wf.steps.length} step{wf.steps.length > 1 ? 's' : ''}
                    {wf.amountThreshold ? ` · threshold: ₹${wf.amountThreshold.toLocaleString('en-IN')}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={e => { e.stopPropagation(); toggleActive(wf.id) }}
                    className="btn-ghost text-xs h-8 px-3"
                    style={{ color: wf.isActive ? '#ef4444' : '#22c55e' }}>
                    {wf.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button className="btn-icon w-8 h-8" onClick={e => e.stopPropagation()}><Edit2 size={13} /></button>
                  {expanded === wf.id ? <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
                </div>
              </button>

              {expanded === wf.id && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px 20px' }}>
                  <div className="flex flex-col gap-3">
                    {wf.steps.map((step, idx) => (
                      <div key={step.id} className="flex items-center gap-4">
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--btn-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: 'var(--text-on-gold)', flexShrink: 0 }}>
                          {step.order}
                        </div>
                        <div style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{step.name}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                                  <Users size={11} />{ROLE_LABELS[step.approverRole] ?? step.approverRole}
                                </span>
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                  Timeout: {step.timeoutDays} day{step.timeoutDays > 1 ? 's' : ''}
                                </span>
                                <span className="flex items-center gap-1 text-xs" style={{ color: '#22c55e' }}>
                                  <CheckCircle size={11} />{step.action === 'APPROVE_REJECT' ? 'Can approve/reject' : 'Approve only'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {idx < wf.steps.length - 1 && (
                          <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 14px', flexShrink: 0 }} />
                        )}
                      </div>
                    ))}
                    <button className="btn-ghost text-xs h-8 mt-2" style={{ alignSelf: 'flex-start', paddingLeft: '44px' }} onClick={()=>toast("Add an approval step")}>
                      <Plus size={12} />Add step
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </PermissionGate>
  )
}
