'use client';
/**
 * Illustrated Orange County map (in-house SVG). Ocean with a slow shimmer, the county with soft terrain and the
 * Santa Ana Mountains / Saddleback ridgeline in the distance, freeways as soft roads, Fraunces city labels with
 * tiny rooftops and trees clustered around them, and parcel markers in ONE lightweight SVG layer driven by CSS
 * (no per-marker Motion components). Three layers share one pan/zoom (Motion values): the live base SVG (county,
 * terrain), a canvas holding the rasterised detail art (freeways, rooftops, trees — see MapArt), and the live
 * overlay SVG (coast, labels, heat, markers). Load sequence (once per session): coastline draws, ocean fades up,
 * detail fades in, markers drop in north to south with a brass glint.
 */
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useTransform, animate, type MotionValue } from 'motion/react';
import { palette as P } from '@/lib/illustrationPalette';
import { spring, ease } from '@/lib/motion';
import type { SiteStats } from '@/lib/siteStats';
import { COUNTY_PATH, MAP_SIZE } from './ocGeo';
import { mapArtVars, MapBase, MapLabels, MapCoast, DETAIL_BOX } from './MapArt';
import { preload } from 'react-dom';
import { useT } from '@/lib/i18n';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

export type MapView = { x: number; y: number; k: number };

type Props = {
  sites: SiteStats[];
  allSites: SiteStats[];
  night: boolean;
  heat: boolean;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (s: SiteStats) => void;
  flyTo: MapView | null;
  intro: boolean;
  className?: string;
  /** Extra map units of room on the left (for floating panels) and above. */
  inset?: { left: number; top: number };
};

export const HOME_VIEW: MapView = { x: 500, y: 520, k: 1.0 };
export const markerRadius = (homes: number) => 4 + Math.min(10, Math.sqrt(Math.max(0, homes)) * 0.75);
export const fitColor = (score: number, eligible: boolean, night: boolean) => {
  if (!eligible) return night ? '#4A5753' : '#B7C1BC';
  if (score >= 85) return night ? '#5FBF9A' : '#1E5C47';
  if (score >= 70) return night ? '#4FA585' : '#2F7A5F';
  if (score >= 55) return night ? '#6E9E8A' : '#5E9A82';
  return night ? '#7E8C86' : '#8FA39A';
};

const DEFAULT_INSET = { left: 0, top: 0 };

