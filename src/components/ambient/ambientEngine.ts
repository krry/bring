/**
 * ambientEngine.ts — generative Web Audio ambient engine v2
 * Standalone (no framework deps) — adapted from ouracle/apps/web/src/lib/ambientEngine.ts
 *
 * Svelte stores replaced with a minimal writable/get shim (API-identical).
 * `browser` check replaced with `typeof window !== 'undefined'`.
 */

// ── Tiny store shim (replaces svelte/store) ───────────────────────────────────

function writable<T>(initial: T) {
  let _value = initial;
  const _subs = new Set<(v: T) => void>();
  return {
    get value(): T { return _value; },
    set(v: T) { _value = v; _subs.forEach(fn => fn(v)); },
    subscribe(fn: (v: T) => void): () => void {
      _subs.add(fn);
      fn(_value);
      return () => _subs.delete(fn);
    },
  };
}
type Writable<T> = ReturnType<typeof writable<T>>;
function get<T>(store: Writable<T>): T { return store.value; }

const browser = typeof window !== 'undefined';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SceneId =
  | 'drizzle' | 'storm'     | 'river'  | 'wind'
  | 'leaves'  | 'fire'      | 'asmr'   | 'bowls'
  | 'earth'   | 'drone'     | 'ocean'  | 'desert'
  | 'waterfall'| 'night'    | 'jungle' | 'binaural';

export const SCENES: { id: SceneId; label: string }[] = [
  { id: 'drizzle',   label: 'drizzle'   },
  { id: 'storm',     label: 'storm'     },
  { id: 'river',     label: 'river'     },
  { id: 'ocean',     label: 'ocean'     },
  { id: 'waterfall', label: 'waterfall' },
  { id: 'wind',      label: 'wind'      },
  { id: 'desert',    label: 'desert'    },
  { id: 'leaves',    label: 'leaves'    },
  { id: 'night',     label: 'night'     },
  { id: 'jungle',    label: 'jungle'    },
  { id: 'fire',      label: 'fire'      },
  { id: 'asmr',      label: 'asmr'      },
  { id: 'bowls',     label: 'bowls'     },
  { id: 'earth',     label: 'earth'     },
  { id: 'drone',     label: 'drone'     },
  { id: 'binaural',  label: 'binaural'  },
];

/** Binaural beat frequency Hz — seeker-controlled, default theta (6 Hz). */
export const binauralBeat = writable(6);

export const ambientRunning = writable(false);
export const ambientScene   = writable<SceneId>('binaural');

// ── Engine state ──────────────────────────────────────────────────────────────

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let liveOscillators: OscillatorNode[] = [];
let liveSources: AudioBufferSourceNode[] = [];
let liveSchedulers: Array<() => void> = [];
let liveBinauralR: Array<{ osc: OscillatorNode; base: number }> = [];

// ── Core helpers ──────────────────────────────────────────────────────────────

function getCtx(): AudioContext {
  if (!ctx || ctx.state === 'closed') ctx = new AudioContext();
  return ctx;
}

function makePinkBuf(ctx: AudioContext, seconds = 4): AudioBuffer {
  const frames = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, frames, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
    for (let i = 0; i < frames; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886*b0 + w*0.0555179; b1 = 0.99332*b1 + w*0.0750759;
      b2 = 0.96900*b2 + w*0.1538520; b3 = 0.86650*b3 + w*0.3104856;
      b4 = 0.55000*b4 + w*0.5329522; b5 = -0.7616*b5 - w*0.0168980;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w*0.5362) * 0.11;
      b6 = w * 0.115926;
    }
  }
  return buf;
}

function makeNoiseBuf(ctx: AudioContext, seconds = 4): AudioBuffer {
  const frames = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, frames, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < frames; i++) d[i] = Math.random() * 2 - 1;
  }
  return buf;
}

function noiseSource(ctx: AudioContext, buf: AudioBuffer): AudioBufferSourceNode {
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  src.loopStart = Math.random() * buf.duration;
  src.loopEnd = buf.duration;
  return src;
}

function makeReverb(ctx: AudioContext, duration: number, decay: number): ConvolverNode {
  const conv = ctx.createConvolver();
  const len = Math.floor(ctx.sampleRate * duration);
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    for (let i = 0; i < len; i++)
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  conv.buffer = ir;
  return conv;
}

