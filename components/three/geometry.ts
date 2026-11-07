import * as THREE from 'three';
import type { Pt } from '@/lib/geometry';

/** Gable (pitched) roof prism: width w along x, depth d along z, ridge along z at height `rise`, with eaves overhang. */
export function gableGeometry(w: number, d: number, rise: number, overhang = 0.5, thickness = 0.3): THREE.BufferGeometry {
  const hw = w / 2 + overhang, hd = d / 2 + overhang;
  // triangle cross-section (x, y): (-hw, 0), (hw, 0), (0, rise)
  const shape = new THREE.Shape();
  shape.moveTo(-hw, -thickness);
  shape.lineTo(hw, -thickness);
  shape.lineTo(hw, 0);
  shape.lineTo(0, rise);
  shape.lineTo(-hw, 0);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: hd * 2, bevelEnabled: false });
  geo.translate(0, 0, -hd);
  geo.computeVertexNormals();
  return geo;
}

/** Extruded polygon (metres, plan x/y → world x/z) with the given height. */
export function polygonPrism(points: Pt[], height: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  points.forEach((p, i) => (i ? shape.lineTo(p.x, -p.y) : shape.moveTo(p.x, -p.y)));
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

/** Soft terrain: a plane with gentle noise far from the centre, flat near the lot. */
export function terrainGeometry(size: number, segments = 48, flatRadius = 60): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(size, size, segments, segments);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    const r = Math.hypot(x, y);
    const f = Math.max(0, (r - flatRadius) / (size / 2 - flatRadius));
    const n = Math.sin(x * 0.045) * Math.cos(y * 0.038) * 2.4 + Math.sin(x * 0.11 + y * 0.07) * 0.8;
    pos.setZ(i, n * f * f);
  }
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

export const easeOutBack = (t: number, s = 0.55) => { const x = t - 1; return x * x * ((s + 1) * x + s) + 1; };
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
