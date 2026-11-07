'use client';
/** Static 2D site plan (SVG) used as the WebGL / reduced-motion fallback and for exports. */
import type { PlanModel } from '@/lib/planModel';
import { palette as P } from '@/lib/illustrationPalette';
import { hashUnit } from '@/lib/planModel';

export function PlanDiagram2D({ model, night = false, showPlan = true, className = '' }: { model: PlanModel; night?: boolean; showPlan?: boolean; className?: string }) {
  const b = model.bounds;
  const pad = 18;
  const vb = `${b.x - pad} ${b.y - pad} ${b.w + pad * 2} ${b.h + pad * 2}`;
  const poly = model.polygon.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ') + ' Z';
  const walls = [P.wall, P.wallWarm, P.wallSage, P.wallClay];
  const roofs = [P.roof, P.roofTerracotta, P.roofLight, P.roofDeep];
  const sr = model.streetRect;
  return (
    <svg viewBox={vb} className={`w-full h-full ${className}`} role="img" aria-label="Site plan" data-testid="plan-2d">
      <rect x={b.x - pad} y={b.y - pad} width={b.w + pad * 2} height={b.h + pad * 2} fill={night ? '#243a30' : '#C9D7CC'} />
      <rect x={sr.x} y={sr.y} width={sr.w} height={sr.h} fill={night ? P.asphaltDeep : P.asphalt} />
      <path d={poly} fill={night ? P.lawnDeep : P.lawn} stroke={night ? P.wall : P.pine} strokeWidth={0.6} />
      {model.parking.map((r, i) => (!showPlan || !model.keptBox) && <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={P.asphalt} rx={1} />)}
      {model.keptBox && <rect x={model.keptBox.x - 0.7} y={model.keptBox.y - 0.7} width={model.keptBox.w + 1.4} height={model.keptBox.h + 1.4} fill={P.asphalt} rx={1} />}
      {(showPlan ? model.keptStalls : model.allStalls).map((s, i) => <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} fill="none" stroke={P.paint} strokeWidth={0.25} opacity={0.8} />)}
      {/* church */}
      <rect x={model.building.x + model.building.w * 0.11} y={model.building.y + model.building.h * 0.05} width={model.building.w * 0.78} height={model.building.h * 0.9} fill={P.roof} />
      <line x1={model.building.x + model.building.w / 2} y1={model.building.y + model.building.h * 0.05} x2={model.building.x + model.building.w / 2} y2={model.building.y + model.building.h * 0.95} stroke={P.roofLight} strokeWidth={0.6} />
      {showPlan && (
        <g>
          {model.layout.aisles.map((a, i) => <rect key={`a${i}`} x={a.x} y={a.y} width={a.w} height={a.h} fill={P.asphaltLight} />)}
          {model.layout.yards.map((y, i) => <rect key={`y${i}`} x={y.x} y={y.y} width={y.w} height={y.h} fill="#B7CDAD" />)}
          {model.layout.green && <rect x={model.layout.green.x} y={model.layout.green.y} width={model.layout.green.w} height={model.layout.green.h} fill="#B7CDAD" />}
          {model.layout.garden && <rect x={model.layout.garden.x} y={model.layout.garden.y} width={model.layout.garden.w} height={model.layout.garden.h} fill={P.dirt} />}
          {model.layout.units.map((u, i) => (
            <g key={u.id}>
              <rect x={u.rect.x + 0.6} y={u.rect.y + 0.6} width={u.rect.w} height={u.rect.h} fill={P.shadow} />
              <rect x={u.rect.x} y={u.rect.y} width={u.rect.w} height={u.rect.h} fill={walls[Math.floor(hashUnit(model.parcel.id, i) * 4)]} />
              <rect x={u.rect.x + 0.4} y={u.rect.y + 0.4} width={u.rect.w - 0.8} height={u.rect.h - 0.8} fill={roofs[Math.floor(hashUnit(model.parcel.id, i + 999) * 4)]} />
              {u.type === 'townhome' && <line x1={u.rect.x + u.rect.w / 2} y1={u.rect.y + 0.4} x2={u.rect.x + u.rect.w / 2} y2={u.rect.y + u.rect.h - 0.4} stroke={P.wall} strokeWidth={0.25} opacity={0.6} />}
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}
