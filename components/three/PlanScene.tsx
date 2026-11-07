'use client';
/**
 * Plan Studio 3D scene (React Three Fiber). Low-poly primitives, matte materials, hemisphere sky +
 * warm directional sun with soft shadows, emissive windows, narrow-FOV camera. frameloop="demand":
 * components invalidate while they animate. Night = moonlight + warm window light + lamp cones.
 */
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { PlanModel } from '@/lib/planModel';
import { hashUnit } from '@/lib/planModel';
import { insetPolygon, type Rect, type Pt, rectsOverlap, pointInPolygon } from '@/lib/geometry';
import { palette as P } from '@/lib/illustrationPalette';
import { M, WALL_SET, ROOF_SET } from './materials';
import { gableGeometry, polygonPrism, terrainGeometry, easeOutCubic, clamp01, easeInOut } from './geometry';

export type PlanView = 'aerial' | 'street' | 'threeQuarter';
export type PlanSceneProps = {
  model: PlanModel;
  showPlan: boolean;
  sunHour: number; // 6–20
  night: boolean;
  view: PlanView;
  buildKey: number;
  onBuildEnd?: () => void;
  interactive?: boolean;
  cursorLight?: boolean;
  autoSunSweep?: boolean;
  speed?: number;
  zoom?: number;
  onCanvas?: (el: HTMLCanvasElement) => void;
  className?: string;
};

const UP = new THREE.Object3D();

// R3F 9 still constructs a THREE.Clock internally; three r187 logs a deprecation on construction.
// Keep the console clean without touching R3F: drop that one message only.
if (typeof window !== 'undefined' && !(window as unknown as { __ksWarnPatched?: boolean }).__ksWarnPatched) {
  (window as unknown as { __ksWarnPatched?: boolean }).__ksWarnPatched = true;
  const orig = console.warn.bind(console);
  console.warn = (...args: unknown[]) => { if (typeof args[0] === 'string' && args[0].startsWith('THREE.Clock: This module has been deprecated')) return; orig(...args); };
}
const tmpColor = new THREE.Color();

export function PlanScene(props: PlanSceneProps) {
  const { model, interactive = true, className = '' } = props;
  const R = Math.max(model.bounds.w, model.bounds.h);
  const [pointer, setPointer] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  return (
    <div
      className={`absolute inset-0 ${className}`}
      onPointerMove={props.cursorLight ? (e) => { const r = e.currentTarget.getBoundingClientRect(); setPointer({ x: ((e.clientX - r.left) / r.width) * 2 - 1, y: ((e.clientY - r.top) / r.height) * 2 - 1 }); } : undefined}
      data-testid="plan-canvas"
    >
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={[1, 2]}
        frameloop="demand"
        gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
        camera={{ fov: 24, near: 1, far: R * 12, position: [R * 0.9, R * 0.75, R * 0.95] }}
        onCreated={({ gl, scene }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;
          scene.background = null;
          props.onCanvas?.(gl.domElement);
        }}
        style={{ background: 'transparent' }}
      >
        <Lights model={model} sunHour={props.sunHour} night={props.night} pointer={pointer} autoSweep={props.autoSunSweep} buildKey={props.buildKey} />
        <Ground model={model} showPlan={props.showPlan} night={props.night} />
        <Church model={model} night={props.night} />
        <Homes model={model} buildKey={props.buildKey} showPlan={props.showPlan} onBuildEnd={props.onBuildEnd} night={props.night} speed={props.speed ?? 1} />
        <SiteFeatures model={model} showPlan={props.showPlan} />
        <Trees model={model} />
        <Lamps model={model} night={props.night} />
        <CameraRig model={model} view={props.view} interactive={interactive} zoom={props.zoom ?? 1} />
        <NightTween night={props.night} />
      </Canvas>
    </div>
  );
}

// ---------- Lights ----------
function sunPosition(hour: number, R: number) {
  const az = (Math.PI * (hour - 6)) / 14; // 0 east → π west
  const el = Math.max(0.12, Math.sin(az)) * 1.1;
  const d = R * 2.2;
  return new THREE.Vector3(Math.cos(az) * d, Math.sin(el) * d * 0.9 + 6, d * 0.45);
}

