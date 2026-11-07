/**
 * Hero street scene: dusk Orange County street, edge to edge. Back: sky + hills + the mini OC map in the sky.
 * Mid: a church on the corner lot (its empty parking lot subtly highlighted) and six distinct homes with trees.
 * Front: sidewalk, street, lamps, cars, people. Ambient: one cloud drifts, trees sway (only while active).
 */
import type { SceneProps } from './types';
import { palette as P } from '@/lib/illustrationPalette';
import { Sky } from '@/components/illustrations/Sky';
import { Hills, Street } from '@/components/illustrations/Ground';
import { Church } from '@/components/illustrations/Church';
import { RanchHouse, CraftsmanHouse, TownhomePair, SpanishBungalow, TwoStoryHouse, Cottage } from '@/components/illustrations/houses';
import { Tree } from '@/components/illustrations/Tree';
import { StreetLamp, LampDefs } from '@/components/illustrations/StreetLamp';
import { Car } from '@/components/illustrations/Car';
import { Person } from '@/components/illustrations/Person';
import { Fence } from '@/components/illustrations/primitives';
import { COUNTY_PATH, COAST_PATH } from '@/components/map/ocGeo';
import { parcels } from '@/lib/data';

/** Hook-free so it can be server-rendered as static markup (see HeroStatic). */
export function StreetScene({ night, active, showMap = true, mapDelay = 0.2 }: Pick<SceneProps, 'night' | 'active'> & { showMap?: boolean; mapDelay?: number }) {
  const W = 1440, H = 900;
  const ground = 548; // in the scaled layer (×1.35 → 740 px)
  const S = 1.35;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="scene-svg" aria-hidden>
      <LampDefs />
      <g className="scene-layer-back">
        <Sky w={W} h={H} night={night} dusk id="hero" />
        <Hills w={W} y={660} night={night} id="hero" />
        {showMap && (
          <g transform="translate(930 90) scale(0.46)" data-testid="hero-minimap">
            <path d={COUNTY_PATH} fill={night ? '#1C2A25' : '#FFFFFF'} fillOpacity={night ? 0.7 : 0.55} stroke={night ? '#4FA585' : P.pine} strokeWidth={2} strokeOpacity={0.5} className="ks-t" />
            <path d={COAST_PATH} fill="none" stroke={night ? '#5F8AA6' : '#8FB4C7'} strokeWidth={4} strokeLinecap="round" />
            {parcels.map((p, i) => (
              <g key={p.id} className="hero-mk" style={{ ['--d' as string]: `${(mapDelay + i * 0.04).toFixed(2)}s`, transformOrigin: `${p.mapX}px ${p.mapY}px` }}>
                <circle cx={p.mapX} cy={p.mapY} r={16} fill={P.brassLight} opacity={0.25} />
                <circle cx={p.mapX} cy={p.mapY} r={7} fill={p.ownerType === 'congregation' || p.ownerType === 'college' ? P.brass : P.stone} stroke={night ? '#0F1513' : '#FFFFFF'} strokeWidth={2} />
              </g>
            ))}
          </g>
        )}
      </g>
      <g className="scene-layer-mid"><g transform={`scale(${S})`}>
        {/* corner church with its empty parking lot highlighted */}
        <Cottage x={-10} y={ground} night={night} delay={300} />
        <Tree x={110} y={ground + 2} kind="jacaranda" scale={1.2} sway={active} seed={2} />
        <RanchHouse x={130} y={ground} night={night} delay={0} />
        <Fence x0={262} x1={300} y={ground} />
        <SpanishBungalow x={310} y={ground} night={night} delay={60} />
        <Tree x={440} y={ground + 2} kind="oak" scale={1.3} sway={active} seed={3} />
        {/* corner church with its empty parking lot highlighted */}
        <g transform={`translate(470 ${ground})`}>
          <rect x={170} y={-14} width={230} height={14} fill={night ? P.asphaltDeep : P.asphalt} className="ks-t" />
          {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={180 + i * 38} y={-12} width={1.5} height={10} fill={P.paint} opacity={0.7} />)}
          <rect x={170} y={-18} width={230} height={20} rx={3} fill="none" stroke={P.brass} strokeWidth={2.5} strokeDasharray="8 6" className="hero-lot-glow" />
          <Church x={0} y={0} night={night} scale={1} tower="steeple" />
        </g>
        <Tree x={880} y={ground + 2} kind="palm" scale={1.3} sway={active} seed={1} />
        <CraftsmanHouse x={900} y={ground} night={night} delay={120} />
        <TownhomePair x={1020} y={ground} night={night} delay={240} />
        <Tree x={1172} y={ground + 2} kind="cypress" scale={1.1} sway={active} seed={4} />
        <TwoStoryHouse x={1190} y={ground} night={night} delay={180} />
        <Tree x={1325} y={ground + 2} kind="palm" scale={1.35} sway={active} seed={5} />
      </g></g>
      <g className="scene-layer-front"><g transform={`scale(${S})`}>
        <Street w={W / S + 2} y={ground + 4} streetH={140} night={night} />
        <StreetLamp x={250} y={ground + 24} scale={1} on={night} index={0} flicker />
        <StreetLamp x={560} y={ground + 24} scale={1} on={night} index={1} />
        <StreetLamp x={820} y={ground + 24} scale={1} on={night} index={2} />
        <StreetLamp x={1040} y={ground + 24} scale={1} on={night} index={3} />
        <Person x={395} y={ground + 22} seed={1} walking={active} />
        <Person x={418} y={ground + 22} seed={2} child walking={active} />
        <Person x={945} y={ground + 22} seed={5} flip />
        <Person x={965} y={ground + 22} seed={8} carrying />
        <Car x={330} y={ground + 112} night={night} color="#5A7FA6" scale={1.1} />
        <Car x={700} y={ground + 112} night={night} color="#B3362B" kind="wagon" flip scale={1.1} />
        <Car x={960} y={ground + 112} night={night} color="#D8D9D3" kind="pickup" scale={1.1} />
      </g></g>
    </svg>
  );
}

