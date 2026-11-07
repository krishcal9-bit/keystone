'use client';
/**
 * "See what a lot can hold." The Plan Studio in miniature inside a wide landscape: the lot extrudes,
 * homes build row by row with soft shadows, the unit counter rolls, the sun sweeps once.
 */
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { SceneProps } from './types';
import { useSceneExplainer } from '@/components/explainer/useSceneExplainer';
import { buildPlanModel } from '@/lib/planModel';
import { parcels } from '@/lib/data';
import { defaultKeepSpaces } from '@/lib/sb4';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { PlanDiagram2D } from '@/components/plan/PlanDiagram2D';
import { useT } from '@/lib/i18n';
import { Sky } from '@/components/illustrations/Sky';
import { Hills } from '@/components/illustrations/Ground';
import { webglQuality } from '@/lib/webgl';

const PlanScene = dynamic(() => import('@/components/three/PlanScene').then((m) => m.PlanScene), { ssr: false, loading: () => null });
const parcel = parcels[0];
const DURATION = 8200;

export function PlanMiniScene(props: SceneProps) {
  const ex = useSceneExplainer(props, DURATION);
  const { t } = useT();
  const model = useMemo(() => buildPlanModel(parcel, { unitType: 'flat', keepSpaces: defaultKeepSpaces(parcel), garden: true }), []);
  const [gl, setGl] = useState<boolean | null>(null);
  const [built, setBuilt] = useState(0);
  useEffect(() => { setGl(webglQuality() === 'hardware' && !props.reduced); }, [props.reduced]);
  const playing = ex.phase !== 'idle';
  const buildKey = playing ? ex.key + 1 : 0;
  useEffect(() => { if (!playing) setBuilt(0); }, [playing]);
  return (
    <div className="absolute inset-0" key={ex.key}>
      <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" className="scene-svg scene-layer-back" aria-hidden>
        <Sky w={1440} h={900} night={props.night} id="plan-mini" />
        <Hills w={1440} y={540} night={props.night} id="plan-mini" />
        <rect x={0} y={560} width={1440} height={340} fill={props.night ? '#4E6A52' : '#A9C3A0'} className="ks-t" />
      </svg>
      <div className="scene-layer-mid absolute inset-y-0 right-0 w-full lg:w-[64%]">
        {gl === true && playing && (
          <PlanScene model={model} showPlan buildKey={buildKey} sunHour={10} night={props.night} view="threeQuarter" zoom={1.75} interactive={false} frameloop={props.active && ex.phase === 'playing' ? 'always' : props.active ? 'demand' : 'never'} autoSunSweep speed={props.reduced ? 10 : ex.fast ? 3 : 1} onBuildEnd={() => setBuilt(model.placed)} />
        )}
        {gl === false && (
          <div className="absolute inset-0 p-10 lg:p-20 flex items-center"><div className="w-full aspect-[4/3] panel p-3 overflow-hidden"><PlanDiagram2D model={model} night={props.night} /></div></div>
        )}
      </div>
      <div className="absolute bottom-24 right-5 md:right-10 lg:right-20 panel px-4 py-3 text-right" data-testid="plan-mini-counter">
        <div className="text-[34px] leading-9 font-semibold tabular-nums text-ink"><AnimatedNumber value={playing ? (built || (ex.fast ? model.placed : 0)) : 0} immediate={false} /></div>
        <div className="text-[13px] text-ink-2">{t('plan.unitsPlaced')} · {t('plan.minimum')} {model.minimumUnits}</div>
      </div>
    </div>
  );
}