function Lights({ model, sunHour, night, pointer, autoSweep, buildKey }: { model: PlanModel; sunHour: number; night: boolean; pointer: { x: number; y: number }; autoSweep?: boolean; buildKey: number }) {
  const R = Math.max(model.bounds.w, model.bounds.h);
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const moon = useRef<THREE.DirectionalLight>(null);
  const invalidate = useThree((s) => s.invalidate);
  const cur = useRef({ hour: sunHour, night: night ? 1 : 0, px: 0, py: 0 });
  const sweep = useRef<{ start: number } | null>(null);
  useEffect(() => { if (autoSweep) sweep.current = { start: performance.now() + 4200 }; }, [autoSweep, buildKey]);
  useEffect(() => { invalidate(); }, [sunHour, night, pointer, invalidate]);

  useFrame(() => {
    const c = cur.current;
    let targetHour = sunHour;
    if (sweep.current) {
      const t = (performance.now() - sweep.current.start) / 3200;
      if (t >= 0 && t <= 1) targetHour = 7 + easeInOut(t) * 11;
      else if (t > 1) { sweep.current = null; targetHour = 15; }
      else targetHour = 7;
    }
    const k = 0.12;
    c.hour += (targetHour - c.hour) * k;
    c.night += ((night ? 1 : 0) - c.night) * k;
    c.px += (pointer.x - c.px) * 0.08;
    c.py += (pointer.y - c.py) * 0.08;
    const moving = Math.abs(targetHour - c.hour) > 0.01 || Math.abs((night ? 1 : 0) - c.night) > 0.005 || Math.abs(pointer.x - c.px) > 0.002 || Math.abs(pointer.y - c.py) > 0.002;
    if (sun.current) {
      const p = sunPosition(c.hour + c.px * 0.35, R);
      p.y += c.py * R * 0.08;
      sun.current.position.copy(p);
      const el = Math.max(0.12, Math.sin((Math.PI * (c.hour - 6)) / 14));
      tmpColor.set('#FFD9A0').lerp(new THREE.Color('#FFF8EC'), Math.min(1, el * 1.3));
      sun.current.color.copy(tmpColor);
      sun.current.intensity = (1.6 + el * 1.2) * (1 - c.night);
    }
    if (hemi.current) {
      hemi.current.color.set(P.sky).lerp(new THREE.Color('#2A3F5C'), c.night);
      hemi.current.groundColor.set(P.lawn).lerp(new THREE.Color('#13201A'), c.night);
      hemi.current.intensity = 0.9 - c.night * 0.3;
    }
    if (moon.current) {
      moon.current.intensity = 1.1 * c.night;
      moon.current.position.set(-R * 0.9, R * 1.6, -R * 0.6);
    }
    if (moving || sweep.current) invalidate();
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={[P.sky, P.lawn, 0.9]} />
      <directionalLight
        ref={sun}
        castShadow
        intensity={2.2}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={4}
      >
        <orthographicCamera attach="shadow-camera" args={[-R * 0.95, R * 0.95, R * 0.95, -R * 0.95, 1, R * 6]} />
      </directionalLight>
      <directionalLight ref={moon} color="#AFC6E6" intensity={0} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004}>
        <orthographicCamera attach="shadow-camera" args={[-R * 0.95, R * 0.95, R * 0.95, -R * 0.95, 1, R * 6]} />
      </directionalLight>
    </>
  );
}

