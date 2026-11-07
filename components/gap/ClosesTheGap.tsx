'use client';
/**
 * "Closes the gap" panel: per-home cost stack for this site, today vs with Keystone, against what the
 * family can pay plus other sources. Every figure is an illustrative assumption (data/assumptions.json).
 */
import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { Parcel } from '@/lib/sb4';
import { gapModel, fmtMoney, type Stack } from '@/lib/gap';
import assumptions from '@/data/assumptions.json';
import { useT } from '@/lib/i18n';
import { spring } from '@/lib/motion';
import { Segmented } from '@/components/ui/Segmented';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

const COLORS: Record<string, string> = { land: 'var(--pine)', design: '#8FA39A', permits: 'var(--brass)', build: '#3C4A52' };

export function ClosesTheGap({ parcel, keepSpaces, homes, compact = false }: { parcel: Parcel; keepSpaces: number; homes?: number; compact?: boolean }) {
  const { t } = useT();
  const reduced = useReducedMotion();
  const tiers = assumptions.gap.habitatTiers;
  const [tier, setTier] = useState<string>(String(assumptions.gap.defaultTierShare.value));
  const g = useMemo(() => gapModel(parcel, keepSpaces, homes, Number(tier)), [parcel, keepSpaces, homes, tier]);
  const max = Math.max(g.today.total, g.closes) * 1.28;
  const tr = reduced ? { duration: 0 } : spring.smooth;

  return (
    <section id="gap" className="panel p-4 scroll-mt-24" data-testid="gap-panel" data-gap-today={g.gapToday} data-gap-keystone={g.gapKeystone} aria-labelledby="gap-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="gap-title" className="text-[15px] font-semibold">{t('gap.title')}</h2>
          <p className="text-[13px] text-ink-2 max-w-[48ch]">{t('gap.help')}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[12px] text-ink-2">{t('gap.tier')}</span>
          <Segmented size="sm" ariaLabel={t('gap.tier')} value={tier} onChange={setTier} options={tiers.map((x) => ({ value: String(x.share), label: x.label }))} />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <Bar label={t('gap.today')} stack={g.today} max={max} tr={tr} t={t} closes={g.closes} gap={g.gapToday} />
        <Bar label={t('gap.keystone')} stack={g.keystone} max={max} tr={tr} t={t} accent closes={g.closes} gap={g.gapKeystone} />
        {/* closes-it bar */}
        <div className="grid grid-cols-[112px_1fr] items-center gap-3">
          <span className="text-[13px] font-medium text-ink">{t('gap.closes')}</span>
          <div className="relative h-7">
            <div className="absolute inset-y-0 left-0 rounded-[6px] overflow-hidden flex" style={{ width: `${(g.closes / max) * 100}%` }}>
              <motion.div className="h-full" style={{ background: 'var(--pine-soft)', borderRight: '1px solid var(--line)' }} initial={false} animate={{ flexBasis: `${(g.family / g.closes) * 100}%` }} transition={tr} title={t('gap.family', { share: Math.round(g.familyShare * 100) })} />
              <motion.div className="h-full" style={{ background: 'color-mix(in srgb, var(--brass) 25%, transparent)' }} initial={false} animate={{ flexBasis: `${(g.other / g.closes) * 100}%` }} transition={tr} title={t('gap.other')} />
            </div>
            <motion.span className="absolute top-1/2 -translate-y-1/2 text-[12px] font-semibold tabular-nums text-ink whitespace-nowrap pl-2" initial={false} animate={{ left: `${(g.closes / max) * 100}%` }} transition={tr}>{fmtMoney(g.closes)}</motion.span>
          </div>
        </div>
        <div className="grid grid-cols-[112px_1fr] gap-3 text-[12px] text-ink-2">
          <span />
          <span>{t('gap.family', { share: Math.round(g.familyShare * 100) })} · {fmtMoney(g.family)} · {t('gap.other')} {fmtMoney(g.other)}</span>
        </div>
      </div>

      {!compact && (
        <ul className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-[12px] text-ink-2">
          <li><span className="inline-block w-2 h-2 rounded-[2px] mr-1.5 align-middle" style={{ background: COLORS.land }} />{t('gap.marketLand', { acres: g.acres.toFixed(2), homes: g.homes })} <span className="text-ink">becomes {t('gap.partnerLand')}</span></li>
          <li><span className="inline-block w-2 h-2 rounded-[2px] mr-1.5 align-middle" style={{ background: COLORS.permits }} />{t('gap.permits')} <span className="text-ink">becomes {t('gap.byRight', { months: g.monthsSaved })}</span></li>
          <li><span className="inline-block w-2 h-2 rounded-[2px] mr-1.5 align-middle" style={{ background: COLORS.design }} />{t('gap.design')} {fmtMoney(assumptions.gap.designPerHome.value)}</li>
          <li><span className="inline-block w-2 h-2 rounded-[2px] mr-1.5 align-middle" style={{ background: COLORS.build }} />{t('gap.build')} {fmtMoney(assumptions.gap.buildPerHome.value)}</li>
        </ul>
      )}
      <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-line pt-2">
        <span className="text-[13px] tabular-nums text-ink"><AnimatedNumber value={g.homes} /> {t('common.homes')} · {t('gap.moreHomes')}</span>
        <span className="text-[11px] text-ink-2 text-right">{t('gap.illustrative')} {t('gap.source')}.</span>
      </div>
    </section>
  );
}