function lfo(
  ctx: AudioContext,
  hz: number,
  depth: number,
  target: AudioParam,
  phase = Math.random() * Math.PI * 2,
): OscillatorNode {
  const osc = ctx.createOscillator();
  const g   = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = hz;
  g.gain.value = depth;
  osc.connect(g);
  g.connect(target);
  osc.start(Math.max(0, ctx.currentTime - phase / (Math.PI * 2 * hz)));
  liveOscillators.push(osc);
  return osc;
}

function noiseBand(
  ctx: AudioContext,
  buf: AudioBuffer,
  type: BiquadFilterType,
  freq: number,
  q: number,
  gainVal: number,
  dest: AudioNode,
): { filter: BiquadFilterNode; gain: GainNode } {
  const src    = noiseSource(ctx, buf);
  const filter = ctx.createBiquadFilter();
  const gain   = ctx.createGain();
  filter.type  = type;
  filter.frequency.value = freq;
  filter.Q.value = q;
  gain.gain.value = gainVal;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  src.start();
  liveSources.push(src);
  return { filter, gain };
}

function dropScheduler(
  ctx: AudioContext,
  dest: AudioNode,
  opts: {
    rateHz: number;
    variance: number;
    freq: number;
    freqVar: number;
    q: number;
    dropMs: number;
    gain: number;
    gainVar: number;
    filterType?: BiquadFilterType;
  }
): () => void {
  const { rateHz, variance, freq, freqVar, q, dropMs, gain, gainVar, filterType = 'bandpass' } = opts;
  let running = true;

  const CACHE = 16;
  const dropFrames = Math.max(8, Math.floor(ctx.sampleRate * dropMs / 1000));
  const bufs: AudioBuffer[] = Array.from({ length: CACHE }, () => {
    const b = ctx.createBuffer(1, dropFrames, ctx.sampleRate);
    const d = b.getChannelData(0);
    const decay = dropFrames * (0.1 + Math.random() * 0.25);
    for (let i = 0; i < dropFrames; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / decay);
    return b;
  });
  let idx = 0;

  function fire() {
    if (!running) return;
    const src  = ctx.createBufferSource();
    const filt = ctx.createBiquadFilter();
    const g    = ctx.createGain();
    src.buffer = bufs[idx++ % CACHE];
    filt.type  = filterType;
    filt.frequency.value = freq * (1 + (Math.random() - 0.5) * 2 * freqVar);
    filt.Q.value = q;
    g.gain.value = Math.max(0, gain + (Math.random() - 0.5) * 2 * gainVar);
    src.connect(filt); filt.connect(g); g.connect(dest);
    src.start();
    const interval = (1000 / rateHz) * (1 - variance / 2 + Math.random() * variance);
    setTimeout(fire, Math.max(10, interval));
  }
  fire();
  return () => { running = false; };
}

// ── Scenes ────────────────────────────────────────────────────────────────────

function buildDrizzle(ctx: AudioContext, master: GainNode) {
  const rev = makeReverb(ctx, 2.0, 4);
  rev.connect(master);
  const dry = ctx.createGain();
  dry.gain.value = 0.65;
  dry.connect(master);

  const tap = noiseBand(ctx, makePinkBuf(ctx, 4), 'bandpass', 3200, 3.5, 0.0, rev);
  tap.gain.gain.value = 0.08;
  lfo(ctx, 11.3, 0.22, tap.gain.gain);
  lfo(ctx, 4.7,  0.14, tap.gain.gain);

  const puddle = noiseBand(ctx, makePinkBuf(ctx, 5), 'bandpass', 420, 2.8, 0.0, dry);
  puddle.gain.gain.value = 0.06;
  lfo(ctx, 3.1, 0.18, puddle.gain.gain);
  lfo(ctx, 1.7, 0.10, puddle.gain.gain);

  noiseBand(ctx, makePinkBuf(ctx, 3), 'highpass', 7000, 0.3, 0.04, rev);

  liveSchedulers.push(dropScheduler(ctx, dry, {
    rateHz: 4, variance: 0.75, freq: 2600, freqVar: 0.45, q: 3.5,
    dropMs: 55, gain: 0.32, gainVar: 0.18,
  }));
  liveSchedulers.push(dropScheduler(ctx, rev, {
    rateHz: 2, variance: 0.85, freq: 380, freqVar: 0.40, q: 2.2,
    dropMs: 80, gain: 0.28, gainVar: 0.14,
  }));
}

