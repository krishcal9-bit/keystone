'use client';
/**
 * Page transitions with the native View Transitions API (300 ms, direction-aware) plus shared elements:
 * give the outgoing and incoming elements the same `view-transition-name` (e.g. `site-focus`) and the
 * browser morphs one into the other. Falls back to a plain navigation where unsupported.
 */
import type { useRouter } from 'next/navigation';

type Router = ReturnType<typeof useRouter>;
export type NavDir = 'forward' | 'back';

const supports = () => typeof document !== 'undefined' && 'startViewTransition' in document && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function waitForPath(pathname: string, timeout = 900) {
  return new Promise<void>((resolve) => {
    const t0 = performance.now();
    const tick = () => {
      if (location.pathname === pathname || performance.now() - t0 > timeout) { requestAnimationFrame(() => requestAnimationFrame(() => resolve())); return; }
      setTimeout(tick, 16);
    };
    tick();
  });
}

export function navigateWithTransition(router: Router, href: string, opts: { dir?: NavDir; sharedEl?: HTMLElement | SVGElement | null; name?: string } = {}) {
  const url = new URL(href, location.href);
  document.documentElement.setAttribute('data-nav-dir', opts.dir ?? 'forward');
  if (!supports()) { router.push(href); return; }
  const el = opts.sharedEl ?? null;
  if (el) (el as HTMLElement).style.viewTransitionName = opts.name ?? 'site-focus';
  const d = document as Document & { startViewTransition: (cb: () => Promise<void>) => { finished: Promise<void> } };
  const vt = d.startViewTransition(async () => {
    router.push(href);
    await waitForPath(url.pathname);
  });
  vt.finished.catch(() => {}).finally(() => { if (el) (el as HTMLElement).style.viewTransitionName = ''; });
}
