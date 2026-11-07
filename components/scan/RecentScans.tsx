'use client';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { useT } from '@/lib/i18n';
import type { ScanResult } from '@/lib/store';
import type { ScanPolygon } from '@/lib/scanMath';

export type StoredScan = ScanResult & {
  polygons: ScanPolygon[];
  buildableAcres?: number;
  homes?: number;
  aspect?: number;
  sampleId?: 1 | 2 | 3;
  source?: string;
};

export function RecentScans({ items, onOpen, locale }: { items: StoredScan[]; onOpen: (s: StoredScan) => void; locale: string }) {
  const { t } = useT();
  const fmt = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  return (
    <section className="flex flex-col gap-2" aria-labelledby="scan-recent-title">
      <h2 id="scan-recent-title" className="text-[15px] leading-[22px] font-medium text-ink-2">{t('scan.recent')}</h2>
      {items.length === 0 ? (
        <p className="text-[15px] leading-[22px] text-ink-2 border-t border-line pt-3">{t('scan.noRecent')}</p>
      ) : (
        <ul className="flex flex-col">
          {items.map((s) => {
            const openable = !!s.sampleId;
            const row = (
              <>
                <span className="flex flex-col min-w-0">
                  <span className="text-[15px] leading-[22px] text-ink truncate">{s.sampleId ? t('scan.sample', { n: s.sampleId }) : s.parcelId ?? t('scan.imageAlt')}</span>
                  <span className="text-[13px] leading-[18px] text-ink-2">{fmt.format(new Date(s.createdAt))}</span>
                </span>
                <span className="tabular-nums text-right whitespace-nowrap">
                  <span className="text-[15px] leading-[22px] font-medium text-ink"><AnimatedNumber value={s.buildableAcres ?? 0} locale={locale} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} /> {t('common.acres')}</span>
                  <span className="block text-[13px] leading-[18px] text-ink-2"><AnimatedNumber value={s.homes ?? 0} locale={locale} /> {t('common.homes')}</span>
                </span>
              </>
            );
            return (
              <li key={s.id} className="border-t border-line">
                {openable ? (
                  <button type="button" onClick={() => onOpen(s)} className="w-full min-h-11 py-2 flex items-center justify-between gap-3 text-left rounded-[8px] hover-tint transition-colors duration-[120ms] px-1 -mx-1">
                    {row}
                  </button>
                ) : (
                  <div className="w-full min-h-11 py-2 flex items-center justify-between gap-3 px-1 -mx-1">{row}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