/** Lerps shared material colours toward their night tones. */
function NightTween({ night }: { night: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  const v = useRef(night ? 1 : 0);
  const sets = useMemo(() => [
    [M.lawn, P.lawn, '#4E6A52'], [M.lawnLight, '#B7CDAD', '#587560'], [M.lot, '#BFD3B4', '#5A7560'], [M.asphalt, P.asphalt, '#2E3336'], [M.asphaltLight, P.asphaltLight, '#3A4043'],
    [M.sidewalk, P.sidewalk, '#7D8382'], [M.curb, P.curb, '#6F7572'], [M.tree, P.tree, '#1E4030'], [M.treeLight, P.treeLight, '#2A5340'], [M.treeDeep, P.treeDeep, '#172F23'],
    [M.jacaranda, P.jacaranda, '#5E5480'], [M.jacarandaLight, P.jacarandaLight, '#6F6794'], [M.palm, P.treeLight, '#2A5340'], [M.dirt, P.dirt, '#7A6C5C'], [M.foundation, P.stoneLight, '#6B7C74'],
  ] as const, []);
  useEffect(() => { invalidate(); }, [night, invalidate]);
  useFrame(() => {
    const target = night ? 1 : 0;
    if (Math.abs(target - v.current) < 0.003) { v.current = target; applyAll(); return; }
    v.current += (target - v.current) * 0.1;
    applyAll();
    invalidate();
  });
  function applyAll() {
    for (const [m, day, nite] of sets) (m as THREE.MeshStandardMaterial).color.set(day).lerp(new THREE.Color(nite), v.current);
    M.window.emissiveIntensity = 0.15 + v.current * 1.4;
    M.lampHead.emissiveIntensity = v.current * 1.8;
  }
  return null;
}

// ---------- Ground, street, parking ----------
function Ground({ model, showPlan, night }: { model: PlanModel; showPlan: boolean; night: boolean }) {
  const R = Math.max(model.bounds.w, model.bounds.h);
  const terrain = useMemo(() => terrainGeometry(R * 7, 56, R * 0.9), [R]);
  const lot = useMemo(() => polygonPrism(model.polygon, 0.25), [model.polygon]);
  const boundary = useMemo(() => [...model.polygon, model.polygon[0]].map((p) => [p.x, 0.32, p.y] as [number, number, number]), [model.polygon]);
  const buildableLine = useMemo(() => { const ip = insetPolygon(model.polygon, Math.min(model.bounds.w, model.bounds.h) * 0.05); return [...ip, ip[0]].map((p) => [p.x, 0.34, p.y] as [number, number, number]); }, [model.polygon, model.bounds]);
  const freedMat = useMemo(() => M.asphalt.clone(), []);
  const stallsFreedMat = useMemo(() => M.paint.clone(), []);
  const invalidate = useThree((s) => s.invalidate);
  const fade = useRef(showPlan ? 0 : 1);
  useEffect(() => { invalidate(); }, [showPlan, invalidate]);
  useFrame(() => {
    const target = showPlan ? 0 : 1;
    if (Math.abs(target - fade.current) < 0.01) { fade.current = target; } else { fade.current += (target - fade.current) * 0.14; invalidate(); }
    freedMat.opacity = fade.current; freedMat.transparent = true; freedMat.visible = fade.current > 0.02;
    freedMat.color.copy(M.asphalt.color);
    stallsFreedMat.opacity = fade.current; stallsFreedMat.transparent = true; stallsFreedMat.visible = fade.current > 0.02;
  });
  const keptBox = model.keptBox;
  const sr = model.streetRect;
  const horizontal = sr.w > sr.h;
  const dashes = useMemo(() => {
    const out: [number, number, number][] = [];
    if (horizontal) for (let x = sr.x + 4; x < sr.x + sr.w - 4; x += 8) out.push([x + 2, 0.06, sr.y + sr.h / 2]);
    else for (let y = sr.y + 4; y < sr.y + sr.h - 4; y += 8) out.push([sr.x + sr.w / 2, 0.06, y + 2]);
    return out;
  }, [sr, horizontal]);
  const sidewalkY = horizontal ? (model.streetSide === 'top' ? sr.y + sr.h + 1 : sr.y - 1) : 0;
  const sidewalkX = !horizontal ? (model.streetSide === 'left' ? sr.x + sr.w + 1 : sr.x - 1) : 0;
  return (
    <group>
      <mesh geometry={terrain} material={M.lawn} receiveShadow position={[0, -0.02, 0]} />
      <mesh geometry={lot} material={M.lot} receiveShadow castShadow />
      <Line points={boundary} color={night ? P.wall : P.pine} lineWidth={1.4} opacity={0.75} transparent />
      {showPlan && <Line points={buildableLine} color={P.pine} lineWidth={1} dashed dashSize={2} gapSize={1.5} opacity={0.6} transparent />}
      {/* street */}
      <mesh material={M.asphalt} receiveShadow position={[sr.x + sr.w / 2, 0.02, sr.y + sr.h / 2]}>
        <boxGeometry args={[sr.w, 0.08, sr.h]} />
      </mesh>
      {dashes.map((d, i) => (
        <mesh key={i} material={M.paint} position={d}><boxGeometry args={horizontal ? [4, 0.02, 0.25] : [0.25, 0.02, 4]} /></mesh>
      ))}
      {/* sidewalk + curb */}
      <mesh material={M.sidewalk} receiveShadow position={horizontal ? [sr.x + sr.w / 2, 0.1, sidewalkY] : [sidewalkX, 0.1, sr.y + sr.h / 2]}>
        <boxGeometry args={horizontal ? [sr.w, 0.2, 2] : [2, 0.2, sr.h]} />
      </mesh>
      {/* existing parking: kept part stays, freed part fades out in the plan */}
      {model.parking.map((r, i) => (
        <mesh key={`p${i}`} material={freedMat} receiveShadow position={[r.x + r.w / 2, 0.3, r.y + r.h / 2]}>
          <boxGeometry args={[r.w, 0.12, r.h]} />
        </mesh>
      ))}
      {keptBox && (
        <mesh material={M.asphalt} receiveShadow position={[keptBox.x + keptBox.w / 2, 0.31, keptBox.y + keptBox.h / 2]}>
          <boxGeometry args={[keptBox.w + 1.5, 0.14, keptBox.h + 1.5]} />
        </mesh>
      )}
      <Stalls stalls={model.keptStalls} material={M.paint} y={0.4} />
      <Stalls stalls={model.allStalls.slice(model.keptStalls.length)} material={stallsFreedMat} y={0.38} />
    </group>
  );
}

function Stalls({ stalls, material, y }: { stalls: Rect[]; material: THREE.Material; y: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.BoxGeometry(1, 0.02, 1), []);
  useEffect(() => {
    const m = ref.current; if (!m) return;
    stalls.forEach((s, i) => {
      // paint only the outline: three thin strips per stall (left, right, back) approximated by a U-shape of 3 instances is heavy; use one thin rect per side via scale on a box per stall edge
      UP.position.set(s.x + s.w / 2, y, s.y + s.h / 2);
      UP.scale.set(s.w, 1, 0.12);
      UP.updateMatrix(); m.setMatrixAt(i * 3, UP.matrix);
      UP.scale.set(0.12, 1, s.h); UP.position.set(s.x + 0.06, y, s.y + s.h / 2); UP.updateMatrix(); m.setMatrixAt(i * 3 + 1, UP.matrix);
      UP.position.set(s.x + s.w - 0.06, y, s.y + s.h / 2); UP.updateMatrix(); m.setMatrixAt(i * 3 + 2, UP.matrix);
    });
    m.count = stalls.length * 3;
    m.instanceMatrix.needsUpdate = true;
  }, [stalls, y]);
  if (!stalls.length) return null;
  return <instancedMesh ref={ref} args={[geo, material, Math.max(1, stalls.length * 3)]} frustumCulled={false} />;
}

// ---------- Church massing ----------
function Church({ model, night }: { model: PlanModel; night: boolean }) {
  const b = model.building;
  const cx = b.x + b.w / 2, cz = b.y + b.h / 2;
  const w = b.w, d = b.h;
  const wallH = 7.5;
  const towerW = Math.min(6, w * 0.22);
  const roof = useMemo(() => gableGeometry(w * 0.78, d * 0.9, 4.2, 0.8), [w, d]);
  const entranceSide = model.streetSide === 'bottom' ? 1 : -1; // entrance faces the street
  const windows = useMemo(() => {
    const list: [number, number, number, number][] = []; // x, z, rotY, w
    const n = Math.max(2, Math.floor(d / 6));
    for (let i = 0; i < n; i++) {
      const z = b.y + d * 0.08 + ((i + 0.5) * (d * 0.84)) / n;
      list.push([b.x + w * 0.11 - 0.02, z, Math.PI / 2, 1.4]);
      list.push([b.x + w * 0.89 + 0.02, z, -Math.PI / 2, 1.4]);
    }
    return list;
  }, [b, w, d]);
  return (
    <group>
      {/* nave */}
      <mesh material={M.wall} castShadow receiveShadow position={[cx, wallH / 2 + 0.25, cz]}>
        <boxGeometry args={[w * 0.78, wallH, d * 0.9]} />
      </mesh>
      <mesh geometry={roof} material={M.roof} castShadow receiveShadow position={[cx, wallH + 0.25, cz]} />
      {/* tower + steeple at a front corner */}
      <mesh material={M.wallShade} castShadow receiveShadow position={[b.x + w - towerW / 2 - 0.5, 6.5 + 0.25, cz + entranceSide * (d * 0.45 - towerW / 2)]}>
        <boxGeometry args={[towerW, 13, towerW]} />
      </mesh>
      <mesh material={M.roofLight} castShadow position={[b.x + w - towerW / 2 - 0.5, 13.25 + 2.6, cz + entranceSide * (d * 0.45 - towerW / 2)]}>
        <coneGeometry args={[towerW * 0.78, 5.2, 4]} />
      </mesh>
      <mesh material={M.brass} position={[b.x + w - towerW / 2 - 0.5, 13.25 + 5.2 + 0.9, cz + entranceSide * (d * 0.45 - towerW / 2)]}>
        <boxGeometry args={[0.25, 1.8, 0.25]} />
      </mesh>
      {/* entrance porch + doors */}
      <mesh material={M.wallWarm} castShadow receiveShadow position={[cx - w * 0.1, 2.2, cz + entranceSide * (d * 0.45 + 1.2)]}>
        <boxGeometry args={[w * 0.3, 4.4, 2.6]} />
      </mesh>
      <mesh material={M.door} position={[cx - w * 0.1, 1.5, cz + entranceSide * (d * 0.45 + 2.52)]}>
        <boxGeometry args={[3, 3, 0.1]} />
      </mesh>
      {/* arched windows (emissive planes) */}
      {windows.map(([x, z, ry, ww], i) => (
        <mesh key={i} material={M.window} position={[x, 4.3, z]} rotation={[0, ry, 0]}>
          <planeGeometry args={[ww, 3.2]} />
        </mesh>
      ))}
      {night && <pointLight position={[cx - w * 0.1, 3.8, cz + entranceSide * (d * 0.45 + 3)]} color={P.honeyGlow} intensity={70} distance={18} decay={2} />}
    </group>
  );
}

// ---------- Homes with build-up animation ----------
type UnitAnim = { rect: Rect; wallH: number; roofH: number; start: number; wallMat: number; roofMat: number; facing: 1 | -1; floors: number; isFlat: boolean };

function Homes({ model, buildKey, showPlan, onBuildEnd, night, speed }: { model: PlanModel; buildKey: number; showPlan: boolean; onBuildEnd?: () => void; night: boolean; speed: number }) {
  const invalidate = useThree((s) => s.invalidate);
  const units = useMemo<UnitAnim[]>(() => {
    let row = -1, idx = 0;
    return model.layout.units.map((u, i) => {
      if (u.row !== row) { row = u.row; idx = 0; }
      const isFlat = u.type === 'flat';
      const start = u.row * 0.42 + idx * 0.055;
      idx++;
      const h = hashUnit(model.parcel.id, i);
      return { rect: u.rect, wallH: u.floors * 3.1, roofH: isFlat ? 0.6 : 2.3, start, wallMat: Math.floor(h * WALL_SET.length), roofMat: Math.floor(hashUnit(model.parcel.id, i + 999) * ROOF_SET.length), facing: u.facing === 's' ? 1 : -1, floors: u.floors, isFlat };
    });
  }, [model]);
  const n = Math.max(1, units.length);
  const isFlat = model.opts.unitType === 'flat';
  const dims = model.layout.units[0]?.rect ?? { w: 7, h: 12, x: 0, y: 0 };
  const foundGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const wallGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const roofGeo = useMemo(() => (isFlat ? new THREE.BoxGeometry(dims.w + 0.8, 0.6, dims.h + 0.8) : gableGeometry(dims.w, dims.h, 2.3, 0.5)), [isFlat, dims.w, dims.h]);
  const winGeo = useMemo(() => new THREE.PlaneGeometry(1.1, 1.3), []);
  const doorGeo = useMemo(() => new THREE.PlaneGeometry(1.0, 2.1), []);
  const litMat = useMemo(() => new THREE.MeshBasicMaterial({ color: P.windowLit, transparent: true, opacity: 0.95 }), []);
  const wallMats = useMemo(() => WALL_SET.map((m) => m.clone()), []);
  const roofMats = useMemo(() => ROOF_SET.map((m) => m.clone()), []);
  const foundMat = useMemo(() => M.foundation.clone(), []);
  const winMat = useMemo(() => M.window.clone(), []);
  const doorMat = useMemo(() => M.door.clone(), []);
  const refs = {
    found: useRef<THREE.InstancedMesh>(null),
    walls: wallMats.map(() => useRef<THREE.InstancedMesh>(null)), // eslint-disable-line react-hooks/rules-of-hooks
    roofs: roofMats.map(() => useRef<THREE.InstancedMesh>(null)), // eslint-disable-line react-hooks/rules-of-hooks
    win: useRef<THREE.InstancedMesh>(null),
    lit: useRef<THREE.InstancedMesh>(null),
    door: useRef<THREE.InstancedMesh>(null),
  };
  // windows per unit: 2 per floor on the facing face (townhome), 4 per floor on both long faces (flats)
  const winPerUnit = isFlat ? 8 * 3 : 2 * (units[0]?.floors ?? 2);
  const t0 = useRef(performance.now());
  const done = useRef(false);
  const total = useMemo(() => (units.length ? Math.max(...units.map((u) => u.start)) + 1.35 : 0), [units]);
  const fade = useRef(showPlan ? 1 : 0);

  useEffect(() => { t0.current = performance.now(); done.current = false; invalidate(); }, [buildKey, model, invalidate]);
  useEffect(() => { invalidate(); }, [showPlan, night, invalidate]);

  useFrame(() => {
    const elapsed = ((performance.now() - t0.current) / 1000) * speed;
    const target = showPlan ? 1 : 0;
    if (Math.abs(target - fade.current) > 0.01) { fade.current += (target - fade.current) * 0.14; invalidate(); } else fade.current = target;
    const op = fade.current;
    for (const m of [...wallMats, ...roofMats, foundMat, winMat, doorMat]) { m.transparent = op < 0.999; m.opacity = op; m.visible = op > 0.02; }
    litMat.opacity = op * (night ? 0.98 : 0.75); litMat.visible = op > 0.02;

    const counts = { found: 0, walls: wallMats.map(() => 0), roofs: roofMats.map(() => 0), win: 0, lit: 0, door: 0 };
    const F = refs.found.current;
    units.forEach((u) => {
      const r = u.rect;
      const cx = r.x + r.w / 2, cz = r.y + r.h / 2;
      const t = elapsed - u.start;
      const pF = clamp01(t / 0.3), pW = clamp01((t - 0.3) / 0.5), pR = clamp01((t - 0.85) / 0.5), pL = clamp01((t - 1.2) / 0.25);
      // foundation grows up from the ground
      if (F) {
        const h = 0.4 * easeOutCubic(pF);
        UP.position.set(cx, 0.25 + h / 2, cz); UP.rotation.set(0, 0, 0); UP.scale.set(r.w + 0.6, Math.max(0.001, h), r.h + 0.6); UP.updateMatrix(); F.setMatrixAt(counts.found++, UP.matrix);
      }
      // walls extrude upward
      const W = refs.walls[u.wallMat].current;
      if (W) {
        const h = u.wallH * easeOutCubic(pW);
        UP.position.set(cx, 0.65 + h / 2, cz); UP.rotation.set(0, 0, 0); UP.scale.set(r.w - 0.1, Math.max(0.001, h), r.h - 0.1); UP.updateMatrix(); W.setMatrixAt(counts.walls[u.wallMat]++, UP.matrix);
      }
      // roof drops and settles, never below its seat
      const Rm = refs.roofs[u.roofMat].current;
      if (Rm && pW >= 1) {
        const seat = 0.65 + u.wallH + (u.isFlat ? 0.3 : 0);
        let y: number;
        if (pR < 0.72) { const q = pR / 0.72; y = seat + 6 * (1 - q * q); }
        else { const q = (pR - 0.72) / 0.28; y = seat + 0.22 * (1 - q) * Math.abs(Math.sin(q * Math.PI * 1.5)); }
        UP.position.set(cx, y, cz); UP.rotation.set(0, 0, 0); UP.scale.set(1, 1, 1); UP.updateMatrix(); Rm.setMatrixAt(counts.roofs[u.roofMat]++, UP.matrix);
      }
      // windows + door on the facing face
      if (pW >= 1) {
        const faceZ = u.facing === 1 ? r.y + r.h + 0.03 : r.y - 0.03;
        const rotY = u.facing === 1 ? 0 : Math.PI;
        const Wi = refs.win.current, Li = refs.lit.current, Do = refs.door.current;
        if (u.isFlat) {
          for (let f = 0; f < 3; f++) for (let k = 0; k < 4; k++) {
            const x = r.x + ((k + 0.5) * r.w) / 4;
            const y = 0.65 + f * 3.1 + 1.7;
            for (const side of [1, -1] as const) {
              const z = side === 1 ? r.y + r.h + 0.03 : r.y - 0.03;
              UP.position.set(x, y, z); UP.rotation.set(0, side === 1 ? 0 : Math.PI, 0); UP.scale.set(1, 1, 1); UP.updateMatrix();
              Wi?.setMatrixAt(counts.win++, UP.matrix);
              const s = easeOutCubic(pL); UP.scale.set(s, s, 1); UP.position.set(x, y, z + side * 0.02); UP.updateMatrix(); Li?.setMatrixAt(counts.lit++, UP.matrix);
            }
          }
        } else {
          for (let f = 0; f < u.floors; f++) for (let k = 0; k < 2; k++) {
            const x = r.x + r.w * (f === 0 && k === 1 ? 0.3 : k === 0 ? 0.3 : 0.72);
            if (f === 0 && k === 1) continue; // ground floor: one window + door
            const y = 0.65 + f * 3.1 + 1.75;
            UP.position.set(x, y, faceZ); UP.rotation.set(0, rotY, 0); UP.scale.set(1, 1, 1); UP.updateMatrix(); Wi?.setMatrixAt(counts.win++, UP.matrix);
            const s = easeOutCubic(pL); UP.scale.set(s, s, 1); UP.position.set(x, y, faceZ + u.facing * 0.02); UP.updateMatrix(); Li?.setMatrixAt(counts.lit++, UP.matrix);
          }
          UP.position.set(r.x + r.w * 0.72, 0.65 + 1.05, faceZ); UP.rotation.set(0, rotY, 0); UP.scale.set(1, 1, 1); UP.updateMatrix(); Do?.setMatrixAt(counts.door++, UP.matrix);
        }
      }
    });
    const setCount = (m: THREE.InstancedMesh | null, c: number) => { if (m) { m.count = c; m.instanceMatrix.needsUpdate = true; } };
    setCount(F, counts.found);
    refs.walls.forEach((r, i) => setCount(r.current, counts.walls[i]));
    refs.roofs.forEach((r, i) => setCount(r.current, counts.roofs[i]));
    setCount(refs.win.current, counts.win); setCount(refs.lit.current, counts.lit); setCount(refs.door.current, counts.door);
    if (elapsed < total + 0.2) invalidate();
    else if (!done.current) { done.current = true; onBuildEnd?.(); }
  });

  if (!units.length) return null;
  return (
    <group>
      <instancedMesh ref={refs.found} args={[foundGeo, foundMat, n]} castShadow receiveShadow frustumCulled={false} />
      {wallMats.map((m, i) => <instancedMesh key={`w${i}`} ref={refs.walls[i]} args={[wallGeo, m, n]} castShadow receiveShadow frustumCulled={false} />)}
      {roofMats.map((m, i) => <instancedMesh key={`r${i}`} ref={refs.roofs[i]} args={[roofGeo, m, n]} castShadow receiveShadow frustumCulled={false} />)}
      <instancedMesh ref={refs.win} args={[winGeo, winMat, n * winPerUnit]} frustumCulled={false} />
      <instancedMesh ref={refs.lit} args={[winGeo, litMat, n * winPerUnit]} frustumCulled={false} />
      <instancedMesh ref={refs.door} args={[doorGeo, doorMat, n]} frustumCulled={false} />
    </group>
  );
}

// ---------- Aisles, yards, green, garden ----------
function SiteFeatures({ model, showPlan }: { model: PlanModel; showPlan: boolean }) {
  const L = model.layout;
  const mat = useMemo(() => M.asphaltLight.clone(), []);
  const yardMat = useMemo(() => M.lawnLight.clone(), []);
  const invalidate = useThree((s) => s.invalidate);
  const fade = useRef(showPlan ? 1 : 0);
  useEffect(() => { invalidate(); }, [showPlan, invalidate]);
  useFrame(() => {
    const target = showPlan ? 1 : 0;
    if (Math.abs(target - fade.current) > 0.01) { fade.current += (target - fade.current) * 0.14; invalidate(); } else fade.current = target;
    for (const m of [mat, yardMat]) { m.transparent = true; m.opacity = fade.current; m.visible = fade.current > 0.02; }
  });
  return (
    <group>
      {L.aisles.map((a, i) => (
        <mesh key={`a${i}`} material={mat} receiveShadow position={[a.x + a.w / 2, 0.36, a.y + a.h / 2]}><boxGeometry args={[a.w, 0.08, a.h]} /></mesh>
      ))}
      {L.yards.map((y, i) => (
        <mesh key={`y${i}`} material={yardMat} receiveShadow position={[y.x + y.w / 2, 0.36, y.y + y.h / 2]}><boxGeometry args={[y.w - 0.3, 0.06, y.h - 0.3]} /></mesh>
      ))}
      {L.green && (
        <mesh material={yardMat} receiveShadow position={[L.green.x + L.green.w / 2, 0.36, L.green.y + L.green.h / 2]}><boxGeometry args={[L.green.w, 0.06, L.green.h]} /></mesh>
      )}
      {L.garden && showPlan && (
        <group>
          {[0, 1, 2].map((i) => (
            <mesh key={i} material={M.dirtShade} castShadow receiveShadow position={[L.garden!.x + 2 + i * 4 + 1.5, 0.6, L.garden!.y + L.garden!.h / 2]}><boxGeometry args={[2.4, 0.5, L.garden!.h - 4]} /></mesh>
          ))}
          {[0, 1, 2].map((i) => (
            <mesh key={`s${i}`} material={M.treeLight} position={[L.garden!.x + 2 + i * 4 + 1.5, 0.95, L.garden!.y + L.garden!.h / 2]}><boxGeometry args={[2.0, 0.25, L.garden!.h - 4.6]} /></mesh>
          ))}
        </group>
      )}
    </group>
  );
}

// ---------- Trees ----------
type TreeSpec = { x: number; z: number; kind: 'oak' | 'jacaranda' | 'palm'; s: number };
function treePositions(model: PlanModel): TreeSpec[] {
  const out: TreeSpec[] = [];
  const poly = model.polygon;
  const blocked: Rect[] = [model.building, ...model.parking, ...model.layout.units.map((u) => u.rect), ...model.layout.aisles, ...model.layout.yards];
  if (model.layout.garden) blocked.push(model.layout.garden);
  const ok = (x: number, z: number, r: number) => pointInPolygon({ x, y: z }, poly) && !blocked.some((b) => rectsOverlap({ x: x - r, y: z - r, w: 2 * r, h: 2 * r }, b));
  // ring just inside the boundary
  const n = poly.length;
  let seed = 7;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < n; i++) {
    const a = poly[i], b = poly[(i + 1) % n];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.floor(len / 14));
    for (let k = 0; k < steps; k++) {
      const t = (k + 0.5) / steps;
      const x = a.x + (b.x - a.x) * t, z = a.y + (b.y - a.y) * t;
      // nudge inward toward centroid
      const ix = x * 0.93, iz = z * 0.93;
      if (ok(ix, iz, 2.5)) out.push({ x: ix, z: iz, kind: rnd() < 0.2 ? 'palm' : rnd() < 0.5 ? 'jacaranda' : 'oak', s: 0.8 + rnd() * 0.5 });
    }
  }
  // community green trees
  const g = model.layout.green;
  if (g) for (let k = 0; k < 3; k++) out.push({ x: g.x + ((k + 0.5) * g.w) / 3, z: g.y + g.h / 2, kind: k === 1 ? 'jacaranda' : 'oak', s: 0.9 });
  // street trees along the sidewalk
  const sr = model.streetRect;
  const horizontal = sr.w > sr.h;
  for (let k = 0; k < 5; k++) {
    if (horizontal) out.push({ x: sr.x + 12 + k * ((sr.w - 24) / 4), z: model.streetSide === 'top' ? sr.y + sr.h + 3.5 : sr.y - 3.5, kind: 'palm', s: 1.1 });
    else out.push({ x: model.streetSide === 'left' ? sr.x + sr.w + 3.5 : sr.x - 3.5, z: sr.y + 12 + k * ((sr.h - 24) / 4), kind: 'palm', s: 1.1 });
  }
  return out.slice(0, 48);
}

