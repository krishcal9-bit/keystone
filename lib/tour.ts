/**
 * Guided tour for judges: seven steps in demo order across the app. State lives in localStorage
 * (versioned key via lib/store) so the tour survives route changes and reloads. Copy is i18n keys;
 * `components/tour/TourOverlay.tsx` renders it.
 */
import { read, write } from './store';
import type { DictKey } from './i18n/en';

export type TourStep = {
  /** 1-based position shown as "Step n of 7". */
  n: number;
  /** Route to navigate to (may carry a query string). */
  route: string;
  /** CSS selector of the element to highlight; the first match wins. Missing at runtime → card only. */
  selector: string;
  title: DictKey;
  body: DictKey;
};

export type TourState = { active: boolean; step: number; startedAt: string };

export const TOUR_KEY = 'tour';
export const TOUR_EMPTY: TourState = { active: false, step: 0, startedAt: '' };
export const TOUR_SELECTOR_TIMEOUT_MS = 3000;
export const TOUR_SELECTOR_POLL_MS = 100;

export const TOUR_STEPS: readonly TourStep[] = [
  { n: 1, route: '/sites', selector: '[data-testid=filter-eligible]', title: 'tour.1.title', body: 'tour.1.body' },
  { n: 2, route: '/sites', selector: '[data-testid=result-row]', title: 'tour.2.title', body: 'tour.2.body' },
  { n: 3, route: '/sites/oakfield-community-church', selector: '[data-testid=keep-slider]', title: 'tour.3.title', body: 'tour.3.body' },
  { n: 4, route: '/sites/oakfield-community-church', selector: '[data-testid=gap-panel]', title: 'tour.4.title', body: 'tour.4.body' },
  { n: 5, route: '/scan?parcel=oakfield-community-church', selector: '[data-testid=scan-page]', title: 'tour.5.title', body: 'tour.5.body' },
  { n: 6, route: '/plan/oakfield-community-church', selector: '[data-testid=generate]', title: 'tour.6.title', body: 'tour.6.body' },
  { n: 7, route: '/pitch/oakfield-community-church', selector: '[data-testid=draft-letter]', title: 'tour.7.title', body: 'tour.7.body' },
];

export const TOUR_TOTAL = TOUR_STEPS.length;
export const JUDGE_GUIDE_ROUTE = '/judges';

/** Pathname part of a step route ("/scan?parcel=x" → "/scan"). */
export const routePath = (route: string) => route.split('?')[0].split('#')[0];

/** Does the current pathname belong to the given step route? */
export const onRoute = (pathname: string | null | undefined, route: string) => (pathname ?? '') === routePath(route);

export function readTour(): TourState {
  const s = read<Partial<TourState> | null>(TOUR_KEY, null);
  if (!s || typeof s !== 'object' || typeof s.active !== 'boolean') return TOUR_EMPTY;
  const step = Number.isInteger(s.step) ? Math.min(Math.max(0, s.step as number), TOUR_TOTAL) : 0;
  return { active: s.active, step, startedAt: typeof s.startedAt === 'string' ? s.startedAt : '' };
}

export function writeTour(state: TourState) {
  write(TOUR_KEY, state);
}

/**
 * Start (or restart) the tour at step 1 and return the route of that step so the caller can
 * `router.push` to it. The overlay picks the change up through the `keystone:store` event.
 */
export function startTour(): string {
  writeTour({ active: true, step: 0, startedAt: new Date().toISOString() });
  return TOUR_STEPS[0].route;
}

/** Jump to a step (0-based; TOUR_TOTAL = finished card). Returns the new state. */
export function goToStep(step: number): TourState {
  const cur = readTour();
  const next: TourState = { active: true, step: Math.min(Math.max(0, step), TOUR_TOTAL), startedAt: cur.startedAt || new Date().toISOString() };
  writeTour(next);
  return next;
}

/** Skip or finish: clears the persisted state. */
export function endTour() {
  writeTour(TOUR_EMPTY);
}

/** Route for a 0-based step index; the finished card points back to the guide. */
export const stepRoute = (step: number) => (step >= TOUR_TOTAL ? JUDGE_GUIDE_ROUTE : TOUR_STEPS[step].route);
