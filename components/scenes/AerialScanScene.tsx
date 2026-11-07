'use client';
/**
 * "Measure any lot from the sky." A satellite-style illustrated lot; a scan beam sweeps, polygons trace
 * around the building, parking and open land in order; area numbers roll up on solid labels.
 */
import { motion } from 'motion/react';
import type { SceneProps } from './types';
import { useSceneExplainer } from '@/components/explainer/useSceneExplainer';
import { when } from '@/components/explainer/useExplainer';
import { AerialLot } from '@/components/illustrations/AerialLot';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { parcels } from '@/lib/data';
import { palette as P } from '@/lib/illustrationPalette';
import { ease, dur } from '@/lib/motion';
import { useT } from '@/lib/i18n';

const DURATION = 5200;
const parcel = parcels[0];

export function AerialScanScene(props: SceneProps) {
  const ex = useSceneExplainer(props, DURATION);
  const { t } = useT();
  const { night } = props;
  const on = ex.phase !== 'idle';
  const fast = ex.fast;
  const b = parcel.buildingRect, pk = parcel.parkingRects[0];
  const bx = 1, by = 0.72;
  const acres = { building: parcel.buildingAcres, parking: parcel.parkingAcres, open: parcel.openAcres };
  const labels = [
    { key: 'building', x: b.x + b.w / 2, y: b.y + b.h + 0.07, text: t('scan.buildings'), v: acres.building, d: 1.9, color: P.roof },
    { key: 'parking', x: pk.x + pk.w / 2, y: pk.y + pk.h + 0.07, text: t('scan.parking'), v: acres.parking, d: 2.5, color: P.asphalt },
    { key: 'open', x: 0.5, y: 0.62, text: t('scan.openLand'), v: acres.open, d: 3.1, color: P.pine },
  ];
  return (
    <div className="absolute inset-0" key={ex.key}>
      <div className="absolute inset-0" style={{ background: night ? '#243a30' : '#C9D7CC' }} />
      <div className="scene-layer-mid absolute inset-y-0 right-0 w-full lg:w-[62%] flex items-center justify-center p-6 lg:p-14">
        <div className="relative w-full max-w-[860px] rounded-[14px] overflow-hidden shadow-[var(--shadow-soft)] border border-line bg-surface">
          <AerialLot parcel={parcel} night={night} id="scan-scene" keptStalls={undefined} ambient={props.active} seed={5} />
          {/* overlay in the same normalized frame */}
          <svg viewBox={`-0.2 -0.2 ${bx + 0.4} ${by + 0.4}`} className="absolute inset-0 w-full h-full" aria-hidden>
            {/* scan beam */}
            <motion.g initial={{ y: -0.25 }} animate={on ? { y: by + 0.25 } : { y: -0.25 }} transition={{ duration: when(fast, 1.2), delay: when(fast, 0.2), ease: ease.inOut }}>
              <rect x={-0.2} y={-0.06} width={bx + 0.4} height={0.06} fill={P.brass} opacity={0.18} />
              <rect x={-0.2} y={-0.004} width={bx + 0.4} height={0.006} fill={P.brassLight} opacity={0.9} />
            </motion.g>
            <motion.rect x={b.x} y={b.y} width={b.w} height={b.h} fill={P.roof} fillOpacity={0.18} stroke={P.roofLight} strokeWidth={0.008} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }} transition={{ duration: when(fast, 0.7), delay: when(fast, 1.5), ease: ease.out }} />
            <motion.rect x={pk.x} y={pk.y} width={pk.w} height={pk.h} fill={P.brass} fillOpacity={0.14} stroke={P.brass} strokeWidth={0.008} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }} transition={{ duration: when(fast, 0.7), delay: when(fast, 2.1), ease: ease.out }} />
            <motion.path d={`M0.03 ${b.y + b.h + 0.05} H ${bx - 0.03} V ${by - 0.03} H 0.03 Z`} fill={P.pine} fillOpacity={0.16} stroke={P.pine} strokeWidth={0.008} strokeDasharray="0.03 0.015" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }} transition={{ duration: when(fast, 0.9), delay: when(fast, 2.7), ease: ease.out }} />
          </svg>
          {labels.map((l) => (
            <motion.div key={l.key} className="absolute -translate-x-1/2 panel px-2.5 py-1.5 flex items-center gap-2 whitespace-nowrap" style={{ left: `${((l.x + 0.2) / (bx + 0.4)) * 100}%`, top: `${((l.y + 0.2) / (by + 0.4)) * 100}%` }}
              initial={{ opacity: 0, scale: 0.92, y: 4 }} animate={on ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.92, y: 4 }} transition={{ delay: when(fast, l.d), duration: dur.short, ease: ease.out }}>
              <span className="w-2.5 h-2.5 rounded-[2px]" style={{ background: l.color }} />
              <span className="text-[13px] font-medium text-ink-2">{l.text}</span>
              <span className="text-[15px] font-semibold tabular-nums text-ink">{on ? <AnimatedNumber value={l.v} immediate={false} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} /> : '0.00'} ac</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
