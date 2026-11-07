'use client';
/** Client-side image intake for Lot Scan: type and size checks, HEIC detection, resize to 1600 px, JPEG base64. */

export const MAX_BYTES = 10 * 1024 * 1024;
export const MAX_EDGE = 1600;
export const JPEG_QUALITY = 0.85;

export type ScanImage = {
  dataUrl: string;
  base64: string;
  mediaType: 'image/jpeg';
  width: number;
  height: number;
  /** height / width */
  aspect: number;
  name: string;
};

export type ImageError = { code: 'tooLarge' | 'badType' | 'heic' | 'decode' };

const isHeic = (file: File) => /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
const isAccepted = (file: File) => /^image\/(png|jpe?g|webp)$/i.test(file.type) || isHeic(file) || /\.(png|jpe?g|webp)$/i.test(file.name);

async function decode(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(file); } catch { /* fall through to <img> */ }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('decode'));
      img.src = url;
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export async function prepareImage(file: File): Promise<ScanImage> {
  if (file.size > MAX_BYTES) throw { code: 'tooLarge' } satisfies ImageError;
  if (!isAccepted(file)) throw { code: 'badType' } satisfies ImageError;
  let bmp: ImageBitmap | HTMLImageElement;
  try {
    bmp = await decode(file);
  } catch {
    throw { code: isHeic(file) ? 'heic' : 'decode' } satisfies ImageError;
  }
  const sw = 'naturalWidth' in bmp ? bmp.naturalWidth : bmp.width;
  const sh = 'naturalHeight' in bmp ? bmp.naturalHeight : bmp.height;
  if (!sw || !sh) throw { code: isHeic(file) ? 'heic' : 'decode' } satisfies ImageError;
  const k = Math.min(1, MAX_EDGE / Math.max(sw, sh));
  const w = Math.max(1, Math.round(sw * k)), h = Math.max(1, Math.round(sh * k));
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw { code: 'decode' } satisfies ImageError;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bmp, 0, 0, w, h);
  if ('close' in bmp) bmp.close();
  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  return { dataUrl, base64: dataUrl.split(',')[1] ?? '', mediaType: 'image/jpeg', width: w, height: h, aspect: h / w, name: file.name };
}

export async function prepareFromUrl(url: string, name: string): Promise<ScanImage> {
  const res = await fetch(url);
  const blob = await res.blob();
  return prepareImage(new File([blob], name, { type: blob.type || 'image/png' }));
}
