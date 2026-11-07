'use client';
import { useRef, useState, type DragEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { useT } from '@/lib/i18n';

const ACCEPT = 'image/png,image/jpeg,image/webp,image/heic,image/heif,.heic,.heif';

/** Empty state of the scan canvas: a dashed hairline target that accepts a dropped or chosen image. */
export function Dropzone({ onFile, error, busy = false }: { onFile: (f: File) => void; error?: string | null; busy?: boolean }) {
  const { t } = useT();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const onDrop = (e: DragEvent) => {
    e.preventDefault(); setOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!over) setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      data-over={over || undefined}
      className={`relative flex flex-col items-center justify-center text-center gap-3 rounded-[14px] border border-dashed px-6 py-14 min-h-[360px] md:min-h-[420px] transition-colors duration-[120ms] ${over ? 'border-pine bg-pine-soft' : 'border-line bg-surface'}`}
      aria-busy={busy || undefined}
    >
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden className="text-ink-2">
        <path d="M6 16V8a2 2 0 0 1 2-2h8M40 6h8a2 2 0 0 1 2 2v8M50 40v8a2 2 0 0 1-2 2h-8M16 50H8a2 2 0 0 1-2-2v-8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <rect x="15" y="15" width="26" height="26" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <rect x="19" y="19" width="9" height="8" rx="1" fill="currentColor" opacity="0.7" />
        <rect x="30" y="19" width="8" height="12" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="23" cy="34" r="2.5" fill="currentColor" opacity="0.5" />
        <circle cx="33" cy="36" r="2" fill="currentColor" opacity="0.5" />
      </svg>
      <div>
        <p className="text-[18px] leading-7 font-medium">{t('scan.drop')}</p>
        <p className="text-[15px] leading-[22px] text-ink-2">{t('scan.dropHelp')}</p>
      </div>
      <Button variant="secondary" onClick={() => input.current?.click()} loading={busy}>{t('scan.choose')}</Button>
      <input ref={input} type="file" accept={ACCEPT} className="sr-only" aria-label={t('scan.choose')} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
      <div className="min-h-[22px] text-[15px] leading-[22px] text-signal-red" role="alert" aria-live="polite">{error}</div>
    </div>
  );
}
