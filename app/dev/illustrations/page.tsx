'use client';
import { useTheme } from '@/lib/theme';
import { RanchHouse, CraftsmanHouse, TownhomePair, SpanishBungalow, TwoStoryHouse, Cottage } from '@/components/illustrations/houses';
import { Tree } from '@/components/illustrations/Tree';
import { Person } from '@/components/illustrations/Person';
import { StreetLamp, LampDefs } from '@/components/illustrations/StreetLamp';
import { Car } from '@/components/illustrations/Car';
import { Church } from '@/components/illustrations/Church';
import { Sky } from '@/components/illustrations/Sky';
import { Street, Hills } from '@/components/illustrations/Ground';
import { AerialLot } from '@/components/illustrations/AerialLot';
import { parcels } from '@/lib/data';

export default function Dev() {
  const { theme } = useTheme();
  const night = theme === 'dark';
  return (
    <div className="pt-20 px-6 flex flex-col gap-8">
      <svg viewBox="0 0 1400 460" width="100%" style={{ background: 'var(--paper)' }}>
        <LampDefs />
        <Sky w={1400} h={460} night={night} dusk id="dev" />
        <Hills w={1400} y={300} night={night} id="dev" />
        <g transform="translate(0 0)">
          <Tree x={60} y={330} kind="palm" scale={1.3} sway seed={1} />
          <Church x={90} y={330} night={night} scale={0.95} />
          <RanchHouse x={320} y={330} night={night} />
          <TownhomePair x={500} y={330} night={night} />
          <CraftsmanHouse x={700} y={330} night={night} />
          <SpanishBungalow x={860} y={330} night={night} />
          <TwoStoryHouse x={1010} y={330} night={night} />
          <Cottage x={1180} y={330} night={night} />
          <Tree x={470} y={332} kind="jacaranda" scale={1.1} sway seed={2} />
          <Tree x={840} y={332} kind="oak" scale={1.1} sway seed={3} />
          <Tree x={1300} y={332} kind="cypress" scale={1} sway seed={4} />
          <Tree x={1340} y={332} kind="palm" scale={1.2} sway seed={5} />
        </g>
        <Street w={1400} y={334} night={night} />
        <StreetLamp x={280} y={352} on={night} index={0} flicker />
        <StreetLamp x={660} y={352} on={night} index={1} />
        <StreetLamp x={1120} y={352} on={night} index={2} />
        <Car x={380} y={440} night={night} color="#5A7FA6" />
        <Car x={760} y={440} night={night} color="#B3362B" kind="wagon" flip />
        <Car x={1180} y={440} night={night} color="#D8D9D3" kind="pickup" />
        <Person x={230} y={350} seed={1} walking />
        <Person x={250} y={350} seed={2} child walking />
        <Person x={940} y={350} seed={5} flip />
        <Person x={960} y={350} seed={8} carrying />
      </svg>
      <div className="grid grid-cols-3 gap-6">
        {parcels.slice(0, 3).map((p, i) => <div key={p.id} className="panel p-3"><AerialLot parcel={p} night={night} id={`a${i}`} keptStalls={40} /></div>)}
      </div>
    </div>
  );
}
