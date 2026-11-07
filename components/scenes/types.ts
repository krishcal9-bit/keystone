import type { ExplainerPhase } from '@/components/explainer/useExplainer';

/**
 * Contract for every landing scene.
 * - `active`: this section is the current one (run ambient motion, auto-play the explainer).
 * - `night`: theme is dark (scene renders its night state; crossfade handled inside via .ks-t).
 * - `replayKey` increments when the user presses Replay; `finishKey` increments when the user
 *   presses Down mid-sequence (complete the sequence quickly, do not skip it).
 * - `onPhase` reports idle/playing/done so the section can show the Next cue and Replay button.
 * Scenes render a full-bleed SVG (viewBox 0 0 1440 900, preserveAspectRatio xMidYMid slice) and
 * put their parts in three groups with classes scene-layer-back / scene-layer-mid / scene-layer-front
 * so section transitions and cursor parallax can move layers at different speeds.
 */
export type SceneProps = {
  active: boolean;
  night: boolean;
  reduced: boolean;
  replayKey: number;
  finishKey: number;
  onPhase?: (phase: ExplainerPhase) => void;
  /** Mount directly in the finished state (the user already watched this section). */
  startDone?: boolean;
};
