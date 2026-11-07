'use client';
import { useEffect, useRef } from 'react';
import { useExplainer } from './useExplainer';
import type { SceneProps } from '@/components/scenes/types';

/** useExplainer wired to the SceneProps contract (replayKey / finishKey / onPhase). */
export function useSceneExplainer(props: SceneProps, durationMs: number) {
  const ex = useExplainer({ active: props.active, durationMs: props.reduced ? 10 : durationMs, onDone: () => props.onPhase?.('done'), startDone: props.startDone });
  const lastReplay = useRef(props.replayKey);
  const lastFinish = useRef(props.finishKey);
  useEffect(() => { if (props.replayKey !== lastReplay.current) { lastReplay.current = props.replayKey; ex.replay(); } }, [props.replayKey, ex]);
  useEffect(() => { if (props.finishKey !== lastFinish.current) { lastFinish.current = props.finishKey; ex.finish(); } }, [props.finishKey, ex]);
  const onPhase = props.onPhase;
  useEffect(() => { onPhase?.(ex.phase); }, [ex.phase, onPhase]);
  return ex;
}
