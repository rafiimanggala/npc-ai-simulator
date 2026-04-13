import { InfoModal } from './info-modal.js';

export class Controls {
  constructor(engine, registry, graphRenderer) {
    this.engine = engine;
    this.registry = registry;
    this.graphRenderer = graphRenderer;
    this._activeId = null;
    this._infoModal = new InfoModal();
    this._initTabs();
    this._initControls();
    this._initInfoPanel();
  }

  _initTabs() {
    const container = document.getElementById('technique-tabs');
    this.registry.list().forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'tab';
      btn.textContent = t.name;
      btn.dataset.id = t.id;
      btn.addEventListener('click', () => this._onTabClick(t.id));
      container.appendChild(btn);
    });
  }

  _onTabClick(id) {
    this._activeId = id;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab[data-id="${id}"]`).classList.add('active');
    document.getElementById('graph-title').textContent = this.registry.techniques.get(id).name;
    this.graphRenderer.clear();
    this.graphRenderer.showSVG();
    if (this.onSwitch) this.onSwitch(id);
  }

  _initControls() {
    const container = document.getElementById('controls');
    const speeds = [0.25, 0.5, 1, 2, 4];
    let speedIdx = 2;

    const playBtn = this._btn('▶ Play', 'primary', () => {
      this.engine.running ? this.engine.pause() : this.engine.resume();
      playBtn.textContent = this.engine.running ? '⏸ Pause' : '▶ Play';
    });

    const resetBtn = this._btn('🔄 Reset', 'secondary', () => {
      if (this.onReset) this.onReset();
    });

    const speedBtn = this._btn(`Speed: ${speeds[speedIdx]}x`, 'secondary', () => {
      speedIdx = (speedIdx + 1) % speeds.length;
      this.engine.setSpeed(speeds[speedIdx]);
      speedBtn.textContent = `Speed: ${speeds[speedIdx]}x`;
    });

    const infoBtn = this._btn('Game Examples', 'secondary', () => {
      if (this._activeId) this._infoModal.show(this._activeId);
    });
    infoBtn.style.background = '#0d419d';
    infoBtn.style.color = '#58a6ff';

    container.append(playBtn, resetBtn, speedBtn, infoBtn);
  }

  _btn(text, cls, handler) {
    const btn = document.createElement('button');
    btn.className = `ctrl-btn ${cls}`;
    btn.textContent = text;
    btn.addEventListener('click', handler);
    return btn;
  }

  _initInfoPanel() {
    const panel = document.getElementById('info-panel');
    this._stateEl = this._infoItem(panel, 'State', 'IDLE', 'blue');
    this._detailEl = this._infoItem(panel, 'Detail', '-', 'green');
    this._fpsEl = this._infoItem(panel, 'FPS', '0', 'green');
  }

  _infoItem(parent, label, value, color) {
    const div = document.createElement('div');
    div.className = 'info-item';
    div.innerHTML = `${label}: <span class="value ${color}">${value}</span>`;
    parent.appendChild(div);
    return div.querySelector('.value');
  }

  updateInfo(state, fps) {
    if (state) {
      this._stateEl.textContent = state.label || 'NONE';
      this._detailEl.textContent = state.detail || '-';
    }
    this._fpsEl.textContent = fps;
  }

  activateTab(id) {
    this._onTabClick(id);
  }
}
