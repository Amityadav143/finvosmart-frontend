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

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store/slices/authStore'
import { askServer } from '@/lib/auth/server'
import { platformApi, type ConsoleAccess } from '@/lib/api/platform'
import { apiError } from '@/lib/apiError'
import { RELEASE } from '@/lib/release'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
const DEFAULT_COMPANY = '00000000-0000-0000-0000-000000000001'

/** The id the value names: from a backend of this update namedCompanyId, from the 13 November one platformCompanyId. */
const named = (w: ConsoleAccess) => (w.namedCompanyId !== undefined ? w.namedCompanyId : w.platformCompanyId) ?? null

export type Verdict = 'asking' | 'allowed' | 'old-backend' | 'not-an-id' | 'no-company' | 'other-company' | 'backend-older' | 'failed'

/**
 * The console is closed to a Super Admin: what the server itself says, and the one thing to change. The web app
 * asks the backend that answers it — its release (/auth/providers), whether it told the web app who may open the
 * console at all (a backend from before the console doesn't), and why (/console-access: PLATFORM_COMPANY_ID as the
 * running backend got it, the company it names, the asker's company). Nothing is changed.
 */
export function ConsoleDiagnosis({ onVerdict }: { onVerdict?: (v: Verdict) => void }) {
  const user = useAuthStore(s => s.user)
  const [backend, setBackend] = useState<string | null | undefined>(undefined)   // undefined: still asking; null: not said
  const [why, setWhy] = useState<ConsoleAccess | null>(null)
  const [state, setState] = useState<'asking' | 'ok' | 'missing' | 'failed'>('asking')
  const [problem, setProblem] = useState('')
  const [apiAt, setApiAt] = useState('')

  useEffect(() => {
    let live = true
    try { setApiAt(new URL(API_URL, window.location.origin).toString().replace(/\/$/, '')) } catch { setApiAt(API_URL) }
    askServer().then(a => { if (live) setBackend('info' in a ? a.info.release : null) })
    platformApi.consoleAccess()
      .then(d => { if (live) { setWhy(d); setState('ok') } })
      .catch((e: any) => {
        if (!live) return
        if (e?.response?.status === 404) setState('missing')
        else { setProblem(apiError(e, 'no answer')); setState('failed') }
      })
    return () => { live = false }
  }, [])

  const company = user?.companyName || 'your company'
  const yours = user?.companyId ?? ''
  const elsewhere = (() => { try { return apiAt && new URL(apiAt).origin !== window.location.origin } catch { return false } })()
  const verdict: Verdict =
    user?.consoleSaid === false ? 'old-backend'
      : state === 'asking' ? 'asking'
      : state === 'failed' ? 'failed'
      : state === 'missing' ? 'backend-older'
      : why!.allowed ? 'allowed'
      : !why!.platformCompanyId || !why!.companyFound ? (named(why!) ? 'no-company' : 'not-an-id')
      : 'other-company'
  useEffect(() => { onVerdict?.(verdict) }, [verdict, onVerdict])
  // the setting the value is read from: PLATFORM_COMPANY_ID, or app.platform.company-id set where it wins over it
  const setting = why?.overridden ? 'app.platform.company-id' : 'PLATFORM_COMPANY_ID'

  // the one change: where the value is set — the env file, or the place that wins over it — then a restart
  const setIt = why?.overridden ? (
    <ol className="list-decimal pl-5 space-y-1 mt-1" data-testid="console-fix" data-where="override">
      <li>on the server, where it is set — {why.from}: change it to <code>{yours || DEFAULT_COMPANY}</code> (or take it out there,
        so <code>PLATFORM_COMPANY_ID</code> in the env file decides)</li>
      <li><code>sudo systemctl restart finvosmart-backend</code> (with Docker: <code>docker compose up -d api</code>)</li>
      <li>press <b>Check again</b> here.</li>
    </ol>
  ) : (
    <>
      <ol className="list-decimal pl-5 space-y-1 mt-1" data-testid="console-fix" data-where="env-file">
        <li>on the server, in the backend&apos;s env file (usually <code>/home/finvosmart/prod/backend/finvosmart.env</code>):{' '}
          <code>PLATFORM_COMPANY_ID={yours || DEFAULT_COMPANY}</code></li>
        <li><code>sudo systemctl restart finvosmart-backend</code> (with Docker: <code>docker compose up -d api</code>)</li>
        <li>press <b>Check again</b> here.</li>
      </ol>
      <p className="mt-1" data-testid="console-one-step">Or both steps at once, on the server in the Finvosmart folder:{' '}
        <code>sudo bash scripts/platform-admin.sh use {user?.email}{user?.companyCode ? ` ${user.companyCode}` : ''}</code> — it sets the
        value, gives this login the role if needed, restarts the backend and shows what it then says.</p>
    </>
  )

  return (
    <div className="rounded-lg px-4 py-3 text-sm space-y-2" data-testid="console-diagnosis" data-verdict={verdict}
      style={{ background: 'rgba(180,83,9,0.06)', border: '1px solid rgba(180,83,9,0.3)' }}>
      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>What this server says</p>
      <ul className="space-y-0.5 text-xs" style={{ color: 'var(--text-secondary)' }} data-testid="console-facts">
        <li>This web app: release <b>{RELEASE}</b>, asking the API at <code>{apiAt || API_URL}</code></li>
        <li>The backend answering: {backend === undefined ? 'asking…' : backend ? <>release <b>{backend}</b></> : 'a release from before releases were reported'}
          {backend && backend !== RELEASE && <span style={{ color: '#b45309' }}> — not this web app&apos;s release</span>}</li>
        {why && <li>{setting} there: {why.configuredSet ? <code>{why.configured}</code> : <>not set — the default, <code>{why.configured ?? DEFAULT_COMPANY}</code></>}
          {' → '}{why.fallback
            ? <span data-testid="console-fallback">{why.fallback === 'NOT_AN_ID' ? 'not a company id' : 'no company has that id'} — taken as not set, so the
                seeded company runs the console{why.companyName ? <>: {why.companyName} ({why.companyCode})</> : ''}</span>
            : !named(why) ? 'not a company id' : why.companyFound ? <>{why.companyName} ({why.companyCode})</> : 'no company has that id'}</li>}
        {why?.from && <li data-testid="console-from">The value comes from: {why.from}
          {why.overridden && why.environment != null && why.environment !== why.configured && <> (PLATFORM_COMPANY_ID=<code>{why.environment}</code> is set too, but isn&apos;t used)</>}</li>}
        {why && <li>Your login: {why.yourCompanyName ?? company} (<code>{why.yourCompanyId}</code>)</li>}
      </ul>

      <div data-testid="console-verdict" style={{ color: 'var(--text-primary)' }}>
        {verdict === 'asking' && <p style={{ color: 'var(--text-muted)' }}>Asking the server…</p>}
        {verdict === 'old-backend' && <>
          <p><b>The backend that answers sign-in is from before the platform console</b> ({backend ? `release ${backend}` : 'an old release'}): it doesn&apos;t
            tell the web app who may open the console, so the console stays closed for everyone.</p>
          <p className="mt-1">Rebuild the backend from this update (<code>mvn clean package -DskipTests</code>) and restart it. Did that already? Then an
            older backend still answers sign-in: <code>sudo ss -ltnp | grep java</code> lists the backends running, and nginx&apos;s <code>proxy_pass</code> for
            <code> /api/</code> must point at the new one.</p>
        </>}
        {verdict === 'allowed' && <p><b>The backend says this login can open the console.</b> Press <b>Check again</b> (this tab still has the answer
          from before it could).</p>}
        {verdict === 'not-an-id' && <>
          <p><b>{setting} on this server isn&apos;t a company id</b> (<code>{why?.configured}</code>), so nobody can open the console. To open it
            for {company}:</p>{setIt}</>}
        {verdict === 'no-company' && <>
          <p><b>No company on this server has the id in {setting}</b> (<code>{why ? named(why) : ''}</code>), so nobody can open the console.
            To open it for {company}:</p>{setIt}</>}
        {verdict === 'other-company' && <>
          <p><b>This server&apos;s console belongs to {why?.companyName} ({why?.companyCode})</b>
            {why?.fallback ? <> — {setting} can&apos;t be used as it is, so the seeded company runs it</>
              : why?.configuredSet ? <> — {setting} is set to it</> : <> — PLATFORM_COMPANY_ID isn&apos;t set, so the default company runs it</>}.
            Your login is in {why?.yourCompanyName ?? company}. Either sign in as a Super Admin of {why?.companyName}
            {why && why.consoleAdmins.length > 0 ? <> ({why.consoleAdmins.join(', ')})</> : <> (none of its logins can open it yet)</>}, or make
            {' '}{why?.yourCompanyName ?? company} the console&apos;s company:</p>{setIt}</>}
        {verdict === 'backend-older' && <>
          <p><b>The backend says {company} isn&apos;t the company that runs Finvosmart</b> — PLATFORM_COMPANY_ID in its environment is another
            company, or isn&apos;t a company id. {backend && backend !== RELEASE
              ? <>It is release {backend}, older than this web app: update it to this release, and this box names the value it has.</>
              : <>See it on the server: <code>sudo grep PLATFORM_COMPANY_ID /home/finvosmart/prod/backend/finvosmart.env</code>.</>}</p>
          <p className="mt-1">To open the console for {company}:</p>{setIt}</>}
        {verdict === 'failed' && <p>The server couldn&apos;t be asked why: {problem}</p>}
      </div>
      {elsewhere && <p className="text-xs" style={{ color: '#b45309' }} data-testid="api-elsewhere">
        This web app sends its requests to <code>{apiAt}</code>, not to this site: it was built with NEXT_PUBLIC_API_URL set. The backend there
        decides who may open the console — rebuild the web app without NEXT_PUBLIC_API_URL (it then uses this site&apos;s /api/v1) if that isn&apos;t
        the backend you updated.</p>}
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>On the server, <code>sudo bash scripts/check-sign-in.sh https://your-site {user?.companyCode ?? 'COMPANY_CODE'} {user?.email}</code> checks
        the same from outside, signing in as you.</p>
    </div>
  )
}