function Bar({ label, stack, max, tr, t, accent = false, closes, gap }: { label: string; stack: Stack; max: number; tr: object; t: (k: never, v?: Record<string, string | number>) => string; accent?: boolean; closes: number; gap: number }) {
  const tt = t as unknown as (k: string, v?: Record<string, string | number>) => string;
  const closed = gap <= 0;
  return (
    <div className="grid grid-cols-[112px_1fr] items-center gap-3">
      <span className={`text-[13px] font-medium ${accent ? 'text-pine' : 'text-ink'}`}>{label}</span>
      <div className="relative h-7">
        <motion.div className="absolute inset-y-0 left-0 rounded-[6px] overflow-hidden flex" initial={false} animate={{ width: `${(stack.total / max) * 100}%` }} transition={tr}>
          {stack.segments.map((s) => (
            <motion.div key={s.id} className="h-full border-r border-surface last:border-r-0" style={{ background: COLORS[s.id] }} initial={false} animate={{ flexBasis: `${(s.value / stack.total) * 100}%` }} transition={tr} title={`${s.label}: ${fmtMoney(s.value)} · ${s.note}`} />
          ))}
        </motion.div>
        {/* the part of the cost that nothing closes yet: red hatch from "closes" to the total */}
        <motion.div className="absolute inset-y-0 rounded-r-[6px]" style={{ background: 'repeating-linear-gradient(135deg, rgba(179,54,43,0.85) 0 3px, transparent 3px 7px)' }} initial={false} animate={{ left: `${(Math.min(closes, stack.total) / max) * 100}%`, width: `${(Math.max(0, stack.total - closes) / max) * 100}%`, opacity: closed ? 0 : 1 }} transition={tr} aria-hidden />
        {/* marker where "what closes it" ends */}
        <motion.div className="absolute -top-1 -bottom-1 w-px border-l border-dashed border-ink-2/60" initial={false} animate={{ left: `${(closes / max) * 100}%` }} transition={tr} aria-hidden />
        <motion.span className="absolute top-1/2 -translate-y-1/2 text-[12px] font-semibold tabular-nums whitespace-nowrap pl-2 flex items-center gap-1.5" initial={false} animate={{ left: `${(stack.total / max) * 100}%` }} transition={tr}>
          <span className="text-ink">{fmtMoney(stack.total)}</span>
          <span className={`inline-flex items-center h-5 px-1.5 rounded-full text-[11px] ${closed ? 'bg-pine-soft text-pine' : 'bg-[color-mix(in_srgb,var(--signal-red)_12%,transparent)] text-signal-red'}`}>{closed ? tt('gap.closed') : `${tt('gap.gap')} ${fmtMoney(gap)}`}</span>
        </motion.span>
      </div>
    </div>
  );
}
