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
import { productMetadata, productSchema, unavailableMetadata } from '@/lib/shopSeo'
import type { PublicStore } from '@/types/store'

// made on each visit from the store's answer (kept 30 seconds, and through an API restart: lib/serverApi.ts)
export const dynamic = 'force-dynamic'
const load = (slug: string) => serverGetKept<PublicStore>(`/public/shop/${encodeURIComponent(slug.toLowerCase())}`)

export async function generateMetadata(props: { params: Promise<{ slug: string; id: string }> }): Promise<Metadata> {
  const params = await props.params
  let s: PublicStore | null
  try { s = await load(params.slug) } catch (e) {
    if (e instanceof ApiUnavailable) return unavailableMetadata       // the page itself says so (error.tsx)
    throw e
  }
  const item = s?.items.find(i => i.id === params.id)
  // before anything is sent: an item that isn't there answers 404 (not a page saying so)
  if (!s || !item) notFound()
  return await productMetadata(s, item)
}

/** One item of a store: its photos, price with GST and stock, with the store's cart. */
export default async function ProductPage(props: { params: Promise<{ slug: string; id: string }> }) {
  const params = await props.params
  const s = await load(params.slug)
  const item = s?.items.find(i => i.id === params.id)
  if (!s || !item) notFound()
  return (
    <>
      <JsonLd nodes={await productSchema(s, item)} />
      <StoreFront store={s} productId={item.id} />
    </>
  )
}
