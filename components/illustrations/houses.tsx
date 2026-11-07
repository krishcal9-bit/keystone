'use client';
/**
 * Six distinct homes. Each sits on the ground line (y = 0) with its own contact shadow.
 * Props: night (windows and porch lights glow), scale via the parent's transform.
 */
import { palette as P, shade } from '@/lib/illustrationPalette';
import { Window, Door, Chimney, Fence, Mailbox, Bush, Steps, Facade, GableRoof, FlatRoof, ContactShadow } from './primitives';

export type HouseProps = { night?: boolean; x?: number; y?: number; lit?: boolean; flip?: boolean; delay?: number };

const wrap = (x: number, y: number, flip: boolean | undefined, children: React.ReactNode) => (
  <g transform={`translate(${x} ${y}) ${flip ? 'scale(-1 1)' : ''}`}>{children}</g>
);

/** Single-story ranch home with a low flat roof, wide window and carport side. Width ≈ 120. */
export function RanchHouse({ night = false, x = 0, y = 0, lit = true, flip, delay = 0 }: HouseProps) {
  return wrap(x, y, flip, (
    <>
      <ContactShadow w={150} h={8} x={62} />
      <Facade x={0} y={-42} w={110} h={42} color={P.wallWarm} depth={14} />
      <FlatRoof x={0} y={-48} w={110} depth={14} color={P.roofDeep} thickness={5} overhang={6} />
      <Window x={10} y={-34} w={28} h={18} night={night} lit={lit} delay={delay} />
      <Window x={78} y={-34} w={16} h={18} night={night} lit={lit} delay={delay + 80} />
      <Door x={48} y={-30} w={14} h={30} color={P.roofTerracotta} night={night} />
      <Steps x={46} w={18} n={1} />
      <Bush x={-8} r={5} />
      <Bush x={124} r={6} />
      <Mailbox x={-20} />
      <Fence x0={-30} x1={-24} />
    </>
  ));
}

/** Two-story craftsman with a porch, gable roof and chimney. Width ≈ 96. */
export function CraftsmanHouse({ night = false, x = 0, y = 0, lit = true, flip, delay = 0 }: HouseProps) {
  return wrap(x, y, flip, (
    <>
      <ContactShadow w={130} h={8} x={50} />
      <Facade x={0} y={-78} w={92} h={78} color={P.wallSage} depth={12} />
      <GableRoof x={0} y={-78} w={92} rise={30} depth={12} color={P.roof} />
      <Chimney x={70} y={-100} color={P.wallClayShade} />
      {/* porch roof + posts */}
      <path d={`M-6 -40 L98 -40 L98 -36 L-6 -36 Z`} fill={P.roofLight} />
      <path d={`M-6 -36 L98 -36 L98 -33 L-6 -33 Z`} fill={P.shadow} opacity={0.35} />
      <rect x={-2} y={-36} width={3} height={36} fill={P.wall} />
      <rect x={28} y={-36} width={3} height={36} fill={P.wall} />
      <rect x={60} y={-36} width={3} height={36} fill={P.wall} />
      <rect x={92} y={-36} width={3} height={36} fill={P.wallShade} />
      <Window x={10} y={-70} w={16} h={18} night={night} lit={lit} delay={delay} />
      <Window x={38} y={-70} w={16} h={18} night={night} lit={lit} delay={delay + 60} />
      <Window x={66} y={-70} w={16} h={18} night={night} lit={lit} delay={delay + 120} />
      <Window x={8} y={-30} w={16} h={18} night={night} lit={lit} delay={delay + 40} />
      <Door x={40} y={-30} w={14} h={30} color={P.pine} night={night} />
      <Window x={66} y={-30} w={16} h={18} night={night} lit={lit} delay={delay + 100} />
      <Steps x={37} w={20} n={2} />
      <Bush x={-14} r={6} />
      <Fence x0={100} x1={130} />
    </>
  ));
}

/** Pair of attached two-story townhomes (Habitat style) with offset entries. Width ≈ 120. */
export function TownhomePair({ night = false, x = 0, y = 0, lit = true, flip, delay = 0 }: HouseProps) {
  return wrap(x, y, flip, (
    <>
      <ContactShadow w={150} h={8} x={62} />
      <Facade x={0} y={-70} w={58} h={70} color={P.wall} depth={0} />
      <Facade x={58} y={-74} w={58} h={74} color={P.wallClay} depth={12} />
      <FlatRoof x={0} y={-74} w={58} depth={12} color={P.roof} thickness={4} overhang={3} />
      <FlatRoof x={58} y={-78} w={58} depth={12} color={P.roofDeep} thickness={4} overhang={3} />
      {/* party wall shadow */}
      <rect x={57} y={-70} width={2} height={70} fill={P.shadow} opacity={0.45} />
      <Window x={8} y={-62} w={14} h={18} night={night} lit={lit} delay={delay} />
      <Window x={34} y={-62} w={14} h={18} night={night} lit={lit} delay={delay + 90} />
      <Window x={66} y={-66} w={14} h={18} night={night} lit={lit} delay={delay + 150} />
      <Window x={92} y={-66} w={14} h={18} night={night} lit={lit} delay={delay + 30} />
      <Door x={8} y={-30} w={13} h={30} color={P.pine} night={night} />
      <Window x={32} y={-30} w={18} h={18} night={night} lit={lit} delay={delay + 60} />
      <Window x={66} y={-30} w={18} h={18} night={night} lit={lit} delay={delay + 120} />
      <Door x={94} y={-30} w={13} h={30} color={P.brass} night={night} />
      <Steps x={6} w={17} n={1} />
      <Steps x={92} w={17} n={1} />
      <Bush x={-10} r={5} />
      <Bush x={56} r={4} />
      <Mailbox x={134} />
    </>
  ));
}

