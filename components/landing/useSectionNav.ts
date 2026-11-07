'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';

const EASE = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // cubic-bezier(0.77,0,0.175,1) feel

/**
 * Landing section navigation: Lenis smooth scroll on the window, one key press = one section,
 * extra presses ignored mid-move, keys never hijacked inside inputs/sliders, touch swipe, IO-based active index.
 */
export function useSectionNav(count: number, enabled: boolean, reduced: boolean) {
  const [active, setActive] = useState(0);
  const lenis = useRef<Lenis | null>(null);
  const moving = useRef(false);
  const activeRef = useRef(0);
  const sections = useRef<HTMLElement[]>([]);
  const register = useCallback((i: number) => (el: HTMLElement | null) => { if (el) sections.current[i] = el; }, []);

  useEffect(() => {
    if (!enabled) return;
    const l = reduced ? null : new Lenis({ duration: 1.1, smoothWheel: true, lerp: 0.1 });
    lenis.current = l;
    let raf = 0;
    const loop = (t: number) => { l?.raf(t); raf = requestAnimationFrame(loop); };
    if (l) raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); l?.destroy(); lenis.current = null; };
  }, [enabled, reduced]);

  useEffect(() => {
    const els = sections.current.filter(Boolean);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting && e.intersectionRatio >= 0.55) {
          const i = els.indexOf(e.target as HTMLElement);
          if (i >= 0) { activeRef.current = i; setActive(i); }
        }
      }
    }, { threshold: [0.55] });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [count]);

  const goTo = useCallback((i: number) => {
    const target = Math.max(0, Math.min(count - 1, i));
    const el = sections.current[target];
    if (!el || moving.current) return;
    moving.current = true;
    activeRef.current = target;
    setActive(target);
    const done = () => { moving.current = false; };
    if (reduced) { el.scrollIntoView({ block: 'start' }); setTimeout(done, 50); return; }
    if (lenis.current) lenis.current.scrollTo(el, { duration: 0.75, easing: EASE, lock: true, onComplete: done });
    else { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); setTimeout(done, 750); }
    setTimeout(done, 900); // safety
  }, [count, reduced]);

  const next = useCallback(() => goTo(activeRef.current + 1), [goTo]);
  const prev = useCallback(() => goTo(activeRef.current - 1), [goTo]);

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (k === 'ArrowDown' || k === 'PageDown' || k === ' ' || k === 'j' || k === 'J') { e.preventDefault(); if (!moving.current) next(); }
      else if (k === 'ArrowUp' || k === 'PageUp' || k === 'k' || k === 'K') { e.preventDefault(); if (!moving.current) prev(); }
      else if (k === 'Home') { e.preventDefault(); goTo(0); }
      else if (k === 'End') { e.preventDefault(); goTo(count - 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled, next, prev, goTo, count]);

  // touch swipe (vertical)
  useEffect(() => {
    if (!enabled) return;
    let y0 = 0, t0 = 0;
    const start = (e: TouchEvent) => { y0 = e.touches[0].clientY; t0 = Date.now(); };
    const end = (e: TouchEvent) => {
      const dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dy) > 60 && Date.now() - t0 < 600 && !moving.current) { if (dy < 0) next(); else prev(); }
    };
    window.addEventListener('touchstart', start, { passive: true });
    window.addEventListener('touchend', end, { passive: true });
    return () => { window.removeEventListener('touchstart', start); window.removeEventListener('touchend', end); };
  }, [enabled, next, prev]);

  return { active, goTo, next, prev, register, isMoving: () => moving.current };
}
