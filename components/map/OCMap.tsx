'use client';
/**
 * Stylized Orange County map rendered in-house (SVG). Ocean, county land with soft terrain, coastline
 * that draws itself, freeways as soft lines, city labels, parcel markers sized by potential homes and
 * coloured by fit score, hover cards that grow from the marker, fly-to on click, optional heat overlay.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { palette as P } from '@/lib/illustrationPalette';
import { spring, ease, dur } from '@/lib/motion';
import type { SiteStats } from '@/lib/siteStats';
import { COUNTY_PATH, COAST_PATH, FREEWAYS, CITY_LABELS, TERRAIN, ll, MAP_SIZE } from './ocGeo';
import { useT } from '@/lib/i18n';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

export type MapView = { x: number; y: number; k: number }; // centre + zoom in map units

type Props = {
  sites: SiteStats[];
  allSites: SiteStats[];
  night: boolean;
  heat: boolean;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (s: SiteStats) => void;
  flyTo: MapView | null;
  intro: boolean; // play the draw-in once
  className?: string;
};

export const HOME_VIEW: MapView = { x: 490, y: 450, k: 1.12 };
export const markerRadius = (homes: number) => 4 + Math.min(10, Math.sqrt(Math.max(0, homes)) * 0.75);
export const fitColor = (score: number, eligible: boolean, night: boolean) => {
  if (!eligible) return night ? '#4A5753' : '#B7C1BC';
  if (score >= 85) return night ? '#5FBF9A' : '#1E5C47';
  if (score >= 70) return night ? '#4FA585' : '#2F7A5F';
  if (score >= 55) return night ? '#6E9E8A' : '#5E9A82';
  return night ? '#7E8C86' : '#8FA39A';
};

export function OCMap({ sites, allSites, night, heat, hoveredId, onHover, onSelect, flyTo, intro, className = '' }: Props) {
  const reduced = useReducedMotion();
  const { t } = useT();
  const [drawn, setDrawn] = useState(!intro);
  useEffect(() => { if (intro) { const id = setTimeout(() => setDrawn(true), 1400); return () => clearTimeout(id); } }, [intro]);
  const visible = useMemo(() => new Set(sites.map((s) => s.parcel.id)), [sites]);
  const sorted = useMemo(() => [...allSites].sort((a, b) => a.parcel.mapY - b.parcel.mapY), [allSites]);
  const hovered = allSites.find((s) => s.parcel.id === hoveredId) ?? null;
  const view = flyTo ?? HOME_VIEW;
  const svgRef = useRef<SVGSVGElement>(null);
  const coastLen = 1;

  const water = night ? '#16283A' : P.ocean;
  const land = night ? '#1C2A25' : '#EEF2EC';
  const landEdge = night ? '#2E4139' : '#CFDAD2';
  const terrain = night ? '#233530' : '#DCE5DB';
  const road = night ? '#3A4A44' : '#D9DFD8';
  const roadMajor = night ? '#4A5C55' : '#C9D2CB';
  const label = night ? '#A7B4AE' : '#4A5753';

  return (
    <div className={`relative ${className}`} data-testid="oc-map">
      <svg ref={svgRef} viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`} className="w-full h-full block select-none" role="group" aria-label={t('sites.mapLabel')} style={{ background: water, transition: 'background 600ms var(--ease-out)' }}>
        <defs>
          <radialGradient id="heat-dot" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor={P.pine} stopOpacity="0.45" />
            <stop offset="1" stopColor={P.pine} stopOpacity="0" />
          </radialGradient>
          <filter id="map-soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.5" /></filter>
          <pattern id="ocean-waves" width="60" height="26" patternUnits="userSpaceOnUse">
            <path d="M0 13 q15 -8 30 0 t30 0" fill="none" stroke={night ? '#24405A' : '#FFFFFF'} strokeOpacity={night ? 0.5 : 0.55} strokeWidth="1.2" />
          </pattern>
        </defs>
        <motion.g
          animate={{ x: MAP_SIZE / 2 - view.x * view.k, y: MAP_SIZE / 2 - view.y * view.k, scale: view.k }}
          transition={reduced ? { duration: 0 } : spring.gentle}
          style={{ transformOrigin: '0 0' }}
        >
          {/* ocean shimmer (one ambient motion) */}
          <rect x={-200} y={-200} width={MAP_SIZE + 400} height={MAP_SIZE + 400} fill="url(#ocean-waves)" style={{ animation: reduced ? undefined : 'ks-shimmer-ocean 7s ease-in-out infinite' }} opacity={0.3} />
          {/* neighbouring land, faint */}
          <path d="M-200 -200 H1200 V260 L930 320 L-200 560 Z" fill={land} opacity={0.35} />
          {/* county */}
          <path d={COUNTY_PATH} fill={P.shadow} transform="translate(5 7)" opacity={0.5} filter="url(#map-soft)" />
          <path d={COUNTY_PATH} fill={land} stroke={landEdge} strokeWidth={1.5} className="ks-t" />
          <clipPath id="county-clip"><path d={COUNTY_PATH} /></clipPath>
          <g clipPath="url(#county-clip)">{TERRAIN.map((tr, i) => <path key={i} d={tr.d} fill={terrain} opacity={tr.opacity} filter="url(#map-soft)" className="ks-t" />)}</g>
          {/* coastline draws itself */}
          <motion.path d={COAST_PATH} fill="none" stroke={night ? '#5F8AA6' : '#8FB4C7'} strokeWidth={3} strokeLinecap="round"
            initial={intro && !reduced ? { pathLength: 0 } : { pathLength: coastLen }} animate={{ pathLength: coastLen }} transition={{ duration: 1.3, ease: ease.inOut }} />
          {/* freeways */}
          <motion.g initial={intro && !reduced ? { opacity: 0 } : { opacity: 1 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: dur.long, ease: ease.out }}>
            {FREEWAYS.map((f) => (
              <path key={f.id} d={f.d} fill="none" stroke={f.major ? roadMajor : road} strokeWidth={f.major ? 4 : 2.5} strokeLinecap="round" strokeLinejoin="round" className="ks-t" />
            ))}
          </motion.g>
          {/* heat overlay */}
          <AnimatePresence>
            {heat && (
              <motion.g key="heat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: dur.medium, ease: ease.out }} style={{ mixBlendMode: night ? 'screen' : 'multiply' }} data-testid="heat-overlay">
                {sites.filter((s) => s.eligibility.eligible).map((s) => {
                  const r = 30 + Math.sqrt(s.scenario.homes) * 6;
                  return <circle key={s.parcel.id} cx={s.parcel.mapX} cy={s.parcel.mapY} r={r} fill="url(#heat-dot)" />;
                })}
              </motion.g>
            )}
          </AnimatePresence>
          {/* city labels */}
          <g className="pointer-events-none" fontFamily="var(--font-public-sans)" fill={label}>
            {CITY_LABELS.map((c) => {
              const p = ll(c.lon, c.lat);
              return (
                <text key={c.name} x={p.x} y={p.y} textAnchor="middle" fontSize={c.size === 'lg' ? 15 : 12} fontWeight={c.size === 'lg' ? 600 : 500} letterSpacing={0.2} opacity={c.size === 'lg' ? 0.9 : 0.7} className="ks-t" fill={label} stroke={land} strokeWidth={3} paintOrder="stroke" strokeLinejoin="round">
                  {c.name}
                </text>
              );
            })}
          </g>
          {/* markers (north → south wave on intro) */}
          <g>
            {sorted.map((s, i) => {
              const on = visible.has(s.parcel.id);
              const r = markerRadius(s.scenario.homes);
              const isHover = hoveredId === s.parcel.id;
              const color = fitColor(s.fit.score, s.eligibility.eligible, night);
              return (
                <motion.g
                  key={s.parcel.id}
                  data-marker={s.parcel.id}
                  data-visible={on}
                  initial={intro && !reduced ? { opacity: 0, scale: 0.6 } : { opacity: on ? 1 : 0, scale: on ? 1 : 0.5 }}
                  animate={{ opacity: on ? 1 : 0, scale: on ? (isHover ? 1.18 : 1) : 0.5 }}
                  transition={drawn ? spring.snappy : { delay: 1.1 + i * 0.02, ...spring.settle }}
                  style={{ transformOrigin: `${s.parcel.mapX}px ${s.parcel.mapY}px`, pointerEvents: on ? 'auto' : 'none', cursor: 'pointer' }}
                  onPointerEnter={() => onHover(s.parcel.id)}
                  onPointerLeave={() => onHover(null)}
                  onClick={() => onSelect(s)}
                  role="button"
                  tabIndex={on ? 0 : -1}
                  aria-label={`${s.parcel.displayName}, ${s.scenario.homes} homes, fit ${s.fit.score}`}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(s); } }}
                >
                  <circle cx={s.parcel.mapX} cy={s.parcel.mapY + 1.5} r={r} fill={P.shadow} opacity={0.6} />
                  <circle cx={s.parcel.mapX} cy={s.parcel.mapY} r={r} fill={color} stroke={night ? '#0F1513' : '#FFFFFF'} strokeWidth={1.6} className="ks-t" />
                  {!s.eligibility.eligible && <circle cx={s.parcel.mapX} cy={s.parcel.mapY} r={r * 0.35} fill={night ? '#0F1513' : '#FFFFFF'} opacity={0.8} />}
                  {s.eligibility.eligible && s.fit.score >= 85 && <circle cx={s.parcel.mapX} cy={s.parcel.mapY} r={r * 0.3} fill={P.brassLight} opacity={0.95} />}
                  <circle cx={s.parcel.mapX} cy={s.parcel.mapY} r={Math.max(r, 12)} fill="transparent" />
                </motion.g>
              );
            })}
          </g>
        </motion.g>
      </svg>
      {/* hover card grows from the marker */}
      <AnimatePresence>
        {hovered && visible.has(hovered.parcel.id) && (
          <HoverCard key={hovered.parcel.id} s={hovered} view={view} svgRef={svgRef} />
        )}
      </AnimatePresence>
    </div>
  );
}

