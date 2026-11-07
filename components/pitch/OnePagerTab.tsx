'use client';
import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import type { Parcel, ContentLang, Scenario, Impact } from '@/lib/sb4';
import { insetPolygon } from '@/lib/geometry';
import { useT, contentLangNames } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { dur, ease, stagger } from '@/lib/motion';
import { AerialLot, stallsFor } from '@/components/illustrations/AerialLot';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Button } from '@/components/ui/Button';
import { Segmented } from '@/components/ui/Segmented';
import { toast } from '@/components/ui/Toast';
import { SB4_THREE } from './sb4Three';

const LANGS: ContentLang[] = ['en', 'es', 'vi', 'ko'];

export function OnePagerTab({ parcel, scenario, impact, lang, setLang }: {
  parcel: Parcel; scenario: Scenario; impact: Impact; lang: ContentLang; setLang: (l: ContentLang) => void;
}) {
  const { t, lang: uiLang } = useT();
  const { theme } = useTheme();
  const night = theme === 'dark';
  const [exporting, setExporting] = useState(false);

  const buildable = useMemo(() => insetPolygon(parcel.lotPolygon, 0.05), [parcel.lotPolygon]);
  const keptStalls = useMemo(() => {
    const total = parcel.parkingRects.reduce((n, r) => n + stallsFor(r, 1).length, 0);
    if (parcel.parkingSpaces <= 0) return 0;
    return Math.round((total * scenario.keepSpaces) / parcel.parkingSpaces);
  }, [parcel.parkingRects, parcel.parkingSpaces, scenario.keepSpaces]);

  const keeps = [t('pitch.keepsSanctuary'), t('pitch.keepsParking', { n: scenario.keepSpaces }), t('pitch.keepsControl')];
  const numbers = [
    { value: impact.homes, label: t('pitch.homesLabel') },
    { value: impact.people, label: t('pitch.peopleHoused') },
    { value: impact.affordabilityYears, label: t('pitch.affordabilityYears') },
  ];

  const exportPdf = async () => {
    setExporting(true);
    try {
      const { exportOnePagerPdf } = await import('./onePagerPdf');
      const fmt = new Intl.NumberFormat(uiLang === 'es' ? 'es-MX' : 'en-US');
      await exportOnePagerPdf({
        title: t('pitch.whatItCouldLookLike'),
        name: parcel.displayName,
        city: `${parcel.city}, California`,
        numbers: numbers.map((n) => ({ value: fmt.format(n.value), label: n.label })),
        keepsTitle: t('pitch.keeps'),
        keeps,
        sb4Title: t('pitch.sb4in3'),
        sb4: SB4_THREE[uiLang],
        notLegal: t('common.notLegal'),
        sample: t('common.sampleData'),
        footer: t('pitch.pdfFooter', { n: scenario.keepSpaces, total: parcel.parkingSpaces }),
      }, `keystone-${parcel.id}-one-pager.pdf`);
      toast(t('pitch.exported'));
    } catch {
      toast(t('common.error'), 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented size="sm" value={lang} onChange={setLang} ariaLabel={t('pitch.language')} options={LANGS.map((l) => ({ value: l, label: contentLangNames[l] }))} />
        <Button variant="secondary" onClick={exportPdf} loading={exporting} data-testid="export-pdf">{t('pitch.exportPdf')}</Button>
      </div>

      <article className="panel p-6 md:p-10 print:border-0 print:p-0" data-one-pager>
        <header className="mb-8 max-w-[760px]">
          <p className="text-helper text-ink-2 mb-2">{t('pitch.whatItCouldLookLike')}</p>
          <h2 className="headline-md">{parcel.displayName}</h2>
          <p className="text-ink-2 text-[18px] leading-7 mt-1">{parcel.city}, California</p>
        </header>

        <div className="grid gap-8 md:grid-cols-12 items-start">
          <div className="md:col-span-5 rounded-[14px] overflow-hidden border border-line bg-paper">
            <AerialLot parcel={parcel} size={420} night={night} keptStalls={keptStalls} showBuildable={buildable} id="onepager-aerial" />
          </div>

          <div className="md:col-span-7 flex flex-col gap-8">
            <div className="grid grid-cols-3 gap-4 border-y border-line py-5">
              {numbers.map((n, i) => (
                <motion.div key={n.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: dur.medium, ease: ease.out, delay: i * stagger }} className="min-w-0">
                  <div className="big-number text-pine" style={{ fontSize: 'clamp(32px, 4vw, 56px)' }}>
                    <AnimatedNumber value={n.value} immediate={false} />
                  </div>
                  <div className="text-helper text-ink-2 mt-1 text-balance">{n.label}</div>
                </motion.div>
              ))}
            </div>

            <section>
              <h3 className="text-title" style={{ fontFamily: 'var(--font-sans)', fontSize: 18, lineHeight: '26px' }}>{t('pitch.keeps')}</h3>
              <ul className="mt-3 flex flex-col gap-2.5">
                {keeps.map((k, i) => (
                  <motion.li key={k} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: dur.medium, ease: ease.out, delay: dur.short + i * stagger }} className="flex items-start gap-3 text-[16px] leading-6">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden className="mt-0.5 shrink-0">
                      <circle cx="10" cy="10" r="9" className="fill-pine-soft" />
                      <motion.path d="M6 10.5l2.6 2.6L14.5 7" stroke="var(--pine)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: dur.medium, ease: ease.out, delay: dur.medium + i * stagger }} />
                    </svg>
                    <span>{k}</span>
                  </motion.li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-title" style={{ fontFamily: 'var(--font-sans)', fontSize: 18, lineHeight: '26px' }}>{t('pitch.sb4in3')}</h3>
              <ol className="mt-3 flex flex-col divide-y divide-line border-y border-line">
                {SB4_THREE[lang].map((s, i) => (
                  <li key={i} className="py-3 text-[15px] leading-6 text-ink-2" lang={lang}>{s}</li>
                ))}
              </ol>
            </section>
          </div>
        </div>

        <footer className="mt-8 pt-4 border-t border-line flex flex-wrap items-center justify-between gap-2 text-small text-ink-2">
          <span>{t('common.notLegal')}</span>
          <span className="tabular-nums">{t('pitch.pdfFooter', { n: scenario.keepSpaces, total: parcel.parkingSpaces })}</span>
        </footer>
      </article>
    </div>
  );
}
