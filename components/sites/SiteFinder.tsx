'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { navigateWithTransition } from '@/lib/viewTransition';
import { useReducedMotion } from 'motion/react';
import { allStats, totals, type SiteStats } from '@/lib/siteStats';
import { cities } from '@/lib/data';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { OCMap, type MapView, fitColor } from '@/components/map/OCMap';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Field, Select, Checkbox } from '@/components/ui/Field';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { Pill, SampleDataLabel } from '@/components/ui/Pill';
import { ComparisonStrip } from '@/components/comparison/ComparisonStrip';
import type { OwnerType, ContentLang } from '@/lib/sb4';

type Sort = 'fit' | 'homes' | 'acres' | 'name';
type Filters = { city: string; owner: OwnerType | 'all'; minAcres: number; transit: boolean; schools: boolean; eligibleOnly: boolean; lang: ContentLang | 'all' };
const DEFAULT: Filters = { city: 'all', owner: 'all', minAcres: 0, transit: false, schools: false, eligibleOnly: false, lang: 'all' };
const INTRO_KEY = 'keystone:v1:map-intro-seen';

const FIRST_ROWS = 16;

export function SiteFinder() {
  const { t } = useT();
  const { theme } = useTheme();
  const router = useRouter();
  const reduced = useReducedMotion();
  const night = theme === 'dark';
  const all = useMemo(() => allStats(), []);
  const [filters, setFilters] = useState<Filters>(DEFAULT);
  const [sort, setSort] = useState<Sort>('fit');
  const [heat, setHeat] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [flyTo, setFlyTo] = useState<MapView | null>(null);
  const [intro, setIntro] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isLg, setIsLg] = useState(true);
  useEffect(() => { const mq = window.matchMedia('(min-width: 1024px)'); const on = () => setIsLg(mq.matches); on(); mq.addEventListener('change', on); return () => mq.removeEventListener('change', on); }, []);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (!sessionStorage.getItem(INTRO_KEY)) { setIntro(true); sessionStorage.setItem(INTRO_KEY, '1'); }
    } catch {}
  }, []);

  // First paint hydrates one screen of rows; the rest mount after the browser is idle (keeps TBT low on mobile).
  const [listReady, setListReady] = useState(false);
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback) { const id = w.requestIdleCallback(() => setListReady(true), { timeout: 1500 }); return () => w.cancelIdleCallback?.(id); }
    const id = setTimeout(() => setListReady(true), 600); return () => clearTimeout(id);
  }, []);
  const shown = useMemo(() => {
    const f = filters;
    const list = all.filter((s) => {
      const p = s.parcel;
      if (f.city !== 'all' && p.city !== f.city) return false;
      if (f.owner !== 'all' && p.ownerType !== f.owner) return false;
      if (s.scenario.buildable.acres < f.minAcres) return false;
      if (f.transit && p.nearTransitM > 800) return false;
      if (f.schools && p.nearSchoolM > 800) return false;
      if (f.eligibleOnly && !s.eligibility.eligible) return false;
      if (f.lang !== 'all' && p.congregationLanguage !== f.lang) return false;
      return true;
    });
    const by: Record<Sort, (a: SiteStats, b: SiteStats) => number> = {
      fit: (a, b) => b.fit.score - a.fit.score || b.scenario.homes - a.scenario.homes,
      homes: (a, b) => (b.eligibility.eligible ? b.scenario.homes : -1) - (a.eligibility.eligible ? a.scenario.homes : -1),
      acres: (a, b) => b.scenario.buildable.acres - a.scenario.buildable.acres,
      name: (a, b) => a.parcel.displayName.localeCompare(b.parcel.displayName),
    };
    return list.sort(by[sort]);
  }, [all, filters, sort]);

  const tot = useMemo(() => totals(shown), [shown]);
  const dirty = JSON.stringify(filters) !== JSON.stringify(DEFAULT);

  const select = useCallback((s: SiteStats) => {
    setFlyTo({ x: s.parcel.mapX, y: s.parcel.mapY, k: 2.6 });
    const go = () => navigateWithTransition(router, `/sites/${s.parcel.id}`, { sharedEl: document.querySelector(`[data-marker="${s.parcel.id}"]`) as SVGElement | null });
    if (reduced) go(); else setTimeout(go, 380);
  }, [router, reduced]);

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setFilters((f) => ({ ...f, [k]: v }));

  const selectFromList = select;

  return (
    <div className="relative min-h-svh pt-16" data-testid="sites-page">
      {/* the map IS the scene: full-bleed behind floating paper panels on desktop */}
      {isLg && <div className="fixed inset-x-0 top-16 bottom-0 hidden lg:block" style={{ ['--map-bg' as string]: night ? '#16283A' : '#C7DCE6' }}>
        <OCMap sites={shown} allSites={all} night={night} heat={heat} hoveredId={hovered} onHover={setHovered} onSelect={select} flyTo={flyTo} intro={intro} className="w-full h-full" inset={{ left: 520, top: 30 }} />
        {flyTo && (
          <button className="absolute top-4 right-5 md:right-10 lg:right-20 h-9 px-3 paper text-[13px] font-medium text-ink hover:bg-pine-soft" onClick={() => setFlyTo(null)}>{t('sites.reset')}</button>
        )}
        <div className="absolute right-5 md:right-10 lg:right-20 bottom-5 flex items-center gap-3 px-3 h-8 paper text-[12px] text-ink-2">
          <Legend color={fitColor(90, true, night)} label="85+" /><Legend color={fitColor(72, true, night)} label="70" /><Legend color={fitColor(60, true, night)} label="55" /><Legend color={fitColor(0, false, night)} label={t('common.notEligible')} />
        </div>
      </div>}

      <div className="relative mx-auto w-full max-w-[1440px] px-5 md:px-10 lg:px-20 pt-6 pb-10 lg:min-h-[calc(100svh-64px)] flex flex-col gap-4 pointer-events-none">
        <div className="pointer-events-auto lg:w-[440px] flex flex-col gap-3">
          <div className="paper p-4 md:p-5">
            <div className="flex items-center gap-3 flex-wrap"><h1 className="headline-md">{t('sites.title')}</h1><SampleDataLabel /></div>
            <p className="text-[14px] text-pine font-medium mt-1" data-testid="lane-line">{t('lane.sites')}</p>
            <p className="text-ink-2 text-[15px] leading-6 mt-1">{t('sites.subtitle')}</p>
            <dl className="grid grid-cols-4 gap-x-4 gap-y-1 mt-4 pt-4 border-t border-line" data-testid="totals">
              <Stat label={t('sites.shown')} value={tot.sites} testId="total-sites" />
              <Stat label={t('sites.eligible')} value={tot.eligible} testId="total-eligible" />
              <Stat label={t('sites.potentialHomes')} value={tot.homes} testId="total-homes" accent />
              <Stat label={t('sites.peopleHoused')} value={tot.people} testId="total-people" />
            </dl>
            {/* comparison-strip-slot */}
            <ComparisonStrip className="mt-3 pt-3 border-t border-line" />
          </div>

          {/* mobile map */}
          {!isLg && <div className="lg:hidden rounded-[14px] overflow-hidden border border-line aspect-[4/5] sm:aspect-square relative">
            <OCMap sites={shown} allSites={all} night={night} heat={heat} hoveredId={hovered} onHover={setHovered} onSelect={select} flyTo={flyTo} intro={intro} className="w-full h-full" />
          </div>}

          <div className="paper p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-ink">{t('sites.filters')}</h2>
              <div className="flex items-center gap-2">
                {dirty && <Button variant="ghost" size="sm" onClick={() => setFilters(DEFAULT)}>{t('sites.clearFilters')}</Button>}
                <button className="lg:hidden h-9 px-2 text-[14px] font-medium text-pine" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((o) => !o)}>{filtersOpen ? t('sites.hideFilters') : t('sites.showFilters')}</button>
              </div>
            </div>
            <div className={`${filtersOpen ? 'grid' : 'hidden'} lg:grid grid-cols-2 gap-3 mt-3`}>
              <Field label={t('sites.city')}>
                <Select value={filters.city} onChange={(e) => set('city', e.target.value)} data-testid="filter-city">
                  <option value="all">{t('common.all')}</option>
                  {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </Field>
              <Field label={t('sites.ownerType')}>
                <Select value={filters.owner} onChange={(e) => set('owner', e.target.value as Filters['owner'])}>
                  <option value="all">{t('common.all')}</option>
                  {(['congregation', 'college', 'private', 'commercial', 'public'] as const).map((o) => <option key={o} value={o}>{t(`owner.${o}`)}</option>)}
                </Select>
              </Field>
              <Field label={t('sites.language')}>
                <Select value={filters.lang} onChange={(e) => set('lang', e.target.value as Filters['lang'])}>
                  <option value="all">{t('common.all')}</option>
                  <option value="en">English</option><option value="es">Español</option><option value="vi">Tiếng Việt</option><option value="ko">한국어</option>
                </Select>
              </Field>
              <Field label={t('sites.sort')}>
                <Select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                  <option value="fit">{t('sites.sort.fit')}</option><option value="homes">{t('sites.sort.homes')}</option><option value="acres">{t('sites.sort.acres')}</option><option value="name">{t('sites.sort.name')}</option>
                </Select>
              </Field>
              <div className="col-span-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-medium text-ink-2 flex justify-between"><span>{t('sites.minAcres')}</span><span className="tabular-nums text-ink">{filters.minAcres.toFixed(1)}</span></span>
                  <input type="range" className="ks-range" min={0} max={5} step={0.5} value={filters.minAcres} onChange={(e) => set('minAcres', Number(e.target.value))} style={{ ['--fill' as string]: `${(filters.minAcres / 5) * 100}%` }} aria-label={t('sites.minAcres')} />
                </label>
              </div>
              <div className="col-span-2 flex flex-wrap gap-x-5">
                <Checkbox label={t('sites.eligibleOnly')} checked={filters.eligibleOnly} onChange={(v) => set('eligibleOnly', v)} testId="filter-eligible" />
                <Checkbox label={t('sites.nearTransit')} checked={filters.transit} onChange={(v) => set('transit', v)} testId="filter-transit" />
                <Checkbox label={t('sites.nearSchools')} checked={filters.schools} onChange={(v) => set('schools', v)} />
              </div>
            </div>
          </div>

          <div className="paper flex flex-col overflow-hidden">
            <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-line">
              <h2 className="text-[15px] font-semibold text-ink">{t('sites.results')} <span className="text-ink-2 font-medium tabular-nums">· {shown.length}</span></h2>
              <Switch checked={heat} onChange={setHeat} label={t('sites.heat')} />
            </div>
            <div ref={listRef} className="overflow-y-auto max-h-[52svh] lg:max-h-[34svh]" data-testid="results-list">
              {shown.length === 0 && (
                <div className="p-6 text-center text-ink-2 text-[15px]">
                  <p>{t('sites.noResults')}</p>
                  <Button variant="secondary" size="sm" className="mt-3" onClick={() => setFilters(DEFAULT)}>{t('sites.clearFilters')}</Button>
                </div>
              )}
              {(listReady ? shown : shown.slice(0, FIRST_ROWS)).map((s) => (
                <button
                  key={s.parcel.id}
                  onClick={() => selectFromList(s)}
                  onPointerEnter={() => setHovered(s.parcel.id)}
                  onPointerLeave={() => setHovered(null)}
                  className={`w-full text-left px-4 py-3 border-b border-line last:border-b-0 flex items-center gap-3 transition-colors duration-[120ms] ${hovered === s.parcel.id ? 'bg-pine-soft' : 'hover:bg-pine-soft'}`}
                  data-testid="result-row"
                  data-id={s.parcel.id}
                >
                  <span className="w-3 h-3 rounded-full shrink-0 border border-surface" style={{ background: fitColor(s.fit.score, s.eligibility.eligible, night) }} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-ink leading-5 truncate">{s.parcel.displayName}</span>
                    <span className="block text-[13px] text-ink-2 leading-5 truncate">{s.parcel.city} · {s.reason}</span>
                  </span>
                  <span className="text-right shrink-0">
                    <span className="block text-[17px] font-semibold tabular-nums leading-5 text-ink">{s.eligibility.eligible ? s.scenario.homes : '—'}</span>
                    <span className="block text-[12px] text-ink-2 leading-4">{t('sites.fit')} {s.fit.score}</span>
                  </span>
                  {!s.eligibility.eligible && <Pill tone="neutral" className="hidden sm:inline-flex">{t('common.notEligible')}</Pill>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, testId, accent = false }: { label: string; value: number; testId: string; accent?: boolean }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[12px] text-ink-2 leading-4 order-2">{label}</dt>
      <dd className={`text-[24px] leading-7 font-semibold tabular-nums order-1 ${accent ? 'text-pine' : 'text-ink'}`} data-testid={testId}><AnimatedNumber value={value} /></dd>
    </div>
  );
}
function Legend({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />{label}</span>;
}
