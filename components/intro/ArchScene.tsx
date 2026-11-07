'use client';
/**
 * Intro 3D: a stone arch assembles on the blueprint (wedge stones fly in from both sides on curved paths,
 * rotate into place and settle with a dust puff), the brass keystone descends, rotates 90° and locks with a
 * glow pulse, then the camera pushes through the arch. Driven by one timeline (ms since start).
 */
import { useMemo, useRef } from 'react';
import '@/components/three/quiet';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { palette as P } from '@/lib/illustrationPalette';
import { easeOutCubic, easeInOut, clamp01 } from '@/components/three/geometry';

const N = 7, R_OUT = 2.2, R_IN = 1.35, DEPTH = 0.7;
const KEY = Math.floor(N / 2);

function stoneGeometry(i: number) {
  const a0 = Math.PI - (Math.PI / N) * i, a1 = Math.PI - (Math.PI / N) * (i + 1);
  const gap = 0.012;
  const shape = new THREE.Shape();
  const pts: [number, number][] = [];
  const steps = 6;
  for (let k = 0; k <= steps; k++) { const a = a0 - gap - ((a0 - a1 - 2 * gap) * k) / steps; pts.push([Math.cos(a) * R_OUT, Math.sin(a) * R_OUT]); }
  for (let k = steps; k >= 0; k--) { const a = a0 - gap - ((a0 - a1 - 2 * gap) * k) / steps; pts.push([Math.cos(a) * R_IN, Math.sin(a) * R_IN]); }
  shape.moveTo(pts[0][0], pts[0][1]);
  for (const [x, y] of pts.slice(1)) shape.lineTo(x, y);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 });
  geo.translate(0, 0, -DEPTH / 2);
  geo.computeVertexNormals();
  return geo;
}

export type ArchTimeline = { tRef: React.MutableRefObject<number>; fast: React.MutableRefObject<boolean> };

export function ArchScene({ tl, night, onReady }: { tl: ArchTimeline; night: boolean; onReady?: () => void }) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ fov: 30, near: 0.1, far: 100, position: [0, 1.2, 11] }} gl={{ antialias: true, alpha: true }} shadows={{ type: THREE.PCFShadowMap }} style={{ background: 'transparent' }} frameloop="always" onCreated={() => onReady?.()}>
      <Rig tl={tl} />
      <hemisphereLight args={[night ? '#2A3F5C' : P.sky, night ? '#13201A' : P.lawn, night ? 0.5 : 0.8]} />
      <directionalLight position={[-4, 7, 5]} intensity={night ? 1.1 : 2.1} color={night ? '#AFC6E6' : '#FFF4DF'} castShadow shadow-mapSize={[1024, 1024]} />
      <Beam tl={tl} />
      <Arch tl={tl} />
      <Dust tl={tl} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <shadowMaterial opacity={0.18} />
      </mesh>
    </Canvas>
  );
}

function Rig({ tl }: { tl: ArchTimeline }) {
  const camera = useThree((s) => s.camera);
  useFrame(() => {
    const t = tl.tRef.current;
    // orbit ~25° during the build (700–2700), push through 2700–3700
    const orbit = clamp01((t - 700) / 2000);
    const push = clamp01((t - 2700) / 1000);
    const ang = -0.22 + easeInOut(orbit) * 0.44;
    const r = 11 - easeInOut(push) * 14;
    camera.position.set(Math.sin(ang) * r, 1.2 + easeInOut(push) * 2.2, Math.cos(ang) * r);
    camera.lookAt(0, 1.4 + easeInOut(push) * 0.6, 0);
  });
  return null;
}

function Beam({ tl }: { tl: ArchTimeline }) {
  const ref = useRef<THREE.SpotLight>(null);
  useFrame(() => {
    const t = tl.tRef.current;
    const k = clamp01((t - 2050) / 250) * (1 - clamp01((t - 2900) / 500));
    if (ref.current) ref.current.intensity = 80 * k;
  });
  return <spotLight ref={ref} position={[0, 7, 1.5]} angle={0.28} penumbra={0.8} color={P.honeyGlow} intensity={0} target-position={[0, 2, 0]} />;
}