function buildStorm(ctx: AudioContext, master: GainNode) {
  const rev = makeReverb(ctx, 2.5, 2.5);
  rev.connect(master);
  const dry = ctx.createGain();
  dry.gain.value = 0.55;
  dry.connect(master);

  const pour = noiseBand(ctx, makePinkBuf(ctx, 4), 'bandpass', 2400, 1.0, 0.0, rev);
  pour.gain.gain.value = 0.30;
  lfo(ctx, 22,  0.28, pour.gain.gain);
  lfo(ctx, 8.7, 0.20, pour.gain.gain);

  const impact = noiseBand(ctx, makePinkBuf(ctx, 5), 'bandpass', 580, 1.8, 0.0, rev);
  impact.gain.gain.value = 0.24;
  lfo(ctx, 6.1, 0.22, impact.gain.gain);
  lfo(ctx, 2.5, 0.16, impact.gain.gain);

  const thunder = noiseBand(ctx, makeNoiseBuf(ctx, 8), 'lowpass', 85, 0.5, 0.38, rev);
  lfo(ctx, 0.012, 0.22, thunder.gain.gain);

  noiseBand(ctx, makePinkBuf(ctx, 3), 'highpass', 4500, 0.4, 0.10, rev);

  liveSchedulers.push(dropScheduler(ctx, dry, {
    rateHz: 18, variance: 0.5, freq: 1800, freqVar: 0.5, q: 1.5,
    dropMs: 35, gain: 0.22, gainVar: 0.14,
  }));
}

function buildRiver(ctx: AudioContext, master: GainNode) {
  const rev = makeReverb(ctx, 2.5, 3.5);
  rev.connect(master);

  const body = noiseBand(ctx, makePinkBuf(ctx, 6), 'lowpass', 420, 0.3, 0.48, rev);
  lfo(ctx, 0.07, 0.12, body.gain.gain);

  const gurgle = noiseBand(ctx, makePinkBuf(ctx, 4), 'bandpass', 920, 2.2, 0.0, rev);
  gurgle.gain.gain.value = 0.18;
  lfo(ctx, 0.38, 0.18, gurgle.gain.gain);
  lfo(ctx, 0.19, 0.10, gurgle.gain.gain);

  noiseBand(ctx, makePinkBuf(ctx, 3), 'highpass', 4800, 0.3, 0.05, rev);
}

function buildOcean(ctx: AudioContext, master: GainNode) {
  const rev = makeReverb(ctx, 3.5, 2.5);
  rev.connect(master);

  const swell = noiseBand(ctx, makePinkBuf(ctx, 12), 'lowpass', 290, 0.25, 0.0, rev);
  swell.gain.gain.value = 0.48;
  lfo(ctx, 0.083, 0.32, swell.gain.gain);

  const shore = noiseBand(ctx, makePinkBuf(ctx, 8), 'bandpass', 680, 0.6, 0.0, rev);
  shore.gain.gain.value = 0.28;
  lfo(ctx, 0.10, 0.22, shore.gain.gain);

  const spray = noiseBand(ctx, makeNoiseBuf(ctx, 3), 'highpass', 5800, 0.4, 0.0, rev);
  spray.gain.gain.value = 0.06;
  lfo(ctx, 0.083, 0.05, spray.gain.gain);

  const depth = noiseBand(ctx, makeNoiseBuf(ctx, 8), 'lowpass', 95, 0.4, 0.15, rev);
  lfo(ctx, 0.04, 0.06, depth.gain.gain);
}

function buildWaterfall(ctx: AudioContext, master: GainNode) {
  const rev = makeReverb(ctx, 2.8, 2.0);
  rev.connect(master);

  const wall = noiseBand(ctx, makeNoiseBuf(ctx, 5), 'lowpass', 9000, 0.1, 0.62, rev);
  lfo(ctx, 0.02, 0.06, wall.gain.gain);

  const plunge = noiseBand(ctx, makePinkBuf(ctx, 6), 'lowpass', 230, 0.5, 0.48, rev);
  lfo(ctx, 0.025, 0.08, plunge.gain.gain);

  noiseBand(ctx, makeNoiseBuf(ctx, 3), 'highpass', 7500, 0.3, 0.09, rev);

  const splash = noiseBand(ctx, makePinkBuf(ctx, 4), 'bandpass', 2600, 1.5, 0.0, rev);
  splash.gain.gain.value = 0.16;
  lfo(ctx, 0.20, 0.14, splash.gain.gain);
}

