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

import { PLACES_OF_SUPPLY } from '@/lib/money'
import { addressLines, addressProblem, inIndia, type ShipToParts } from '@/lib/address'

/**
 * An address in its parts: line 1, line 2, city, state, PIN code and country — and, for where the goods go, who
 * receives them and their GSTIN. In India the state is chosen from the GST list (it decides the place of
 * supply); elsewhere it is typed. idPrefix names every box ("bill-line1", "ship-pincode"…).
 */
export function AddressFields({ value, onChange, idPrefix, which, withName, withGstin, stateFromGstin }: {
  value: ShipToParts
  onChange: (next: ShipToParts) => void
  idPrefix: string
  /** "billing" or "shipping": named in the messages */
  which: string
  /** the receiver's name (shipping) */
  withName?: boolean
  /** the receiver's GSTIN (shipping) */
  withGstin?: boolean
  /** the state that the GSTIN gives (the state box then follows it) */
  stateFromGstin?: string | null
}) {
  const set = (k: keyof ShipToParts) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ ...value, [k]: e.target.value })
  const india = inIndia(value)
  const problem = addressProblem(value, which)
  const id = (k: string) => `${idPrefix}-${k}`
  const knownState = !value.state || PLACES_OF_SUPPLY.some(p => p.name === value.state)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-6 gap-3" data-address={idPrefix}>
      {withName && (
        <div className="sm:col-span-6">
          <label className="label" htmlFor={id('name')}>Receiver&apos;s name</label>
          <input id={id('name')} className="input h-10" value={value.name ?? ''} onChange={set('name')} maxLength={200} placeholder="Leave empty: the customer" />
        </div>
      )}
      <div className="sm:col-span-6">
        <label className="label" htmlFor={id('line1')}>Address line 1</label>
        <input id={id('line1')} className="input h-10" value={value.line1 ?? ''} onChange={set('line1')} maxLength={200} placeholder="Building, street" autoComplete="address-line1" />
      </div>
      <div className="sm:col-span-6">
        <label className="label" htmlFor={id('line2')}>Address line 2</label>
        <input id={id('line2')} className="input h-10" value={value.line2 ?? ''} onChange={set('line2')} maxLength={200} placeholder="Area, landmark (optional)" autoComplete="address-line2" />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor={id('city')}>City</label>
        <input id={id('city')} className="input h-10" value={value.city ?? ''} onChange={set('city')} maxLength={100} autoComplete="address-level2" />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor={id('state')}>State</label>
        {india ? (
          <select id={id('state')} className="input h-10" value={stateFromGstin ?? value.state ?? ''} onChange={set('state')} disabled={!!stateFromGstin}>
            <option value="">{stateFromGstin ? `${stateFromGstin} (from GSTIN)` : 'Choose…'}</option>
            {!knownState && <option value={value.state ?? ''}>{value.state}</option>}
            {PLACES_OF_SUPPLY.map(p => <option key={p.code} value={p.name}>{p.name}</option>)}
          </select>
        ) : (
          <input id={id('state')} className="input h-10" value={value.state ?? ''} onChange={set('state')} maxLength={100} placeholder="State / province" />
        )}
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor={id('pincode')}>{india ? 'PIN code' : 'Postal code'}</label>
        <input id={id('pincode')} className="input h-10" value={value.pincode ?? ''} onChange={set('pincode')} maxLength={10}
          inputMode={india ? 'numeric' : 'text'} placeholder={india ? '411001' : ''} autoComplete="postal-code" />
      </div>
      <div className={withGstin ? 'sm:col-span-3' : 'sm:col-span-6'}>
        <label className="label" htmlFor={id('country')}>Country</label>
        <input id={id('country')} className="input h-10" value={value.country ?? ''} onChange={set('country')} maxLength={60} placeholder="India" autoComplete="country-name" />
      </div>
      {withGstin && (
        <div className="sm:col-span-3">
          <label className="label" htmlFor={id('gstin')}>Receiver&apos;s GSTIN</label>
          <input id={id('gstin')} className="input h-10 font-mono uppercase" value={value.gstin ?? ''} maxLength={15} placeholder="If registered"
            onChange={e => onChange({ ...value, gstin: e.target.value.toUpperCase().replace(/\s/g, '') })} />
        </div>
      )}
      {problem && <p className="sm:col-span-6 text-xs" style={{ color: '#dc2626' }} role="alert">{problem}</p>}
    </div>
  )
}

/** An address as it prints, for a summary ("Ships to the billing address: …"). */
export function AddressText({ value, empty = '—', testId }: { value?: ShipToParts | null; empty?: string; testId?: string }) {
  const lines = addressLines(value)
  return (
    <div className="text-sm leading-relaxed" data-testid={testId}>
      {value?.name ? <p className="font-medium">{value.name}</p> : null}
      {lines.length ? lines.map((l, i) => <p key={i}>{l}</p>) : <p style={{ color: 'var(--text-muted)' }}>{empty}</p>}
      {value?.gstin ? <p className="font-mono text-xs mt-0.5">GSTIN {value.gstin}</p> : null}
    </div>
  )
}
