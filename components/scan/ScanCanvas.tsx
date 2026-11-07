'use client';
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent, type MouseEvent as RMouseEvent } from 'react';
import { motion } from 'motion/react';
import { spring, dur, ease } from '@/lib/motion';
import { useT } from '@/lib/i18n';
import type { Pt } from '@/lib/geometry';
import { polygonAreaM2, polygonCentroidSafe, m2ToAcres, type ScanCategory, type ScanPolygon } from '@/lib/scanMath';
import { palette as P } from '@/lib/illustrationPalette';
import { CATEGORY_ORDER, CATEGORY_STYLE, categoryIndex } from './categories';
import type { ScanImage } from './imageUtils';

/** Beam sweep: 800 ms, built from the motion tokens (long + scene) / 2. */
export const BEAM_MS = Math.round(((dur.long + dur.scene) / 2) * 1000);
/** Per-category stagger (120 ms) and trace length. */
export const TRACE_STAGGER = dur.micro;
export const TRACE_DUR = dur.long;
export const TRACE_TOTAL_MS = Math.round(((CATEGORY_ORDER.length - 1) * TRACE_STAGGER + TRACE_DUR + dur.short) * 1000);

export type ManualState = {
  active: boolean;
  category: ScanCategory;
  points: Pt[];
  onAddPoint: (p: Pt) => void;
  onFinish: () => void;
};

type Props = {
  image: ScanImage;
  polygons: ScanPolygon[];
  onChange: (polys: ScanPolygon[]) => void;
  scanning: boolean;
  /** Increments for each new result; replays the trace. */
  revealKey: number;
  showOverlay: boolean;
  /** Render number "flyers" at the first polygon of each category (shared layoutId with the results rows). */
  flying: boolean;
  run: number;
  metersAcross: number;
  manual: ManualState;
  locale: string;
};

const toPath = (pts: Pt[], w: number, h: number, close = true) =>
  pts.map((p, i) => `${i ? 'L' : 'M'}${(p.x * w).toFixed(1)} ${(p.y * h).toFixed(1)}`).join(' ') + (close ? ' Z' : '');