function Trees({ model }: { model: PlanModel }) {
  const specs = useMemo(() => treePositions(model), [model]);
  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.22, 0.32, 1, 7), []);
  const sphere = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
  const leaf = useMemo(() => { const g = new THREE.PlaneGeometry(0.9, 3.4); g.translate(0, 1.6, 0); return g; }, []);
  const trunk = useRef<THREE.InstancedMesh>(null);
  const oakA = useRef<THREE.InstancedMesh>(null);
  const oakB = useRef<THREE.InstancedMesh>(null);
  const jacA = useRef<THREE.InstancedMesh>(null);
  const jacB = useRef<THREE.InstancedMesh>(null);
  const palmLeaf = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    let ti = 0, oa = 0, ob = 0, ja = 0, jb = 0, pl = 0;
    specs.forEach((t) => {
      const h = (t.kind === 'palm' ? 7 : 2.6) * t.s;
      UP.rotation.set(0, 0, 0); UP.position.set(t.x, 0.3 + h / 2, t.z); UP.scale.set(t.s, h, t.s); UP.updateMatrix(); trunk.current?.setMatrixAt(ti++, UP.matrix);
      if (t.kind === 'oak') {
        UP.scale.set(2.6 * t.s, 2.2 * t.s, 2.6 * t.s); UP.position.set(t.x, 0.3 + h + 1.3 * t.s, t.z); UP.updateMatrix(); oakA.current?.setMatrixAt(oa++, UP.matrix);
        UP.scale.set(1.8 * t.s, 1.6 * t.s, 1.8 * t.s); UP.position.set(t.x - 1.1 * t.s, 0.3 + h + 2.1 * t.s, t.z + 0.6 * t.s); UP.updateMatrix(); oakB.current?.setMatrixAt(ob++, UP.matrix);
      } else if (t.kind === 'jacaranda') {
        UP.scale.set(2.4 * t.s, 2.0 * t.s, 2.4 * t.s); UP.position.set(t.x, 0.3 + h + 1.4 * t.s, t.z); UP.updateMatrix(); jacA.current?.setMatrixAt(ja++, UP.matrix);
        UP.scale.set(1.5 * t.s, 1.3 * t.s, 1.5 * t.s); UP.position.set(t.x + 1.0 * t.s, 0.3 + h + 2.2 * t.s, t.z - 0.5 * t.s); UP.updateMatrix(); jacB.current?.setMatrixAt(jb++, UP.matrix);
      } else {
        for (let k = 0; k < 7; k++) {
          UP.position.set(t.x, 0.3 + h, t.z); UP.rotation.set(0.9, (k * Math.PI * 2) / 7, 0, 'YXZ'); UP.scale.set(t.s, t.s, t.s); UP.updateMatrix(); palmLeaf.current?.setMatrixAt(pl++, UP.matrix);
        }
      }
    });
    const fin = (m: THREE.InstancedMesh | null, c: number) => { if (m) { m.count = c; m.instanceMatrix.needsUpdate = true; } };
    fin(trunk.current, ti); fin(oakA.current, oa); fin(oakB.current, ob); fin(jacA.current, ja); fin(jacB.current, jb); fin(palmLeaf.current, pl);
  }, [specs]);
  const n = Math.max(1, specs.length);
  return (
    <group>
      <instancedMesh ref={trunk} args={[trunkGeo, M.trunk, n]} castShadow frustumCulled={false} />
      <instancedMesh ref={oakA} args={[sphere, M.tree, n]} castShadow frustumCulled={false} />
      <instancedMesh ref={oakB} args={[sphere, M.treeLight, n]} castShadow frustumCulled={false} />
      <instancedMesh ref={jacA} args={[sphere, M.jacaranda, n]} castShadow frustumCulled={false} />
      <instancedMesh ref={jacB} args={[sphere, M.jacarandaLight, n]} castShadow frustumCulled={false} />
      <instancedMesh ref={palmLeaf} args={[leaf, M.palm, n * 7]} castShadow frustumCulled={false} />
    </group>
  );
}

