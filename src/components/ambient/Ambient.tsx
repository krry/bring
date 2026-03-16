/**
 * Ambient.tsx — React component wrapping the ambient engine
 *
 * import { Ambient } from 'ambient-widget';
 *
 * <Ambient scene="binaural" volume={0.75} />
 */

import { useState, useEffect, useCallback } from 'react';
import {
  startAmbient, stopAmbient, ambientRunning, ambientScene,
  binauralBeat, updateBinauralBeat, SCENES,
} from './ambientEngine';
import type { SceneId } from './ambientEngine';

const MIN_HZ = 0.5;
const MAX_HZ = 100;
const LOG_RANGE = Math.log(MAX_HZ / MIN_HZ);

function sliderToHz(pos: number): number {
  return MIN_HZ * Math.exp((pos / 1000) * LOG_RANGE);
}
function hzToSlider(hz: number): number {
  return Math.log(hz / MIN_HZ) / LOG_RANGE * 1000;
}
function bandSymbol(hz: number): string {
  if (hz < 4)  return 'δ';
  if (hz < 8)  return 'θ';
  if (hz < 13) return 'α';
  if (hz < 30) return 'β';
  return 'γ';
}
function hzLabel(hz: number): string {
  return `${bandSymbol(hz)} · ${hz < 10 ? hz.toFixed(1) : Math.round(hz)} Hz`;
}

// Tiny hook to subscribe to a store value
function useStore<T>(store: { value: T; subscribe(fn: (v: T) => void): () => void }): T {
  const [val, setVal] = useState(store.value);
  useEffect(() => store.subscribe(setVal), [store]);
  return val;
}

export interface AmbientProps {
  scene?: SceneId;
  volume?: number;
}

export function Ambient({ scene: defaultScene = 'binaural', volume = 0.75 }: AmbientProps) {
  const running = useStore(ambientRunning);
  const scene   = useStore(ambientScene);
  const hz      = useStore(binauralBeat);
  const [open, setOpen] = useState(false);

  // Set initial scene from prop
  useEffect(() => { ambientScene.set(defaultScene); }, [defaultScene]);

  const toggle = useCallback(() => {
    if (running) stopAmbient();
    else startAmbient(scene, volume);
  }, [running, scene, volume]);

  const switchScene = useCallback((s: SceneId) => {
    ambientScene.set(s);
    if (running) startAmbient(s, volume);
  }, [running, volume]);

  const onSlide = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newHz = Math.round(sliderToHz(Number(e.target.value)) * 10) / 10;
    if (running && scene === 'binaural') updateBinauralBeat(newHz);
    else binauralBeat.set(newHz);
  }, [running, scene]);

  const sliderPos = Math.round(hzToSlider(hz));

  // Collapsed pill
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="ambient"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '1.1rem', lineHeight: 1, padding: '0.1rem 0.2rem',
          color: running ? 'var(--accent, #a78bfa)' : 'var(--muted, #888)',
          transition: 'color 0.15s',
        }}
      >♪</button>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <button
        onClick={toggle}
        title={running ? 'stop' : 'start'}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '1rem', lineHeight: 1, padding: '0.1rem 0.2rem',
          color: running ? 'var(--accent, #a78bfa)' : 'var(--muted, #888)',
          transition: 'color 0.15s',
        }}
      >♪</button>

      <select
        value={scene}
        onChange={e => switchScene(e.target.value as SceneId)}
        aria-label="ambient scene"
        style={{
          appearance: 'none', background: 'none', border: 'none',
          color: 'var(--muted, #888)', cursor: 'pointer',
          fontFamily: 'var(--font-mono, monospace)', fontSize: '0.65rem',
          letterSpacing: '0.08em', padding: 0,
        }}
      >
        {SCENES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
      </select>

      {scene === 'binaural' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', width: '96px' }}>
          <span style={{ fontSize: '0.58rem', letterSpacing: '0.06em', color: 'var(--muted, #888)', fontVariantNumeric: 'tabular-nums' }}>
            {hzLabel(hz)}
          </span>
          <input
            type="range" min={0} max={1000} step={1}
            value={sliderPos}
            onChange={onSlide}
            aria-label="binaural beat frequency"
            style={{ width: '100%' }}
          />
        </div>
      )}

      <button
        onClick={() => setOpen(false)}
        title="collapse"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '0.7rem', color: 'var(--muted, #888)', lineHeight: 1,
          padding: '0.1rem', opacity: 0.6,
        }}
      >×</button>
    </div>
  );
}

export default Ambient;
