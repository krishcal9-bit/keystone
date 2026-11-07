'use client';
/**
 * Compact one-line "Searching vs. waiting" strip for the Site Finder header: three cells, each with its "i" popover.
 * "{eligible} sites in view · vetting ~{min} min each · −{money} land per home"
 */
import { useT } from '@/lib/i18n';
import { useComparison, fmtNum, fmtUsd } from '@/lib/comparison';
import { InfoButton } from './InfoButton';

export function ComparisonStrip({ className = '' }: { className?: string }) {
  const { t, lang } = useT();
  const locale = lang === 'es' ? 'es-US' : 'en-US';
  const { rows } = useComparison();
  const [sites, vet, land] = rows;
  const cells = [
    { text: t('cmp.strip.sites', { n: sites.keystone.value }), figure: sites.keystone, title: `${t(sites.title)} · ${t('cmp.colKeystone')}` },
    { text: t('cmp.strip.vet', { min: fmtNum(vet.keystone.value, locale) }), figure: vet.keystone, title: `${t(vet.title)} · ${t('cmp.colKeystone')}` },
    { text: t('cmp.strip.land', { money: fmtUsd(-land.multiplier.value, locale) }), figure: land.multiplier, title: `${t(land.title)} · ${t(land.multiplier.label)}` },
  ];
  return (
    <p data-testid="comparison-strip" className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] leading-[18px] text-ink-2 ${className}`}>
      <span className="font-semibold text-pine mr-1 basis-full sm:basis-auto">{t('cmp.title')}</span>
      {cells.map((c, i) => (
        <span key={i} className="inline-flex items-center gap-1 whitespace-nowrap">
          <span className="tabular-nums text-ink">{c.text}</span>
          <InfoButton figure={c.figure} title={c.title} />
        </span>
      ))}
    </p>
  );
}
