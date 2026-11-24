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
import { headers } from 'next/headers'
import type { JsonLdNode } from '@/lib/seo'
import type { PublicItem, PublicStore } from '@/types/store'

/**
 * Search and sharing for the online stores: each store's page and product pages carry their own title, description,
 * canonical address, share picture and schema.org data (Store, Product with its Offer). A store that hasn't asked to
 * be listed is kept out of search results (noindex) but still shares nicely.
 */

/** A store's page that can't be made just now (the API down): out of search results until it can be. */
export const unavailableMetadata: Metadata = { title: 'Store unavailable', robots: { index: false, follow: false } }

/** The site the page is being served from ("https://finvosmart.com"), from the request (nginx passes the host). */
export async function origin(): Promise<string> {
  const h = await headers()
  const host = (h.get('x-forwarded-host') || h.get('host') || '').split(',')[0].trim()
  const proto = (h.get('x-forwarded-proto') || 'https').split(',')[0].trim()
  return host ? `${proto}://${host}` : 'https://finvosmart.com'
}

const API = () => (process.env.NEXT_PUBLIC_API_URL || '/api/v1').replace(/\/+$/, '')
/** An absolute address of a store's picture (or logo) for search engines and link previews. */
export function absolutePicture(base: string, slug: string, id: string | null): string | null {
  const api = API()
  const root = /^https?:\/\//i.test(api) ? api : base + api
  return id === null ? `${root}/public/shop/${encodeURIComponent(slug)}/logo` : `${root}/public/shop/${encodeURIComponent(slug)}/pictures/${id}`
}

const clip = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…')

export function storeDescription(s: PublicStore): string {
  const ways = [s.pickup && 'pickup', s.delivery && 'delivery'].filter(Boolean).join(' or ')
  const where = s.city ? ` in ${s.city}` : ''
  return clip(s.tagline?.trim() || s.about?.trim() || `Order from ${s.name} online for ${ways}${where}. See prices with GST and what is in stock.`, 155)
}

export async function storeMetadata(s: PublicStore): Promise<Metadata> {
  const base = await origin()
  const url = `${base}/shop/${s.slug}`
  const title = clip(`${s.name}${s.city ? `, ${s.city}` : ''} — order online`, 60)
  const description = storeDescription(s)
  const pic = s.items.find(i => i.featured && i.images[0])?.images[0] ?? s.items.find(i => i.images[0])?.images[0]
  const image = pic ? absolutePicture(base, s.slug, pic) : s.hasLogo ? absolutePicture(base, s.slug, null) : null
  return {
    title: { absolute: title }, description, alternates: { canonical: url },
    robots: s.listed ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { type: 'website', url, title, description, siteName: s.name, locale: 'en_IN', ...(image ? { images: [{ url: image, alt: s.name }] } : {}) },
    twitter: { card: image ? 'summary_large_image' : 'summary', title, description, ...(image ? { images: [image] } : {}) },
    keywords: undefined, applicationName: s.name,
  }
}

export async function productMetadata(s: PublicStore, i: PublicItem): Promise<Metadata> {
  const base = await origin()
  const url = `${base}/shop/${s.slug}/p/${i.id}`
  const price = Number(i.priceWithGst)
  const rs = '₹' + price.toLocaleString('en-IN', { minimumFractionDigits: price % 1 ? 2 : 0, maximumFractionDigits: 2 })
  const title = clip(`${i.name} — ${rs} at ${s.name}`, 60)
  const description = clip(i.description?.trim() || `${i.name} for ${rs} (GST included) at ${s.name}${s.city ? `, ${s.city}` : ''}. Order online for ${[s.pickup && 'pickup', s.delivery && 'delivery'].filter(Boolean).join(' or ')}.`, 155)
  const image = i.images[0] ? absolutePicture(base, s.slug, i.images[0]) : null
  return {
    title: { absolute: title }, description, alternates: { canonical: url },
    robots: s.listed ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { type: 'website', url, title, description, siteName: s.name, locale: 'en_IN', ...(image ? { images: [{ url: image, alt: i.name }] } : {}) },
    twitter: { card: image ? 'summary_large_image' : 'summary', title, description, ...(image ? { images: [image] } : {}) },
    keywords: undefined, applicationName: s.name,
  }
}

function storeNode(s: PublicStore, base: string): JsonLdNode {
  const url = `${base}/shop/${s.slug}`
  return {
    '@type': 'Store', '@id': `${url}#store`, name: s.name, url,
    ...(s.legalName && s.legalName !== s.name ? { legalName: s.legalName } : {}),
    ...(s.about || s.tagline ? { description: s.about || s.tagline } : {}),
    ...(s.phone ? { telephone: s.phone } : {}), ...(s.email ? { email: s.email } : {}),
    ...(s.hasLogo ? { logo: absolutePicture(base, s.slug, null), image: absolutePicture(base, s.slug, null) } : {}),
    ...(s.gstin ? { taxID: s.gstin } : {}),
    address: { '@type': 'PostalAddress', ...(s.address ? { streetAddress: s.address } : {}), ...(s.city ? { addressLocality: s.city } : {}), ...(s.state ? { addressRegion: s.state } : {}), addressCountry: 'IN' },
    currenciesAccepted: 'INR',
  }
}

function productNode(s: PublicStore, i: PublicItem, base: string): JsonLdNode {
  const url = `${base}/shop/${s.slug}/p/${i.id}`
  return {
    '@type': 'Product', '@id': `${url}#product`, name: i.name, url,
    ...(i.description ? { description: i.description } : {}), ...(i.category ? { category: i.category } : {}),
    ...(i.images.length ? { image: i.images.map(id => absolutePicture(base, s.slug, id)) } : {}),
    offers: {
      '@type': 'Offer', url, price: Number(i.priceWithGst).toFixed(2), priceCurrency: 'INR',
      availability: i.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition', seller: { '@id': `${base}/shop/${s.slug}#store` },
    },
  }
}

/** The store and its first items, for search engines. */
export async function storeSchema(s: PublicStore): Promise<JsonLdNode[]> {
  const base = await origin()
  const list: JsonLdNode = {
    '@type': 'ItemList', '@id': `${base}/shop/${s.slug}#items`, name: `${s.name} — items`,
    itemListElement: s.items.slice(0, 30).map((i, n) => ({ '@type': 'ListItem', position: n + 1, url: `${base}/shop/${s.slug}/p/${i.id}`, name: i.name })),
  }
  return [storeNode(s, base), list]
}

/** One item, its offer, and the path back to the store. */
export async function productSchema(s: PublicStore, i: PublicItem): Promise<JsonLdNode[]> {
  const base = await origin()
  return [storeNode(s, base), productNode(s, i, base), {
    '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: s.name, item: `${base}/shop/${s.slug}` },
      { '@type': 'ListItem', position: 2, name: i.name, item: `${base}/shop/${s.slug}/p/${i.id}` },
    ],
  }]
}
