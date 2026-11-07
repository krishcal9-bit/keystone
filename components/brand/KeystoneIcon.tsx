'use client';
import { motion } from 'motion/react';

/**
 * Stone arch icon. Seven voussoirs; the top-center keystone is brass with a key-shaped notch.
 * In dark mode the keystone glows softly (CSS filter on the group).
 */
export function KeystoneIcon({ size = 28, className = '', glow = false, title = 'Keystone' }: { size?: number; className?: string; glow?: boolean; title?: string }) {
  // Arch geometry: centre (32, 40), outer radius 28, inner radius 16; 7 stones over 180°
  const cx = 32, cy = 40, R = 28, r = 16, n = 7;
  const stones: { d: string; i: number }[] = [];
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI - (Math.PI / n) * i;
    const a1 = Math.PI - (Math.PI / n) * (i + 1);
    const gap = 0.012;
    const p = (a: number, rad: number) => [cx + Math.cos(a) * rad, cy - Math.sin(a) * rad] as const;
    const [x0, y0] = p(a0 - gap, R); const [x1, y1] = p(a1 + gap, R);
    const [x2, y2] = p(a1 + gap, r); const [x3, y3] = p(a0 - gap, r);
    stones.push({ i, d: `M${x0.toFixed(2)} ${y0.toFixed(2)} A${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} L${x2.toFixed(2)} ${y2.toFixed(2)} A${r} ${r} 0 0 0 ${x3.toFixed(2)} ${y3.toFixed(2)} Z` });
  }
  const key = Math.floor(n / 2);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} role="img" aria-label={title}>
      <defs>
        <linearGradient id="ks-stone" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--pine)" />
          <stop offset="1" stopColor="var(--pine-deep)" />
        </linearGradient>
        <linearGradient id="ks-brass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E3B866" />
          <stop offset="1" stopColor="var(--brass)" />
        </linearGradient>
      </defs>
      {/* piers */}
      <rect x="4" y="40" width="12" height="20" rx="1.5" fill="url(#ks-stone)" />
      <rect x="48" y="40" width="12" height="20" rx="1.5" fill="url(#ks-stone)" />
      <rect x="4" y="50" width="12" height="1.2" fill="rgba(0,0,0,0.18)" />
      <rect x="48" y="50" width="12" height="1.2" fill="rgba(0,0,0,0.18)" />
      {stones.map((s) => s.i !== key && (
        <path key={s.i} d={s.d} fill="url(#ks-stone)" opacity={1 - Math.abs(s.i - key) * 0.06} />
      ))}
      <motion.g
        style={{ filter: glow ? 'drop-shadow(0 0 6px rgba(217,166,74,0.55))' : undefined }}
        className={glow ? '' : 'ks-keystone'}
      >
        <path d={stones[key].d} fill="url(#ks-brass)" />
        {/* key-shaped notch */}
        <circle cx="32" cy="17.5" r="1.9" fill="rgba(24,36,32,0.75)" />
        <rect x="31.25" y="18.8" width="1.5" height="4.2" rx="0.4" fill="rgba(24,36,32,0.75)" />
        <rect x="32.75" y="21.6" width="1.2" height="0.9" fill="rgba(24,36,32,0.75)" />
      </motion.g>
    </svg>
  );
}
