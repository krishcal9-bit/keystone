'use client';
import { useState } from 'react';
import { useTheme } from '@/lib/theme';
import { DeskScene } from '@/components/scenes/DeskScene';
import { IsoBlockScene } from '@/components/scenes/IsoBlockScene';
import type { ExplainerPhase } from '@/components/explainer/useExplainer';

function Harness({ name, Scene }: { name: string; Scene: typeof DeskScene }) {
  const { theme } = useTheme();
  const [replayKey, setReplayKey] = useState(0);
  const [finishKey, setFinishKey] = useState(0);
  const [phase, setPhase] = useState<ExplainerPhase>('idle');
  return (
    <div style={{ position: 'relative', height: 900, overflow: 'hidden', background: 'var(--paper)' }}>
      <Scene active night={theme === 'dark'} reduced={false} replayKey={replayKey} finishKey={finishKey} onPhase={setPhase} />
      <div style={{ position: 'absolute', left: 24, top: 24, display: 'flex', gap: 8, alignItems: 'center', zIndex: 2 }}>
        <span className="pill" style={{ background: 'var(--surface)', padding: '4px 10px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 13 }}>{name} · {phase}</span>
        <button type="button" className="btn" style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', fontSize: 13 }} onClick={() => setReplayKey((k) => k + 1)}>Replay</button>
        <button type="button" className="btn" style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', fontSize: 13 }} onClick={() => setFinishKey((k) => k + 1)}>Finish</button>
      </div>
    </div>
  );
}

export default function DevScenes() {
  return (
    <div className="pt-16">
      <Harness name="Desk" Scene={DeskScene} />
      <Harness name="Iso block" Scene={IsoBlockScene} />
    </div>
  );
}
