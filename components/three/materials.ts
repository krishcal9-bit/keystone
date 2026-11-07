import * as THREE from 'three';
import { palette as P } from '@/lib/illustrationPalette';

const mk = (color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.86, metalness: 0, ...opts });

/** Shared matte materials with slight roughness variation (module singletons). */
export const M = {
  lawn: mk(P.lawn, { roughness: 0.95 }),
  lawnLight: mk('#B7CDAD', { roughness: 0.95 }),
  lot: mk('#BFD3B4', { roughness: 0.95 }),
  asphalt: mk(P.asphalt, { roughness: 0.9 }),
  asphaltLight: mk(P.asphaltLight, { roughness: 0.9 }),
  paint: mk(P.paint, { roughness: 0.8 }),
  sidewalk: mk(P.sidewalk, { roughness: 0.9 }),
  curb: mk(P.curb, { roughness: 0.85 }),
  wall: mk(P.wall, { roughness: 0.88 }),
  wallWarm: mk(P.wallWarm, { roughness: 0.88 }),
  wallSage: mk(P.wallSage, { roughness: 0.88 }),
  wallClay: mk(P.wallClay, { roughness: 0.88 }),
  wallShade: mk(P.wallShade, { roughness: 0.88 }),
  roof: mk(P.roof, { roughness: 0.8 }),
  roofLight: mk(P.roofLight, { roughness: 0.8 }),
  roofTerracotta: mk(P.roofTerracotta, { roughness: 0.82 }),
  roofDeep: mk(P.roofDeep, { roughness: 0.8 }),
  foundation: mk(P.stoneLight, { roughness: 0.95 }),
  stone: mk(P.stone, { roughness: 0.9 }),
  trunk: mk(P.trunk, { roughness: 0.95 }),
  tree: mk(P.tree, { roughness: 0.92 }),
  treeLight: mk(P.treeLight, { roughness: 0.92 }),
  treeDeep: mk(P.treeDeep, { roughness: 0.92 }),
  jacaranda: mk(P.jacaranda, { roughness: 0.92 }),
  jacarandaLight: mk(P.jacarandaLight, { roughness: 0.92 }),
  palm: mk(P.treeLight, { roughness: 0.9, side: THREE.DoubleSide }),
  pine: mk(P.pine, { roughness: 0.6 }),
  brass: mk(P.brass, { roughness: 0.45, metalness: 0.35 }),
  dirt: mk(P.dirt, { roughness: 0.95 }),
  dirtShade: mk(P.dirtShade, { roughness: 0.95 }),
  door: mk(P.pine, { roughness: 0.7 }),
  window: new THREE.MeshStandardMaterial({ color: P.window, roughness: 0.3, metalness: 0.1, emissive: new THREE.Color(P.windowLit), emissiveIntensity: 0 }),
  lampHead: new THREE.MeshStandardMaterial({ color: P.brass, roughness: 0.5, emissive: new THREE.Color(P.honeyGlow), emissiveIntensity: 0 }),
  survey: new THREE.LineBasicMaterial({ color: P.pine }),
};

export const WALL_SET = [M.wall, M.wallWarm, M.wallSage, M.wallClay];
export const ROOF_SET = [M.roof, M.roofTerracotta, M.roofLight, M.roofDeep];
