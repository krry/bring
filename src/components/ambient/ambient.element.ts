/**
 * ambient.element.ts — <ambient-widget> Web Component
 *
 * Usage:
 *   <ambient-widget scene="binaural" position="bottom-right" theme="auto"></ambient-widget>
 *   <script src="https://kerry.ink/widgets/ambient/ambient.wc.js"></script>
 *
 * Attributes:
 *   scene     — default scene id (default: 'binaural')
 *   position  — corner: bottom-right | bottom-left | top-right | top-left
 *   volume    — 0–1 (default: 0.75)
 *   theme     — light | dark | auto (default: auto)
 */

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

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls?: string,
  attrs?: Record<string, string>,
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (attrs) Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  return e;
}

class AmbientElement extends HTMLElement {
  private shadow: ShadowRoot;
  private _size: 'small' | 'medium' = 'small';
  private _unsubs: Array<() => void> = [];

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['position', 'scene', 'volume', 'theme'];
  }

  connectedCallback() {
    this._render();
    this._unsubs.push(
      ambientRunning.subscribe(() => this._updatePlayState()),
      ambientScene.subscribe(() => this._updateSceneUI()),
      binauralBeat.subscribe(() => this._updateBeatUI()),
    );
    const scene = this.getAttribute('scene') as SceneId | null;
    if (scene && SCENES.find(s => s.id === scene)) ambientScene.set(scene);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if ((this.getAttribute('theme') || 'auto') === 'auto') this._render();
    });
  }

  disconnectedCallback() {
    stopAmbient();
    this._unsubs.forEach(fn => fn());
    this._unsubs = [];
  }

  attributeChangedCallback(name: string, old: string, next: string) {
    if (old !== next && (name === 'theme' || name === 'position')) this._render();
  }

  private _isDark(): boolean {
    const t = this.getAttribute('theme') || 'auto';
    if (t === 'auto') return window.matchMedia('(prefers-color-scheme: dark)').matches;
    return t === 'dark';
  }

  private _buildCSS(): string {
    const dark = this._isDark();
    const p    = this.getAttribute('position') || 'bottom-right';
    const posMap: Record<string, string> = {
      'bottom-right': 'bottom:21px;right:21px',
      'bottom-left':  'bottom:21px;left:21px',
      'top-right':    'top:21px;right:21px',
      'top-left':     'top:21px;left:21px',
    };
    const pos = posMap[p] ?? posMap['bottom-right'];

    return `
:host {
  display:block; position:fixed; ${pos}; z-index:9000;
  /* Absolute base — immune to host page font-size. All em units resolve to this. */
  font-size:14px !important;
  font-family:-apple-system,'SF Pro Text',system-ui,sans-serif;
  --gb:${dark ? 'rgba(18,18,22,.75)' : 'rgba(255,255,255,.618)'};
  --gb2:${dark ? 'rgba(255,255,255,.10)' : 'rgba(255,255,255,.55)'};
  --text:${dark ? '#e0e0e6' : '#1a1a2e'};
  --muted:${dark ? '#78788a' : '#333'};
  --accent:${dark ? 'hsl(208,62%,62%)' : 'hsl(208,62%,38%)'};
  --sh:${dark ? '0 8px 32px rgba(0,0,0,.55),0 2px 8px rgba(0,0,0,.3)' : '0 8px 32px rgba(0,0,0,.10),0 2px 8px rgba(0,0,0,.07)'};
  --spring:cubic-bezier(.34,1.26,.64,1);
}
@keyframes float { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-3px) scale(1.01)} }
@keyframes pulse-ring {
  0%{box-shadow:0 0 0 0 rgba(167,139,250,.4)}
  70%{box-shadow:0 0 0 8px rgba(167,139,250,0)}
  100%{box-shadow:0 0 0 0 rgba(167,139,250,0)}
}
.w {
  background:var(--gb); backdrop-filter:blur(20px) saturate(180%);
  -webkit-backdrop-filter:blur(20px) saturate(180%);
  border:1px solid var(--gb2); box-shadow:var(--sh); color:var(--text);
  border-radius:1.14em; overflow:hidden;
  transition:all .4s var(--spring); animation:float 7s ease-in-out infinite;
}
.w[data-size="small"] {
  width:3.43em; height:3.43em; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
}
.w[data-size="small"].on { animation:float 7s ease-in-out infinite,pulse-ring 2.5s ease-out infinite; }
.w[data-size="small"] .panel { display:none; }
.w[data-size="medium"] .icon { display:none; }
.icon { font-size:1.3em; line-height:1; color:var(--muted); transition:color .2s; user-select:none; }
.w[data-size="small"].on .icon { color:var(--accent); }
.w[data-size="medium"] { width:188px; animation:none; }
.glyph {
  font-size:1.3em; line-height:1; color:var(--muted);
  transition:color .2s; user-select:none;
  cursor:pointer; flex-shrink:0;
}
.glyph:hover { color:var(--text); }
.w[data-size="medium"].on .glyph { color:var(--accent); }
.panel { padding:.45em .6em; display:flex; flex-direction:column; gap:.45em; }
.row { display:flex; align-items:center; gap:.5em; }
.btn-play {
  background:none; border:1px solid var(--gb2); border-radius:8px;
  color:var(--muted); cursor:pointer; font-size:1em; line-height:1;
  padding:.25em .4em; transition:color .15s,border-color .15s,background .15s;
  flex-shrink:0; min-width:26px; text-align:center;
}
.btn-play:hover { color:var(--text); border-color:var(--accent); }
.btn-play.on { color:var(--accent); border-color:var(--accent); background:rgba(167,139,250,.1); }
.sel {
  appearance:none; background:none; border:none; color:var(--muted);
  cursor:pointer; font-family:inherit; font-size:1em;
  padding:0; flex:1; transition:color .15s;
}
.sel:hover,.sel:focus { color:var(--accent); outline:none; }
.sel option { background:${dark ? '#1a1a2e' : '#fff'}; color:${dark ? '#e0e0e6' : '#1a1a2e'}; }
.beat { display:flex; flex-direction:column; gap:.18em; }
.beat-lbl { font-size:.58em; letter-spacing:.06em; color:var(--muted); font-variant-numeric:tabular-nums; text-align:right; }
.beat-sl { appearance:none; background:${dark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.12)'}; border-radius:2px; height:2px; width:100%; cursor:pointer; }
.beat-sl::-webkit-slider-thumb { appearance:none; background:var(--accent); border-radius:50%; height:10px; width:10px; }
`;
  }

  private _render() {
    this.shadow.replaceChildren();

    const style = document.createElement('style');
    style.textContent = this._buildCSS();
    this.shadow.appendChild(style);

    // Widget container
    const w = el('div', 'w');
    w.dataset.size = this._size;

    // Small-state centered icon (hidden in medium)
    const icon = el('span', 'icon');
    icon.textContent = '♪';
    w.appendChild(icon);

    // Panel (hidden in small state)
    const panel = el('div', 'panel');

    // Row: glyph (collapse) + play + scene
    const row     = el('div', 'row');
    const rowGlyph = el('span', 'glyph');
    rowGlyph.textContent = '♪';
    const btnPlay = el('button', 'btn-play', { title: 'play / stop' });
    btnPlay.textContent = '▶';

    const sel = el('select', 'sel', { 'aria-label': 'scene' });
    SCENES.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.label;
      if (ambientScene.value === s.id) opt.selected = true;
      sel.appendChild(opt);
    });
    row.append(rowGlyph, btnPlay, sel);
    panel.appendChild(row);

    // Binaural beat control
    const beat    = el('div', 'beat');
    if (ambientScene.value !== 'binaural') beat.style.display = 'none';
    const beatLbl = el('span', 'beat-lbl');
    beatLbl.textContent = hzLabel(binauralBeat.value);
    const beatSl  = el('input', 'beat-sl', { type: 'range', min: '0', max: '1000', step: '1' });
    beatSl.value = String(Math.round(hzToSlider(binauralBeat.value)));
    beat.append(beatLbl, beatSl);
    panel.appendChild(beat);

    w.appendChild(panel);
    this.shadow.appendChild(w);

    this._bindEvents();
    this._updatePlayState();
  }

  private _bindEvents() {
    const w = this.shadow.querySelector('.w')!;

    w.addEventListener('click', (e) => {
      if (this._size === 'small') { e.stopPropagation(); this._setSize('medium'); }
    });

    this.shadow.querySelector('.glyph')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._setSize('small');
    });

    this.shadow.querySelector('.btn-play')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (ambientRunning.value) {
        stopAmbient();
      } else {
        const vol = parseFloat(this.getAttribute('volume') || '0.75');
        startAmbient(ambientScene.value as SceneId, vol);
      }
    });

    this.shadow.querySelector('.sel')?.addEventListener('change', (e) => {
      const scene = (e.target as HTMLSelectElement).value as SceneId;
      ambientScene.set(scene);
      if (ambientRunning.value) {
        startAmbient(scene, parseFloat(this.getAttribute('volume') || '0.75'));
      }
      this._updateBeatCtrl();
    });

    this.shadow.querySelector('.beat-sl')?.addEventListener('input', (e) => {
      const pos = Number((e.target as HTMLInputElement).value);
      const hz  = Math.round(sliderToHz(pos) * 10) / 10;
      if (ambientRunning.value && ambientScene.value === 'binaural') {
        updateBinauralBeat(hz);
      } else {
        binauralBeat.set(hz);
      }
      const lbl = this.shadow.querySelector('.beat-lbl');
      if (lbl) lbl.textContent = hzLabel(hz);
    });
  }

  private _setSize(size: 'small' | 'medium') {
    this._size = size;
    this.shadow.querySelector('.w')?.setAttribute('data-size', size);
  }

  private _updatePlayState() {
    const on  = ambientRunning.value;
    const w   = this.shadow.querySelector('.w');
    const btn = this.shadow.querySelector<HTMLButtonElement>('.btn-play');
    w?.classList.toggle('on', on);
    if (btn) { btn.textContent = on ? '■' : '▶'; btn.classList.toggle('on', on); }
  }

  private _updateSceneUI() {
    const sel = this.shadow.querySelector<HTMLSelectElement>('.sel');
    if (sel) sel.value = ambientScene.value;
    this._updateBeatCtrl();
  }

  private _updateBeatCtrl() {
    const el = this.shadow.querySelector<HTMLElement>('.beat');
    if (el) el.style.display = ambientScene.value === 'binaural' ? '' : 'none';
  }

  private _updateBeatUI() {
    const hz  = binauralBeat.value;
    const lbl = this.shadow.querySelector('.beat-lbl');
    const sl  = this.shadow.querySelector<HTMLInputElement>('.beat-sl');
    if (lbl) lbl.textContent = hzLabel(hz);
    if (sl)  sl.value = String(Math.round(hzToSlider(hz)));
  }
}

if (!customElements.get('ambient-widget')) {
  customElements.define('ambient-widget', AmbientElement);
}