// ---------- Lamps ----------
function Lamps({ model, night }: { model: PlanModel; night: boolean }) {
  const sr = model.streetRect;
  const horizontal = sr.w > sr.h;
  const posts = useMemo(() => {
    const out: [number, number][] = [];
    for (let k = 0; k < 4; k++) {
      if (horizontal) out.push([sr.x + 18 + k * ((sr.w - 36) / 3), model.streetSide === 'top' ? sr.y + sr.h + 1 : sr.y - 1]);
      else out.push([model.streetSide === 'left' ? sr.x + sr.w + 1 : sr.x - 1, sr.y + 18 + k * ((sr.h - 36) / 3)]);
    }
    return out;
  }, [sr, horizontal, model.streetSide]);
  return (
    <group>
      {posts.map(([x, z], i) => (
        <group key={i} position={[x, 0.3, z]}>
          <mesh material={M.pine} castShadow position={[0, 3, 0]}><cylinderGeometry args={[0.12, 0.16, 6, 6]} /></mesh>
          <mesh material={M.pine} position={[0.5, 6, 0]}><boxGeometry args={[1.1, 0.14, 0.14]} /></mesh>
          <mesh material={M.lampHead} position={[1, 5.85, 0]}><boxGeometry args={[0.6, 0.3, 0.4]} /></mesh>
          {night && <pointLight position={[1, 5.6, 0]} color={P.honeyGlow} intensity={90} distance={22} decay={2} />}
        </group>
      ))}
    </group>
  );
}