function HoverCard({ s, view, svgRef }: { s: SiteStats; view: MapView; svgRef: React.RefObject<SVGSVGElement | null> }) {
  const { t } = useT();
  const el = svgRef.current;
  const rect = el?.getBoundingClientRect();
  const w = rect?.width ?? 1000, h = rect?.height ?? 1000;
  const scale = Math.min(w, h) / MAP_SIZE;
  const ox = (w - MAP_SIZE * scale) / 2, oy = (h - MAP_SIZE * scale) / 2;
  const mx = (MAP_SIZE / 2 - view.x * view.k + s.parcel.mapX * view.k) * scale + ox;
  const my = (MAP_SIZE / 2 - view.y * view.k + s.parcel.mapY * view.k) * scale + oy;
  const right = mx > w * 0.6;
  const below = my < h * 0.3;
  return (
    <motion.div
      className="absolute pointer-events-none z-10 panel shadow-[var(--shadow-soft)] px-3 py-2.5 w-[230px]"
      style={{ left: mx + (right ? -14 : 14), top: my + (below ? 14 : -14), transform: `translate(${right ? '-100%' : '0'}, ${below ? '0' : '-100%'})`, transformOrigin: `${right ? 'right' : 'left'} ${below ? 'top' : 'bottom'}` }}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.11 } }}
      transition={{ duration: 0.16, ease: ease.out }}
      data-testid="hover-card"
    >
      <div className="text-[14px] font-semibold text-ink leading-5">{s.parcel.displayName}</div>
      <div className="text-[13px] text-ink-2 leading-5">{s.parcel.city}</div>
      <div className="mt-1.5 flex items-baseline gap-3">
        <span className="text-[20px] font-semibold text-ink tabular-nums leading-6"><AnimatedNumber value={s.eligibility.eligible ? s.scenario.homes : 0} /> <span className="text-[13px] font-medium text-ink-2">{t('common.homes')}</span></span>
        <span className="text-[13px] text-ink-2">{t('sites.fit')} {s.fit.score}</span>
      </div>
      <div className="text-[13px] text-ink-2 leading-5 mt-0.5">{s.reason}</div>
    </motion.div>
  );
}