/** Closing band: the same street running into the distance; window lights come on in a wave. */
export function ClosingScene({ night, active }: SceneProps) {
  const W = 1440, H = 900;
  const rows = [
    { y: 820, s: 1.35, x0: -80, step: 300, light: 0 },
    { y: 660, s: 0.82, x0: 110, step: 200, light: 0.12 },
    { y: 580, s: 0.52, x0: 230, step: 140, light: 0.22 },
    { y: 530, s: 0.32, x0: 300, step: 100, light: 0.32 },
  ];
  const kinds = [RanchHouse, CraftsmanHouse, TownhomePair, SpanishBungalow, TwoStoryHouse, Cottage];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="scene-svg" aria-hidden>
      <LampDefs />
      <defs>
        <linearGradient id="close-road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={night ? '#3B3F42' : '#8A9093'} /><stop offset="1" stopColor={night ? P.asphaltDeep : P.asphalt} /></linearGradient>
      </defs>
      <g className="scene-layer-back">
        <Sky w={W} h={H} night={night} dusk id="close" />
        <Hills w={W} y={520} night={night} id="close" />
        {/* road vanishing to the centre */}
        <path d={`M 600 520 L 840 520 L 1500 ${H} L -60 ${H} Z`} fill="url(#close-road)" className="ks-t" />
        {[0, 1, 2, 3, 4, 5].map((i) => { const t = i / 6; const y = 540 + t * t * 360; const w = 2 + t * 10; return <rect key={i} x={720 - w / 2} y={y} width={w} height={6 + t * 30} rx={1} fill={P.paint} opacity={0.55} />; })}
      </g>
      <g className="scene-layer-mid">
        {rows.slice().reverse().map((r, ri) => (
          <g key={ri} opacity={1 - r.light} style={{ filter: r.light ? `saturate(${1 - r.light})` : undefined }}>
            {[0, 1, 2].map((k) => {
              const K = kinds[(k + ri) % kinds.length];
              const xl = r.x0 + k * r.step, xr = W - r.x0 - k * r.step - 120 * r.s;
              const i = ri * 3 + k;
              return (
                <g key={k}>
                  <g transform={`translate(${xl} ${r.y}) scale(${r.s})`}><K night={night} delay={active ? 900 + i * 110 : 0} /></g>
                  <g transform={`translate(${xr} ${r.y}) scale(${r.s})`}><K night={night} delay={active ? 900 + i * 110 + 60 : 0} flip /></g>
                </g>
              );
            })}
            {ri === 3 && <>
              <Tree x={440} y={rows[0].y + 2} kind="palm" scale={1.6} sway={active} seed={1} />
              <Tree x={1010} y={rows[0].y + 2} kind="jacaranda" scale={1.5} sway={active} seed={2} />
            </>}
          </g>
        ))}
      </g>
      <g className="scene-layer-front">
        <StreetLamp x={430} y={840} scale={1.25} on={night} index={0} flicker />
        <StreetLamp x={1010} y={840} scale={1.25} on={night} index={1} />
        <StreetLamp x={590} y={690} scale={0.8} on={night} index={2} />
        <StreetLamp x={860} y={690} scale={0.8} on={night} index={3} />
        <StreetLamp x={660} y={600} scale={0.5} on={night} index={4} />
        <StreetLamp x={790} y={600} scale={0.5} on={night} index={5} />
        <Car x={540} y={890} night={night} color="#5A7FA6" scale={1.3} flip />
      </g>
    </svg>
  );
}
