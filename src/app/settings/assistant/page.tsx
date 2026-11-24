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

import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Database, Lock, MessageSquare, ShieldCheck, Sparkles } from 'lucide-react'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { askAssistant, useAssistantStatus } from '@/components/assistant/AppAssistant'
import { assistantApi } from '@/lib/assistant'
import { apiError } from '@/lib/apiError'
import { formatDate } from '@/lib/utils'

/**
 * Settings → AI assistant: whether "Ask Finvosmart" may answer this company's users from the company's own figures.
 * Off until a company admin switches it on; what it then reads, and where that goes, said plainly.
 */
export default function AssistantSettingsPage() {
  const { data: s, isLoading } = useAssistantStatus()
  const qc = useQueryClient()
  const change = useMutation({
    mutationFn: (on: boolean) => assistantApi.setDataAccess(on),
    onSuccess: (next, on) => {
      qc.setQueryData(['assistant-status'], next)
      toast.success(on ? 'The assistant may now answer from your company’s figures.' : 'The assistant no longer reads your company’s figures.')
    },
    onError: (e: any) => toast.error(apiError(e, 'That could not be changed. Please try again.')),
  })

  return (
    <PermissionGate anyOf={['SETTINGS_VIEW', 'SETTINGS_COMPANY']} showDenied>
      <div className="space-y-6 max-w-3xl" data-testid="assistant-settings">
        <div>
          <h1 className="page-title flex items-center gap-2"><Sparkles size={22} style={{ color: 'var(--gold)' }} aria-hidden />AI assistant</h1>
          <p className="page-subtitle">“Ask Finvosmart” answers your team’s questions in the app — how to do things, with links to the pages — and, if you allow it, from your company’s own figures.</p>
        </div>

        {isLoading || !s ? <SkeletonCard /> : !s.available ? (
          <div className="card" data-testid="assistant-unavailable">
            <p className="font-semibold">The assistant isn’t switched on for this server</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Finvosmart’s administrators switch it on in the platform console. Your choice below is kept and applies once it is on.
            </p>
          </div>
        ) : (
          <div className="card flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare size={18} style={{ color: 'var(--gold)' }} aria-hidden />
              <p className="text-sm">{s.claude
                ? <><strong>{s.usedToday}</strong> of today’s {s.dailyLimit} questions for Claude used by your company — Finvosmart’s own answers don’t count, and go on after it.</>
                : <>Answered by Finvosmart’s own server — nothing is sent outside, and there is no daily limit.</>}</p>
            </div>
            <button type="button" className="btn-secondary h-9 px-4" onClick={() => askAssistant('')} data-testid="assistant-try">
              <Sparkles size={14} aria-hidden />Open the assistant
            </button>
          </div>
        )}

        {s && (
          <div className="card space-y-4" data-testid="assistant-data">
            <div className="flex items-start gap-4">
              <Database size={20} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }} aria-hidden />
              <div className="flex-1 min-w-0">
                <h2 className="section-title">Answers from your company’s figures</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {s.dataAccess
                    ? 'On. The assistant can look up figures to answer: who owes you and what is overdue, bills to pay, cash for the next 13 weeks, and a record by name or number.'
                    : 'Off. The assistant explains how to do things and takes people to the right page, but doesn’t read any of your figures.'}
                </p>
                {s.changedAt && (
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }} data-testid="assistant-changed">
                    Last changed{s.changedBy ? ` by ${s.changedBy}` : ''} on {formatDate(s.changedAt.slice(0, 10), 'd MMM yyyy')}.
                  </p>
                )}
              </div>
              <label className="flex items-center gap-2 flex-shrink-0 cursor-pointer select-none" title={s.canSwitch ? undefined : 'A company admin can change this'}>
                <input type="checkbox" role="switch" className="w-5 h-5 accent-amber-500" checked={s.dataAccess}
                  disabled={!s.canSwitch || change.isPending} onChange={e => change.mutate(e.target.checked)}
                  aria-label="Let the assistant answer from your company’s figures" data-testid="assistant-data-switch" />
                <span className="text-sm font-semibold">{s.dataAccess ? 'On' : 'Off'}</span>
              </label>
            </div>
            {!s.canSwitch && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Only someone who manages the company’s settings can change this.</p>
            )}
            <ul className="grid gap-3 sm:grid-cols-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <li className="flex gap-2"><ShieldCheck size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--ok-text)' }} aria-hidden />
                <span>It sees no more than the person asking: only what their role may open in Finvosmart.</span></li>
              <li className="flex gap-2"><Lock size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--ok-text)' }} aria-hidden />
                <span>It only reads. It can’t create, change, send, pay or delete anything.</span></li>
              <li className="flex gap-2"><Sparkles size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }} aria-hidden />
                <span>Most questions, figures included, are answered by Finvosmart’s own server, and nothing of them leaves Finvosmart. Only a question it can’t answer itself goes to Anthropic’s AI model (Claude), where Finvosmart uses it — with the figures that answer needs, under Anthropic’s commercial terms, not used to train its models.</span></li>
              <li className="flex gap-2"><MessageSquare size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }} aria-hidden />
                <span>Finvosmart keeps no conversation — only how many questions were asked each day. A chat reaches our support team only when someone emails it there.</span></li>
            </ul>
          </div>
        )}
      </div>
    </PermissionGate>
  )
}
