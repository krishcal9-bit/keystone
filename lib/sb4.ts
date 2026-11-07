/**
 * Keystone SB 4 engine. Deterministic and unit-tested. Claude never decides eligibility or numbers.
 * Legal facts follow the HCD SB 4 fact sheet (Gov. Code § 65913.16). Not legal advice.
 */
import assumptions from '@/data/assumptions.json';
import { type Pt, type Rect, bbox, polygonArea, rectInPolygon, rectsOverlap, insetPolygon, clamp, safeNum } from './geometry';

export type OwnerType = 'congregation' | 'college' | 'private' | 'commercial' | 'public';
export type Zoning = 'residential' | 'commercial' | 'institutional';
export type ContentLang = 'en' | 'es' | 'vi' | 'ko';
export type UnitType = 'townhome' | 'flat';

export type Parcel = {
  id: string;
  displayName: string;
  ownerType: OwnerType;
  ownerSince: string; // ISO date
  faith?: string;
  city: string;
  mapX: number; // 0–1000 on the stylized OC map
  mapY: number;
  lotAcres: number;
  buildingAcres: number;
  parkingAcres: number;
  parkingSpaces: number;
  openAcres: number;
  zoning: Zoning;
  nearSchoolM: number;
  nearTransitM: number;
  nearGroceryM: number;
  slopePct: number;
  floodZone: boolean;
  hazards: string[];
  congregationLanguage: ContentLang;
  lotPolygon: Pt[]; // normalized; bbox fits inside [0,1]²
  buildingRect: Rect; // normalized, same frame as lotPolygon
  parkingRects: Rect[]; // normalized
  streetSide: 'top' | 'bottom' | 'left' | 'right';
};

export const SB4 = {
  ownershipCutoff: assumptions.sb4.ownershipCutoff,
  effectiveFrom: assumptions.sb4.effectiveFrom,
  sunset: assumptions.sb4.sunset,
  moderateIncomeMaxShare: assumptions.sb4.moderateIncomeMaxShare,
  staffUnitsMaxShare: assumptions.sb4.staffUnitsMaxShare,
  ownershipDeedYears: assumptions.sb4.ownershipDeedYears,
  rentalDeedYears: assumptions.sb4.rentalDeedYears,
  citation: 'Gov. Code § 65913.16 (SB 4, 2023)',
} as const;

export const A = {
  sqftPerAcre: assumptions.sqftPerAcre,
  sqftPerSpace: assumptions.sqftPerParkingSpace.value,
  setbackPct: assumptions.setbackPct.value,
  townhomeLandSqft: assumptions.townhome.landSqftPerUnit,
  flatsLandSqft: assumptions.flats.landSqftPerUnit,
  flatsCap: assumptions.flats.capOverMinimum,
  peoplePerHousehold: assumptions.peoplePerHousehold.value,
  affordabilityYears: assumptions.affordabilityYears.value,
  defaultKeepShare: assumptions.defaultKeepParkingShare.value,
  landValuePerAcre: assumptions.landValuePerAcre.value,
  densityMetro: assumptions.density.metropolitanMin,
  densityNonRes: assumptions.density.nonResidentialZoneMin,
} as const;

export const ELIGIBLE_OWNERS: OwnerType[] = ['congregation', 'college'];

// ---------- Eligibility ----------
export type Reason = { id: string; pass: boolean; label: string; detail: string; provision: string };
export type Warning = { id: string; label: string; detail: string };
export type Eligibility = { eligible: boolean; reasons: Reason[]; warnings: Warning[] };

const toDate = (d: string | Date) => (d instanceof Date ? d : new Date(d + (d.length === 10 ? 'T12:00:00Z' : '')));
const fmtDate = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