/** Memoised: the parent re-renders on every filter/hover change, and 60 markers only need to re-render when their inputs do. */
export const OCMap = memo(function OCMap({ sites, allSites, night, heat, hoveredId, onHover, onSelect, flyTo, intro, className = '', inset = DEFAULT_INSET }: Props) {
  const reduced = useReducedMotion();
  const { t } = useT();
  const visible = useMemo(() => new Set(sites.map((s) => s.parcel.id)), [sites]);
  const sorted = useMemo(() => [...allSites].sort((a, b) => a.parcel.mapY - b.parcel.mapY), [allSites]);
  const hovered = allSites.find((s) => s.parcel.id === hoveredId) ?? null;
  const view = flyTo ?? HOME_VIEW;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [settled, setSettled] = useState(!intro || !!reduced);
  useEffect(() => { if (intro && !reduced) { const id = setTimeout(() => setSettled(true), 3200); return () => clearTimeout(id); } }, [intro, reduced]);
  const play = intro && !reduced;

  const water = night ? '#16283A' : '#C7DCE6';
  const detailSrc = `/art/map-detail-${night ? 'night' : 'day'}.webp`;
  preload(detailSrc, { as: 'image' });
  const waveStroke = encodeURIComponent(night ? '#2A4660' : '#FFFFFF');
  const waves = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='70' height='30' viewBox='0 0 70 30'%3E%3Cpath d='M0 15 q17 -9 35 0 t35 0' fill='none' stroke='${waveStroke}' stroke-opacity='${night ? 0.55 : 0.6}' stroke-width='1.3'/%3E%3C/svg%3E")`;
  const vb = `${-inset.left} ${-inset.top} ${MAP_SIZE + inset.left} ${MAP_SIZE + inset.top}`;

  // One pan/zoom shared by the three layers.
  const tx = useMotionValue(MAP_SIZE / 2 - view.x * view.k);
  const ty = useMotionValue(MAP_SIZE / 2 - view.y * view.k);
  const tk = useMotionValue(view.k);
  useEffect(() => {
    const tr = reduced ? { duration: 0 } : spring.gentle;
    const ctrls = [animate(tx, MAP_SIZE / 2 - view.x * view.k, tr), animate(ty, MAP_SIZE / 2 - view.y * view.k, tr), animate(tk, view.k, tr)];
    return () => ctrls.forEach((c) => c.stop());
  }, [view.x, view.y, view.k, reduced, tx, ty, tk]);
  const baseRef = useSvgTransform(tx, ty, tk);
  const overlayRef = useSvgTransform(tx, ty, tk);
  const transform0 = `translate(${MAP_SIZE / 2 - view.x * view.k} ${MAP_SIZE / 2 - view.y * view.k}) scale(${view.k})`;
  const svgStyle = mapArtVars(night) as React.CSSProperties;

  return (
    <div ref={wrapRef} className={`relative ${className}`} data-testid="oc-map" data-settled={settled} style={{ background: water, transition: 'background 600ms var(--ease-out)' }}>
      <style>{`
        .mk { transform-box: fill-box; transform-origin: center; transition: transform 320ms cubic-bezier(0.23,1,0.32,1), opacity 240ms ease; cursor: pointer; }
        .mk[data-visible="false"] { opacity: 0; transform: scale(0.5); pointer-events: none; }
        .mk[data-hover="true"] { transform: scale(1.18); }
        @media (hover:hover) and (pointer:fine) { .mk:hover { transform: scale(1.18); } }
        .mk-in { animation: mk-drop 560ms cubic-bezier(0.23,1,0.32,1) both; animation-delay: var(--d); }
        .mk-in .glint { animation: mk-glint 700ms ease-out both; animation-delay: calc(var(--d) + 360ms); }
        @keyframes mk-drop { from { opacity: 0; transform: translateY(-16px) scale(0.6); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes mk-glint { 0% { opacity: 0.8; transform: scale(0.6); } 100% { opacity: 0; transform: scale(2.4); } }
        .coast-draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: coast 1.4s cubic-bezier(0.77,0,0.175,1) forwards; }
        @keyframes coast { to { stroke-dashoffset: 0; } }
        .fade-in { animation: fade 700ms ease-out both; animation-delay: var(--d); }
        @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
        .ocean-shimmer { opacity: 0.35; animation: ks-shimmer-ocean 7s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .mk-in, .coast-draw, .fade-in, .glint { animation: none !important; opacity: 1; stroke-dashoffset: 0; } .ocean-shimmer { animation: none !important; } }
      `}</style>
      {/* ocean shimmer: an HTML layer so the opacity tween is composited (an SVG rect would repaint the pattern every frame) */}
      <div aria-hidden className={`absolute inset-0 pointer-events-none ${play ? 'fade-in' : ''}`} style={{ ['--d' as string]: '300ms' }}>
        <div className="absolute inset-0 ocean-shimmer" style={{ backgroundImage: waves, backgroundSize: '56px 24px', willChange: 'opacity' }} />
      </div>
      {/* base: county, terrain, ridgeline (live, server-rendered) */}
      <svg viewBox={vb} className="absolute inset-0 w-full h-full block pointer-events-none" aria-hidden preserveAspectRatio="xMidYMid meet" style={svgStyle}>
        <defs><clipPath id="county-clip"><path d={COUNTY_PATH} /></clipPath></defs>
        <g ref={baseRef} transform={transform0}><MapBase /></g>
      </svg>
      {/* detail: freeways, rooftops, trees as one rasterised bitmap */}
      <MapRaster src={detailSrc} tx={tx} ty={ty} tk={tk} inset={inset} play={play} />
      {/* overlay: coast, labels, heat, markers (interactive) */}
      <svg viewBox={vb} className="relative w-full h-full block select-none" role="group" aria-label={t('sites.mapLabel')} preserveAspectRatio="xMidYMid meet" style={svgStyle}>
        <defs>
          <radialGradient id="heat-dot" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor={P.pine} stopOpacity="0.45" />
            <stop offset="1" stopColor={P.pine} stopOpacity="0" />
          </radialGradient>
        </defs>
        <g ref={overlayRef} transform={transform0}>
          <MapCoast play={play} />
          <g className={`pointer-events-none ${play ? 'fade-in' : ''}`} style={{ ['--d' as string]: '1100ms', fontFamily: 'var(--font-fraunces), Georgia, serif', fontVariationSettings: '"opsz" 14, "SOFT" 30, "WONK" 0' }}>
            <MapLabels />
          </g>
          {/* heat overlay */}
          <AnimatePresence>
            {heat && (
              <motion.g key="heat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.32, ease: ease.out }} style={{ mixBlendMode: night ? 'screen' : 'multiply' }} data-testid="heat-overlay">
                {sites.filter((s) => s.eligibility.eligible).map((s) => <circle key={s.parcel.id} cx={s.parcel.mapX} cy={s.parcel.mapY} r={30 + Math.sqrt(s.scenario.homes) * 6} fill="url(#heat-dot)" />)}
              </motion.g>
            )}
          </AnimatePresence>
          {/* markers: one CSS-driven layer */}
          <g>
            {sorted.map((s, i) => {
              const on = visible.has(s.parcel.id);
              const r = markerRadius(s.scenario.homes);
              const color = fitColor(s.fit.score, s.eligibility.eligible, night);
              return (
                <g
                  key={s.parcel.id}
                  className={`mk ${play && !settled ? 'mk-in' : ''}`}
                  style={{ ['--d' as string]: `${1700 + i * 20}ms` }}
                  data-marker={s.parcel.id}
                  data-visible={on}
                  data-hover={hoveredId === s.parcel.id}
                  onPointerEnter={() => onHover(s.parcel.id)}
                  onPointerLeave={() => onHover(null)}
                  onClick={() => onSelect(s)}
                  role="button"
                  tabIndex={on ? 0 : -1}
                  aria-label={`${s.parcel.displayName}, ${s.scenario.homes} homes, fit ${s.fit.score}`}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(s); } }}
                >
                  <circle className="glint" cx={s.parcel.mapX} cy={s.parcel.mapY} r={r + 3} fill="none" stroke={P.brassLight} strokeWidth={2} />
                  <circle cx={s.parcel.mapX} cy={s.parcel.mapY + 1.5} r={r} fill={P.shadow} opacity={0.6} />
                  <circle cx={s.parcel.mapX} cy={s.parcel.mapY} r={r} fill={color} stroke={night ? '#0F1513' : '#FFFFFF'} strokeWidth={1.6} className="ks-t" />
                  {!s.eligibility.eligible && <circle cx={s.parcel.mapX} cy={s.parcel.mapY} r={r * 0.35} fill={night ? '#0F1513' : '#FFFFFF'} opacity={0.8} />}
                  {s.eligibility.eligible && s.fit.score >= 85 && <circle cx={s.parcel.mapX} cy={s.parcel.mapY} r={r * 0.3} fill={P.brassLight} opacity={0.95} />}
                  <circle cx={s.parcel.mapX} cy={s.parcel.mapY} r={Math.max(r, 12)} fill="transparent" />
                </g>
              );
            })}
          </g>
        </g>
      </svg>
      <AnimatePresence>
        {hovered && visible.has(hovered.parcel.id) && <HoverCard key={hovered.parcel.id} s={hovered} wrap={wrapRef} />}
      </AnimatePresence>
    </div>
  );
});



