import type { Rect } from './geometry';

const scaleRect = (r: Rect, s: number): Rect => ({ x: r.x * s, y: r.y * s, w: r.w * s, h: r.h * s });

/**
 * Painted stalls for a parking rectangle (normalized frame) scaled by `s`.
 * Double-loaded bays run along the longer axis. Returns at most `maxStalls`.
 */
export function stallsFor(r: Rect, s: number, maxStalls = Infinity): Rect[] {
  const horizontal = r.w >= r.h;
  const stallW = 0.028, stallD = 0.055, aisle = 0.07;
  const out: Rect[] = [];
  if (horizontal) {
    const bayH = stallD * 2 + aisle;
    const bays = Math.max(1, Math.floor(r.h / bayH));
    const perRow = Math.floor((r.w - 0.02) / stallW);
    for (let b = 0; b < bays; b++) for (let side = 0; side < 2; side++) {
      const y = r.y + 0.01 + b * bayH + (side ? stallD + aisle : 0);
      for (let i = 0; i < perRow; i++) {
        if (out.length >= maxStalls) return out.map((q) => scaleRect(q, s));
        out.push({ x: r.x + 0.01 + i * stallW, y, w: stallW, h: stallD });
      }
    }
  } else {
    const bayW = stallD * 2 + aisle;
    const bays = Math.max(1, Math.floor(r.w / bayW));
    const perCol = Math.floor((r.h - 0.02) / stallW);
    for (let b = 0; b < bays; b++) for (let side = 0; side < 2; side++) {
      const x = r.x + 0.01 + b * bayW + (side ? stallD + aisle : 0);
      for (let i = 0; i < perCol; i++) {
        if (out.length >= maxStalls) return out.map((q) => scaleRect(q, s));
        out.push({ x, y: r.y + 0.01 + i * stallW, w: stallD, h: stallW });
      }
    }
  }
  return out.map((q) => scaleRect(q, s));
}

export const unionRect = (rs: Rect[]): Rect | null => {
  if (!rs.length) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const r of rs) { x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h); }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
};