function buildWind(ctx: AudioContext, master: GainNode) {
  const rev = makeReverb(ctx, 4.0, 5);
  rev.connect(master);

  const breeze = noiseBand(ctx, makeNoiseBuf(ctx, 6), 'bandpass', 500, 0.3, 0.40, rev);
  lfo(ctx, 0.022, 140, breeze.filter.frequency);
  lfo(ctx, 0.035, 0.12, breeze.gain.gain);

  const flutter = noiseBand(ctx, makeNoiseBuf(ctx, 4), 'bandpass', 2200, 0.8, 0.11, rev);
  lfo(ctx, 0.07, 0.08, flutter.gain.gain);

  const air = noiseBand(ctx, makeNoiseBuf(ctx, 5), 'lowpass', 160, 0.5, 0.24, rev);
  lfo(ctx, 0.018, 0.10, air.gain.gain);
}

function buildDesert(ctx: AudioContext, master: GainNode) {
  const rev = makeReverb(ctx, 5, 6);
  rev.connect(master);

  const wind = noiseBand(ctx, makeNoiseBuf(ctx, 7), 'bandpass', 560, 0.3, 0.33, rev);
  lfo(ctx, 0.015, 130, wind.filter.frequency);
  lfo(ctx, 0.020, 0.12, wind.gain.gain);

  noiseBand(ctx, makeNoiseBuf(ctx, 3), 'highpass', 6800, 0.5, 0.06, rev);

  const vast = noiseBand(ctx, makeNoiseBuf(ctx, 6), 'lowpass', 105, 0.6, 0.22, rev);
  lfo(ctx, 0.009, 0.08, vast.gain.gain);
}

function buildLeaves(ctx: AudioContext, master: GainNode) {
  const rev = makeReverb(ctx, 1.5, 4);
  rev.connect(master);
  const dry = ctx.createGain();
  dry.gain.value = 0.65;
  dry.connect(master);

  const rustle = noiseBand(ctx, makePinkBuf(ctx, 5), 'bandpass', 3200, 1.5, 0.0, rev);
  rustle.gain.gain.value = 0.12;
  lfo(ctx, 0.30, 0.12, rustle.gain.gain);
  lfo(ctx, 0.13, 0.07, rustle.gain.gain);

  const moss = noiseBand(ctx, makePinkBuf(ctx, 4), 'lowpass', 280, 0.5, 0.28, rev);
  lfo(ctx, 0.05, 0.07, moss.gain.gain);

  liveSchedulers.push(dropScheduler(ctx, dry, {
    rateHz: 3, variance: 0.65, freq: 2800, freqVar: 0.5, q: 1.8,
    dropMs: 90, gain: 0.30, gainVar: 0.18,
  }));
  liveSchedulers.push(dropScheduler(ctx, dry, {
    rateHz: 1, variance: 0.90, freq: 1100, freqVar: 0.45, q: 1.4,
    dropMs: 130, gain: 0.24, gainVar: 0.14,
  }));
}

function buildFire(ctx: AudioContext, master: GainNode) {
  const rev = makeReverb(ctx, 1.0, 3);
  rev.connect(master);

  const roar = noiseBand(ctx, makeNoiseBuf(ctx, 5), 'lowpass', 340, 0.5, 0.46, rev);
  lfo(ctx, 0.03, 50, roar.filter.frequency);
  lfo(ctx, 0.025, 0.08, roar.gain.gain);

  const crackle = noiseBand(ctx, makeNoiseBuf(ctx, 3), 'bandpass', 1400, 3.8, 0.22, rev);
  lfo(ctx, 0.45, 800, crackle.filter.frequency);
  lfo(ctx, 0.31, 0.14, crackle.gain.gain);

  const embers = noiseBand(ctx, makeNoiseBuf(ctx, 2), 'bandpass', 5500, 2.0, 0.07, rev);
  lfo(ctx, 0.52, 0.06, embers.gain.gain);

  const hearth = noiseBand(ctx, makeNoiseBuf(ctx, 6), 'lowpass', 80, 0.7, 0.28, rev);
  lfo(ctx, 0.018, 0.08, hearth.gain.gain);
}

