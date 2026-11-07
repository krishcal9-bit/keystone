/**
 * Illustration primitives. Every primitive draws in local coordinates with the ground line at y = 0
 * and grows upward (negative y). Light comes from the top-left: left/top faces are light, right faces are shaded.
 * Only colours from lib/illustrationPalette are used.
 */
import { palette as P, shade } from '@/lib/illustrationPalette';

export const T = 'ks-t'; // class: fill/opacity transition for theme crossfades (600ms)

export function ContactShadow({ w, h = 6, x = 0, y = 0, opacity = 1 }: { w: number; h?: number; x?: number; y?: number; opacity?: number }) {
  return <ellipse cx={x} cy={y + 1} rx={w / 2} ry={h / 2} fill={P.shadow} opacity={opacity} />;
}

/** Window with frame, mullions, sill; lit (brass) at night. */
export function Window({ x, y, w = 14, h = 18, night = false, lit = true, arch = false, mullions = true, sill = true, delay = 0 }: {
  x: number; y: number; w?: number; h?: number; night?: boolean; lit?: boolean; arch?: boolean; mullions?: boolean; sill?: boolean; delay?: number;
}) {
  const glow = night && lit;
  const fill = glow ? P.windowLit : P.window;
  const deep = glow ? P.windowLitDeep : P.windowDeep;
  const r = arch ? w / 2 : 1.2;
  const path = arch
    ? `M${x} ${y + h} V${y + r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h} Z`
    : undefined;
  return (
    <g style={{ transitionDelay: `${delay}ms` }}>
      {glow && <ellipse cx={x + w / 2} cy={y + h / 2} rx={w * 1.1} ry={h * 0.9} fill={P.windowLit} opacity={0.18} className={T} />}
      {path ? <path d={path} fill={P.wallDeep} /> : <rect x={x - 1.2} y={y - 1.2} width={w + 2.4} height={h + 2.4} rx={1.5} fill={P.wallDeep} opacity={0.9} />}
      {path
        ? <path d={`M${x + 1} ${y + h} V${y + r} A${r - 1} ${r - 1} 0 0 1 ${x + w - 1} ${y + r} V${y + h} Z`} fill={fill} className={T} />
        : <rect x={x} y={y} width={w} height={h} rx={r} fill={fill} className={T} />}
      {/* glass depth: upper-left light, lower-right deep */}
      <path d={`M${x + 1} ${y + h - 1} L${x + w - 1} ${y + h - 1} L${x + w - 1} ${y + 2} Z`} fill={deep} opacity={0.55} className={T} />
      {mullions && (
        <g stroke={glow ? P.wallShade : P.wall} strokeWidth={1.1} opacity={0.95}>
          <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} />
          <line x1={x} y1={y + h * 0.45} x2={x + w} y2={y + h * 0.45} />
        </g>
      )}
      {sill && <rect x={x - 2} y={y + h} width={w + 4} height={2.2} rx={0.6} fill={P.wallShade} />}
      {sill && <rect x={x - 2} y={y + h + 2.2} width={w + 4} height={1.2} fill={P.shadow} opacity={0.6} />}
    </g>
  );
}

