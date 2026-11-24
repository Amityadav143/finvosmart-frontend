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

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/seo/JsonLd'
import { StoreFront } from '@/components/shop/StoreFront'
import { ApiUnavailable, serverGetKept } from '@/lib/serverApi'
import { storeMetadata, storeSchema, unavailableMetadata } from '@/lib/shopSeo'
import type { PublicStore } from '@/types/store'

// made on each visit from the store's answer (kept 30 seconds, and through an API restart: lib/serverApi.ts)
export const dynamic = 'force-dynamic'
const load = (slug: string) => serverGetKept<PublicStore>(`/public/shop/${encodeURIComponent(slug.toLowerCase())}`)

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params
  let s: PublicStore | null
  try { s = await load(params.slug) } catch (e) {
    if (e instanceof ApiUnavailable) return unavailableMetadata       // the page itself says so (error.tsx)
    throw e
  }
  // before anything is sent: a store that isn't there answers 404 (not a page saying so)
  if (!s) notFound()
  return await storeMetadata(s)
}

/** A published online store: rendered on the server (search engines read it whole), then the cart works in the browser. */
export default async function StorePage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params
  const s = await load(params.slug)
  if (!s) notFound()
  return (
    <>
      <JsonLd nodes={await storeSchema(s)} />
      <StoreFront store={s} />
    </>
  )
}
