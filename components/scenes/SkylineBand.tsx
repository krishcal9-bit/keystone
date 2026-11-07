'use client';
/**
 * Pipeline backdrop: a faint, static skyline band (rooftops, a steeple, trees, lamp posts) across the
 * top ~220px of the page. No motion at all; night variant lights windows and lamps. Rendered at 8–10%.
 */
import { useTheme } from '@/lib/theme';
import { palette as P } from '@/lib/illustrationPalette';
import { Church } from '@/components/illustrations/Church';
import { RanchHouse, CraftsmanHouse, TownhomePair, SpanishBungalow, TwoStoryHouse, Cottage } from '@/components/illustrations/houses';
import { Tree } from '@/components/illustrations/Tree';
import { StreetLamp, LampDefs } from '@/components/illustrations/StreetLamp';

const W = 1440;
const H = 220;
const G = 196; // ground line

export function SkylineBand() {
  const { theme } = useTheme();
  const night = theme === 'dark';
  return (
    <div
      className="absolute inset-x-0 top-0 h-[220px]"
      style={{
        opacity: night ? 0.1 : 0.085,
        maskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
      }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMax slice" className="block" aria-hidden>
        <LampDefs />
        {/* distant block, lighter (atmospheric perspective) */}
        <g opacity={0.55}>
          <TwoStoryHouse x={40} y={G - 26} night={night} />
          <Cottage x={300} y={G - 26} night={night} />
          <TownhomePair x={620} y={G - 26} night={night} />
          <CraftsmanHouse x={1000} y={G - 26} night={night} />
          <RanchHouse x={1250} y={G - 26} night={night} flip />
          <Tree x={240} y={G - 24} kind="cypress" scale={0.8} />
          <Tree x={900} y={G - 24} kind="oak" scale={0.7} far />
        </g>
        {/* near block */}
        <Tree x={120} y={G} kind="palm" scale={1.1} />
        <SpanishBungalow x={150} y={G} night={night} />
        <Tree x={330} y={G} kind="jacaranda" scale={0.95} />
        <TownhomePair x={380} y={G} night={night} />
        <Church x={560} y={G} night={night} scale={0.9} />
        <Tree x={760} y={G} kind="oak" scale={0.9} />
        <CraftsmanHouse x={800} y={G} night={night} />
        <Cottage x={950} y={G} night={night} flip />
        <Tree x={1080} y={G} kind="cypress" />
        <TwoStoryHouse x={1110} y={G} night={night} />
        <RanchHouse x={1290} y={G} night={night} />
        <Tree x={1430} y={G} kind="palm" scale={1.05} />
        {/* ground strip + lamps */}
        <rect x={0} y={G} width={W} height={H - G} fill={night ? P.sidewalkShade : P.sidewalk} />
        <rect x={0} y={G} width={W} height={2} fill={P.shadow} opacity={0.5} />
        <StreetLamp x={70} y={G + 4} on={night} height={60} />
        <StreetLamp x={530} y={G + 4} on={night} height={60} />
        <StreetLamp x={940} y={G + 4} on={night} height={60} />
        <StreetLamp x={1270} y={G + 4} on={night} height={60} />
      </svg>
    </div>
  );
}