/** Spanish bungalow with terracotta roof and arched door. Width ≈ 100. */
export function SpanishBungalow({ night = false, x = 0, y = 0, lit = true, flip, delay = 0 }: HouseProps) {
  return wrap(x, y, flip, (
    <>
      <ContactShadow w={130} h={8} x={50} />
      <Facade x={0} y={-50} w={96} h={50} color={P.wallWarm} depth={12} />
      <GableRoof x={0} y={-50} w={96} rise={18} depth={12} color={P.roofTerracotta} overhang={4} />
      {/* roof tile lines */}
      <path d={`M48 -66 L96 -50`} stroke={shade(P.roofTerracotta, 0.2)} strokeWidth={0.8} opacity={0.6} />
      <path d={`M48 -66 L0 -50`} stroke={shade(P.roofTerracotta, -0.1)} strokeWidth={0.8} opacity={0.5} />
      <Window x={10} y={-40} w={18} h={22} night={night} lit={lit} arch delay={delay} />
      <Door x={41} y={-34} w={14} h={34} color={P.trunk} night={night} arch />
      <Window x={70} y={-40} w={16} h={22} night={night} lit={lit} arch delay={delay + 70} />
      <Steps x={39} w={18} n={1} />
      <Bush x={-10} r={6} color={P.jacarandaDeep} light={P.jacaranda} />
      <Bush x={106} r={5} />
      <Fence x0={-32} x1={-20} color={P.wallClayShade} />
    </>
  ));
}

/** Tall two-story colonial with a side bay and dormer. Width ≈ 104. */
export function TwoStoryHouse({ night = false, x = 0, y = 0, lit = true, flip, delay = 0 }: HouseProps) {
  return wrap(x, y, flip, (
    <>
      <ContactShadow w={140} h={8} x={54} />
      <Facade x={0} y={-82} w={100} h={82} color={P.wall} depth={14} />
      <FlatRoof x={0} y={-86} w={100} depth={14} color={P.roof} thickness={4} overhang={4} />
      {/* dormer */}
      <rect x={38} y={-104} width={24} height={18} fill={P.wallShade} />
      <path d="M34 -104 L50 -116 L66 -104 Z" fill={P.roofLight} />
      <Window x={44} y={-100} w={12} h={12} night={night} lit={lit} sill={false} delay={delay + 200} />
      <Window x={10} y={-74} w={16} h={20} night={night} lit={lit} delay={delay} />
      <Window x={42} y={-74} w={16} h={20} night={night} lit={lit} delay={delay + 80} />
      <Window x={74} y={-74} w={16} h={20} night={night} lit={lit} delay={delay + 160} />
      <Window x={10} y={-32} w={16} h={20} night={night} lit={lit} delay={delay + 120} />
      <Door x={42} y={-32} w={16} h={32} color={P.roofDeep} night={night} />
      <Window x={74} y={-32} w={16} h={20} night={night} lit={lit} delay={delay + 40} />
      <Steps x={40} w={20} n={2} />
      <Bush x={-12} r={7} />
      <Bush x={118} r={5} />
      <Mailbox x={-26} color={P.pine} />
    </>
  ));
}

/** Small cottage with a steep roof and picket fence. Width ≈ 70. */
export function Cottage({ night = false, x = 0, y = 0, lit = true, flip, delay = 0 }: HouseProps) {
  return wrap(x, y, flip, (
    <>
      <ContactShadow w={100} h={7} x={36} />
      <Facade x={0} y={-44} w={66} h={44} color={P.wallSage} depth={10} />
      <GableRoof x={0} y={-44} w={66} rise={30} depth={10} color={P.roofDeep} overhang={6} />
      <Chimney x={46} y={-70} w={7} h={14} color={P.stone} />
      <Window x={8} y={-34} w={16} h={16} night={night} lit={lit} delay={delay} />
      <Door x={40} y={-30} w={13} h={30} color={P.brass} night={night} />
      <Steps x={38} w={17} n={1} />
      <Fence x0={-30} x1={-6} />
      <Fence x0={72} x1={100} />
      <Bush x={-4} r={4} />
    </>
  ));
}

export const HOUSES = { RanchHouse, CraftsmanHouse, TownhomePair, SpanishBungalow, TwoStoryHouse, Cottage } as const;
export type HouseKind = keyof typeof HOUSES;
