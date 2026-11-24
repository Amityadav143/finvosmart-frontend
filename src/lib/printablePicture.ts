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

/**
 * A logo or a signature as the server can print it. The server reads PNG, JPEG, GIF and BMP (TemplateAssetService,
 * up to 5 MB); logos are often WebP or SVG (saved from a website) and phone pictures can be larger, so anything else
 * the browser can draw — WebP, SVG, AVIF — is drawn into a PNG here first (transparency kept), and a picture over
 * 5 MB is made smaller. Nothing is sent anywhere to be converted.
 */
export const PICTURE_ACCEPT = 'image/png,image/jpeg,image/gif,image/bmp,image/webp,image/svg+xml,image/avif,.png,.jpg,.jpeg,.gif,.bmp,.webp,.svg,.avif'

const SERVER_READS = /^image\/(png|jpeg|gif|bmp)$/
const MAX_BYTES = 5 * 1024 * 1024
const BY_NAME: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', bmp: 'image/bmp',
  webp: 'image/webp', svg: 'image/svg+xml', avif: 'image/avif', heic: 'image/heic', heif: 'image/heif' }

/** Why a picture was refused, in words for the person. */
export class PictureProblem extends Error {}

export function pictureType(file: File): string {
  if (file.type) return file.type.toLowerCase()
  const ext = file.name.toLowerCase().split('.').pop() ?? ''
  return BY_NAME[ext] ?? ''
}

export async function printablePicture(file: File): Promise<File> {
  const type = pictureType(file)
  if (/^image\/hei[cf]$/.test(type))
    throw new PictureProblem('Pictures in HEIC format can’t be used. Save the picture as PNG or JPEG (on an iPhone: Settings → Camera → Formats → Most Compatible).')
  if (!type.startsWith('image/')) throw new PictureProblem('Choose a picture: PNG, JPEG, WebP or SVG.')
  if (file.size === 0) throw new PictureProblem('The file is empty.')
  if (SERVER_READS.test(type) && file.size <= MAX_BYTES) return file

  const base = file.name.replace(/\.[^.]+$/, '') || 'picture'
  for (const side of [2000, 1200]) {
    const canvas = type === 'image/svg+xml' ? await drawSvg(file, side) : await drawPicture(file, side)
    // a photo stays a JPEG (smaller); everything else a PNG, which keeps transparency
    const asJpeg = type === 'image/jpeg'
    const blob = await new Promise<Blob | null>(res => {
      try { canvas.toBlob(res, asJpeg ? 'image/jpeg' : 'image/png', 0.92) } catch { res(null) }
    })
    if (!blob) throw new PictureProblem('This picture couldn’t be converted. Save it as PNG or JPEG and upload that.')
    if (blob.size <= MAX_BYTES) return new File([blob], `${base}.${asJpeg ? 'jpg' : 'png'}`, { type: asJpeg ? 'image/jpeg' : 'image/png' })
  }
  throw new PictureProblem('The picture is too large even when made smaller. Use a picture under 5 MB.')
}

/** A raster picture (WebP, AVIF, or a large PNG/JPEG) on a canvas, at most maxSide pixels a side. */
async function drawPicture(file: File, maxSide: number): Promise<HTMLCanvasElement> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new PictureProblem('This picture couldn’t be opened — it may be damaged, or a kind this browser can’t show. Save it as PNG or JPEG.')
  }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = sized(bitmap.width * scale, bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()
  return canvas
}

/**
 * An SVG drawn as a picture: shown by an <img> (no scripts run, nothing outside the file is loaded), sharp at about
 * 1,200 pixels across, at most maxSide.
 */
async function drawSvg(file: File, maxSide: number): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new PictureProblem('This SVG couldn’t be drawn. Save it as PNG and upload that.'))
      img.src = url
    })
    const w = img.naturalWidth || 1200, h = img.naturalHeight || 1200
    const scale = Math.min(maxSide, Math.max(1200, Math.max(w, h))) / Math.max(w, h)
    const canvas = sized(w * scale, h * scale)
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas
  } finally {
    URL.revokeObjectURL(url)
  }
}

function sized(w: number, h: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(w)); canvas.height = Math.max(1, Math.round(h))
  return canvas
}
