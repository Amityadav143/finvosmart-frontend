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
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Download } from 'lucide-react'
import { platformApi } from '@/lib/api/platform'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { ConsoleHeading } from '@/components/platform/ConsoleKit'
import { apiError } from '@/lib/apiError'

const PERIODS = [30, 90, 365]
const n = (v: number) => v.toLocaleString('en-IN')

/**
 * Where sign-ups and demo requests come from — search engines, AI assistants, ads, social media, other sites — as each
 * visitor's own browser kept it (no tracker), and the sign-ups from Google ads as a file for Google Ads' offline
 * conversion import, so paid search is judged by the companies it brings.
 */
export default function PlatformAcquisitionPage() {
  const [days, setDays] = useState(90)
  const [name, setName] = useState('Sign-up')
  const [busy, setBusy] = useState(false)
  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['platform', 'acquisition', days], queryFn: () => platformApi.acquisition(days), placeholderData: keepPreviousData,
  })
  const downloadAds = async () => {
    setBusy(true)
    try {
      const blob = await platformApi.googleAdsFile(days, name.trim() || 'Sign-up')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'finvosmart-google-ads-signups.csv'; a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (e) {
      toast.error(apiError(e, 'The file could not be made.'))
    } finally { setBusy(false) }
  }

  return (
    <div className="space-y-4" data-testid="platform-acquisition">
      <ConsoleHeading title="Where sign-ups come from"
        line={<>{data ? `${n(data.signups)} sign-ups and ${n(data.demos)} demo requests in the last ${data.days} days` : 'Sign-ups and demo requests by what brought them'}
          {isFetching && data ? ' · updating…' : ''}</>}>
        <div className="flex gap-1" role="group" aria-label="Period">
          {PERIODS.map(d => (
            <button key={d} className={d === days ? 'btn-primary h-9' : 'btn-secondary h-9'} aria-pressed={d === days} onClick={() => setDays(d)}
              data-testid={`acq-days-${d}`}>{d === 365 ? 'A year' : `${d} days`}</button>
          ))}
        </div>
      </ConsoleHeading>

      {isLoading && <SkeletonCard />}
      {isError && <div className="card text-sm" role="alert" style={{ color: 'var(--danger-text)' }}>{apiError(error, 'The figures could not be loaded.')}</div>}
      {data && (
        <>
          <section className="card overflow-x-auto" aria-label="By channel">
            <h2 className="font-semibold mb-2">By what first brought them</h2>
            <table className="w-full text-sm" data-testid="acq-channels">
              <thead><tr className="text-left" style={{ color: 'var(--text-muted)' }}><th className="py-1.5 pr-3">Channel</th><th className="py-1.5 pr-3 text-right">Sign-ups</th><th className="py-1.5 text-right">Demo requests</th></tr></thead>
              <tbody>{data.channels.map(c => (
                <tr key={c.channel} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="py-1.5 pr-3">{c.label}</td><td className="py-1.5 pr-3 text-right tabular-nums">{n(c.signups)}</td><td className="py-1.5 text-right tabular-nums">{n(c.demos)}</td>
                </tr>))}</tbody>
            </table>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>AI assistants: visits from ChatGPT, Perplexity, Claude, Gemini, Copilot and others. Direct, or not known: nothing said where they came from.</p>
          </section>

          <section className="card overflow-x-auto" aria-label="By campaign">
            <h2 className="font-semibold mb-2">By campaign (the latest one before they signed up)</h2>
            {data.campaigns.length === 0
              ? <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No tagged campaign brought anyone in this period. Tag ad and email links with utm_source, utm_medium and utm_campaign to see them here.</p>
              : <table className="w-full text-sm" data-testid="acq-campaigns">
                  <thead><tr className="text-left" style={{ color: 'var(--text-muted)' }}><th className="py-1.5 pr-3">Source</th><th className="py-1.5 pr-3">Medium</th><th className="py-1.5 pr-3">Campaign</th><th className="py-1.5 pr-3 text-right">Sign-ups</th><th className="py-1.5 text-right">Demo requests</th></tr></thead>
                  <tbody>{data.campaigns.map((c, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                      <td className="py-1.5 pr-3">{c.source || '—'}</td><td className="py-1.5 pr-3">{c.medium || '—'}</td><td className="py-1.5 pr-3">{c.campaign || '—'}</td>
                      <td className="py-1.5 pr-3 text-right tabular-nums">{n(c.signups)}</td><td className="py-1.5 text-right tabular-nums">{n(c.demos)}</td>
                    </tr>))}</tbody>
                </table>}
          </section>

          <section className="card space-y-2" aria-label="Google Ads">
            <h2 className="font-semibold">Sign-ups for Google Ads</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{n(data.adSignups)} sign-ups in this period came from a Google ad. Import them in Google Ads
              (Goals → Conversions → Uploads) as offline conversions, so its bidding learns which searches bring companies, not just clicks.
              The conversion action there must have the name below.</p>
            <div className="flex flex-wrap items-end gap-2">
              <div><label className="label" htmlFor="acq-name">Conversion action’s name</label>
                <input id="acq-name" className="input h-10 w-56" value={name} onChange={e => setName(e.target.value)} maxLength={60} /></div>
              <button className="btn-secondary h-10" onClick={downloadAds} disabled={busy || data.adSignups === 0} data-testid="acq-google-ads">
                <Download className="w-4 h-4" aria-hidden />{busy ? 'Making the file…' : 'Download for Google Ads'}</button>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