export function checkEligibility(parcel: Parcel, today: string | Date = new Date()): Eligibility {
  const now = toDate(today);
  const reasons: Reason[] = [];
  const warnings: Warning[] = [];

  const ownerOk = ELIGIBLE_OWNERS.includes(parcel.ownerType);
  reasons.push({
    id: 'owner',
    pass: ownerOk,
    label: ownerOk ? 'Eligible owner' : 'Owner type not covered',
    detail: ownerOk
      ? `${ownerLabel(parcel.ownerType)} land is covered by SB 4.`
      : `SB 4 applies only to land owned by a religious institution or an independent institution of higher education. This parcel is ${ownerLabel(parcel.ownerType).toLowerCase()}.`,
    provision: '§ 65913.16(a): applies to land owned by a religious institution or an independent institution of higher education.',
  });

  const ownedBy = toDate(parcel.ownerSince).getTime() <= toDate(SB4.ownershipCutoff).getTime();
  reasons.push({
    id: 'ownedSince',
    pass: ownedBy,
    label: ownedBy ? 'Owned on or before January 1, 2024' : 'Acquired after January 1, 2024',
    detail: `Owner of record since ${fmtDate(parcel.ownerSince)}. SB 4 requires the institution to have owned the land on or before ${fmtDate(SB4.ownershipCutoff)}.`,
    provision: '§ 65913.16: the land must have been owned by the institution on or before January 1, 2024.',
  });

  const inWindow = now.getTime() >= toDate(SB4.effectiveFrom).getTime() && now.getTime() < toDate(SB4.sunset).getTime();
  reasons.push({
    id: 'window',
    pass: inWindow,
    label: inWindow ? 'SB 4 is in effect today' : 'Outside the SB 4 window',
    detail: `SB 4 is in effect from ${fmtDate(SB4.effectiveFrom)} through ${fmtDate(SB4.sunset)}.`,
    provision: 'SB 4 took effect July 2, 2024 and sunsets January 1, 2036.',
  });

  if (parcel.floodZone) {
    warnings.push({ id: 'flood', label: 'Flood zone', detail: 'Parcel is mapped in a flood zone. SB 4 excludes certain hazard sites; confirm the FEMA designation and mitigation with the city.' });
  }
  for (const h of parcel.hazards) {
    warnings.push({ id: `hazard-${h}`, label: hazardLabel(h), detail: hazardDetail(h) });
  }
  if (parcel.zoning !== 'residential') {
    warnings.push({ id: 'density40', label: 'Higher minimum density', detail: 'The zone does not allow residential use, so SB 4 raises the minimum density to 40 homes per acre.' });
  }

  return { eligible: reasons.every((r) => r.pass), reasons, warnings };
}

export const ownerLabel = (o: OwnerType) => ({
  congregation: 'Congregation', college: 'Independent nonprofit college', private: 'Private owner', commercial: 'Commercial owner', public: 'Public agency',
}[o]);

const hazardLabel = (h: string) => ({
  'fire-severity': 'Very high fire hazard zone', 'fault-zone': 'Earthquake fault zone', 'hazardous-site': 'Listed hazardous site', 'wetland': 'Wetland', 'liquefaction': 'Liquefaction zone', 'noise-airport': 'Airport noise contour',
}[h] ?? h);
const hazardDetail = (h: string) => ({
  'fire-severity': 'Sites in a very high fire hazard severity zone are excluded unless mitigated to state standards.',
  'fault-zone': 'Sites in an Alquist-Priolo fault zone are excluded unless the fault is not active.',
  'hazardous-site': 'Listed hazardous waste sites are excluded unless cleared by the state.',
  'wetland': 'Wetlands are excluded from by-right eligibility.',
  'liquefaction': 'Liquefaction risk raises foundation cost; a geotechnical report is needed.',
  'noise-airport': 'Airport noise contours may require sound mitigation.',
}[h] ?? 'Confirm this condition with the city.');

// ---------- Density ----------
export const minDensity = (parcel: Pick<Parcel, 'zoning'>): number =>
  parcel.zoning === 'residential' ? A.densityMetro : A.densityNonRes;

// ---------- Buildable area ----------
export type Buildable = {
  acres: number; // net, after setbacks
  grossAcres: number;
  keptSpaces: number;
  keptParkingAcres: number;
  freedParkingAcres: number;
  openAcres: number;
  setbackAcres: number;
};