// ---------- Camera ----------
function CameraRig({ model, view, interactive, zoom }: { model: PlanModel; view: PlanView; interactive: boolean; zoom: number }) {
  const R = Math.max(model.bounds.w, model.bounds.h) * zoom;
  const controls = useRef<OrbitControlsImpl>(null);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const target = useRef<{ pos: THREE.Vector3; look: THREE.Vector3; t: number } | null>(null);
  const sr = model.streetRect;
  const streetZ = sr.w > sr.h ? sr.y + sr.h / 2 : 0;
  const streetX = sr.w > sr.h ? 0 : sr.x + sr.w / 2;
  const presets = useMemo<Record<PlanView, { pos: THREE.Vector3; look: THREE.Vector3 }>>(() => ({
    aerial: { pos: new THREE.Vector3(R * 0.15, R * 2.0, R * 0.9), look: new THREE.Vector3(0, 0, 0) },
    threeQuarter: { pos: new THREE.Vector3(R * 1.05, R * 0.8, R * 1.1), look: new THREE.Vector3(0, 2, 0) },
    street: { pos: new THREE.Vector3(streetX + (sr.w > sr.h ? R * 0.35 : 0), 2.2, streetZ + (sr.w > sr.h ? 0 : R * 0.35)), look: new THREE.Vector3(0, 4, 0) },
  }), [R, streetX, streetZ, sr.w, sr.h]);
  useEffect(() => {
    const p = presets[view];
    target.current = { pos: p.pos.clone(), look: p.look.clone(), t: 0 };
    invalidate();
  }, [view, presets, invalidate]);
  useFrame((_, dt) => {
    const tg = target.current; if (!tg) return;
    tg.t = Math.min(1, tg.t + dt / 0.9);
    const k = easeInOut(tg.t);
    camera.position.lerp(tg.pos, 0.08 + k * 0.1);
    const c = controls.current;
    if (c) { c.target.lerp(tg.look, 0.08 + k * 0.1); c.update(); } else camera.lookAt(tg.look);
    if (camera.position.distanceTo(tg.pos) < 0.05 && tg.t >= 1) { camera.position.copy(tg.pos); target.current = null; }
    invalidate();
  });
  return <OrbitControls ref={controls} makeDefault enabled={interactive} enablePan={false} enableDamping dampingFactor={0.08} minDistance={R * 0.35} maxDistance={R * 3.2} maxPolarAngle={1.5} onChange={() => invalidate()} />;
}

export type { RefObject, Pt };
