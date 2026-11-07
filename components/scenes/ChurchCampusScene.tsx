'use client';
/**
 * "The law changed in 2024." Church campus: sanctuary, kept parking with cars, and the empty lot.
 * Explainer: lot glows → survey lines trace → townhomes rise row by row (slab, walls, roof settle, windows light)
 * → families walk in. The church and its kept parking never move.
 */
import { motion } from 'motion/react';
import type { SceneProps } from './types';
import { useSceneExplainer, } from '@/components/explainer/useSceneExplainer';
import { when } from '@/components/explainer/useExplainer';
import { palette as P, shade } from '@/lib/illustrationPalette';
import { Sky } from '@/components/illustrations/Sky';
import { Hills, Street } from '@/components/illustrations/Ground';
import { Church } from '@/components/illustrations/Church';
import { Tree } from '@/components/illustrations/Tree';
import { StreetLamp, LampDefs } from '@/components/illustrations/StreetLamp';
import { Car } from '@/components/illustrations/Car';
import { Person } from '@/components/illustrations/Person';
import { Window, Door, ContactShadow } from '@/components/illustrations/primitives';
import { spring, ease, dur } from '@/lib/motion';

const DURATION = 7600;

export function ChurchCampusScene(props: SceneProps) {
  const ex = useSceneExplainer(props, DURATION);
  const { night, active } = props;
  const playing = ex.phase !== 'idle';
  const fast = ex.fast;
  const W = 1440, H = 900, S = 1.3, ground = 740 / S;
  const homes = [
    // back row (smaller, higher), then front row
    { x: 700, y: ground - 46, s: 0.78, t: 2.2, wall: P.wallSage, roof: P.roof },
    { x: 845, y: ground - 46, s: 0.78, t: 2.45, wall: P.wall, roof: P.roofTerracotta },
    { x: 990, y: ground - 46, s: 0.78, t: 2.7, wall: P.wallClay, roof: P.roofDeep },
    { x: 640, y: ground, s: 1, t: 3.6, wall: P.wallWarm, roof: P.roofDeep },
    { x: 820, y: ground, s: 1, t: 3.9, wall: P.wall, roof: P.roofTerracotta },
    { x: 1000, y: ground, s: 1, t: 4.2, wall: P.wallSage, roof: P.roof },
  ];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="scene-svg" aria-hidden key={ex.key}>
      <LampDefs />
      <g className="scene-layer-back">
        <Sky w={W} h={H} night={night} id="campus" />
        <Hills w={W} y={640} night={night} id="campus" />
      </g>
      <g className="scene-layer-mid"><g transform={`scale(${S})`}>
        {/* kept parking lot with cars */}
        <g transform={`translate(300 ${ground})`}>
          <path d="M0 0 L340 0 L380 -40 L60 -40 Z" fill={night ? P.asphaltDeep : P.asphalt} className="ks-t" />
          {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${60 + i * 54} -40 L${i * 54 + 2} 0`} stroke={P.paint} strokeWidth={1.5} opacity={0.6} />)}
          <Car x={30} y={-6} scale={0.72} color="#5A7FA6" night={night} />
          <Car x={140} y={-6} scale={0.72} color="#D8D9D3" night={night} kind="wagon" />
          <Car x={250} y={-6} scale={0.72} color="#8A6FA8" night={night} />
        </g>
        <Church x={40} y={ground} night={night} scale={1} tower="bell" />
        <Tree x={10} y={ground + 2} kind="oak" scale={1.2} sway={active} seed={3} />
        {/* the empty lot */}
        <g transform={`translate(600 ${ground})`}>
          <path d="M0 0 L560 0 L600 -70 L60 -70 Z" fill={night ? '#3B4A3F' : P.dirt} className="ks-t" />
          <path d="M0 0 L560 0 L600 -70 L60 -70 Z" fill={P.lawn} opacity={0.35} />
          <motion.path d="M0 0 L560 0 L600 -70 L60 -70 Z" fill={P.honey} initial={{ opacity: 0 }} animate={{ opacity: playing ? [0, 0.45, 0.18] : 0 }} transition={{ duration: when(fast, 1.4), delay: when(fast, 0.2), ease: ease.out }} data-lot-glow />
          {/* survey lines */}
          <motion.path d="M20 -8 L540 -8 L578 -62 L72 -62 Z" fill="none" stroke={P.pine} strokeWidth={2.5} strokeDasharray="10 6" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: playing ? 1 : 0, opacity: playing ? 1 : 0 }} transition={{ duration: when(fast, 1.1), delay: when(fast, 1.0), ease: ease.inOut }} data-survey />
          {[[20, -8], [540, -8], [578, -62], [72, -62]].map(([x, y], i) => (
            <motion.g key={i} initial={{ opacity: 0, y: -6 }} animate={{ opacity: playing ? 1 : 0, y: playing ? 0 : -6 }} transition={{ delay: when(fast, 1.0 + i * 0.25), duration: dur.short }}>
              <rect x={x - 1.5} y={y - 18} width={3} height={18} fill={P.trunk} />
              <rect x={x - 5} y={y - 22} width={10} height={6} fill={P.brass} />
            </motion.g>
          ))}
        </g>
        {homes.map((h, i) => (
          <TownhomeBuild key={i} {...h} night={night} playing={playing} fast={fast} />
        ))}
        {/* families walk in */}
        {[{ x: 700, seed: 1, d: 5.3 }, { x: 725, seed: 2, d: 5.4, child: true }, { x: 880, seed: 5, d: 5.7 }, { x: 1065, seed: 8, d: 6.0 }, { x: 1090, seed: 3, d: 6.1, child: true }].map((f, i) => (
          <motion.g key={i} initial={{ x: -140, opacity: 0 }} animate={playing ? { x: 0, opacity: 1 } : { x: -140, opacity: 0 }} transition={{ delay: when(fast, f.d), duration: when(fast, 1.3), ease: ease.out }}>
            <Person x={f.x} y={ground + 2} seed={f.seed} child={f.child} walking={ex.phase === 'playing'} scale={1.05} />
          </motion.g>
        ))}
      </g></g>
      <g className="scene-layer-front"><g transform={`scale(${S})`}>
        <Street w={W / S + 2} y={ground + 6} streetH={140} night={night} />
        <StreetLamp x={290} y={ground + 26} scale={1} on={night} index={0} flicker />
        <StreetLamp x={620} y={ground + 26} scale={1} on={night} index={1} />
        <StreetLamp x={900} y={ground + 26} scale={1} on={night} index={2} />
        <StreetLamp x={1080} y={ground + 26} scale={1} on={night} index={3} />
        <Tree x={1095} y={ground + 2} kind="palm" scale={1.3} sway={active} seed={6} />
      </g></g>
    </svg>
  );
}

/** A townhome that assembles: slab slides in, walls rise from the slab, roof drops and settles, windows light. */
function TownhomeBuild({ x, y, s, t, wall, roof, night, playing, fast }: { x: number; y: number; s: number; t: number; wall: string; roof: string; night: boolean; playing: boolean; fast: boolean }) {
  const w = 120, h = 68, depth = 12;
  const on = playing;
  const d = (k: number) => when(fast, t + k);
  const fastTr = fast ? { duration: 0.18, ease: ease.out } : undefined;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: on ? 1 : 0 }} transition={{ delay: d(0), duration: 0.2 }}>
        <ContactShadow w={w + 40} h={9} x={w / 2} />
      </motion.g>
      {/* slab */}
      <motion.g initial={{ y: 18, opacity: 0 }} animate={on ? { y: 0, opacity: 1 } : { y: 18, opacity: 0 }} transition={fastTr ?? { delay: d(0), ...spring.settle }}>
        <rect x={-6} y={-5} width={w + 12} height={5} fill={P.stoneLight} />
        <rect x={-6} y={-1.5} width={w + 12} height={1.5} fill={P.stoneDeep} opacity={0.6} />
      </motion.g>
      {/* walls grow upward from the slab */}
      <motion.g style={{ originY: '-5px', originX: `${w / 2}px` }} initial={{ scaleY: 0 }} animate={{ scaleY: on ? 1 : 0 }} transition={fastTr ?? { delay: d(0.35), duration: 0.55, ease: ease.out }}>
        <rect x={0} y={-5 - h} width={w} height={h} fill={wall} />
        <path d={`M${w} ${-5 - h} L${w + depth} ${-5 - h - depth * 0.6} V${-5 - depth * 0.6} L${w} -5 Z`} fill={shade(wall, 0.22)} />
        <rect x={w / 2 - 1} y={-5 - h} width={2} height={h} fill={P.shadow} opacity={0.4} />
      </motion.g>
      {/* roof drops and settles */}
      <motion.g initial={{ y: -70, opacity: 0 }} animate={on ? { y: 0, opacity: 1 } : { y: -70, opacity: 0 }} transition={fastTr ?? { delay: d(0.95), ...spring.settle }}>
        <path d={`M-4 ${-5 - h} L${w / 2} ${-5 - h - 26} L${w + 4} ${-5 - h} Z`} fill={shade(roof, -0.2)} />
        <path d={`M${w / 2} ${-5 - h - 26} L${w / 2 + depth} ${-5 - h - 26 - depth * 0.6} L${w + 4 + depth} ${-5 - h - depth * 0.6} L${w + 4} ${-5 - h} Z`} fill={roof} />
        <path d={`M-4 ${-5 - h} L${w / 2} ${-5 - h - 26} L${w + 4} ${-5 - h}`} stroke={shade(roof, 0.3)} strokeWidth={1.4} fill="none" />
        <path d={`M0 ${-5 - h} L${w / 2} ${-5 - h - 22} L${w} ${-5 - h} L${w} ${-1 - h} L0 ${-1 - h} Z`} fill={P.shadow} opacity={0.3} />
      </motion.g>
      {/* openings appear with the walls, light at the end */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: on ? 1 : 0 }} transition={fastTr ?? { delay: d(0.85), duration: 0.25 }}>
        <Window x={10} y={-5 - h + 10} w={16} h={18} night={night} />
        <Window x={w / 2 + 10} y={-5 - h + 10} w={16} h={18} night={night} />
        <Door x={10} y={-5 - 30} w={13} h={30} color={P.pine} night={night} mat={false} />
        <Window x={34} y={-5 - 32} w={18} h={18} night={night} />
        <Door x={w / 2 + 10} y={-5 - 30} w={13} h={30} color={P.brass} night={night} mat={false} />
        <Window x={w / 2 + 34} y={-5 - 32} w={18} h={18} night={night} />
      </motion.g>
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: on ? 1 : 0 }} transition={fastTr ?? { delay: d(1.45), duration: 0.5 }}>
        {[10, w / 2 + 10, 34, w / 2 + 34].map((wx, i) => <rect key={i} x={wx - 3} y={i < 2 ? -5 - h + 7 : -5 - 35} width={22} height={24} rx={4} fill={P.windowLit} opacity={night ? 0.5 : 0.28} />)}
      </motion.g>
    </g>
  );
}