function Arch({ tl }: { tl: ArchTimeline }) {
  const geos = useMemo(() => Array.from({ length: N }, (_, i) => stoneGeometry(i)), []);
  const stoneMat = useMemo(() => Array.from({ length: N }, (_, i) => new THREE.MeshStandardMaterial({ color: new THREE.Color(P.pine).lerp(new THREE.Color(P.pineLight), (i % 3) * 0.18), roughness: 0.78, emissive: new THREE.Color(P.brass), emissiveIntensity: 0 })), []);
  const keyMat = useMemo(() => new THREE.MeshStandardMaterial({ color: P.brass, roughness: 0.4, metalness: 0.35, emissive: new THREE.Color(P.honeyGlow), emissiveIntensity: 0 }), []);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const pierGeo = useMemo(() => new THREE.BoxGeometry(0.85, 1.6, DEPTH), []);
  const order = useMemo(() => { const o: number[] = []; for (let k = 0; k < N; k++) { if (k === KEY) continue; o.push(k); } return o.sort((a, b) => Math.abs(a - KEY) - Math.abs(b - KEY)).reverse(); }, []);
  useFrame(() => {
    const t = tl.tRef.current;
    const fast = tl.fast.current;
    order.forEach((i, k) => {
      const m = refs.current[i]; if (!m) return;
      const start = fast ? 0 : 700 + k * 150;
      const p = clamp01((t - start) / (fast ? 1 : 520));
      const e = easeOutCubic(p);
      const fromLeft = i < KEY;
      const sx = fromLeft ? -9 : 9, sy = 3.5 + (i % 2) * 1.2;
      m.position.set(sx * (1 - e), sy * (1 - e) + Math.sin(p * Math.PI) * 1.6 + 1.6 * 0, 0);
      m.position.y += 1.6; // arch sits on piers
      m.rotation.set(0, 0, (fromLeft ? -1 : 1) * (1 - e) * 1.2);
      // settle: tiny overshoot down then back
      const settle = p >= 1 ? 0 : 0;
      m.position.y += settle;
      m.visible = p > 0 || fast;
      const glow = clamp01((t - 2500) / 150) * (1 - clamp01((t - 2650) / 450));
      (m.material as THREE.MeshStandardMaterial).emissiveIntensity = glow * 0.9;
    });
    const key = refs.current[KEY];
    if (key) {
      const p = clamp01((t - 2150) / (fast ? 1 : 420));
      const e = easeOutCubic(p);
      key.position.set(0, 1.6 + (1 - e) * 4.2, 0);
      key.rotation.set(0, (1 - e) * (Math.PI / 2), 0);
      key.visible = t > 2050 || fast;
      const lock = clamp01((t - 2570) / 120) * (1 - clamp01((t - 2700) / 500));
      keyMat.emissiveIntensity = 0.1 + lock * 1.6;
      // arch settles 2px (≈0.02 units) on lock
      const settle = clamp01((t - 2580) / 120) * (1 - clamp01((t - 2700) / 260)) * 0.03;
      key.position.y -= settle;
    }
  });
  return (
    <group>
      {geos.map((g, i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el; }} geometry={g} material={i === KEY ? keyMat : stoneMat[i]} castShadow receiveShadow visible={false} />
      ))}
      <mesh geometry={pierGeo} position={[-(R_OUT + R_IN) / 2, 0.8, 0]} castShadow receiveShadow><meshStandardMaterial color={P.pine} roughness={0.8} /></mesh>
      <mesh geometry={pierGeo} position={[(R_OUT + R_IN) / 2, 0.8, 0]} castShadow receiveShadow><meshStandardMaterial color={P.pineLight} roughness={0.8} /></mesh>
    </group>
  );
}

/** Dust puffs: 10 instanced particles per landing, fading over 400 ms. */
function Dust({ tl }: { tl: ArchTimeline }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.SphereGeometry(0.05, 6, 6), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#E8E3D6', transparent: true, opacity: 0.6 }), []);
  const obj = useMemo(() => new THREE.Object3D(), []);
  const landings = useMemo(() => {
    const out: { t: number; x: number; y: number }[] = [];
    for (let k = 0; k < N - 1; k++) { const i = k; const a = Math.PI - (Math.PI / N) * (i + 0.5); out.push({ t: 700 + k * 150 + 520, x: Math.cos(a) * (R_OUT + R_IN) / 2, y: Math.sin(a) * (R_OUT + R_IN) / 2 + 1.6 }); }
    out.push({ t: 2600, x: 0, y: R_OUT + 1.6 });
    return out;
  }, []);
  useFrame(() => {
    const t = tl.tRef.current;
    const m = ref.current; if (!m) return;
    let n = 0;
    landings.forEach((l, li) => {
      const p = (t - l.t) / 420;
      if (p <= 0 || p >= 1) return;
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2 + li;
        const r = 0.15 + p * 0.9;
        obj.position.set(l.x + Math.cos(a) * r, l.y + Math.sin(a) * r * 0.6 + p * 0.3, (k % 2 ? 0.3 : -0.3) * p);
        const s = (1 - p) * 1.2;
        obj.scale.set(s, s, s);
        obj.updateMatrix();
        m.setMatrixAt(n++, obj.matrix);
      }
    });
    m.count = n;
    m.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mat, 80]} frustumCulled={false} />;
}
