/**
 * The Site Finder map's art, split by cost:
 * - MapBase: haze, county, terrain and the Saddleback ridgeline (about ten paths) — live SVG, server-rendered,
 *   so the county is on screen at first paint.
 * - MapDetail: freeways plus ~1,000 rooftops and trees — hook-free and colour-agnostic (CSS variables);
 *   scripts/gen-static-art.tsx renders it per theme into public/art/map-detail-*.svg, which OCMap rasterises
 *   once onto a canvas. Pans, zooms and marker animations then blit one bitmap instead of repainting paths.
 * - MapCoast and MapLabels stay live: the coastline draws itself on load, and labels render in Fraunces
 *   (web fonts never load inside image documents).
 */
import { memo } from 'react';
import { palette as P } from '@/lib/illustrationPalette';
import { COUNTY_PATH, COAST_PATH, FREEWAYS, CITY_LABELS, TERRAIN, ll } from './ocGeo';
import { RIDGE_FAR, RIDGE_NEAR, SADDLEBACK, cityClusters } from './ocArt';

/** Extent of the rasterised detail layer, in map units. */
export const DETAIL_BOX = { x: -200, y: -200, size: 1400 };

export const MapBase = memo(function MapBase() {
  return (
    <g>
      <path d="M-900 -900 H1900 V260 L930 320 L-900 560 Z" fill="var(--m-land)" opacity={0.3} />
      <path d="M930 320 L1900 300 V1900 H900 Z" fill="var(--m-land)" opacity={0.22} />
      <path d={COUNTY_PATH} fill={P.shadow} transform="translate(6 8)" opacity={0.35} />
      <path d={COUNTY_PATH} fill="var(--m-land)" stroke="var(--m-land-edge)" strokeWidth={1.5} className="ks-t" />
      <g clipPath="url(#county-clip)">
        {TERRAIN.map((tr, i) => <path key={i} d={tr.d} fill="var(--m-terrain)" opacity={tr.opacity} className="ks-t" />)}
        {/* Saddleback ridgeline in the distance */}
        <path d={RIDGE_FAR} fill="var(--m-ridge-far)" opacity={0.75} className="ks-t" />
        <path d={RIDGE_NEAR} fill="var(--m-ridge-near)" opacity={0.8} className="ks-t" />
        <path d={SADDLEBACK} fill="none" stroke="var(--m-ridge-line)" strokeWidth={1.2} strokeLinejoin="round" opacity={0.8} />
      </g>
    </g>
  );
});

export function MapDetail() {
  const clusters = cityClusters();
  const tones = ['var(--m-t0)', 'var(--m-t1)', 'var(--m-t2)'];
  return (
    <g>
      {/* freeways as soft roads (casing + fill) */}
      <g >
        {FREEWAYS.map((f) => <path key={`c${f.id}`} d={f.d} fill="none" stroke="var(--m-road-case)" strokeWidth={f.major ? 6 : 4} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} className="ks-t" />)}
        {FREEWAYS.map((f) => <path key={f.id} d={f.d} fill="none" stroke="var(--m-road)" strokeWidth={f.major ? 3.4 : 2.2} strokeLinecap="round" strokeLinejoin="round" className="ks-t" />)}
      </g>
      {/* rooftops and trees clustered in cities */}
      <g>
        {clusters.map((c) => (
          <g key={c.city}>
            {c.roofs.map((r, i) => (
              <g key={i}>
                <rect x={(r.x - r.w / 2 + 0.6).toFixed(2)} y={(r.y + 0.8).toFixed(2)} width={r.w} height={r.h} fill={P.shadow} opacity={0.5} />
                <rect x={(r.x - r.w / 2).toFixed(2)} y={r.y} width={r.w} height={r.h} fill={tones[r.tone]} />
                <path d={`M${(r.x - r.w / 2 - 0.5).toFixed(2)} ${r.y} L${(r.x + (r.flip ? -r.w * 0.15 : r.w * 0.15)).toFixed(2)} ${(r.y - r.h * 0.9).toFixed(2)} L${(r.x + r.w / 2 + 0.5).toFixed(2)} ${r.y} Z`} fill="var(--m-roof)" opacity={0.9} />
              </g>
            ))}
            {c.trees.map((tr, i) => (
              <g key={`t${i}`}>
                <circle cx={(tr.x + 0.6).toFixed(2)} cy={(tr.y + 0.8).toFixed(2)} r={tr.r} fill={P.shadow} opacity={0.5} />
                <circle cx={tr.x} cy={tr.y} r={tr.r} fill={tr.jacaranda ? 'var(--m-jacaranda)' : 'var(--m-tree)'} />
              </g>
            ))}
          </g>
        ))}
      </g>
    </g>
  );
}

/** Theme colours for the static art, set as CSS variables on the map <svg>. */
export function mapArtVars(night: boolean): Record<string, string> {
  return {
    '--m-land': night ? '#1C2A25' : '#EEF2EC',
    '--m-land-edge': night ? '#2E4139' : '#CFDAD2',
    '--m-terrain': night ? '#233530' : '#DCE5DB',
    '--m-road': night ? '#3A4A44' : '#D9DFD8',
    '--m-road-case': night ? '#2A3630' : '#FFFFFF',
    '--m-label': night ? '#C9D3CE' : '#2F3C37',
    '--m-ridge-far': night ? '#2A3F35' : '#CFD9D1',
    '--m-ridge-near': night ? '#223328' : '#BBCBC0',
    '--m-ridge-line': night ? '#3A5246' : '#E4ECE6',
    '--m-coast': night ? '#6E9AB8' : '#8FB4C7',
    '--m-coast-hi': night ? '#A8C6DA' : '#FFFFFF',
    '--m-t0': night ? '#3B4A45' : '#E8E2D6',
    '--m-t1': night ? '#44534D' : '#DCD3C3',
    '--m-t2': night ? '#4D5A55' : '#E3CDB9',
    '--m-roof': night ? '#2A3632' : '#3C4A52',
    '--m-jacaranda': night ? '#5E5480' : P.jacaranda,
    '--m-tree': night ? '#2A5340' : P.tree,
  };
}

/** City labels, rendered live in the page so they use Fraunces. */
export const MapLabels = memo(function MapLabels() {
  return (
    <g>
      <g>
        {CITY_LABELS.map((c) => {
          const p = ll(c.lon, c.lat);
          return (
            <text key={c.name} x={p.x} y={c.size === 'lg' ? p.y - 30 : p.y} textAnchor="middle" fontSize={c.size === 'lg' ? 17 : 13} fontWeight={500} fill="var(--m-label)" stroke="var(--m-land)" strokeWidth={3.5} paintOrder="stroke" strokeLinejoin="round" opacity={c.size === 'lg' ? 0.95 : 0.75} className="ks-t">
              {c.name}
            </text>
          );
        })}
      </g>
    </g>
  );
});

/** The coastline, kept live so it can draw itself on first load (two paths; cheap to animate). */
export const MapCoast = memo(function MapCoast({ play }: { play: boolean }) {
  return (
    <g>
      <path d={COAST_PATH} fill="none" stroke="var(--m-coast)" strokeWidth={3.2} strokeLinecap="round" pathLength={1} className={play ? 'coast-draw' : undefined} />
      <path d={COAST_PATH} fill="none" stroke="var(--m-coast-hi)" strokeWidth={1} strokeLinecap="round" pathLength={1} opacity={0.7} className={play ? 'coast-draw' : undefined} />
    </g>
  );
});