/** Door with frame, knob, doormat and a porch light (lit at night). */
export function Door({ x, y, w = 14, h = 26, color = P.pine, night = false, porchLight = true, mat = true, arch = false }: {
  x: number; y: number; w?: number; h?: number; color?: string; night?: boolean; porchLight?: boolean; mat?: boolean; arch?: boolean;
}) {
  const r = arch ? w / 2 : 1.5;
  return (
    <g>
      {porchLight && (
        <g>
          {night && <circle cx={x + w / 2} cy={y - 9} r={14} fill={P.windowLit} opacity={0.22} className={T} />}
          <rect x={x + w / 2 - 1.5} y={y - 11} width={3} height={4} fill={P.roofDeep} />
          <circle cx={x + w / 2} cy={y - 6} r={2.4} fill={night ? P.honeyGlow : P.wallDeep} className={T} />
        </g>
      )}
      <rect x={x - 1.5} y={y - 1.5} width={w + 3} height={h + 1.5} rx={r + 1} fill={P.wallDeep} opacity={0.9} />
      {arch
        ? <path d={`M${x} ${y + h} V${y + r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h} Z`} fill={color} />
        : <rect x={x} y={y} width={w} height={h} rx={r} fill={color} />}
      <rect x={x + 2} y={y + 3} width={w - 4} height={h * 0.38} rx={1} fill={shade(color, 0.18)} opacity={0.8} />
      <rect x={x + 2} y={y + 3 + h * 0.46} width={w - 4} height={h * 0.42} rx={1} fill={shade(color, 0.18)} opacity={0.8} />
      <circle cx={x + w - 3.2} cy={y + h * 0.55} r={1.1} fill={P.brass} />
      {mat && <rect x={x - 1} y={y + h} width={w + 2} height={3} rx={0.8} fill={P.roofTerracotta} opacity={0.85} />}
    </g>
  );
}

export function Chimney({ x, y, w = 8, h = 16, color = P.wallClayShade }: { x: number; y: number; w?: number; h?: number; color?: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={color} />
      <rect x={x + w * 0.55} y={y} width={w * 0.45} height={h} fill={shade(color, 0.22)} />
      <rect x={x - 1} y={y - 2} width={w + 2} height={3} fill={shade(color, 0.3)} />
    </g>
  );
}

/** Low picket fence from x0 to x1 at ground y. */
export function Fence({ x0, x1, y = 0, h = 10, color = P.wall }: { x0: number; x1: number; y?: number; h?: number; color?: string }) {
  const pickets: number[] = [];
  for (let x = x0; x <= x1; x += 5) pickets.push(x);
  return (
    <g>
      <rect x={x0} y={y - h * 0.75} width={x1 - x0} height={1.4} fill={shade(color, 0.2)} />
      <rect x={x0} y={y - h * 0.35} width={x1 - x0} height={1.4} fill={shade(color, 0.2)} />
      {pickets.map((x) => (
        <path key={x} d={`M${x} ${y} V${y - h + 1.5} L${x + 1.5} ${y - h} L${x + 3} ${y - h + 1.5} V${y} Z`} fill={color} />
      ))}
      <rect x={x0} y={y} width={x1 - x0} height={1.2} fill={P.shadow} opacity={0.6} />
    </g>
  );
}

export function Mailbox({ x, y = 0, color = P.roof }: { x: number; y?: number; color?: string }) {
  return (
    <g>
      <rect x={x} y={y - 14} width={1.8} height={14} fill={P.trunk} />
      <rect x={x - 3.5} y={y - 20} width={9} height={6.5} rx={2.5} fill={color} />
      <rect x={x - 3.5} y={y - 20} width={9} height={2.4} rx={1.2} fill={shade(color, -0.25)} opacity={0.5} />
      <rect x={x + 4.6} y={y - 19} width={1} height={3} fill={P.brass} />
      <ContactShadow w={8} h={2.5} x={x + 1} y={y} />
    </g>
  );
}

export function Bush({ x, y = 0, r = 6, color = P.tree, light = P.treeLight }: { x: number; y?: number; r?: number; color?: string; light?: string }) {
  return (
    <g>
      <ContactShadow w={r * 2.2} h={r * 0.5} x={x} y={y} />
      <circle cx={x} cy={y - r * 0.8} r={r} fill={color} />
      <circle cx={x - r * 0.35} cy={y - r * 1.05} r={r * 0.6} fill={light} />
      <circle cx={x + r * 0.5} cy={y - r * 0.7} r={r * 0.55} fill={shade(color, 0.15)} />
    </g>
  );
}

export function Steps({ x, y = 0, w = 18, n = 2 }: { x: number; y?: number; w?: number; n?: number }) {
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => (
        <g key={i}>
          <rect x={x - i * 1.5} y={y - (n - i) * 3} width={w + i * 3} height={3} fill={P.stoneLight} />
          <rect x={x - i * 1.5} y={y - (n - i) * 3 + 2.2} width={w + i * 3} height={0.8} fill={P.stoneDeep} opacity={0.6} />
        </g>
      ))}
    </g>
  );
}

