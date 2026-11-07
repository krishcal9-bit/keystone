'use client';
/**
 * Slim stacked bar: homes by stage, one segment per stage in a pine-to-brass tonal ramp built from
 * the theme tokens with color-mix (no gradients). Segments morph width with a spring (layout transforms).
 */
import { LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { useT } from '@/lib/i18n';
import { STAGES, type Stage } from '@/lib/store';
import { spring } from '@/lib/motion';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

/** Tonal ramp from pine (first stage) to brass (groundbreaking). */
export const stageColor = (i: number) => `color-mix(in oklab, var(--pine) ${Math.round(100 - (i * 100) / (STAGES.length - 1))}%, var(--brass))`;

export function StageBar({ homesByStage, countByStage }: { homesByStage: Record<Stage, number>; countByStage: Record<Stage, number> }) {
  const { t } = useT();
  const reduced = useReducedMotion();
  const total = STAGES.reduce((a, s) => a + homesByStage[s], 0);
  const tr = reduced ? { duration: 0 } : spring.smooth;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[13px] font-medium text-ink-2">{t('pipe.homesByStage')}</span>
        <span className="text-[13px] text-ink-2 tabular-nums"><AnimatedNumber value={total} /> {t('common.homes')}</span>
      </div>
      <LayoutGroup id="stage-bar">
        <div className="flex h-2 w-full rounded-full overflow-hidden bg-line gap-px" role="img" aria-label={`${t('pipe.homesByStage')}: ${STAGES.map((s) => `${t(`stage.${s}` as 'stage.identified')} ${homesByStage[s]}`).join(', ')}`}>
          {STAGES.map((s, i) => {
            const v = homesByStage[s];
            if (!v) return null;
            return (
              <motion.div
                key={s}
                layout
                transition={tr}
                className="h-full min-w-[3px] first:rounded-l-full last:rounded-r-full"
                style={{ flexGrow: v, flexBasis: 0, backgroundColor: stageColor(i) }}
              />
            );
          })}
        </div>
      </LayoutGroup>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5" aria-label={t('pipe.perStage')}>
        {STAGES.map((s, i) => (
          <li key={s} className="inline-flex items-center gap-2 text-[13px] leading-[18px] text-ink-2 min-h-6">
            <span className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ backgroundColor: stageColor(i) }} aria-hidden />
            <span>{t(`stage.${s}` as 'stage.identified')}</span>
            <span className="tabular-nums text-ink font-medium"><AnimatedNumber value={countByStage[s]} /></span>
          </li>
        ))}
      </ul>
    </div>
  );
}