function buildAsmr(ctx: AudioContext, master: GainNode) {
  const rev = makeReverb(ctx, 0.5, 7);
  rev.connect(master);
  const dry = ctx.createGain();
  dry.gain.value = 0.75;
  dry.connect(master);

  const fabric = noiseBand(ctx, makePinkBuf(ctx, 5), 'bandpass', 3600, 1.2, 0.0, dry);
  fabric.gain.gain.value = 0.20;
  lfo(ctx, 0.04, 0.10, fabric.gain.gain);

  const breath = noiseBand(ctx, makePinkBuf(ctx, 6), 'bandpass', 380, 0.6, 0.0, dry);
  breath.gain.gain.value = 0.16;
  lfo(ctx, 0.13, 0.12, breath.gain.gain);

  noiseBand(ctx, makeNoiseBuf(ctx, 3), 'highpass', 7500, 0.5, 0.09, dry);

  liveSchedulers.push(dropScheduler(ctx, dry, {
    rateHz: 0.7, variance: 0.90, freq: 5500, freqVar: 0.35, q: 0.9,
    dropMs: 220, gain: 0.24, gainVar: 0.14, filterType: 'highpass',
  }));
}

function buildBowls(ctx: AudioContext, master: GainNode) {
  const rev = makeReverb(ctx, 6, 6);
  rev.connect(master);

  const bowls: [number, number, number, number][] = [
    [174,  6,   0.30, 0.8],
    [396,  4,   0.22, 0.65],
    [528,  3.5, 0.20, 0.6],
    [741,  4,   0.15, 0.7],
    [963,  5,   0.09, 0.75],
  ];

  bowls.forEach(([hz, beat, gainVal, width], i) => {
    [-width, width].forEach((pan, ch) => {
      const osc    = ctx.createOscillator();
      const gain   = ctx.createGain();
      const panner = ctx.createStereoPanner();
      osc.type = 'sine';
      osc.frequency.value = hz + ch * beat;
      gain.gain.value = gainVal;
      panner.pan.value = pan;
      lfo(ctx, 0.008 + i * 0.003, 0.6, osc.frequency);
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(rev);
      osc.start();
      liveOscillators.push(osc);
    });
  });
}

function buildEarth(ctx: AudioContext, master: GainNode) {
  const rev = makeReverb(ctx, 1.2, 4);
  rev.connect(master);

  const sub = noiseBand(ctx, makeNoiseBuf(ctx, 6), 'lowpass', 120, 0.6, 0.44, rev);
  lfo(ctx, 0.03, 0.10, sub.gain.gain);

  const grain = noiseBand(ctx, makeNoiseBuf(ctx, 3), 'bandpass', 2600, 2.5, 0.0, rev);
  grain.gain.gain.value = 0.16;
  lfo(ctx, 0.28, 0.14, grain.gain.gain);
  lfo(ctx, 0.11, 0.08, grain.gain.gain);

  const gravel = noiseBand(ctx, makeNoiseBuf(ctx, 4), 'bandpass', 600, 1.2, 0.26, rev);
  lfo(ctx, 0.07, 0.07, gravel.gain.gain);
}

function buildNight(ctx: AudioContext, master: GainNode) {
  const rev = makeReverb(ctx, 2.5, 4);
  rev.connect(master);

  const crickets = noiseBand(ctx, makeNoiseBuf(ctx, 4), 'bandpass', 4800, 5.0, 0.18, rev);
  lfo(ctx, 0.55, 0.10, crickets.gain.gain);
  lfo(ctx, 0.08, 180, crickets.filter.frequency);

  const frogs = noiseBand(ctx, makeNoiseBuf(ctx, 3), 'bandpass', 680, 2.8, 0.20, rev);
  lfo(ctx, 0.22, 0.14, frogs.gain.gain);
  lfo(ctx, 0.11, 70, frogs.filter.frequency);

  const air = noiseBand(ctx, makePinkBuf(ctx, 5), 'lowpass', 200, 0.4, 0.16, rev);
  lfo(ctx, 0.02, 0.06, air.gain.gain);

  [220, 329.6].forEach((hz, i) => {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    const pan = ctx.createStereoPanner();
    osc.type = 'sine';
    osc.frequency.value = hz;
    g.gain.value = 0.07;
    pan.pan.value = i === 0 ? -0.4 : 0.4;
    lfo(ctx, 0.008, 1.5, osc.frequency);
    lfo(ctx, 0.05, 0.05, g.gain);
    osc.connect(g); g.connect(pan); pan.connect(rev);
    osc.start(); liveOscillators.push(osc);
  });
}

