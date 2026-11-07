'use client';
/** Reads a text/plain streaming response chunk by chunk. Throws { code, message } on an error envelope. */
export type ApiFailure = { code: string; message: string };

export async function streamPost(url: string, body: unknown, onChunk: (text: string, full: string) => void, signal?: AbortSignal): Promise<{ text: string; source: string }> {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal });
  const source = res.headers.get('X-Keystone-Source') ?? 'unknown';
  if (!res.ok || !res.body) {
    let err: ApiFailure = { code: 'http_' + res.status, message: res.statusText || 'Request failed' };
    try { const j = await res.json(); if (j?.error) err = j.error; } catch {}
    throw err;
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let full = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    const t = dec.decode(value, { stream: true });
    full += t;
    onChunk(t, full);
  }
  return { text: full, source };
}

export async function postJson<T>(url: string, body: unknown, signal?: AbortSignal): Promise<{ data: T; source: string }> {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal });
  const source = res.headers.get('X-Keystone-Source') ?? 'unknown';
  const j = await res.json().catch(() => null);
  if (!res.ok) throw (j?.error ?? { code: 'http_' + res.status, message: res.statusText }) as ApiFailure;
  return { data: j as T, source };
}