/** Writes `translate(x y) scale(k)` straight to a group's transform attribute: SVG-origin semantics, no transform-box surprises, same maths as the raster layer. */
function useSvgTransform(tx: MotionValue<number>, ty: MotionValue<number>, tk: MotionValue<number>) {
  const ref = useRef<SVGGElement>(null);
  useEffect(() => {
    const apply = () => ref.current?.setAttribute('transform', `translate(${tx.get()} ${ty.get()}) scale(${tk.get()})`);
    apply();
    const offs = [tx.on('change', apply), ty.on('change', apply), tk.on('change', apply)];
    return () => offs.forEach((off) => off());
  }, [tx, ty, tk]);
  return ref;
}

/** Pre-rasterised detail art blitted onto a canvas (a canvas is cheap to transform and is not an LCP candidate); the layer is an HTML element, so pans and zooms are composited. */
function MapRaster({ src, tx, ty, tk, inset, play }: { src: string; tx: MotionValue<number>; ty: MotionValue<number>; tk: MotionValue<number>; inset: { left: number; top: number }; play: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  // viewBox → pixel mapping (xMidYMid meet), kept in a motion value so the transform follows resizes.
  const gs = useMotionValue(0), gox = useMotionValue(0), goy = useMotionValue(0);
  const vbX = -inset.left, vbY = -inset.top, vbW = MAP_SIZE + inset.left, vbH = MAP_SIZE + inset.top;
  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const update = () => {
      const w = el.clientWidth, h = el.clientHeight;
      const s = Math.min(w / vbW, h / vbH);
      gs.set(s); gox.set((w - vbW * s) / 2); goy.set((h - vbH * s) / 2);
    };
    update();
    const ro = new ResizeObserver(update); ro.observe(el);
    return () => ro.disconnect();
  }, [gs, gox, goy, vbW, vbH]);
  const transform = useTransform([tx, ty, tk, gs, gox, goy], ([x, y, k, s, ox, oy]: number[]) =>
    `translate(${ox + (x - vbX) * s}px, ${oy + (y - vbY) * s}px) scale(${k * s})`);
  useEffect(() => {
    const c = canvas.current; if (!c) return;
    let cancelled = false;
    const img = new Image();
    img.src = src;
    const draw = () => {
      if (cancelled) return;
      // The bitmap is pre-rasterised at build time (scripts/gen-raster.mjs), so this is one blit, not a vector paint.
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const ctx = c.getContext('2d'); if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      setReady(true);
    };
    (img.decode ? img.decode().then(draw) : new Promise<void>((r) => { img.onload = () => r(); }).then(draw)).catch(() => {});
    return () => { cancelled = true; };
  }, [src]);
  return (
    <div ref={wrap} className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <motion.div style={{ transform, transformOrigin: '0 0', position: 'absolute', left: 0, top: 0, width: 0, height: 0 }}>
        <canvas ref={canvas} style={{ position: 'absolute', left: DETAIL_BOX.x, top: DETAIL_BOX.y, width: DETAIL_BOX.size, height: DETAIL_BOX.size, opacity: ready ? 1 : 0, transition: `opacity ${play ? 900 : 300}ms var(--ease-out)` }} />
      </motion.div>
    </div>
  );
}

function HoverCard({ s, wrap }: { s: SiteStats; wrap: React.RefObject<HTMLDivElement | null> }) {
  const { t } = useT();
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const el = wrap.current?.querySelector(`[data-marker="${s.parcel.id}"] circle:nth-of-type(3)`) as SVGCircleElement | null;
    const box = wrap.current?.getBoundingClientRect();
    if (!el || !box) return;
    const r = el.getBoundingClientRect();
    setPos({ x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top });
  }, [s.parcel.id, wrap]);
  if (!pos) return null;
  const w = wrap.current?.clientWidth ?? 1000, h = wrap.current?.clientHeight ?? 1000;
  const right = pos.x > w * 0.6, below = pos.y < h * 0.3;
  return (
    <motion.div
      className="absolute pointer-events-none z-10 paper px-3 py-2.5 w-[230px]"
      style={{ left: pos.x + (right ? -14 : 14), top: pos.y + (below ? 14 : -14), transform: `translate(${right ? '-100%' : '0'}, ${below ? '0' : '-100%'})`, transformOrigin: `${right ? 'right' : 'left'} ${below ? 'top' : 'bottom'}` }}
      initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.11 } }} transition={{ duration: 0.16, ease: ease.out }}
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
