'use client';
/**
 * Lot Scan surface: a sheet of survey paper on a light table. Faint 24 px grid (1 px ink at 6 %),
 * a ruler edge along the top and left (ticks every 8 px, numbers every 80 px), corner survey marks and
 * a soft warm vignette. Night: a backlit table (slightly luminous paper with a cool rim). Static, in
 * screen pixels (no viewBox), so the grid never scales with the container. Fills its parent.
 */
import { palette as P } from '@/lib/illustrationPalette';

const CELL = 24;
const TICK = 8;
const NUMBER_EVERY = 80;
const RULER = 22;
const NUMBERS = Array.from({ length: 24 }, (_, i) => i); // enough for ~1900 px; overflow is clipped

export function LightTable({ night = false, className = '' }: { night?: boolean; className?: string }) {
  const ink = night ? P.star : P.roofDeep;
  const sheet = night ? '#1C2622' : '#FBFAF6';
  const rulerBg = night ? '#212C27' : P.wall;
  const vignette = night
    ? 'radial-gradient(ellipse at 50% 45%, rgba(244,212,142,0.10), transparent 60%), radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(14,26,43,0.45) 100%)'
    : 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.6), transparent 55%), radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(201,181,154,0.28) 100%)';
  return (
    <div
      className={`absolute inset-0 overflow-hidden rounded-[14px] pointer-events-none select-none ${className}`}
      style={{
        background: sheet,
        boxShadow: night ? 'inset 0 0 0 1px rgba(159,191,208,0.22), inset 0 0 40px rgba(159,191,208,0.08)' : 'inset 0 0 0 1px rgba(24,36,32,0.08)',
      }}
      aria-hidden
      data-light-table
    >
      <svg width="100%" height="100%" style={{ display: 'block', position: 'absolute', inset: 0 }}>
        <defs>
          <pattern id="lt-grid" width={CELL} height={CELL} patternUnits="userSpaceOnUse">
            <path d={`M${CELL} 0 V${CELL} M0 ${CELL} H${CELL}`} stroke={ink} strokeWidth={1} opacity={night ? 0.09 : 0.06} fill="none" />
          </pattern>
          <pattern id="lt-ticks-x" width={NUMBER_EVERY} height={RULER} patternUnits="userSpaceOnUse">
            {Array.from({ length: NUMBER_EVERY / TICK }, (_, i) => (
              <rect key={i} x={i * TICK} y={RULER - (i === 0 ? 12 : i % 5 === 0 ? 8 : 5)} width={1} height={i === 0 ? 12 : i % 5 === 0 ? 8 : 5} fill={ink} opacity={0.55} />
            ))}
          </pattern>
          <pattern id="lt-ticks-y" width={RULER} height={NUMBER_EVERY} patternUnits="userSpaceOnUse">
            {Array.from({ length: NUMBER_EVERY / TICK }, (_, i) => (
              <rect key={i} x={RULER - (i === 0 ? 12 : i % 5 === 0 ? 8 : 5)} y={i * TICK} width={i === 0 ? 12 : i % 5 === 0 ? 8 : 5} height={1} fill={ink} opacity={0.55} />
            ))}
          </pattern>
        </defs>
        {/* grid under everything */}
        <rect x={RULER} y={RULER} width="100%" height="100%" fill="url(#lt-grid)" />
        {/* rulers */}
        <rect x={0} y={0} width="100%" height={RULER} fill={rulerBg} />
        <rect x={0} y={0} width={RULER} height="100%" fill={rulerBg} />
        <rect x={RULER} y={0} width="100%" height={RULER} fill="url(#lt-ticks-x)" />
        <rect x={0} y={RULER} width={RULER} height="100%" fill="url(#lt-ticks-y)" />
        <rect x={0} y={RULER - 0.5} width="100%" height={1} fill={ink} opacity={0.35} />
        <rect x={RULER - 0.5} y={0} width={1} height="100%" fill={ink} opacity={0.35} />
        <g fill={ink} opacity={0.6} fontFamily="var(--font-sans), 'Public Sans', sans-serif" fontSize={10} style={{ fontVariantNumeric: 'tabular-nums' }}>
          {NUMBERS.map((n) => (
            <text key={`x${n}`} x={RULER + n * NUMBER_EVERY + 3} y={9}>{n * NUMBER_EVERY}</text>
          ))}
          {NUMBERS.map((n) => (
            <text key={`y${n}`} x={3} y={RULER + n * NUMBER_EVERY + 11} transform={`rotate(-90 ${3} ${RULER + n * NUMBER_EVERY + 11})`} textAnchor="end" dx={-2}>{n * NUMBER_EVERY}</text>
          ))}
        </g>
        {/* corner survey marks (bottom-right and bottom-left, inside the sheet) */}
        <g stroke={ink} strokeWidth={1} opacity={0.5} fill="none">
          <path d={`M${RULER + 10} ${RULER + 10} h14 M${RULER + 17} ${RULER + 3} v14`} />
          <circle cx={RULER + 17} cy={RULER + 10} r={4} />
        </g>
      </svg>
      <svg width={30} height={30} className="absolute right-0 bottom-0" style={{ display: 'block' }}>
        <g stroke={ink} strokeWidth={1} opacity={0.5} fill="none">
          <path d="M6 13 h14 M13 6 v14" />
          <circle cx={13} cy={13} r={4} />
        </g>
      </svg>
      {/* warm vignette (light) or backlit glow + cool rim (night) */}
      <div className="absolute inset-0" style={{ background: vignette }} />
    </div>
  );
}
