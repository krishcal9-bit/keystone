/**
 * The only colours used inside illustrations and 3D scenes. Every object gets a light face,
 * a shadow face and ambient occlusion where it meets the ground. Light comes from the top-left.
 */
export const palette = {
  wall: '#F2EEE6',
  wallShade: '#D9D3C7',
  wallDeep: '#BFB7A8',
  wallWarm: '#EADFCB',
  wallWarmShade: '#CFC2A9',
  wallSage: '#D7DFD2',
  wallSageShade: '#B6C2AF',
  wallClay: '#E3CDB9',
  wallClayShade: '#C7AC94',
  roof: '#3C4A52',
  roofLight: '#56666F',
  roofDeep: '#2B363D',
  roofTerracotta: '#A8694A',
  roofTerracottaLight: '#C08A6B',
  sky: '#DCE8EE',
  skyLow: '#F6F7F5',
  skyDusk: '#F0D9C4',
  skyDuskHigh: '#C9D7E3',
  honey: '#E3B866',
  honeyGlow: '#F4D48E',
  lawn: '#A9C3A0',
  lawnShade: '#8FAB86',
  lawnDeep: '#769470',
  tree: '#2E5E45',
  treeLight: '#3F7A5A',
  treeDeep: '#224734',
  jacaranda: '#9A8CC8',
  jacarandaLight: '#B4A7DA',
  jacarandaDeep: '#7B6DAB',
  trunk: '#6B5341',
  trunkLight: '#86684F',
  asphalt: '#4A4F52',
  asphaltLight: '#5B6164',
  asphaltDeep: '#3B3F42',
  paint: '#F2EEE6',
  curb: '#C9CBC6',
  sidewalk: '#D8D9D3',
  sidewalkShade: '#C3C5BF',
  stone: '#8FA39A',
  stoneLight: '#A6B7AF',
  stoneDeep: '#71857C',
  pine: '#1E5C47',
  pineLight: '#2D7A5F',
  brass: '#B8862B',
  brassLight: '#D6A84C',
  shadow: 'rgba(24,36,32,0.18)',
  shadowSoft: 'rgba(24,36,32,0.10)',
  ocean: '#BFD7E2',
  oceanDeep: '#9FBFD0',
  dirt: '#C9B59A',
  dirtShade: '#B09C80',
  window: '#BCD0DC',
  windowDeep: '#8FA9B8',
  windowLit: '#F4D48E',
  windowLitDeep: '#E3B866',
  // Night
  nightSkyHigh: '#0E1A2B',
  nightSkyLow: '#223650',
  nightHorizon: '#3B4C66',
  moon: '#F1EEDD',
  star: '#E8EDEA',
  lampCone: 'rgba(244,212,142,0.28)',
  // People
  skin: ['#F3D3B8', '#E3B897', '#C98E66', '#A66B45', '#7A4A2E', '#5B3522'],
  hair: ['#2A1E16', '#4A3425', '#8A6240', '#C9A26D', '#555B63', '#E8E3D6'],
  shirt: ['#1E5C47', '#B8862B', '#5A7FA6', '#B3362B', '#8A6FA8', '#E3B866', '#4A5753', '#D98B6B'],
  pants: ['#3C4A52', '#4A5753', '#6B5341', '#2B2F3A', '#8A7F6B'],
} as const;

/** Darkens a hex colour by a factor (0–1). */
export function shade(hex: string, factor: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * (1 - factor));
  const g = Math.round(((n >> 8) & 255) * (1 - factor));
  const b = Math.round((n & 255) * (1 - factor));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/** Mixes two hex colours. t = 0 → a, t = 1 → b. */
export function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `#${((1 << 24) + (ch(16) << 16) + (ch(8) << 8) + ch(0)).toString(16).slice(1)}`;
}

/** Seeded PRNG for deterministic variation in scenes. */
export function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

export const nightLerp = (dark: boolean) => (dark ? 1 : 0);
