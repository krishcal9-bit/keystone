import { palette as P } from '@/lib/illustrationPalette';
import type { DictKey } from '@/lib/i18n';
import type { ScanCategory } from '@/lib/scanMath';

/** Draw order (buildings → parking → open land → trees → access) and tones per category. */
export const CATEGORY_ORDER: ScanCategory[] = ['building', 'parking', 'open', 'trees', 'access'];

export const CATEGORY_STYLE: Record<ScanCategory, { fill: string; fillOpacity: number; stroke: string; key: DictKey; areaKey: DictKey }> = {
  building: { fill: P.roof, fillOpacity: 0.35, stroke: P.roofLight, key: 'scan.buildings', areaKey: 'scan.buildingArea' },
  parking: { fill: P.asphalt, fillOpacity: 0.35, stroke: P.asphaltLight, key: 'scan.parking', areaKey: 'scan.parkingArea' },
  open: { fill: P.pine, fillOpacity: 0.25, stroke: P.pineLight, key: 'scan.openLand', areaKey: 'scan.openArea' },
  trees: { fill: P.tree, fillOpacity: 0.3, stroke: P.treeLight, key: 'scan.trees', areaKey: 'scan.treesArea' },
  access: { fill: P.brass, fillOpacity: 0.3, stroke: P.brassLight, key: 'scan.access', areaKey: 'scan.access' },
};

export const categoryIndex = (c: ScanCategory) => CATEGORY_ORDER.indexOf(c);
