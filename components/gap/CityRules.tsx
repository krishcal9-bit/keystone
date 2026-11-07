'use client';
import Link from 'next/link';
import { cityRules } from '@/lib/cityRules';
import { useT } from '@/lib/i18n';
import { Pill } from '@/components/ui/Pill';
import { ButtonLink } from '@/components/ui/Button';

export function CityRules({ city }: { city: string }) {
  const { t } = useT();
  const r = cityRules(city);
  return (
    <section id="city" className="panel p-4 scroll-mt-24" data-testid="city-rules" aria-labelledby="city-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="city-title" className="text-[15px] font-semibold">{t('city.title')} · {r.city}</h2>
          <p className="text-[13px] text-ink-2 max-w-[52ch]">{t('city.help')}</p>
        </div>
        <Pill tone="neutral" className="whitespace-nowrap">{t('city.sample')}</Pill>
      </div>
      <ul className="mt-3 flex flex-col gap-1.5 text-[13px]">
        <li className="flex gap-2"><span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-pine shrink-0" /><span className="text-ink">{t('city.override')}</span></li>
        <li className="flex gap-2"><span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-brass shrink-0" /><span className="text-ink">{t('city.objective')} <span className="text-ink-2">{r.note}</span></span></li>
      </ul>
      <h3 className="mt-3 text-[13px] font-semibold text-ink-2">{t('city.checklist')} · {r.portal} · {r.fee}</h3>
      <ul className="mt-1 grid sm:grid-cols-2 gap-x-5 gap-y-1 text-[13px]">
        {r.checklist.map((c) => (
          <li key={c.item} className="flex gap-2 items-start"><span className="mt-[5px] w-3.5 h-3.5 rounded-[3px] border border-line shrink-0" aria-hidden /><span><span className="text-ink">{c.item}</span><span className="block text-[12px] text-ink-2 leading-4">{c.note}</span></span></li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
        <span className="text-[11px] text-ink-2">{t('gap.hcd')}. {t('common.notLegal')}</span>
        <ButtonLink href={`/ask?q=${encodeURIComponent(`What do we need to know to build under SB 4 in ${r.city}?`)}`} variant="secondary" size="sm" data-testid="ask-city">{t('city.ask')}</ButtonLink>
      </div>
      <Link href="/judges" className="sr-only">Judge Guide</Link>
    </section>
  );
}