export function ScanCanvas({ image, polygons, onChange, scanning, revealKey, showOverlay, flying, run, metersAcross, manual, locale }: Props) {
  const { t } = useT();
  const wrap = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const drag = useRef<{ id: string; idx: number } | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const r = e.contentRect;
      setSize({ w: Math.round(r.width), h: Math.round(r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const toNorm = useCallback((clientX: number, clientY: number): Pt => {
    const r = wrap.current?.getBoundingClientRect();
    if (!r || !r.width || !r.height) return { x: 0, y: 0 };
    return { x: Math.min(1, Math.max(0, (clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (clientY - r.top) / r.height)) };
  }, []);

  const fmtArea = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }), [locale]);
  const fmtAcres = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 2, minimumFractionDigits: 2 }), [locale]);
  const fmtPct = useMemo(() => new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }), [locale]);

  const ordered = useMemo(() => [...polygons].sort((a, b) => categoryIndex(a.category) - categoryIndex(b.category)), [polygons]);
  const firstByCategory = useMemo(() => {
    const m = new Map<ScanCategory, ScanPolygon>();
    for (const p of ordered) if (!m.has(p.category)) m.set(p.category, p);
    return m;
  }, [ordered]);
  const areaByCategory = useMemo(() => {
    const m: Partial<Record<ScanCategory, number>> = {};
    for (const p of polygons) m[p.category] = (m[p.category] ?? 0) + polygonAreaM2(p.points, metersAcross, image.aspect);
    return m;
  }, [polygons, metersAcross, image.aspect]);

  // ---- vertex dragging ----
  const onHandleDown = (e: RPointerEvent<SVGCircleElement>, id: string, idx: number) => {
    if (manual.active) return;
    e.preventDefault(); e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id, idx };
  };
  const onHandleMove = (e: RPointerEvent<SVGCircleElement>) => {
    const d = drag.current;
    if (!d) return;
    const p = toNorm(e.clientX, e.clientY);
    onChange(polygons.map((poly) => poly.id === d.id ? { ...poly, points: poly.points.map((q, i) => (i === d.idx ? p : q)) } : poly));
  };
  const onHandleUp = (e: RPointerEvent<SVGCircleElement>) => {
    if (drag.current) { try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {} }
    drag.current = null;
  };

  // ---- manual tracing ----
  const onSvgClick = (e: RMouseEvent<SVGSVGElement>) => {
    if (!manual.active) return;
    const p = toNorm(e.clientX, e.clientY);
    const last = manual.points[manual.points.length - 1];
    if (last && Math.hypot(last.x - p.x, last.y - p.y) < 0.008) return; // second click of a double-click
    manual.onAddPoint(p);
  };
  const onSvgDouble = (e: RMouseEvent<SVGSVGElement>) => {
    if (!manual.active) return;
    e.preventDefault();
    manual.onFinish();
  };

  const treeCount = useMemo(() => polygons.filter((p) => p.category === 'trees').length, [polygons]);
  const { w, h } = size;
  const ready = w > 0 && h > 0;
  const manualStyle = CATEGORY_STYLE[manual.category];
  const interactive = showOverlay && !scanning && !manual.active;

  return (
    <div className="relative rounded-[14px] border border-line bg-surface p-2">
      <div
        ref={wrap}
        className={`relative w-full overflow-hidden rounded-[8px] bg-paper ${manual.active ? 'cursor-crosshair' : ''}`}
        style={{ aspectRatio: `${image.width} / ${image.height}` }}
      >
        <motion.img
          key={image.dataUrl.length + image.name}
          src={image.dataUrl}
          alt={t('scan.imageAlt')}
          draggable={false}
          className="block w-full h-full object-cover select-none"
          style={{ outline: '1px solid rgba(24,36,32,0.06)', outlineOffset: -1 }}
          initial={{ opacity: 0, y: -4, scale: 0.995 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={spring.settle}
        />

        {/* Scan beam: thin brass line with a soft trailing band, sweeping top to bottom until the response arrives. */}
        {scanning && ready && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
            <style>{`@keyframes ks-scan-beam { from { transform: translateY(0); } to { transform: translateY(${h + 72}px); } }`}</style>
            <div className="absolute inset-x-0" style={{ top: -72, height: 72, animation: `ks-scan-beam ${BEAM_MS}ms linear infinite`, willChange: 'transform' }}>
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent, color-mix(in srgb, var(--brass) 34%, transparent))' }} />
              <div className="absolute inset-x-0 bottom-0 h-[2px] bg-brass" style={{ boxShadow: '0 0 12px 2px color-mix(in srgb, var(--brass) 55%, transparent)' }} />
            </div>
          </div>
        )}

        {/* Polygon overlay in pixel space so strokes and handles stay crisp. */}
        {ready && (
          <svg
            viewBox={`0 0 ${w} ${h}`}
            width={w}
            height={h}
            className="absolute inset-0"
            style={{ pointerEvents: manual.active || interactive ? 'auto' : 'none' }}
            onClick={onSvgClick}
            onDoubleClick={onSvgDouble}
            aria-hidden
          >
            {showOverlay && ordered.map((poly) => {
              const st = CATEGORY_STYLE[poly.category];
              const d = toPath(poly.points, w, h);
              const delay = categoryIndex(poly.category) * TRACE_STAGGER;
              return (
                <g key={`${revealKey}-${poly.id}`} data-polygon={poly.category}>
                  <motion.path d={d} fill={st.fill} initial={{ opacity: 0 }} animate={{ opacity: st.fillOpacity }} transition={{ duration: dur.medium, ease: ease.out, delay: delay + TRACE_DUR * 0.55 }} style={{ pointerEvents: 'none' }} />
                  <motion.path d={d} fill="none" stroke={P.wall} strokeWidth={4} strokeOpacity={0.7} strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: TRACE_DUR, ease: ease.out, delay }} style={{ pointerEvents: 'none' }} />
                  <motion.path d={d} fill="none" stroke={st.stroke} strokeWidth={2} strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: TRACE_DUR, ease: ease.out, delay }} style={{ pointerEvents: 'none' }} />
                </g>
              );
            })}

            {/* draggable vertices: 44 px hit area, 10 px visible dot */}
            {interactive && ordered.map((poly) => poly.points.map((p, i) => (
              <g key={`${poly.id}-${i}`}>
                <circle
                  cx={p.x * w} cy={p.y * h} r={22} fill="transparent" data-vertex={poly.category}
                  style={{ cursor: 'grab', touchAction: 'none' }}
                  onPointerDown={(e) => onHandleDown(e, poly.id, i)}
                  onPointerMove={onHandleMove}
                  onPointerUp={onHandleUp}
                  onPointerCancel={onHandleUp}
                />
                <circle cx={p.x * w} cy={p.y * h} r={5} fill="var(--surface)" stroke={CATEGORY_STYLE[poly.category].stroke} strokeWidth={2} style={{ pointerEvents: 'none' }} />
              </g>
            )))}

            {/* in-progress manual shape */}
            {manual.active && manual.points.length > 0 && (
              <g style={{ pointerEvents: 'none' }}>
                {manual.points.length > 2 && <path d={toPath(manual.points, w, h)} fill={manualStyle.fill} fillOpacity={manualStyle.fillOpacity * 0.6} />}
                <path d={toPath(manual.points, w, h, false)} fill="none" stroke={P.wall} strokeWidth={4} strokeOpacity={0.7} strokeLinejoin="round" />
                <path d={toPath(manual.points, w, h, false)} fill="none" stroke={P.brass} strokeWidth={2} strokeDasharray="6 4" strokeLinejoin="round" />
                {manual.points.map((p, i) => <circle key={i} cx={p.x * w} cy={p.y * h} r={i === 0 ? 6 : 4} fill={i === 0 ? P.brass : 'var(--surface)'} stroke={P.brass} strokeWidth={2} />)}
              </g>
            )}
          </svg>
        )}

        {/* Label chips on solid backing at each centroid. */}
        {ready && showOverlay && ordered.map((poly) => {
          // Narrow canvases get one chip per category, and trees always share one chip, so labels never pile up over the art.
          const dense = w < 560;
          const aggregate = poly.category === 'trees';
          if ((dense || aggregate) && firstByCategory.get(poly.category) !== poly) return null;
          const c = polygonCentroidSafe(poly.points);
          const st = CATEGORY_STYLE[poly.category];
          const m2 = aggregate ? (areaByCategory.trees ?? 0) : polygonAreaM2(poly.points, metersAcross, image.aspect);
          const xs = poly.points.map((p) => p.x * w);
          const compact = dense || (!aggregate && Math.max(...xs) - Math.min(...xs) < 150);
          const delay = categoryIndex(poly.category) * TRACE_STAGGER + TRACE_DUR * 0.7;
          return (
            <motion.div
              key={`${revealKey}-chip-${poly.id}`}
              className="absolute pointer-events-none"
              style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%`, transform: 'translate(-50%, -50%)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: dur.short, ease: ease.out, delay }}
            >
              <div className="inline-flex items-center gap-1.5 rounded-[8px] border border-line bg-surface px-2 py-1 text-[13px] leading-[18px] whitespace-nowrap tabular-nums text-ink">
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: st.fill }} aria-hidden />
                {!compact && <span className="font-medium">{t(st.key)}{aggregate && treeCount > 1 ? ` ×${treeCount}` : ''}</span>}
                <span>{fmtArea.format(m2)} m²</span>
                {!compact && <span className="text-ink-2">{fmtAcres.format(m2ToAcres(m2))} ac</span>}
                {!compact && <span className="text-ink-2">{fmtPct.format(poly.confidence)}</span>}
              </div>
            </motion.div>
          );
        })}

        {/* Flyers: the numbers that travel from the image to the results panel on the first reveal. */}
        {ready && flying && CATEGORY_ORDER.filter((c) => c !== 'access').map((cat) => {
          const poly = firstByCategory.get(cat);
          if (!poly) return null;
          const c = polygonCentroidSafe(poly.points);
          return (
            <motion.span
              key={`fly-${run}-${cat}`}
              layoutId={`scan-num-${run}-${cat}`}
              className="absolute pointer-events-none inline-block rounded-[8px] bg-surface px-1 text-[15px] font-medium tabular-nums"
              style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%`, translate: '-50% -50%' }}
            >
              {fmtArea.format(areaByCategory[cat] ?? 0)}
            </motion.span>
          );
        })}
      </div>
      <p className="px-2 pt-2 text-[13px] leading-[18px] text-ink-2 min-h-[26px]">
        {scanning ? t('scan.scanningHelp') : manual.active ? t('scan.traceHelp') : showOverlay && polygons.length ? t('scan.dragHelp') : t('scan.readyHelp')}
      </p>
    </div>
  );
}