export function buildableArea(parcel: Parcel, keepSpaces: number): Buildable {
  const kept = clamp(Math.round(safeNum(keepSpaces)), 0, Math.max(0, parcel.parkingSpaces));
  const keptParkingAcres = Math.min(parcel.parkingAcres, (kept * A.sqftPerSpace) / A.sqftPerAcre);
  const freedParkingAcres = Math.max(0, parcel.parkingAcres - keptParkingAcres);
  const grossAcres = Math.max(0, parcel.openAcres + freedParkingAcres);
  const setbackAcres = grossAcres * A.setbackPct;
  const acres = Math.max(0, grossAcres - setbackAcres);
  return { acres, grossAcres, keptSpaces: kept, keptParkingAcres, freedParkingAcres, openAcres: parcel.openAcres, setbackAcres };
}

// ---------- Unit capacity ----------
export type Capacity = {
  minimumUnits: number;
  practicalUnits: number;
  meetsMinimum: boolean;
  shortfall: number;
  density: number;
  type: UnitType;
  suggestion?: 'stacked-flats';
};

export function unitCapacity(areaAcres: number, parcel: Pick<Parcel, 'zoning'>, type: UnitType): Capacity {
  const area = Math.max(0, safeNum(areaAcres));
  const density = minDensity(parcel);
  const minimumUnits = Math.floor(area * density);
  const sqft = area * A.sqftPerAcre;
  let practicalUnits: number;
  if (type === 'townhome') {
    practicalUnits = Math.floor(sqft / A.townhomeLandSqft);
  } else {
    const raw = Math.floor(sqft / A.flatsLandSqft);
    practicalUnits = Math.min(raw, Math.max(minimumUnits, Math.ceil(minimumUnits * A.flatsCap)));
  }
  const meetsMinimum = practicalUnits >= minimumUnits;
  return {
    minimumUnits,
    practicalUnits,
    meetsMinimum,
    shortfall: Math.max(0, minimumUnits - practicalUnits),
    density,
    type,
    suggestion: !meetsMinimum && type === 'townhome' ? 'stacked-flats' : undefined,
  };
}

/** Default scenario: keep half the parking, townhomes if they meet the minimum, otherwise stacked flats. */
export type Scenario = { keepSpaces: number; buildable: Buildable; capacity: Capacity; homes: number };
export function defaultKeepSpaces(parcel: Parcel) { return Math.round(parcel.parkingSpaces * A.defaultKeepShare); }
export function recommendedScenario(parcel: Parcel, keepSpaces = defaultKeepSpaces(parcel)): Scenario {
  const buildable = buildableArea(parcel, keepSpaces);
  const th = unitCapacity(buildable.acres, parcel, 'townhome');
  const capacity = th.meetsMinimum ? th : unitCapacity(buildable.acres, parcel, 'flat');
  return { keepSpaces: buildable.keptSpaces, buildable, capacity, homes: capacity.practicalUnits };
}

// ---------- Fit score ----------
export type FitFactor = { id: string; label: string; points: number; max: number; note: string };
export type Fit = { score: number; factors: FitFactor[] };

const proximityPoints = (m: number, max: number) => {
  if (m <= 400) return max;
  if (m <= 800) return Math.round(max * 0.66);
  if (m <= 1600) return Math.round(max * 0.33);
  return 0;
};

