/**
 * The three bundled sample aerials. Each is an illustrated top-down lot rendered from a sample parcel
 * by `app/dev/aerial/[n]` into a 1200×900 PNG; `fixtures/scan-{n}.json` holds the matching polygons.
 * The frame math here is the single source of truth for both the render and the fixture.
 */
import { parcels } from '@/lib/data';
import { metersPerUnitForLot } from '@/lib/sb4';
import type { Pt, Rect } from '@/lib/geometry';
import type { Parcel } from '@/lib/sb4';

export const SAMPLE_W = 1200;
export const SAMPLE_H = 900;
/** AerialLot draws 0.2 normalized units of ground around the lot on each side. */
const MARGIN = 0.2;
/** The lot frame is scaled down inside the image so neighbouring context surrounds it. */
const FIT = 0.78;

export type SampleAerial = { id: 1 | 2 | 3; parcelId: string; src: string; fixture: string };

export const sampleAerials: SampleAerial[] = [
  { id: 1, parcelId: parcels[0].id, src: '/samples/aerial-1.png', fixture: 'scan-1.json' },
  { id: 2, parcelId: parcels[5].id, src: '/samples/aerial-2.png', fixture: 'scan-2.json' },
  { id: 3, parcelId: parcels[12].id, src: '/samples/aerial-3.png', fixture: 'scan-3.json' },
];

export const sampleParcel = (n: number): Parcel => parcels.find((p) => p.id === sampleAerials[n - 1]?.parcelId) ?? parcels[0];

/** How the AerialLot SVG sits inside the 1200×900 image (contain, centred). */
export function sampleFrame(parcel: Pick<Parcel, 'lotPolygon' | 'lotAcres'>) {
  const bx = Math.max(...parcel.lotPolygon.map((p) => p.x));
  const by = Math.max(...parcel.lotPolygon.map((p) => p.y));
  const fw = bx + MARGIN * 2, fh = by + MARGIN * 2;
  const scale = Math.min(SAMPLE_W / fw, SAMPLE_H / fh) * FIT; // px per normalized unit
  const w = fw * scale, h = fh * scale;
  const ox = (SAMPLE_W - w) / 2, oy = (SAMPLE_H - h) / 2;
  const mpu = metersPerUnitForLot(parcel.lotPolygon, parcel.lotAcres);
  const metersAcross = Math.round(mpu * (SAMPLE_W / scale));
  const toImage = (p: Pt): Pt => ({
    x: +((ox + (p.x + MARGIN) * scale) / SAMPLE_W).toFixed(4),
    y: +((oy + (p.y + MARGIN) * scale) / SAMPLE_H).toFixed(4),
  });
  const rectToImage = (r: Rect): Pt[] => [
    { x: r.x, y: r.y }, { x: r.x + r.w, y: r.y }, { x: r.x + r.w, y: r.y + r.h }, { x: r.x, y: r.y + r.h },
  ].map(toImage);
  return { bx, by, scale, w, h, ox, oy, mpu, metersAcross, toImage, rectToImage };
}

/** Sample metersAcross for the scale control when a sample is loaded. */
export const sampleMetersAcross = (n: number) => sampleFrame(sampleParcel(n)).metersAcross;