function buildJungle(ctx: AudioContext, master: GainNode) {
  const rev = makeReverb(ctx, 3.0, 3.5);
  rev.connect(master);
  const dry = ctx.createGain();
  dry.gain.value = 0.55;
  dry.connect(master);

  const insects = noiseBand(ctx, makeNoiseBuf(ctx, 4), 'bandpass', 5200, 3.2, 0.16, rev);
  lfo(ctx, 0.65, 0.08, insects.gain.gain);

  const frogs = noiseBand(ctx, makeNoiseBuf(ctx, 3), 'bandpass', 1200, 2.2, 0.20, rev);
  lfo(ctx, 0.28, 0.12, frogs.gain.gain);
  lfo(ctx, 0.16, 100, frogs.filter.frequency);

  liveSchedulers.push(dropScheduler(ctx, dry, {
    rateHz: 2, variance: 0.80, freq: 1900, freqVar: 0.55, q: 3,
    dropMs: 70, gain: 0.28, gainVar: 0.16,
  }));

  const floor = noiseBand(ctx, makePinkBuf(ctx, 5), 'lowpass', 180, 0.5, 0.26, rev);
  lfo(ctx, 0.03, 0.07, floor.gain.gain);

  const call = ctx.createOscillator();
  const callG = ctx.createGain();
  call.type = 'sine'; call.frequency.value = 180;
  callG.gain.value = 0.06;
  lfo(ctx, 0.007, 14, call.frequency);
  lfo(ctx, 0.04, 0.05, callG.gain);
  call.connect(callG); callG.connect(rev);
  call.start(); liveOscillators.push(call);
}

function buildDrone(ctx: AudioContext, master: GainNode) {
  const rev = makeReverb(ctx, 5, 5);
  rev.connect(master);

  const freqs = [111, 166.5, 222, 333];
  freqs.forEach((f, i) => {
    [-0.6, 0.6].forEach((pan, ch) => {
      const osc    = ctx.createOscillator();
      const gain   = ctx.createGain();
      const panner = ctx.createStereoPanner();
      osc.type = 'sine';
      osc.frequency.value = f + ch * (2 + i * 0.8);
      gain.gain.value = 0.14 / (i + 1);
      panner.pan.value = pan;
      lfo(ctx, 0.013 + i * 0.006, 0.35, osc.frequency);
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(rev);
      osc.start();
      liveOscillators.push(osc);
    });
  });
}

