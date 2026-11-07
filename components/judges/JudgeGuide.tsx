'use client';
/**
 * Judge Guide: one calm page for the "Find it" lane. The problem and our answer in one sentence each,
 * the brief's four numbers as rolling figures, a hairline table mapping each challenge item to the
 * screen that answers it, and the entry point of the guided tour.
 */
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import { useT, type DictKey } from '@/lib/i18n';
import { dur, ease, stagger } from '@/lib/motion';
import { BRIEF, BRIEF_SOURCE } from '@/lib/gap';
import { startTour } from '@/lib/tour';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Button, ButtonLink } from '@/components/ui/Button';
import { LaneHero } from './LaneHero';

type Row = { id: string; c: DictKey; f: DictKey; href: string };
const ROWS: Row[] = [
  { id: 'land', c: 'judges.row.land.c', f: 'judges.row.land.f', href: '/sites/oakfield-community-church#gap' },
  { id: 'time', c: 'judges.row.time.c', f: 'judges.row.time.f', href: '/sites/oakfield-community-church#time' },
  { id: 'cities', c: 'judges.row.cities.c', f: 'judges.row.cities.f', href: '/sites/oakfield-community-church#city' },
  { id: 'pay', c: 'judges.row.pay.c', f: 'judges.row.pay.f', href: '/sites/oakfield-community-church#gap' },
  { id: 'luck', c: 'judges.row.luck.c', f: 'judges.row.luck.f', href: '/sites' },
  { id: 'owner', c: 'judges.row.owner.c', f: 'judges.row.owner.f', href: '/pitch/oakfield-community-church' },
  { id: 'measure', c: 'judges.row.measure.c', f: 'judges.row.measure.f', href: '/scan?parcel=oakfield-community-church' },
  { id: 'fit', c: 'judges.row.fit.c', f: 'judges.row.fit.f', href: '/plan/oakfield-community-church' },
];

const money = { minimumFractionDigits: 2, maximumFractionDigits: 2 } as const;

