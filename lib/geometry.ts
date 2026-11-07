export type Pt = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };

export const polygonArea = (pts: Pt[]): number => {
  let a = 0;
  for (let i = 0, n = pts.length; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    a += p.x * q.y - q.x * p.y;
  }
  return Math.abs(a) / 2;
};

export const polygonCentroid = (pts: Pt[]): Pt => {
  if (pts.length === 0) return { x: 0, y: 0 };
  let cx = 0, cy = 0, a = 0;
  for (let i = 0, n = pts.length; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    const f = p.x * q.y - q.x * p.y;
    a += f; cx += (p.x + q.x) * f; cy += (p.y + q.y) * f;
  }
  if (Math.abs(a) < 1e-12) {
    const s = pts.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    return { x: s.x / pts.length, y: s.y / pts.length };
  }
  a *= 0.5;
  return { x: cx / (6 * a), y: cy / (6 * a) };
};

export const bbox = (pts: Pt[]): Rect => {
  if (pts.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of pts) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
};

/** Ray-casting point in polygon; points on the boundary count as inside. */
export const pointInPolygon = (p: Pt, poly: Pt[], eps = 1e-9): boolean => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    // boundary check
    const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
    if (Math.abs(cross) < eps && p.x >= Math.min(a.x, b.x) - eps && p.x <= Math.max(a.x, b.x) + eps && p.y >= Math.min(a.y, b.y) - eps && p.y <= Math.max(a.y, b.y) + eps) return true;
    const intersect = (a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x;
    if (intersect) inside = !inside;
  }
  return inside;
};

export const rectCorners = (r: Rect): Pt[] => [
  { x: r.x, y: r.y }, { x: r.x + r.w, y: r.y }, { x: r.x + r.w, y: r.y + r.h }, { x: r.x, y: r.y + r.h },
];

const segmentsIntersect = (p1: Pt, p2: Pt, p3: Pt, p4: Pt): boolean => {
  const d = (a: Pt, b: Pt, c: Pt) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const d1 = d(p3, p4, p1), d2 = d(p3, p4, p2), d3 = d(p1, p2, p3), d4 = d(p1, p2, p4);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
};

/** True when every corner is inside and no polygon edge crosses the rectangle (handles concave lots). */
export const rectInPolygon = (r: Rect, poly: Pt[]): boolean => {
  const corners = rectCorners(r);
  if (!corners.every((c) => pointInPolygon(c, poly))) return false;
  for (let i = 0; i < 4; i++) {
    const a = corners[i], b = corners[(i + 1) % 4];
    for (let j = 0; j < poly.length; j++) {
      if (segmentsIntersect(a, b, poly[j], poly[(j + 1) % poly.length])) return false;
    }
  }
  return true;
};

export const rectsOverlap = (a: Rect, b: Rect, eps = 1e-6): boolean =>
  a.x < b.x + b.w - eps && a.x + a.w > b.x + eps && a.y < b.y + b.h - eps && a.y + a.h > b.y + eps;

export const rectArea = (r: Rect) => r.w * r.h;

export const insetRect = (r: Rect, d: number): Rect => ({ x: r.x + d, y: r.y + d, w: Math.max(0, r.w - 2 * d), h: Math.max(0, r.h - 2 * d) });

/** Approximate polygon inset by moving each vertex toward the centroid by `d` along its normal-ish direction. */
export const insetPolygon = (pts: Pt[], d: number): Pt[] => {
  if (pts.length < 3 || d <= 0) return pts;
  const n = pts.length;
  const area = polygonArea(pts);
  // signed area to know orientation
  let signed = 0;
  for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; signed += p.x * q.y - q.x * p.y; }
  const ccw = signed > 0;
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n], cur = pts[i], next = pts[(i + 1) % n];
    const e1 = norm({ x: cur.x - prev.x, y: cur.y - prev.y });
    const e2 = norm({ x: next.x - cur.x, y: next.y - cur.y });
    // inward normals
    const n1 = ccw ? { x: -e1.y, y: e1.x } : { x: e1.y, y: -e1.x };
    const n2 = ccw ? { x: -e2.y, y: e2.x } : { x: e2.y, y: -e2.x };
    const bis = norm({ x: n1.x + n2.x, y: n1.y + n2.y });
    const cos = Math.max(0.3, (n1.x * bis.x + n1.y * bis.y));
    out.push({ x: cur.x + (bis.x * d) / cos, y: cur.y + (bis.y * d) / cos });
  }
  return polygonArea(out) < area ? out : pts;
};

const norm = (v: Pt): Pt => { const l = Math.hypot(v.x, v.y) || 1; return { x: v.x / l, y: v.y / l }; };

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const safeNum = (v: number, fallback = 0) => (Number.isFinite(v) ? v : fallback);
