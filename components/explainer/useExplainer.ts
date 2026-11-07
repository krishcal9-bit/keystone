'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export type ExplainerPhase = 'idle' | 'playing' | 'done';

/**
 * Auto-play-then-hold controller for landing scenes.
 * - When `active` first becomes true, phase goes idle → playing, and → done after `durationMs`.
 * - `finish()` completes the sequence immediately (used when the user presses Down mid-sequence);
 *   scenes read `fast` to shorten remaining transitions instead of skipping.
 * - `replay()` restarts from idle (bump `key` to remount animated children).
 * - Returning to a finished scene shows the finished state (phase stays done).
 */
export function useExplainer({ active, durationMs, onDone, startDone = false }: { active: boolean; durationMs: number; onDone?: () => void; startDone?: boolean }) {
  const [phase, setPhase] = useState<ExplainerPhase>(startDone ? 'done' : 'idle');
  const [fast, setFast] = useState(startDone);
  const [key, setKey] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const started = useRef(startDone);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const clear = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };

  const start = useCallback(() => {
    clear();
    setFast(false);
    setPhase('playing');
    timer.current = setTimeout(() => { setPhase('done'); onDoneRef.current?.(); }, durationMs);
  }, [durationMs]);

  useEffect(() => {
    if (active && !started.current) {
      started.current = true;
      // small beat so the section transition lands first
      const pending = setTimeout(() => { timer.current = null; start(); }, 350);
      timer.current = pending;
      return () => {
        // cancelled before it started (StrictMode double-mount, or the section left early): allow a restart
        if (timer.current === pending) { clearTimeout(pending); timer.current = null; started.current = false; }
      };
    }
    return clear;
  }, [active, start]);

  const finish = useCallback(() => {
    if (phase !== 'playing') return;
    clear();
    setFast(true);
    setPhase('done');
    onDoneRef.current?.();
  }, [phase]);

  const replay = useCallback(() => {
    clear();
    setKey((k) => k + 1);
    setPhase('idle');
    setFast(false);
    timer.current = setTimeout(start, 60);
  }, [start]);

  return { phase, fast, key, finish, replay, playing: phase === 'playing', done: phase === 'done' };
}

/** Delay helper: returns 0 when finishing fast, otherwise the scheduled delay in seconds. */
export const when = (fast: boolean, seconds: number) => (fast ? 0 : seconds);