export function Sprinkler({ x, y = 0, active = false }: { x: number; y?: number; active?: boolean }) {
  return (
    <g>
      <rect x={x - 0.8} y={y - 4} width={1.6} height={4} fill={P.stoneDeep} />
      {active && (
        <g className="ks-sprinkler" style={{ transformOrigin: `${x}px ${y - 4}px` }}>
          <path d={`M${x} ${y - 4} q6 -10 14 -8`} stroke={P.ocean} strokeWidth={1} fill="none" opacity={0.7} />
          <path d={`M${x} ${y - 4} q4 -12 10 -12`} stroke={P.ocean} strokeWidth={1} fill="none" opacity={0.55} />
        </g>
      )}
    </g>
  );
}

/** A facade box with a shaded right side to suggest depth. depth is the visible side width. */
export function Facade({ x, y, w, h, color, depth = 10, skew = 0.6 }: { x: number; y: number; w: number; h: number; color: string; depth?: number; skew?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={color} />
      <path d={`M${x + w} ${y} L${x + w + depth} ${y - depth * skew} V${y + h - depth * skew} L${x + w} ${y + h} Z`} fill={shade(color, 0.22)} />
      {/* ambient occlusion along the ground */}
      <rect x={x} y={y + h - 3} width={w} height={3} fill={P.shadow} opacity={0.5} />
    </g>
  );
}

/** Pitched (gable) roof over a facade. */
export function GableRoof({ x, y, w, rise, depth = 10, skew = 0.6, color = P.roof, overhang = 5 }: { x: number; y: number; w: number; rise: number; depth?: number; skew?: number; color?: string; overhang?: number }) {
  const light = shade(color, -0.2);
  return (
    <g>
      {/* front gable (lit) */}
      <path d={`M${x - overhang} ${y} L${x + w / 2} ${y - rise} L${x + w + overhang} ${y} Z`} fill={light} />
      {/* right slope (shaded) */}
      <path d={`M${x + w / 2} ${y - rise} L${x + w / 2 + depth} ${y - rise - depth * skew} L${x + w + overhang + depth} ${y - depth * skew} L${x + w + overhang} ${y} Z`} fill={color} />
      {/* eave shadow on the wall */}
      <path d={`M${x} ${y} L${x + w / 2} ${y - rise + 4} L${x + w} ${y} L${x + w} ${y + 4} L${x} ${y + 4} Z`} fill={P.shadow} opacity={0.35} />
      {/* fascia */}
      <path d={`M${x - overhang} ${y} L${x + w / 2} ${y - rise} L${x + w + overhang} ${y}`} stroke={shade(color, 0.3)} strokeWidth={1.4} fill="none" strokeLinejoin="round" />
    </g>
  );
}

/** Hip/shed-style flat roof slab with a shaded side (for townhomes, ranch homes). */
export function FlatRoof({ x, y, w, depth = 10, skew = 0.6, color = P.roof, thickness = 4, overhang = 3 }: { x: number; y: number; w: number; depth?: number; skew?: number; color?: string; thickness?: number; overhang?: number }) {
  return (
    <g>
      <path d={`M${x - overhang} ${y} L${x - overhang + depth} ${y - depth * skew} L${x + w + overhang + depth} ${y - depth * skew} L${x + w + overhang} ${y} Z`} fill={shade(color, -0.25)} />
      <rect x={x - overhang} y={y} width={w + overhang * 2} height={thickness} fill={color} />
      <path d={`M${x + w + overhang} ${y} L${x + w + overhang + depth} ${y - depth * skew} V${y - depth * skew + thickness} L${x + w + overhang} ${y + thickness} Z`} fill={shade(color, 0.2)} />
      <rect x={x} y={y + thickness} width={w} height={3} fill={P.shadow} opacity={0.4} />
    </g>
  );
}
