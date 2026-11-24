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

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { posApi } from '@/lib/api/store'
import { apiError } from '@/lib/apiError'
import { Counter } from '@/components/pos/Counter'
import { PosStart, ShiftClosed } from '@/components/pos/PosStart'
import type { PosSession, ShiftReport } from '@/types/store'

const JOINED = 'finvo.pos.session'

/** Counter billing: choose the counter and open the shift, then bill. */
export default function PosPage() {
  const { canAny } = usePermissions()
  const allowed = canAny('POS_SELL', 'POS_MANAGE')
  const { data: state, isLoading, error, refetch } = useQuery({ queryKey: ['pos-state'], queryFn: posApi.state, enabled: allowed })
  const [joined, setJoined] = useState<string | null>(() => { try { return localStorage.getItem(JOINED) } catch { return null } })
  const join = (s: PosSession) => { setJoined(s.id); try { localStorage.setItem(JOINED, s.id) } catch { /* storage off */ } }
  const leave = () => { setJoined(null); try { localStorage.removeItem(JOINED) } catch { /* storage off */ } }
  // a shift just closed: its report stays up over the counters (the counter screen goes with the shift)
  const [closed, setClosed] = useState<{ report: ShiftReport; width: 58 | 80 } | null>(null)

  if (!allowed) return <PermissionGate anyOf={['POS_SELL', 'POS_MANAGE']} showDenied><span /></PermissionGate>
  if (isLoading) return <div className="space-y-3" aria-busy="true"><div className="h-8 w-56 rounded-lg animate-pulse" style={{ background: 'var(--border)' }} /><div className="h-64 rounded-2xl animate-pulse" style={{ background: 'var(--border)' }} /></div>
  if (error || !state) return (
    <div className="card p-6 max-w-lg space-y-3" role="alert">
      <p className="font-semibold">The counter could not be opened</p>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{apiError(error, 'Check the connection and try again.')}</p>
      <button className="btn-primary h-10" onClick={() => refetch()}>Try again</button>
    </div>
  )
  const at = (id?: string | null) => (id ? state.registers.find(r => r.openSession?.id === id) : undefined)
  const register = closed ? undefined : at(joined) ?? at(state.mine?.id)
  return (
    <>
      {register?.openSession
        ? <Counter key={register.openSession.id} state={state} session={register.openSession} register={register} onLeave={leave}
            onClosed={(report, width) => { leave(); setClosed({ report, width }); refetch() }} />
        : <PosStart state={state} onJoin={join} />}
      {closed && <ShiftClosed report={closed.report} company={state.company} width={closed.width} onDone={() => setClosed(null)} />}
    </>
  )
}