function buildBinaural(ctx: AudioContext, master: GainNode, beatHz: number) {
  const rev = makeReverb(ctx, 5, 4.5);
  rev.connect(master);

  const carriers = [111, 222, 333];
  carriers.forEach((base, i) => {
    const gainVal = 0.20 / (i + 1);

    const oscL  = ctx.createOscillator();
    const gL    = ctx.createGain();
    const panL  = ctx.createStereoPanner();
    oscL.type = 'sine';
    oscL.frequency.value = base;
    gL.gain.value = gainVal;
    panL.pan.value = -1;
    lfo(ctx, 0.013 + i * 0.005, 0.28, oscL.frequency);
    lfo(ctx, 0.07 + i * 0.03, gainVal * 0.25, gL.gain);
    oscL.connect(gL); gL.connect(panL); panL.connect(rev);
    oscL.start();
    liveOscillators.push(oscL);

    const oscR  = ctx.createOscillator();
    const gR    = ctx.createGain();
    const panR  = ctx.createStereoPanner();
    oscR.type = 'sine';
    oscR.frequency.value = base + beatHz;
    gR.gain.value = gainVal;
    panR.pan.value = 1;
    lfo(ctx, 0.013 + i * 0.005, 0.28, oscR.frequency);
    lfo(ctx, 0.07 + i * 0.03, gainVal * 0.25, gR.gain);
    oscR.connect(gR); gR.connect(panR); panR.connect(rev);
    oscR.start();
    liveOscillators.push(oscR);
    liveBinauralR.push({ osc: oscR, base });
  });

  // Warm overtone cluster
  [166.5, 277.5].forEach((hz, i) => {
    [-0.45, 0.45].forEach((pan) => {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      const p   = ctx.createStereoPanner();
      osc.type = 'sine';
      osc.frequency.value = hz;
      g.gain.value = 0.05 / (i + 1);
      p.pan.value = pan;
      lfo(ctx, 0.009 + i * 0.004, 0.20, osc.frequency);
      osc.connect(g); g.connect(p); p.connect(rev);
      osc.start();
      liveOscillators.push(osc);
    });
  });

  // Pink noise bed with breath + undercurrent
  const bed = noiseBand(ctx, makePinkBuf(ctx, 8), 'lowpass', 800, 0.3, 0.06, rev);
  lfo(ctx, 0.083, 0.04, bed.gain.gain);
  lfo(ctx, 0.5,   0.02, bed.gain.gain);

  // Sub-bass cardiac pulse — two coprime LFOs for irregular heartbeat
  const pulse = noiseBand(ctx, makePinkBuf(ctx, 6), 'lowpass', 65, 0.9, 0.0, rev);
  pulse.gain.gain.value = 0.07;
  lfo(ctx, 1.1, 0.055, pulse.gain.gain);
  lfo(ctx, 0.9, 0.030, pulse.gain.gain);

  // High shimmer
  const shimmer = noiseBand(ctx, makePinkBuf(ctx, 4), 'highpass', 6500, 0.5, 0.022, rev);
  lfo(ctx, 0.04, 0.012, shimmer.gain.gain);
}

// ── Public API ─────────────────────────────────────────────────────────────────

function teardown() {
  liveSchedulers.forEach(stop => stop());
  liveSchedulers = [];
  liveOscillators.forEach(o => { try { o.stop(); } catch { /* already stopped */ } });
  liveSources.forEach(s => { try { s.stop(); } catch { /* already stopped */ } });
  liveOscillators = [];
  liveSources = [];
  liveBinauralR = [];
}

export function startAmbient(scene: SceneId, volume: number) {
  if (!browser) return;
  stopAmbient();

  const audioCtx = getCtx();
  if (audioCtx.state === 'suspended') audioCtx.resume();

  masterGain = audioCtx.createGain();
  masterGain.gain.value = volume;
  masterGain.connect(audioCtx.destination);

  switch (scene) {
    case 'drizzle':   buildDrizzle(audioCtx, masterGain);   break;
    case 'storm':     buildStorm(audioCtx, masterGain);     break;
    case 'river':     buildRiver(audioCtx, masterGain);     break;
    case 'wind':      buildWind(audioCtx, masterGain);      break;
    case 'leaves':    buildLeaves(audioCtx, masterGain);    break;
    case 'ocean':     buildOcean(audioCtx, masterGain);     break;
    case 'waterfall': buildWaterfall(audioCtx, masterGain); break;
    case 'desert':    buildDesert(audioCtx, masterGain);    break;
    case 'night':     buildNight(audioCtx, masterGain);     break;
    case 'jungle':    buildJungle(audioCtx, masterGain);    break;
    case 'fire':      buildFire(audioCtx, masterGain);      break;
    case 'asmr':      buildAsmr(audioCtx, masterGain);      break;
    case 'bowls':     buildBowls(audioCtx, masterGain);     break;
    case 'earth':     buildEarth(audioCtx, masterGain);     break;
    case 'drone':     buildDrone(audioCtx, masterGain);     break;
    case 'binaural':  buildBinaural(audioCtx, masterGain, get(binauralBeat)); break;
  }

  ambientRunning.set(true);
  ambientScene.set(scene);
}

export function stopAmbient() {
  teardown();
  if (masterGain) { masterGain.disconnect(); masterGain = null; }
  ambientRunning.set(false);
}

export function setVolume(v: number) {
  if (masterGain && ctx) masterGain.gain.setTargetAtTime(v, ctx.currentTime, 0.1);
}

export function updateBinauralBeat(hz: number) {
  if (!ctx || liveBinauralR.length === 0) return;
  binauralBeat.set(hz);
  const t = ctx.currentTime;
  liveBinauralR.forEach(({ osc, base }) => {
    osc.frequency.setTargetAtTime(base + hz, t, 0.05);
  });
}