export function fitScore(parcel: Parcel, today: string | Date = new Date()): Fit {
  const elig = checkEligibility(parcel, today);
  const scenario = recommendedScenario(parcel);
  const acres = scenario.buildable.acres;
  const factors: FitFactor[] = [];

  const acrePts = Math.round(Math.min(acres / 2, 1) * 30);
  factors.push({ id: 'acres', label: 'Buildable acres', points: acrePts, max: 30, note: `${acres.toFixed(2)} buildable acres keeping ${scenario.keepSpaces} spaces` });

  const tr = proximityPoints(parcel.nearTransitM, 15);
  factors.push({ id: 'transit', label: 'Transit', points: tr, max: 15, note: `${fmtDist(parcel.nearTransitM)} to the nearest bus or rail stop` });
  const sc = proximityPoints(parcel.nearSchoolM, 10);
  factors.push({ id: 'school', label: 'Schools', points: sc, max: 10, note: `${fmtDist(parcel.nearSchoolM)} to the nearest school` });
  const gr = proximityPoints(parcel.nearGroceryM, 10);
  factors.push({ id: 'grocery', label: 'Grocery', points: gr, max: 10, note: `${fmtDist(parcel.nearGroceryM)} to a grocery store` });

  const slopePts = parcel.slopePct <= 3 ? 10 : parcel.slopePct <= 8 ? 6 : parcel.slopePct <= 15 ? 2 : 0;
  factors.push({ id: 'slope', label: 'Slope', points: slopePts, max: 10, note: `${parcel.slopePct}% average slope` });

  const hazardPts = Math.max(0, 10 - (parcel.floodZone ? 5 : 0) - parcel.hazards.length * 3);
  factors.push({ id: 'hazards', label: 'Hazards', points: hazardPts, max: 10, note: parcel.floodZone || parcel.hazards.length ? `${[parcel.floodZone ? 'flood zone' : null, ...parcel.hazards.map(hazardLabel)].filter(Boolean).join(', ')}` : 'No mapped hazards' });

  const eligPts = elig.eligible ? 15 : 0;
  factors.push({ id: 'eligibility', label: 'SB 4 eligibility', points: eligPts, max: 15, note: elig.eligible ? 'Meets owner, ownership-date and timing tests' : elig.reasons.find((r) => !r.pass)?.label ?? 'Not eligible' });

  const score = clamp(factors.reduce((s, f) => s + f.points, 0), 0, 100);
  return { score, factors };
}