export function JudgeGuide() {
  const { t, lang } = useT();
  const router = useRouter();
  const reduced = useReducedMotion();
  const locale = lang === 'es' ? 'es-US' : 'en-US';

  const rise = (i: number) => ({
    initial: reduced ? false : { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: dur.medium, ease: ease.out, delay: i * stagger * 2 },
  });

  const begin = () => { router.push(startTour()); };

  return (
    <div className="relative min-h-svh pt-16">
      <div className="relative mx-auto px-5 md:px-10 lg:px-20 max-w-[1000px] pt-6 pb-24">
        <motion.div {...rise(0)}>
          <LaneHero className="w-full h-[150px] sm:h-[190px] md:h-[220px] rounded-[14px] border border-line" />
        </motion.div>

        <motion.header {...rise(1)} className="mt-8 max-w-[720px]">
          <h1 className="headline-md text-ink">{t('judges.title')}</h1>
          <p className="mt-3 text-[18px] leading-7 text-ink-2">{t('judges.subtitle')}</p>
        </motion.header>

        {/* problem / answer */}
        <motion.section {...rise(2)} className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 border-t border-line pt-8">
          <div>
            <h2 className="font-sans text-[15px] leading-[22px] font-semibold text-ink-2 tracking-normal">{t('judges.problemLabel')}</h2>
            <p className="font-display mt-3 text-[26px] leading-[34px] text-ink" style={{ fontVariationSettings: '"opsz" 48, "SOFT" 30, "WONK" 0' }}>{t('judges.problem')}</p>
            <p className="mt-3 text-[13px] leading-[18px] text-ink-2">{BRIEF_SOURCE}</p>
          </div>
          <div>
            <h2 className="font-sans text-[15px] leading-[22px] font-semibold text-pine tracking-normal">{t('judges.answerLabel')}</h2>
            <p className="font-display mt-3 text-[26px] leading-[34px] text-ink" style={{ fontVariationSettings: '"opsz" 48, "SOFT" 30, "WONK" 0' }}>{t('judges.answer')}</p>
          </div>
        </motion.section>

        {/* four numbers */}
        <motion.section {...rise(3)} className="mt-12 border-t border-line pt-8" aria-labelledby="judges-stats">
          <h2 id="judges-stats" className="font-sans text-[15px] leading-[22px] font-semibold text-ink-2 tracking-normal">{t('judges.statsLabel')}</h2>
          <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-8 sm:gap-x-8">
            <Stat
              number={<AnimatedNumber value={BRIEF.medianHomePrice / 1e6} format={money} locale={locale} prefix="$" suffix="M" immediate={false} />}
              label={t('judges.stat.price')} answer={t('judges.answer.price')} answerLabel={t('judges.keystoneAnswer')} />
            <Stat
              number={<AnimatedNumber value={BRIEF.yearsLandToKeys} locale={locale} prefix="~" suffix={` ${t('judges.yrs')}`} immediate={false} />}
              label={t('judges.stat.years')} answer={t('judges.answer.years')} answerLabel={t('judges.keystoneAnswer')} />
            <Stat
              number={<AnimatedNumber value={BRIEF.cities} locale={locale} immediate={false} />}
              label={t('judges.stat.cities')} answer={t('judges.answer.cities')} answerLabel={t('judges.keystoneAnswer')} />
            <Stat
              number={<><AnimatedNumber value={BRIEF.familyPayShareMin * 100} locale={locale} immediate={false} />–<AnimatedNumber value={BRIEF.familyPayShareMax * 100} locale={locale} suffix="%" immediate={false} /></>}
              label={t('judges.stat.pay')} answer={t('judges.answer.pay')} answerLabel={t('judges.keystoneAnswer')} />
          </dl>
          <p className="mt-6 text-[13px] leading-[18px] text-ink-2">{BRIEF_SOURCE}</p>
        </motion.section>

        {/* challenge → feature table */}
        <motion.section {...rise(4)} className="mt-12 border-t border-line pt-8" aria-labelledby="judges-map">
          <h2 id="judges-map" className="font-sans text-[15px] leading-[22px] font-semibold text-ink-2 tracking-normal">{t('judges.mapLabel')}</h2>
          <div role="table" className="mt-4 text-[15px] leading-[22px]">
            <div role="row" className="hidden sm:grid grid-cols-[1fr_1.25fr_auto] gap-x-6 pb-2 border-b border-line text-[13px] leading-[18px] text-ink-2">
              <span role="columnheader">{t('judges.col.challenge')}</span>
              <span role="columnheader">{t('judges.col.feature')}</span>
              <span role="columnheader" className="w-[84px] text-right">{t('judges.col.link')}</span>
            </div>
            {ROWS.map((r) => (
              <div key={r.id} role="row" className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_1.25fr_auto] gap-x-6 gap-y-1 py-3 border-b border-line items-center">
                <span role="cell" className="font-medium text-ink">{t(r.c)}</span>
                <span role="cell" className="text-ink-2 col-start-1 sm:col-start-2 row-start-2 sm:row-start-auto">{t(r.f)}</span>
                <span role="cell" className="col-start-2 row-start-1 row-span-2 sm:col-start-3 sm:row-start-auto sm:row-span-1 w-[84px] flex justify-end">
                  <ButtonLink href={r.href} variant="secondary" size="sm" className="h-11 sm:h-9" data-testid="see-it" data-target={r.href}>{t('judges.seeIt')}</ButtonLink>
                </span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* tour */}
        <motion.section {...rise(5)} className="mt-12 border-t border-line pt-8 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
          <Button size="lg" onClick={begin} data-testid="start-tour" className="self-start">{t('judges.startTour')}</Button>
          <p className="text-[15px] leading-[22px] text-ink-2 max-w-[48ch]">{t('judges.tourHint')}</p>
        </motion.section>

        <motion.footer {...rise(6)} className="mt-16 border-t border-line pt-6 text-[13px] leading-[18px] text-ink-2 flex flex-col gap-1">
          <p className="text-ink">{t('common.notLegal')}</p>
          <p>{BRIEF_SOURCE}</p>
          <p>{t('judges.sourceSb4')}</p>
        </motion.footer>
      </div>
    </div>
  );
}

function Stat({ number, label, answer, answerLabel }: { number: React.ReactNode; label: string; answer: string; answerLabel: string }) {
  return (
    <div className="sm:border-l sm:border-line sm:pl-5 first:border-l-0 first:pl-0">
      <dt className="sr-only">{label}</dt>
      <dd className="m-0">
        <span className="big-number text-ink block whitespace-nowrap" style={{ fontSize: 'clamp(44px, 4.6vw, 68px)' }}>{number}</span>
        <span className="block mt-2 text-[15px] leading-[22px] text-ink-2">{label}</span>
        <span className="block mt-3 pt-3 border-t border-line text-[15px] leading-[22px]">
          <span className="text-pine font-medium">{answerLabel}</span>{' '}
          <span className="text-ink">{answer}</span>
        </span>
      </dd>
    </div>
  );
}