const fmtDist = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`);

// ---------- Impact ----------
export type Impact = { homes: number; people: number; affordabilityYears: number };
export function impact(units: number): Impact {
  const u = Math.max(0, Math.round(safeNum(units)));
  return { homes: u, people: Math.round(u * A.peoplePerHousehold), affordabilityYears: u * A.affordabilityYears };
}

export function oneLineReason(parcel: Parcel, today: string | Date = new Date()): string {
  const elig = checkEligibility(parcel, today);
  if (!elig.eligible) return elig.reasons.find((r) => !r.pass)?.label ?? 'Not eligible';
  const s = recommendedScenario(parcel);
  const bits: string[] = [`${s.buildable.acres.toFixed(1)} buildable ac`];
  if (parcel.nearTransitM <= 800) bits.push('near transit');
  if (parcel.nearSchoolM <= 800) bits.push('near schools');
  if (elig.warnings.length) bits.push(`${elig.warnings.length} warning${elig.warnings.length > 1 ? 's' : ''}`);
  return bits.join(' · ');
}

// ---------- Procedural layout ----------
export type PlacedUnit = { id: string; rect: Rect; row: number; type: UnitType; floors: number; unitsInBuilding: number; facing: 'n' | 's' };
export type Layout = {
  units: PlacedUnit[];
  unitCount: number;
  rows: number;
  aisles: Rect[];
  parking?: { rect: Rect; stalls: Rect[] };
  garden?: Rect;
  green?: Rect;
  yards: Rect[];
  buildablePolygon: Pt[];
  bounds: Rect;
};
export type LayoutOpts = {
  unitType: UnitType;
  targetUnits?: number;
  keepSpaces: number;
  garden?: boolean;
  setbackM?: number;
  /** Existing buildings/areas to keep clear, in the same metre frame as the polygon. */
  keepClear?: Rect[];
  /** Edge where kept parking should sit (nearest the existing building/street). */
  parkingEdge?: 'top' | 'bottom';
};

export const UNIT_DIMS = {
  townhome: { w: 7, d: 12, yard: 5, floors: 2, perBuilding: 1 },
  flat: { w: 30, d: 14, yard: 4, floors: 3, perBuilding: 12 },
} as const;
export const AISLE_W = 7;
export const STALL = { w: 2.7, d: 5.5 };

/**
 * Pure procedural site plan. Polygon in metres. Returns positioned rows of units inside the
 * set-back polygon, a drive aisle between facing rows, kept parking stalls along one edge,
 * yards behind each row and an optional community garden.
 */
export function layoutPlan(polygonM: Pt[], opts: LayoutOpts): Layout {
  const bounds = bbox(polygonM);
  const setback = opts.setbackM ?? Math.max(3, Math.min(bounds.w, bounds.h) * 0.05);
  const poly = insetPolygon(polygonM, setback);
  const inner = bbox(poly);
  const keepClear = [...(opts.keepClear ?? [])];
  const yards: Rect[] = [];
  const aisles: Rect[] = [];
  const units: PlacedUnit[] = [];
  const dims = UNIT_DIMS[opts.unitType];

  const fits = (r: Rect) => rectInPolygon(r, poly) && !keepClear.some((k) => rectsOverlap(r, k));

  // 1. Kept parking: double-loaded bay along the chosen edge.
  let parking: Layout['parking'];
  const keep = Math.max(0, Math.round(opts.keepSpaces));
  let cursorTop = inner.y;
  let cursorBottom = inner.y + inner.h;
  if (keep > 0) {
    const stalls: Rect[] = [];
    const perRow = Math.max(1, Math.floor((inner.w - 2) / STALL.w));
    const rowsNeeded = Math.ceil(keep / perRow);
    const bays = Math.ceil(rowsNeeded / 2);
    const depth = bays * (2 * STALL.d + AISLE_W);
    const edge = opts.parkingEdge ?? 'top';
    const y0 = edge === 'top' ? inner.y : inner.y + inner.h - depth;
    const rect: Rect = { x: inner.x, y: y0, w: inner.w, h: depth };
    let placed = 0;
    for (let b = 0; b < bays && placed < keep; b++) {
      const by = y0 + b * (2 * STALL.d + AISLE_W);
      for (let side = 0; side < 2 && placed < keep; side++) {
        const sy = side === 0 ? by : by + STALL.d + AISLE_W;
        for (let i = 0; i < perRow && placed < keep; i++) {
          const s: Rect = { x: inner.x + 1 + i * STALL.w, y: sy, w: STALL.w, h: STALL.d };
          if (fits(s)) { stalls.push(s); placed++; }
        }
      }
      aisles.push({ x: inner.x, y: by + STALL.d, w: inner.w, h: AISLE_W });
    }
    parking = { rect, stalls };
    keepClear.push(rect);
    if (edge === 'top') cursorTop = y0 + depth + 2; else cursorBottom = y0 - 2;
  }

  // 2. Optional community garden in the far corner from the parking.
  let garden: Rect | undefined;
  if (opts.garden) {
    const g = 14;
    const candidates: Rect[] = [
      { x: inner.x + inner.w - g, y: cursorBottom - g, w: g, h: g },
      { x: inner.x, y: cursorBottom - g, w: g, h: g },
      { x: inner.x + inner.w - g, y: cursorTop, w: g, h: g },
    ];
    for (const c of candidates) { if (fits(c)) { garden = c; keepClear.push(c); break; } }
  }

  // 3. Rows of homes: pairs of facing rows around a drive aisle, stacked down the lot.
  const target = opts.targetUnits ?? Infinity;
  const pairDepth = dims.d + dims.yard + AISLE_W + dims.d + dims.yard;
  let y = cursorTop;
  let row = 0;
  const gapX = opts.unitType === 'flat' ? 6 : 0;
  while (y + dims.d + dims.yard <= cursorBottom && units.length < target) {
    const roomForPair = y + pairDepth <= cursorBottom;
    // Row A (faces the aisle below it): yard on top, building below yard
    const yardA: Rect = { x: inner.x, y, w: inner.w, h: dims.yard };
    const bldgAY = y + dims.yard;
    const aisleY = bldgAY + dims.d;
    const aisle: Rect = { x: inner.x, y: aisleY, w: inner.w, h: AISLE_W };
    const bldgBY = aisleY + AISLE_W;
    const yardB: Rect = { x: inner.x, y: bldgBY + dims.d, w: inner.w, h: dims.yard };

    let placedA = 0, placedB = 0;
    for (let x = inner.x; x + dims.w <= inner.x + inner.w + 1e-6 && units.length < target; x += dims.w + gapX) {
      const r: Rect = { x, y: bldgAY, w: dims.w, h: dims.d };
      const yardCell: Rect = { x, y, w: dims.w, h: dims.yard };
      if (fits(r) && fits(yardCell)) {
        units.push({ id: `u${units.length}`, rect: r, row, type: opts.unitType, floors: dims.floors, unitsInBuilding: dims.perBuilding, facing: 's' });
        yards.push(yardCell); placedA++;
      }
    }
    if (placedA > 0) aisles.push(aisle);
    if (roomForPair) {
      for (let x = inner.x; x + dims.w <= inner.x + inner.w + 1e-6 && units.length < target; x += dims.w + gapX) {
        const r: Rect = { x, y: bldgBY, w: dims.w, h: dims.d };
        const yardCell: Rect = { x, y: bldgBY + dims.d, w: dims.w, h: dims.yard };
        if (fits(r) && fits(yardCell) && (placedA > 0 || fits(aisle))) {
          units.push({ id: `u${units.length}`, rect: r, row: row + 1, type: opts.unitType, floors: dims.floors, unitsInBuilding: dims.perBuilding, facing: 'n' });
          yards.push(yardCell); placedB++;
        }
      }
    }
    if (placedA === 0 && placedB === 0) { y += dims.d / 2; continue; } // slide past an obstruction
    void yardA; void yardB;
    row += 2;
    y = roomForPair ? bldgBY + dims.d + dims.yard + 3 : aisleY + AISLE_W + 3;
  }

  // 4. Community green: the largest leftover strip at the bottom (if any).
  let green: Rect | undefined;
  const lastY = units.reduce((m, u) => Math.max(m, u.rect.y + u.rect.h + dims.yard), cursorTop);
  if (cursorBottom - lastY >= 8) {
    const g: Rect = { x: inner.x + 2, y: lastY + 2, w: inner.w - 4, h: Math.min(cursorBottom - lastY - 4, 20) };
    if (g.w > 6 && g.h > 4 && fits(g)) green = g;
  }

  const unitCount = units.reduce((s, u) => s + u.unitsInBuilding, 0);
  return { units, unitCount, rows: row, aisles, parking, garden, green, yards, buildablePolygon: poly, bounds };
}

// ---------- Polygon area ----------
export function areaFromPolygon(points: Pt[], metersPerUnit: number) {
  const m2 = polygonArea(points) * metersPerUnit * metersPerUnit;
  const sqft = m2 * 10.7639;
  return { m2, sqft, acres: sqft / A.sqftPerAcre };
}

/** Metres per normalized unit so that the normalized polygon's area equals the lot's acres. */
export function metersPerUnitForLot(polygon: Pt[], lotAcres: number): number {
  const normArea = polygonArea(polygon);
  if (normArea <= 0) return 0;
  const m2 = lotAcres * A.sqftPerAcre / 10.7639;
  return Math.sqrt(m2 / normArea);
}

export const toMeters = (pts: Pt[], mpu: number): Pt[] => pts.map((p) => ({ x: p.x * mpu, y: p.y * mpu }));
export const rectToMeters = (r: Rect, mpu: number): Rect => ({ x: r.x * mpu, y: r.y * mpu, w: r.w * mpu, h: r.h * mpu });

/** Illustrative land value of the buildable area (clearly labelled as an assumption in the UI). */
export const illustrativeLandValue = (acres: number) => Math.max(0, safeNum(acres)) * A.landValuePerAcre;
