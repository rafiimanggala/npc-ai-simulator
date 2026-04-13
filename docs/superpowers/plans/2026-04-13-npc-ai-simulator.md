# NPC AI Simulator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web-based NPC AI Simulator with 10 swappable AI techniques, real-time simulation + D3.js decision graph visualization.

**Architecture:** Plugin system — each AI technique implements an `AIBrain` interface (`update`, `getState`, `getGraphData`, `reset`, `getConfig`). Core shell handles rendering (p5.js), graph viz (D3.js), and technique switching via registry. All vanilla JS with ES modules, served statically.

**Tech Stack:** p5.js (CDN), D3.js v7 (CDN), vanilla HTML/CSS/JS with ES modules, `npx serve` for dev.

**Design Spec:** `docs/superpowers/specs/2026-04-13-npc-ai-simulator-design.md`

---

## File Map

```
npc-ai-simulator/
├── index.html                 # Entry point, CDN imports, layout
├── css/style.css              # Dark theme, split-screen layout
├── js/
│   ├── main.js                # Bootstrap: init engine, load default technique
│   ├── core/
│   │   ├── engine.js          # Game loop (requestAnimationFrame), timing, speed control
│   │   ├── world.js           # World state: entities list, grid, obstacles, waypoints
│   │   ├── renderer.js        # p5.js instance: draw world, entities, debug overlays
│   │   ├── graph-renderer.js  # D3.js: draw AI decision graph per technique
│   │   └── registry.js        # Register AI modules, switch active technique
│   ├── entities/
│   │   ├── npc.js             # NPC class: pos, vel, health, perception
│   │   └── player.js          # Player class: mouse-controlled position
│   ├── ai/
│   │   ├── base.js            # AIBrain base class (interface)
│   │   ├── fsm.js             # 1. Finite State Machine
│   │   ├── hfsm.js            # 2. Hierarchical FSM
│   │   ├── bt.js              # 3. Behavior Tree
│   │   ├── utility.js         # 4. Utility AI
│   │   ├── goap.js            # 5. GOAP
│   │   ├── pathfinding.js     # 6. A* Pathfinding
│   │   ├── steering.js        # 7. Steering / Flocking
│   │   ├── director.js        # 8. Director AI / DDA
│   │   ├── rl.js              # 9. Reinforcement Learning
│   │   └── llm-npc.js         # 10. LLM NPC
│   └── ui/
│       └── controls.js        # Tabs, play/pause/speed/reset, info panel
└── tests/
    └── ai-tests.html          # In-browser tests for AI logic modules
```

---

### Task 1: Project Setup + HTML Shell + CSS Theme

**Files:**
- Create: `index.html`
- Create: `css/style.css`
- Create: `js/main.js` (empty bootstrap)

- [ ] **Step 1: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NPC AI Simulator</title>
  <link rel="stylesheet" href="css/style.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js"></script>
</head>
<body>
  <header id="top-bar">
    <div class="logo">🧠 NPC AI Simulator</div>
    <nav id="technique-tabs"></nav>
  </header>
  <main id="app">
    <section id="simulation-panel">
      <div class="panel-header">SIMULATION WORLD</div>
      <div id="sim-canvas"></div>
    </section>
    <section id="graph-panel">
      <div class="panel-header">AI DECISION GRAPH — <span id="graph-title">FSM</span></div>
      <div id="graph-container"></div>
    </section>
  </main>
  <footer id="bottom-bar">
    <div id="controls"></div>
    <div id="info-panel"></div>
  </footer>
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `css/style.css`**

```css
* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --bg: #0d1117;
  --panel: #161b22;
  --border: #30363d;
  --text: #e6edf3;
  --text-muted: #8b949e;
  --blue: #58a6ff;
  --orange: #f0883e;
  --green: #3fb950;
  --red: #f85149;
  --yellow: #d29922;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

header#top-bar {
  background: var(--panel);
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.logo {
  font-size: 16px;
  font-weight: 700;
  color: var(--blue);
}

#technique-tabs {
  display: flex;
  gap: 6px;
}

.tab {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
  background: var(--border);
  color: var(--text-muted);
  border: none;
  font-family: inherit;
  transition: all 0.2s;
}

.tab:hover { color: var(--text); }
.tab.active { background: var(--green); color: white; }

main#app {
  flex: 1;
  display: flex;
  min-height: 0;
}

#simulation-panel, #graph-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

#simulation-panel { border-right: 1px solid var(--border); }

.panel-header {
  padding: 6px 12px;
  background: var(--panel);
  border-bottom: 1px solid var(--border);
  font-size: 11px;
  color: var(--text-muted);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

#sim-canvas { flex: 1; position: relative; }
#sim-canvas canvas { display: block; }

#graph-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

footer#bottom-bar {
  background: var(--panel);
  padding: 8px 16px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

#controls { display: flex; gap: 8px; align-items: center; }

.ctrl-btn {
  padding: 4px 14px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  border: none;
  font-family: inherit;
  transition: all 0.15s;
}

.ctrl-btn.primary { background: var(--green); color: white; }
.ctrl-btn.secondary { background: var(--border); color: var(--text-muted); }
.ctrl-btn:hover { filter: brightness(1.2); }

.speed-display {
  color: var(--text-muted);
  font-size: 12px;
  font-family: 'SF Mono', monospace;
}

.speed-display span { color: var(--blue); }

#info-panel {
  display: flex;
  gap: 20px;
  font-size: 11px;
  font-family: 'SF Mono', monospace;
}

.info-item { color: var(--text-muted); }
.info-item .value { font-weight: 600; }
.info-item .value.blue { color: var(--blue); }
.info-item .value.green { color: var(--green); }
.info-item .value.orange { color: var(--orange); }
.info-item .value.red { color: var(--red); }
```

- [ ] **Step 3: Create empty `js/main.js`**

```js
// NPC AI Simulator — Bootstrap
console.log('NPC AI Simulator loading...');
```

- [ ] **Step 4: Start dev server, verify layout in browser**

Run: `cd ~/projects/npc-ai-simulator && npx serve . -l 3000`
Open: `http://localhost:3000`
Expected: Dark page with header (logo + empty tabs), split panels, footer bar.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: project setup — HTML shell, dark theme CSS, CDN imports"
```

---

### Task 2: Core Engine + World + Entities

**Files:**
- Create: `js/core/engine.js`
- Create: `js/core/world.js`
- Create: `js/entities/npc.js`
- Create: `js/entities/player.js`
- Create: `js/ai/base.js`

- [ ] **Step 1: Create `js/ai/base.js` — AIBrain interface**

```js
export class AIBrain {
  constructor(world) {
    this.world = world;
    this.name = 'Base';
    this.description = '';
  }

  update(dt) {
    throw new Error('AIBrain.update() must be implemented');
  }

  getState() {
    return { label: 'NONE', details: {} };
  }

  getGraphData() {
    return { nodes: [], edges: [], activeNodeId: null };
  }

  reset() {
    throw new Error('AIBrain.reset() must be implemented');
  }

  getConfig() {
    return [];
  }

  setConfig(key, value) {}
}
```

- [ ] **Step 2: Create `js/entities/npc.js`**

```js
export class NPC {
  constructor(x, y, options = {}) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.speed = options.speed || 80;
    this.size = options.size || 16;
    this.color = options.color || '#58a6ff';
    this.health = options.health || 100;
    this.maxHealth = options.health || 100;
    this.detectionRange = options.detectionRange || 120;
    this.attackRange = options.attackRange || 30;
    this.fov = options.fov || Math.PI / 2;
    this.angle = 0;
  }

  moveTo(tx, ty, dt) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 2) return true;
    this.vx = (dx / dist) * this.speed;
    this.vy = (dy / dist) * this.speed;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.angle = Math.atan2(dy, dx);
    return false;
  }

  distanceTo(entity) {
    const dx = entity.x - this.x;
    const dy = entity.y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  canSee(entity) {
    const dist = this.distanceTo(entity);
    if (dist > this.detectionRange) return false;
    const angleToEntity = Math.atan2(entity.y - this.y, entity.x - this.x);
    let angleDiff = angleToEntity - this.angle;
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    return Math.abs(angleDiff) < this.fov / 2;
  }

  stop() {
    this.vx = 0;
    this.vy = 0;
  }
}
```

- [ ] **Step 3: Create `js/entities/player.js`**

```js
export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 12;
    this.color = '#f0883e';
    this.alive = true;
    this.health = 100;
  }

  updateFromMouse(mx, my, bounds) {
    this.x = Math.max(0, Math.min(mx, bounds.width));
    this.y = Math.max(0, Math.min(my, bounds.height));
  }
}
```

- [ ] **Step 4: Create `js/core/world.js`**

```js
import { NPC } from '../entities/npc.js';
import { Player } from '../entities/player.js';

export class World {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.npcs = [];
    this.player = new Player(width * 0.75, height * 0.5);
    this.waypoints = [];
    this.obstacles = [];
    this.grid = null;
    this.gridCellSize = 20;
  }

  addNPC(x, y, options) {
    const npc = new NPC(x, y, options);
    this.npcs.push(npc);
    return npc;
  }

  setWaypoints(points) {
    this.waypoints = points.map((p, i) => ({ id: i, x: p.x, y: p.y }));
  }

  setObstacles(rects) {
    this.obstacles = rects.map((r, i) => ({ id: i, ...r }));
  }

  initGrid(cols, rows) {
    this.grid = { cols, rows, cells: [] };
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.grid.cells.push({ col: c, row: r, walkable: true, cost: 1 });
      }
    }
    return this.grid;
  }

  getGridCell(col, row) {
    if (!this.grid || col < 0 || row < 0 || col >= this.grid.cols || row >= this.grid.rows) return null;
    return this.grid.cells[row * this.grid.cols + col];
  }

  pointInObstacle(x, y) {
    return this.obstacles.some(o => x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h);
  }

  reset() {
    this.npcs = [];
    this.player.x = this.width * 0.75;
    this.player.y = this.height * 0.5;
    this.player.health = 100;
    this.player.alive = true;
  }
}
```

- [ ] **Step 5: Create `js/core/engine.js`**

```js
export class Engine {
  constructor() {
    this.running = false;
    this.speed = 1.0;
    this.lastTime = 0;
    this.fps = 0;
    this.frameCount = 0;
    this.fpsTime = 0;
    this.onUpdate = null;
    this.onRender = null;
    this._raf = null;
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this._loop(this.lastTime);
  }

  pause() { this.running = false; }

  resume() {
    if (!this.running) {
      this.running = true;
      this.lastTime = performance.now();
      this._loop(this.lastTime);
    }
  }

  setSpeed(s) { this.speed = s; }

  _loop(now) {
    if (!this.running) return;
    const rawDt = (now - this.lastTime) / 1000;
    const dt = Math.min(rawDt, 0.05) * this.speed;
    this.lastTime = now;

    this.frameCount++;
    this.fpsTime += rawDt;
    if (this.fpsTime >= 1) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTime = 0;
    }

    if (this.onUpdate) this.onUpdate(dt);
    if (this.onRender) this.onRender();

    this._raf = requestAnimationFrame((t) => this._loop(t));
  }

  stop() {
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: core engine, world, entities, AIBrain base class"
```

---

### Task 3: p5.js Renderer + Registry + UI Controls

**Files:**
- Create: `js/core/renderer.js`
- Create: `js/core/graph-renderer.js`
- Create: `js/core/registry.js`
- Create: `js/ui/controls.js`
- Modify: `js/main.js`

- [ ] **Step 1: Create `js/core/renderer.js`**

```js
export class Renderer {
  constructor(containerId, world) {
    this.world = world;
    this.container = document.getElementById(containerId);
    this.p5instance = null;
    this._initP5();
  }

  _initP5() {
    const self = this;
    const sketch = (p) => {
      p.setup = () => {
        const rect = self.container.getBoundingClientRect();
        const canvas = p.createCanvas(rect.width, rect.height);
        canvas.parent(self.container);
        self.world.width = rect.width;
        self.world.height = rect.height;
      };

      p.draw = () => {
        const w = self.world;
        p.background(13, 17, 23);

        // Grid
        p.stroke(88, 166, 255, 15);
        p.strokeWeight(0.5);
        for (let x = 0; x < w.width; x += 30) p.line(x, 0, x, w.height);
        for (let y = 0; y < w.height; y += 30) p.line(0, y, w.width, y);

        // Obstacles
        p.noStroke();
        w.obstacles.forEach(o => {
          p.fill(48, 54, 61);
          p.rect(o.x, o.y, o.w, o.h, 2);
        });

        // Waypoints + connecting lines
        if (w.waypoints.length > 1) {
          p.stroke(63, 185, 80, 60);
          p.strokeWeight(1);
          for (let i = 0; i < w.waypoints.length; i++) {
            const a = w.waypoints[i];
            const b = w.waypoints[(i + 1) % w.waypoints.length];
            p.line(a.x, a.y, b.x, b.y);
          }
        }
        w.waypoints.forEach(wp => {
          p.noStroke();
          p.fill(63, 185, 80);
          p.circle(wp.x, wp.y, 8);
          p.fill(63, 185, 80, 60);
          p.circle(wp.x, wp.y, 14);
        });

        // NPCs
        w.npcs.forEach(npc => {
          // Vision cone
          p.fill(88, 166, 255, 15);
          p.noStroke();
          p.arc(npc.x, npc.y, npc.detectionRange * 2, npc.detectionRange * 2,
            npc.angle - npc.fov / 2, npc.angle + npc.fov / 2, p.PIE);

          // Body
          p.fill(npc.color);
          p.noStroke();
          p.push();
          p.translate(npc.x, npc.y);
          p.rotate(npc.angle);
          p.rect(-npc.size / 2, -npc.size / 2, npc.size, npc.size, 3);
          // Direction indicator
          p.fill(255, 255, 255, 180);
          p.triangle(npc.size / 2, 0, npc.size / 4, -4, npc.size / 4, 4);
          p.pop();

          // Glow
          p.drawingContext.shadowBlur = 12;
          p.drawingContext.shadowColor = npc.color;
          p.fill(npc.color);
          p.circle(npc.x, npc.y, 4);
          p.drawingContext.shadowBlur = 0;
        });

        // Player
        if (w.player.alive) {
          const pl = w.player;
          p.fill(240, 136, 62);
          p.noStroke();
          p.circle(pl.x, pl.y, pl.size);
          p.drawingContext.shadowBlur = 10;
          p.drawingContext.shadowColor = '#f0883e';
          p.circle(pl.x, pl.y, 6);
          p.drawingContext.shadowBlur = 0;
        }

        // Custom overlay from AI brain
        if (self.customDraw) self.customDraw(p);
      };

      p.mouseMoved = () => {
        const rect = self.container.getBoundingClientRect();
        self.world.player.updateFromMouse(
          p.mouseX, p.mouseY,
          { width: rect.width, height: rect.height }
        );
      };

      p.windowResized = () => {
        const rect = self.container.getBoundingClientRect();
        p.resizeCanvas(rect.width, rect.height);
        self.world.width = rect.width;
        self.world.height = rect.height;
      };
    };

    this.p5instance = new p5(sketch);
  }

  setCustomDraw(fn) { this.customDraw = fn; }
}
```

- [ ] **Step 2: Create `js/core/graph-renderer.js`**

```js
export class GraphRenderer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.svg = null;
    this.simulation = null;
    this._currentLayout = 'force';
    this._init();
  }

  _init() {
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${this.width} ${this.height}`);

    this.edgeGroup = this.svg.append('g').attr('class', 'edges');
    this.nodeGroup = this.svg.append('g').attr('class', 'nodes');
    this.labelGroup = this.svg.append('g').attr('class', 'labels');

    new ResizeObserver(() => {
      const r = this.container.getBoundingClientRect();
      this.width = r.width;
      this.height = r.height;
      this.svg.attr('viewBox', `0 0 ${this.width} ${this.height}`);
    }).observe(this.container);
  }

  update(graphData) {
    if (!graphData || !graphData.nodes) return;
    const { nodes, edges, activeNodeId, layout } = graphData;

    if (layout && layout !== this._currentLayout) {
      this._currentLayout = layout;
    }

    if (this._currentLayout === 'force') {
      this._renderForce(nodes, edges, activeNodeId);
    } else if (this._currentLayout === 'tree') {
      this._renderTree(nodes, edges, activeNodeId);
    } else if (this._currentLayout === 'custom') {
      this._renderCustom(nodes, edges, activeNodeId);
    }
  }

  _renderForce(nodes, edges, activeNodeId) {
    const w = this.width, h = this.height;

    // Assign fixed positions if provided, otherwise use force
    nodes.forEach(n => {
      if (n.fx == null) {
        n.fx = n.x || w / 2;
        n.fy = n.y || h / 2;
      }
    });

    // Edges
    const edgeSel = this.edgeGroup.selectAll('line').data(edges, d => d.source + '-' + d.target);
    edgeSel.exit().remove();
    const edgeEnter = edgeSel.enter().append('line');
    edgeSel.merge(edgeEnter)
      .attr('x1', d => (nodes.find(n => n.id === d.source) || {}).fx || 0)
      .attr('y1', d => (nodes.find(n => n.id === d.source) || {}).fy || 0)
      .attr('x2', d => (nodes.find(n => n.id === d.target) || {}).fx || 0)
      .attr('y2', d => (nodes.find(n => n.id === d.target) || {}).fy || 0)
      .attr('stroke', d => d.active ? '#58a6ff' : '#30363d')
      .attr('stroke-width', d => d.active ? 2.5 : 1.5)
      .attr('opacity', d => d.active ? 1 : 0.6);

    // Nodes
    const nodeSel = this.nodeGroup.selectAll('circle').data(nodes, d => d.id);
    nodeSel.exit().remove();
    const nodeEnter = nodeSel.enter().append('circle');
    nodeSel.merge(nodeEnter)
      .attr('cx', d => d.fx)
      .attr('cy', d => d.fy)
      .attr('r', d => d.id === activeNodeId ? 26 : 22)
      .attr('fill', d => d.id === activeNodeId ? (d.activeColor || '#0d419d') : '#21262d')
      .attr('stroke', d => d.id === activeNodeId ? (d.color || '#58a6ff') : '#30363d')
      .attr('stroke-width', d => d.id === activeNodeId ? 2.5 : 1.5)
      .style('filter', d => d.id === activeNodeId ? `drop-shadow(0 0 8px ${d.color || '#58a6ff'})` : 'none');

    // Labels
    const labelSel = this.labelGroup.selectAll('text').data(nodes, d => d.id);
    labelSel.exit().remove();
    const labelEnter = labelSel.enter().append('text');
    labelSel.merge(labelEnter)
      .attr('x', d => d.fx)
      .attr('y', d => d.fy + 4)
      .attr('text-anchor', 'middle')
      .attr('fill', d => d.id === activeNodeId ? (d.color || '#58a6ff') : '#8b949e')
      .attr('font-size', 10)
      .attr('font-weight', d => d.id === activeNodeId ? 'bold' : 'normal')
      .attr('font-family', "'SF Mono', monospace")
      .text(d => d.label);
  }

  _renderTree(nodes, edges, activeNodeId) {
    this._renderForce(nodes, edges, activeNodeId);
  }

  _renderCustom(nodes, edges, activeNodeId) {
    this._renderForce(nodes, edges, activeNodeId);
  }

  clear() {
    this.edgeGroup.selectAll('*').remove();
    this.nodeGroup.selectAll('*').remove();
    this.labelGroup.selectAll('*').remove();
  }

  renderHTML(htmlContent) {
    this.svg.style('display', 'none');
    let div = this.container.querySelector('.graph-html');
    if (!div) {
      div = document.createElement('div');
      div.className = 'graph-html';
      div.style.cssText = 'width:100%;height:100%;overflow:auto;padding:12px;';
      this.container.appendChild(div);
    }
    div.innerHTML = htmlContent;
  }

  showSVG() {
    this.svg.style('display', null);
    const div = this.container.querySelector('.graph-html');
    if (div) div.remove();
  }
}
```

- [ ] **Step 3: Create `js/core/registry.js`**

```js
export class Registry {
  constructor() {
    this.techniques = new Map();
    this.active = null;
    this.onSwitch = null;
  }

  register(id, name, factory) {
    this.techniques.set(id, { id, name, factory, instance: null });
  }

  switch(id, world) {
    const entry = this.techniques.get(id);
    if (!entry) return null;
    if (!entry.instance) {
      entry.instance = entry.factory(world);
    } else {
      entry.instance.world = world;
      entry.instance.reset();
    }
    this.active = entry;
    if (this.onSwitch) this.onSwitch(entry);
    return entry.instance;
  }

  getActive() {
    return this.active ? this.active.instance : null;
  }

  getActiveName() {
    return this.active ? this.active.name : '';
  }

  list() {
    return [...this.techniques.values()].map(t => ({ id: t.id, name: t.name }));
  }
}
```

- [ ] **Step 4: Create `js/ui/controls.js`**

```js
export class Controls {
  constructor(engine, registry, graphRenderer) {
    this.engine = engine;
    this.registry = registry;
    this.graphRenderer = graphRenderer;
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

    container.append(playBtn, resetBtn, speedBtn);
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
```

- [ ] **Step 5: Wire up `js/main.js`**

```js
import { Engine } from './core/engine.js';
import { World } from './core/world.js';
import { Renderer } from './core/renderer.js';
import { GraphRenderer } from './core/graph-renderer.js';
import { Registry } from './core/registry.js';
import { Controls } from './ui/controls.js';

// -- AI Module Imports (added as they're built) --
import { createFSM } from './ai/fsm.js';

// Init
const engine = new Engine();
const world = new World(800, 600);
const registry = new Registry();

// Register AI techniques
registry.register('fsm', 'FSM', (w) => createFSM(w));

// Wait for DOM
window.addEventListener('DOMContentLoaded', () => {
  const renderer = new Renderer('sim-canvas', world);
  const graphRenderer = new GraphRenderer('graph-container');
  const controls = new Controls(engine, registry, graphRenderer);

  let activeBrain = null;

  const switchTechnique = (id) => {
    world.reset();
    graphRenderer.clear();
    graphRenderer.showSVG();
    activeBrain = registry.switch(id, world);
    if (activeBrain && activeBrain.setupWorld) {
      activeBrain.setupWorld();
    }
    renderer.setCustomDraw(activeBrain && activeBrain.customDraw ? activeBrain.customDraw.bind(activeBrain) : null);
  };

  controls.onSwitch = switchTechnique;
  controls.onReset = () => {
    if (registry.active) switchTechnique(registry.active.id);
  };

  engine.onUpdate = (dt) => {
    if (activeBrain) activeBrain.update(dt);
  };

  engine.onRender = () => {
    if (activeBrain) {
      const state = activeBrain.getState();
      controls.updateInfo(
        { label: state.label, detail: state.detail || '' },
        engine.fps
      );
      graphRenderer.update(activeBrain.getGraphData());
    }
  };

  // Default: load first technique
  const first = registry.list()[0];
  if (first) {
    controls.activateTab(first.id);
    switchTechnique(first.id);
  }

  engine.start();
});
```

- [ ] **Step 6: Create stub `js/ai/fsm.js`** (so main.js doesn't crash — full FSM in next task)

```js
import { AIBrain } from './base.js';

export function createFSM(world) {
  const brain = new AIBrain(world);
  brain.name = 'FSM';
  brain.description = 'Finite State Machine — Guard Patrol';
  brain.update = () => {};
  brain.reset = () => {};
  brain.setupWorld = () => {};
  return brain;
}
```

- [ ] **Step 7: Verify in browser**

Run: `cd ~/projects/npc-ai-simulator && npx serve . -l 3000`
Expected: Dark UI, "FSM" tab active (green), split panels visible, footer with Play/Pause/Reset/Speed, empty simulation canvas with grid.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: p5.js renderer, D3.js graph, registry, UI controls, main bootstrap"
```

---

### Task 4: FSM AI Module (Guard Patrol)

**Files:**
- Modify: `js/ai/fsm.js`

- [ ] **Step 1: Implement full FSM**

Replace `js/ai/fsm.js` with the complete FSM implementation. States: IDLE → PATROL → DETECT → CHASE → ATTACK → RETURN. Guard NPC patrols 4 waypoints, detects player, chases, attacks, returns to post.

```js
import { AIBrain } from './base.js';

const STATES = {
  IDLE: 'IDLE',
  PATROL: 'PATROL',
  DETECT: 'DETECT',
  CHASE: 'CHASE',
  ATTACK: 'ATTACK',
  RETURN: 'RETURN',
};

export function createFSM(world) {
  let npc = null;
  let state = STATES.IDLE;
  let waypointIdx = 0;
  let idleTimer = 0;
  let detectTimer = 0;
  let attackTimer = 0;
  let lostTimer = 0;
  const IDLE_DURATION = 2;
  const DETECT_DURATION = 1;
  const ATTACK_COOLDOWN = 0.8;
  const LOST_DURATION = 3;
  let homePos = { x: 0, y: 0 };

  const brain = new AIBrain(world);
  brain.name = 'FSM';
  brain.description = 'Finite State Machine — Guard Patrol';

  brain.setupWorld = () => {
    world.setWaypoints([
      { x: world.width * 0.15, y: world.height * 0.2 },
      { x: world.width * 0.45, y: world.height * 0.2 },
      { x: world.width * 0.45, y: world.height * 0.7 },
      { x: world.width * 0.15, y: world.height * 0.7 },
    ]);
    world.setObstacles([
      { x: world.width * 0.28, y: world.height * 0.35, w: 40, h: 40 },
      { x: world.width * 0.5, y: world.height * 0.25, w: 30, h: 60 },
    ]);
    npc = world.addNPC(world.width * 0.15, world.height * 0.2);
    homePos = { x: npc.x, y: npc.y };
    state = STATES.IDLE;
    waypointIdx = 0;
    idleTimer = 0;
  };

  brain.update = (dt) => {
    if (!npc) return;
    const player = world.player;

    switch (state) {
      case STATES.IDLE:
        npc.stop();
        idleTimer += dt;
        if (idleTimer >= IDLE_DURATION) {
          state = STATES.PATROL;
          idleTimer = 0;
        }
        if (npc.canSee(player)) {
          state = STATES.DETECT;
          detectTimer = 0;
        }
        break;

      case STATES.PATROL:
        const wp = world.waypoints[waypointIdx];
        const arrived = npc.moveTo(wp.x, wp.y, dt);
        if (arrived) {
          waypointIdx = (waypointIdx + 1) % world.waypoints.length;
          state = STATES.IDLE;
          idleTimer = 0;
        }
        if (npc.canSee(player)) {
          state = STATES.DETECT;
          detectTimer = 0;
        }
        break;

      case STATES.DETECT:
        npc.stop();
        detectTimer += dt;
        if (!npc.canSee(player)) {
          state = STATES.PATROL;
          break;
        }
        if (detectTimer >= DETECT_DURATION) {
          state = STATES.CHASE;
        }
        break;

      case STATES.CHASE:
        npc.moveTo(player.x, player.y, dt);
        if (npc.distanceTo(player) < npc.attackRange) {
          state = STATES.ATTACK;
          attackTimer = 0;
        }
        if (!npc.canSee(player)) {
          lostTimer += dt;
          if (lostTimer >= LOST_DURATION) {
            state = STATES.RETURN;
            lostTimer = 0;
          }
        } else {
          lostTimer = 0;
        }
        break;

      case STATES.ATTACK:
        npc.stop();
        attackTimer += dt;
        if (attackTimer >= ATTACK_COOLDOWN) {
          player.health -= 10;
          attackTimer = 0;
          if (player.health <= 0) {
            player.alive = false;
            state = STATES.RETURN;
          }
        }
        if (npc.distanceTo(player) > npc.attackRange * 1.5) {
          state = STATES.CHASE;
        }
        break;

      case STATES.RETURN:
        const home = world.waypoints[0] || homePos;
        const atHome = npc.moveTo(home.x, home.y, dt);
        if (atHome) {
          state = STATES.IDLE;
          idleTimer = 0;
          waypointIdx = 0;
        }
        break;
    }
  };

  brain.getState = () => {
    const details = {
      IDLE: `Waiting ${idleTimer.toFixed(1)}s / ${IDLE_DURATION}s`,
      PATROL: `→ Waypoint ${waypointIdx + 1}/${world.waypoints.length}`,
      DETECT: `Alert! ${detectTimer.toFixed(1)}s / ${DETECT_DURATION}s`,
      CHASE: `Pursuing player (${lostTimer > 0 ? 'losing...' : 'locked'})`,
      ATTACK: `Attacking! CD: ${attackTimer.toFixed(1)}s`,
      RETURN: 'Returning to post',
    };
    return {
      label: state,
      detail: details[state] || '',
    };
  };

  brain.getGraphData = () => {
    const cx = 160, cy = 150;
    const positions = {
      IDLE:    { x: cx, y: 40 },
      PATROL:  { x: cx - 90, y: 110 },
      DETECT:  { x: cx, y: 110 },
      CHASE:   { x: cx + 90, y: 110 },
      ATTACK:  { x: cx + 90, y: 200 },
      RETURN:  { x: cx, y: 200 },
    };

    const stateColors = {
      IDLE: '#8b949e',
      PATROL: '#3fb950',
      DETECT: '#d29922',
      CHASE: '#f0883e',
      ATTACK: '#f85149',
      RETURN: '#58a6ff',
    };

    const nodes = Object.keys(STATES).map(s => ({
      id: s,
      label: s,
      fx: positions[s].x,
      fy: positions[s].y,
      color: stateColors[s],
      activeColor: stateColors[s] + '33',
    }));

    const transitions = [
      { source: 'IDLE', target: 'PATROL' },
      { source: 'PATROL', target: 'IDLE' },
      { source: 'IDLE', target: 'DETECT' },
      { source: 'PATROL', target: 'DETECT' },
      { source: 'DETECT', target: 'PATROL' },
      { source: 'DETECT', target: 'CHASE' },
      { source: 'CHASE', target: 'ATTACK' },
      { source: 'CHASE', target: 'RETURN' },
      { source: 'ATTACK', target: 'CHASE' },
      { source: 'ATTACK', target: 'RETURN' },
      { source: 'RETURN', target: 'IDLE' },
    ];

    const edges = transitions.map(t => ({
      ...t,
      active: t.source === state,
    }));

    return { nodes, edges, activeNodeId: state, layout: 'force' };
  };

  brain.reset = () => {
    state = STATES.IDLE;
    waypointIdx = 0;
    idleTimer = 0;
    detectTimer = 0;
    attackTimer = 0;
    lostTimer = 0;
  };

  return brain;
}
```

- [ ] **Step 2: Verify in browser**

Open `http://localhost:3000`. Expected:
- Left panel: Guard NPC (blue square) patrols 4 waypoints. Move mouse near NPC → enters DETECT → CHASE → ATTACK.
- Right panel: FSM graph with 6 nodes. Active state glows with color.
- Footer: State label updates in real-time.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: FSM guard patrol — 6 states, detection, chase, attack, return"
```

---

### Task 5: Behavior Tree AI Module

**Files:**
- Create: `js/ai/bt.js`
- Modify: `js/main.js` (add import + register)

- [ ] **Step 1: Create `js/ai/bt.js`**

Full BT engine + guard behavior tree: patrol → hear sound → investigate → see enemy → call backup → attack. Nodes: Selector, Sequence, Decorator, Action, Condition.

```js
import { AIBrain } from './base.js';

// BT Node types
const STATUS = { SUCCESS: 'success', FAILURE: 'failure', RUNNING: 'running' };

class BTNode {
  constructor(name, type) {
    this.name = name;
    this.type = type;
    this.status = null;
    this.children = [];
    this.id = BTNode._nextId++;
  }
  tick(bb, dt) { return STATUS.FAILURE; }
  reset() { this.status = null; this.children.forEach(c => c.reset()); }
}
BTNode._nextId = 0;

class Selector extends BTNode {
  constructor(name, children) { super(name, 'selector'); this.children = children; }
  tick(bb, dt) {
    for (const child of this.children) {
      const s = child.tick(bb, dt);
      child.status = s;
      if (s !== STATUS.FAILURE) { this.status = s; return s; }
    }
    this.status = STATUS.FAILURE;
    return STATUS.FAILURE;
  }
}

class Sequence extends BTNode {
  constructor(name, children) { super(name, 'sequence'); this.children = children; }
  tick(bb, dt) {
    for (const child of this.children) {
      const s = child.tick(bb, dt);
      child.status = s;
      if (s !== STATUS.SUCCESS) { this.status = s; return s; }
    }
    this.status = STATUS.SUCCESS;
    return STATUS.SUCCESS;
  }
}

class Inverter extends BTNode {
  constructor(child) { super('Inverter', 'decorator'); this.children = [child]; }
  tick(bb, dt) {
    const s = this.children[0].tick(bb, dt);
    this.children[0].status = s;
    if (s === STATUS.SUCCESS) { this.status = STATUS.FAILURE; return STATUS.FAILURE; }
    if (s === STATUS.FAILURE) { this.status = STATUS.SUCCESS; return STATUS.SUCCESS; }
    this.status = STATUS.RUNNING;
    return STATUS.RUNNING;
  }
}

class Condition extends BTNode {
  constructor(name, fn) { super(name, 'condition'); this._fn = fn; }
  tick(bb) {
    this.status = this._fn(bb) ? STATUS.SUCCESS : STATUS.FAILURE;
    return this.status;
  }
}

class Action extends BTNode {
  constructor(name, fn) { super(name, 'action'); this._fn = fn; }
  tick(bb, dt) { this.status = this._fn(bb, dt); return this.status; }
}

function flattenTree(node, list = []) {
  list.push(node);
  node.children.forEach(c => flattenTree(c, list));
  return list;
}

export function createBT(world) {
  let npc = null;
  let waypointIdx = 0;

  const bb = {
    target: null,
    lastKnownPos: null,
    alertLevel: 0,
    investigateTimer: 0,
    attackTimer: 0,
    backupCalled: false,
  };

  // Build tree
  const tree = new Selector('Root', [
    // 1. Attack sequence
    new Sequence('AttackSeq', [
      new Condition('EnemyInRange?', (b) => {
        if (!npc) return false;
        return npc.distanceTo(world.player) < npc.attackRange && npc.canSee(world.player);
      }),
      new Action('Attack', (b, dt) => {
        npc.stop();
        b.attackTimer += dt;
        if (b.attackTimer >= 0.8) {
          world.player.health -= 10;
          b.attackTimer = 0;
          if (world.player.health <= 0) { world.player.alive = false; return STATUS.SUCCESS; }
        }
        return STATUS.RUNNING;
      }),
    ]),
    // 2. Chase sequence
    new Sequence('ChaseSeq', [
      new Condition('EnemySeen?', (b) => npc && npc.canSee(world.player)),
      new Action('Chase', (b, dt) => {
        b.lastKnownPos = { x: world.player.x, y: world.player.y };
        b.alertLevel = Math.min(b.alertLevel + dt, 3);
        npc.moveTo(world.player.x, world.player.y, dt);
        if (npc.distanceTo(world.player) < npc.attackRange) return STATUS.SUCCESS;
        return STATUS.RUNNING;
      }),
    ]),
    // 3. Investigate sequence
    new Sequence('InvestigateSeq', [
      new Condition('HeardSomething?', (b) => b.lastKnownPos !== null && b.alertLevel > 0),
      new Action('Investigate', (b, dt) => {
        const arrived = npc.moveTo(b.lastKnownPos.x, b.lastKnownPos.y, dt);
        if (arrived) {
          b.investigateTimer += dt;
          npc.stop();
          npc.angle += dt * 2;
          if (b.investigateTimer >= 2) {
            b.lastKnownPos = null;
            b.alertLevel = 0;
            b.investigateTimer = 0;
            return STATUS.FAILURE;
          }
        }
        if (npc.canSee(world.player)) return STATUS.FAILURE;
        return STATUS.RUNNING;
      }),
    ]),
    // 4. Patrol sequence
    new Sequence('PatrolSeq', [
      new Condition('HasWaypoints?', () => world.waypoints.length > 0),
      new Action('Patrol', (b, dt) => {
        const wp = world.waypoints[waypointIdx];
        const arrived = npc.moveTo(wp.x, wp.y, dt);
        if (arrived) waypointIdx = (waypointIdx + 1) % world.waypoints.length;
        if (npc.canSee(world.player)) {
          b.lastKnownPos = { x: world.player.x, y: world.player.y };
          b.alertLevel = 1;
          return STATUS.FAILURE;
        }
        return STATUS.RUNNING;
      }),
    ]),
  ]);

  const allNodes = flattenTree(tree);

  const brain = new AIBrain(world);
  brain.name = 'Behavior Tree';
  brain.description = 'Behavior Tree — Guard with patrol, investigate, chase, attack';

  brain.setupWorld = () => {
    world.setWaypoints([
      { x: world.width * 0.1, y: world.height * 0.15 },
      { x: world.width * 0.4, y: world.height * 0.15 },
      { x: world.width * 0.4, y: world.height * 0.75 },
      { x: world.width * 0.1, y: world.height * 0.75 },
    ]);
    world.setObstacles([
      { x: world.width * 0.25, y: world.height * 0.35, w: 35, h: 35 },
    ]);
    npc = world.addNPC(world.width * 0.1, world.height * 0.15);
    waypointIdx = 0;
    Object.assign(bb, { target: null, lastKnownPos: null, alertLevel: 0, investigateTimer: 0, attackTimer: 0, backupCalled: false });
    tree.reset();
  };

  brain.update = (dt) => {
    if (!npc) return;
    allNodes.forEach(n => { n.status = null; });
    tree.tick(bb, dt);
  };

  brain.getState = () => {
    const running = allNodes.find(n => n.status === STATUS.RUNNING && n.type === 'action');
    return {
      label: running ? running.name : 'Idle',
      detail: `Alert: ${bb.alertLevel.toFixed(1)} | Player HP: ${world.player.health}`,
    };
  };

  brain.getGraphData = () => {
    const statusColor = { success: '#3fb950', failure: '#f85149', running: '#d29922' };
    let yOffset = 30;
    const xCenter = 160;
    const nodes = [];
    const edges = [];

    const layout = (node, x, y, level) => {
      nodes.push({
        id: node.id,
        label: node.name,
        fx: x, fy: y,
        color: statusColor[node.status] || '#8b949e',
        activeColor: (statusColor[node.status] || '#8b949e') + '33',
      });
      const childCount = node.children.length;
      const spread = Math.max(60, 280 / (level + 1));
      const startX = x - (spread * (childCount - 1)) / 2;
      node.children.forEach((child, i) => {
        edges.push({
          source: node.id,
          target: child.id,
          active: child.status === STATUS.RUNNING,
        });
        layout(child, startX + i * spread, y + 55, level + 1);
      });
    };

    layout(tree, xCenter, yOffset, 0);
    const runningNode = allNodes.find(n => n.status === STATUS.RUNNING);
    return { nodes, edges, activeNodeId: runningNode ? runningNode.id : null, layout: 'force' };
  };

  brain.reset = () => {
    waypointIdx = 0;
    Object.assign(bb, { target: null, lastKnownPos: null, alertLevel: 0, investigateTimer: 0, attackTimer: 0, backupCalled: false });
    tree.reset();
  };

  return brain;
}
```

- [ ] **Step 2: Add import to `js/main.js`**

Add after FSM import:
```js
import { createBT } from './ai/bt.js';
```

Add after FSM register:
```js
registry.register('bt', 'Behavior Tree', (w) => createBT(w));
```

- [ ] **Step 3: Verify in browser** — click "Behavior Tree" tab. Guard patrols, detects, chases. Tree graph shows node statuses (green/red/yellow).

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: Behavior Tree — selector/sequence/decorator/action nodes, guard AI"
```

---

### Task 6: A* Pathfinding AI Module

**Files:**
- Create: `js/ai/pathfinding.js`
- Modify: `js/main.js` (add import + register)

- [ ] **Step 1: Create `js/ai/pathfinding.js`**

A* on 20x20 grid. Click to toggle obstacles. NPC finds path from start to goal. Visualization: open/closed lists, path highlight.

```js
import { AIBrain } from './base.js';

function heuristic(a, b) {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

function aStar(grid, start, goal) {
  const cols = grid.cols, rows = grid.rows;
  const open = [start];
  const closed = new Set();
  const gScore = new Map();
  const fScore = new Map();
  const cameFrom = new Map();
  const key = (n) => `${n.col},${n.row}`;

  gScore.set(key(start), 0);
  fScore.set(key(start), heuristic(start, goal));

  const openSet = new Set([key(start)]);
  const closedCells = [];
  const openCells = [];

  while (open.length > 0) {
    open.sort((a, b) => (fScore.get(key(a)) || Infinity) - (fScore.get(key(b)) || Infinity));
    const current = open.shift();
    const ck = key(current);
    openSet.delete(ck);

    if (current.col === goal.col && current.row === goal.row) {
      const path = [];
      let c = current;
      while (c) { path.unshift(c); c = cameFrom.get(key(c)); }
      return { path, closedCells, openCells: [...openSet].map(k => { const [c,r] = k.split(','); return {col:+c,row:+r}; }) };
    }

    closed.add(ck);
    closedCells.push({ col: current.col, row: current.row });

    const neighbors = [
      { col: current.col - 1, row: current.row },
      { col: current.col + 1, row: current.row },
      { col: current.col, row: current.row - 1 },
      { col: current.col, row: current.row + 1 },
    ];

    for (const n of neighbors) {
      if (n.col < 0 || n.row < 0 || n.col >= cols || n.row >= rows) continue;
      const cell = grid.cells[n.row * cols + n.col];
      if (!cell.walkable) continue;
      const nk = key(n);
      if (closed.has(nk)) continue;

      const tentG = (gScore.get(ck) || 0) + cell.cost;
      if (tentG < (gScore.get(nk) || Infinity)) {
        cameFrom.set(nk, current);
        gScore.set(nk, tentG);
        fScore.set(nk, tentG + heuristic(n, goal));
        if (!openSet.has(nk)) {
          open.push(n);
          openSet.add(nk);
        }
      }
    }
    openCells.push({ col: current.col, row: current.row });
  }
  return { path: [], closedCells, openCells: [] };
}

export function createPathfinding(world) {
  const GRID_COLS = 20, GRID_ROWS = 15;
  let cellW, cellH;
  let start = { col: 1, row: 1 };
  let goal = { col: 18, row: 13 };
  let result = { path: [], closedCells: [], openCells: [] };
  let npc = null;
  let pathIdx = 0;
  let mode = 'obstacle'; // obstacle, start, goal

  const brain = new AIBrain(world);
  brain.name = 'A* Pathfinding';
  brain.description = 'A* pathfinding on grid — click to place obstacles';

  brain.setupWorld = () => {
    world.setWaypoints([]);
    world.setObstacles([]);
    const grid = world.initGrid(GRID_COLS, GRID_ROWS);
    cellW = world.width / GRID_COLS;
    cellH = world.height / GRID_ROWS;

    // Add some default obstacles
    const obstaclePositions = [
      [5,3],[5,4],[5,5],[5,6],[5,7],
      [10,2],[10,3],[10,4],[10,5],
      [10,8],[10,9],[10,10],[10,11],
      [15,5],[15,6],[15,7],[15,8],[15,9],
    ];
    obstaclePositions.forEach(([c,r]) => {
      const cell = world.getGridCell(c, r);
      if (cell) cell.walkable = false;
    });

    npc = world.addNPC(
      start.col * cellW + cellW / 2,
      start.row * cellH + cellH / 2,
      { speed: 120 }
    );
    pathIdx = 0;
    _recalc();
  };

  function _recalc() {
    if (!world.grid) return;
    result = aStar(world.grid, start, goal);
    pathIdx = 0;
  }

  brain.update = (dt) => {
    if (!npc || result.path.length === 0) return;
    if (pathIdx >= result.path.length) return;
    const target = result.path[pathIdx];
    const tx = target.col * cellW + cellW / 2;
    const ty = target.row * cellH + cellH / 2;
    const arrived = npc.moveTo(tx, ty, dt);
    if (arrived) pathIdx++;
  };

  brain.customDraw = (p) => {
    if (!world.grid) return;
    // Draw grid cells
    for (const cell of world.grid.cells) {
      const x = cell.col * cellW, y = cell.row * cellH;
      if (!cell.walkable) {
        p.fill(48, 54, 61);
        p.noStroke();
        p.rect(x, y, cellW - 1, cellH - 1, 2);
      }
    }
    // Closed list
    result.closedCells.forEach(c => {
      p.fill(13, 65, 157, 40);
      p.noStroke();
      p.rect(c.col * cellW, c.row * cellH, cellW - 1, cellH - 1);
    });
    // Open list
    result.openCells.forEach(c => {
      p.fill(88, 166, 255, 25);
      p.noStroke();
      p.rect(c.col * cellW, c.row * cellH, cellW - 1, cellH - 1);
    });
    // Path
    result.path.forEach((c, i) => {
      p.fill(i <= pathIdx ? 63, 185, 80 : 63, 185, 80, 100);
      p.noStroke();
      p.rect(c.col * cellW + 2, c.row * cellH + 2, cellW - 5, cellH - 5, 3);
    });
    // Start
    p.fill(63, 185, 80);
    p.circle(start.col * cellW + cellW / 2, start.row * cellH + cellH / 2, 12);
    // Goal
    p.fill(248, 81, 73);
    p.circle(goal.col * cellW + cellW / 2, goal.row * cellH + cellH / 2, 12);
  };

  brain.getState = () => ({
    label: pathIdx < result.path.length ? 'NAVIGATING' : 'ARRIVED',
    detail: `Path: ${result.path.length} cells | Step: ${pathIdx}/${result.path.length}`,
  });

  brain.getGraphData = () => {
    if (!world.grid) return { nodes: [], edges: [], activeNodeId: null };
    const w = 320, h = 240;
    const cw = w / GRID_COLS, ch = h / GRID_ROWS;
    const nodes = [];
    const edges = [];

    // Show path as graph nodes
    result.path.forEach((cell, i) => {
      nodes.push({
        id: i,
        label: i === 0 ? 'S' : i === result.path.length - 1 ? 'G' : `${i}`,
        fx: cell.col * cw + cw / 2,
        fy: cell.row * ch + ch / 2 + 20,
        color: i <= pathIdx ? '#3fb950' : '#58a6ff',
        activeColor: '#3fb95033',
      });
      if (i > 0) {
        edges.push({ source: i - 1, target: i, active: i === pathIdx });
      }
    });

    return { nodes, edges, activeNodeId: pathIdx < result.path.length ? pathIdx : null, layout: 'force' };
  };

  brain.reset = () => {
    pathIdx = 0;
    _recalc();
  };

  return brain;
}
```

- [ ] **Step 2: Add to `js/main.js`**

```js
import { createPathfinding } from './ai/pathfinding.js';
registry.register('pathfinding', 'A* Path', (w) => createPathfinding(w));
```

- [ ] **Step 3: Verify** — click "A* Path" tab. Grid visible, NPC navigates path, colored open/closed lists.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: A* pathfinding — 20x20 grid, obstacle placement, path visualization"
```

---

### Task 7: Steering / Flocking AI Module

**Files:**
- Create: `js/ai/steering.js`
- Modify: `js/main.js`

- [ ] **Step 1: Create `js/ai/steering.js`**

Craig Reynolds' boids: separation, alignment, cohesion. 30 agents. Player = seek target.

```js
import { AIBrain } from './base.js';

class Boid {
  constructor(x, y, id) {
    this.id = id;
    this.x = x; this.y = y;
    this.vx = (Math.random() - 0.5) * 60;
    this.vy = (Math.random() - 0.5) * 60;
    this.ax = 0; this.ay = 0;
    this.maxSpeed = 100;
    this.maxForce = 200;
    this.size = 6;
  }

  applyForce(fx, fy) { this.ax += fx; this.ay += fy; }

  update(dt, w, h) {
    this.vx += this.ax * dt; this.vy += this.ay * dt;
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > this.maxSpeed) {
      this.vx = (this.vx / speed) * this.maxSpeed;
      this.vy = (this.vy / speed) * this.maxSpeed;
    }
    this.x += this.vx * dt; this.y += this.vy * dt;
    // Wrap
    if (this.x < 0) this.x = w; if (this.x > w) this.x = 0;
    if (this.y < 0) this.y = h; if (this.y > h) this.y = 0;
    this.ax = 0; this.ay = 0;
  }
}

function steer(boid, tx, ty, maxSpeed, maxForce) {
  let dx = tx - boid.x, dy = ty - boid.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 0.01) return { x: 0, y: 0 };
  dx = (dx / dist) * maxSpeed - boid.vx;
  dy = (dy / dist) * maxSpeed - boid.vy;
  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag > maxForce) { dx = (dx / mag) * maxForce; dy = (dy / mag) * maxForce; }
  return { x: dx, y: dy };
}

export function createSteering(world) {
  let boids = [];
  const weights = { separation: 2.5, alignment: 1.0, cohesion: 1.0, seek: 0.8 };
  const perception = 60;

  const brain = new AIBrain(world);
  brain.name = 'Steering/Flocking';
  brain.description = 'Craig Reynolds Boids — separation, alignment, cohesion';

  brain.setupWorld = () => {
    world.setWaypoints([]);
    world.setObstacles([]);
    world.npcs = [];
    boids = [];
    for (let i = 0; i < 30; i++) {
      const b = new Boid(
        Math.random() * world.width * 0.5 + world.width * 0.05,
        Math.random() * world.height,
        i
      );
      boids.push(b);
      const npc = world.addNPC(b.x, b.y, { size: 8, speed: 100 });
      npc._boidRef = b;
    }
  };

  brain.update = (dt) => {
    const target = world.player;

    boids.forEach(boid => {
      let sepX = 0, sepY = 0, sepCount = 0;
      let aliVx = 0, aliVy = 0, aliCount = 0;
      let cohX = 0, cohY = 0, cohCount = 0;

      boids.forEach(other => {
        if (other.id === boid.id) return;
        const dx = other.x - boid.x, dy = other.y - boid.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < perception && dist > 0) {
          // Separation
          if (dist < perception * 0.5) {
            sepX -= dx / dist; sepY -= dy / dist; sepCount++;
          }
          // Alignment
          aliVx += other.vx; aliVy += other.vy; aliCount++;
          // Cohesion
          cohX += other.x; cohY += other.y; cohCount++;
        }
      });

      if (sepCount > 0) {
        const s = steer(boid, boid.x + sepX, boid.y + sepY, boid.maxSpeed, boid.maxForce);
        boid.applyForce(s.x * weights.separation, s.y * weights.separation);
      }
      if (aliCount > 0) {
        const s = steer(boid, boid.x + aliVx / aliCount, boid.y + aliVy / aliCount, boid.maxSpeed, boid.maxForce);
        boid.applyForce(s.x * weights.alignment, s.y * weights.alignment);
      }
      if (cohCount > 0) {
        const s = steer(boid, cohX / cohCount, cohY / cohCount, boid.maxSpeed, boid.maxForce);
        boid.applyForce(s.x * weights.cohesion, s.y * weights.cohesion);
      }
      // Seek player
      const sk = steer(boid, target.x, target.y, boid.maxSpeed, boid.maxForce);
      boid.applyForce(sk.x * weights.seek, sk.y * weights.seek);

      boid.update(dt, world.width, world.height);
    });

    // Sync NPC positions
    world.npcs.forEach((npc, i) => {
      if (boids[i]) {
        npc.x = boids[i].x; npc.y = boids[i].y;
        npc.angle = Math.atan2(boids[i].vy, boids[i].vx);
      }
    });
  };

  brain.getState = () => ({
    label: 'FLOCKING',
    detail: `Boids: ${boids.length} | Sep: ${weights.separation} Ali: ${weights.alignment} Coh: ${weights.cohesion}`,
  });

  brain.getGraphData = () => {
    const w = 320, h = 280;
    const barY = 30;
    const barH = 20;
    const bars = [
      { id: 'sep', label: 'Separation', value: weights.separation, max: 5, color: '#f85149' },
      { id: 'ali', label: 'Alignment', value: weights.alignment, max: 5, color: '#58a6ff' },
      { id: 'coh', label: 'Cohesion', value: weights.cohesion, max: 5, color: '#3fb950' },
      { id: 'seek', label: 'Seek', value: weights.seek, max: 5, color: '#f0883e' },
    ];

    const nodes = bars.map((b, i) => ({
      id: b.id,
      label: `${b.label}: ${b.value.toFixed(1)}`,
      fx: 60 + (b.value / b.max) * 200,
      fy: barY + i * 50 + 25,
      color: b.color,
      activeColor: b.color + '33',
    }));

    return { nodes, edges: [], activeNodeId: 'sep', layout: 'force' };
  };

  brain.reset = () => {};

  return brain;
}
```

- [ ] **Step 2: Add to `js/main.js`**

```js
import { createSteering } from './ai/steering.js';
registry.register('steering', 'Steering', (w) => createSteering(w));
```

- [ ] **Step 3: Verify** — 30 boids flocking, following mouse. Graph shows weight bars.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: steering/flocking — Reynolds boids, separation/alignment/cohesion"
```

---

### Task 8: Utility AI Module

**Files:**
- Create: `js/ai/utility.js`
- Modify: `js/main.js`

- [ ] **Step 1: Create `js/ai/utility.js`**

Score-based decision making. NPC has needs (hunger, energy, danger). Each action scored by response curves.

```js
import { AIBrain } from './base.js';

const ACTIONS = {
  PATROL: { name: 'Patrol', color: '#3fb950' },
  EAT: { name: 'Eat', color: '#f0883e' },
  SLEEP: { name: 'Sleep', color: '#58a6ff' },
  ATTACK: { name: 'Attack', color: '#f85149' },
  FLEE: { name: 'Flee', color: '#d29922' },
  INVESTIGATE: { name: 'Investigate', color: '#bc8cff' },
};

function linear(x) { return Math.max(0, Math.min(1, x)); }
function quadratic(x) { return Math.max(0, Math.min(1, x * x)); }
function inverse(x) { return Math.max(0, Math.min(1, 1 - x)); }
function logistic(x, k = 10, mid = 0.5) { return 1 / (1 + Math.exp(-k * (x - mid))); }

export function createUtility(world) {
  let npc = null;
  let currentAction = 'PATROL';
  let waypointIdx = 0;
  const needs = { hunger: 0.3, energy: 0.8, curiosity: 0.2 };
  const scores = {};
  let actionTimer = 0;

  const brain = new AIBrain(world);
  brain.name = 'Utility AI';
  brain.description = 'Score-based decision making with response curves';

  brain.setupWorld = () => {
    world.setWaypoints([
      { x: world.width * 0.1, y: world.height * 0.3 },
      { x: world.width * 0.4, y: world.height * 0.2 },
      { x: world.width * 0.35, y: world.height * 0.7 },
      { x: world.width * 0.1, y: world.height * 0.6 },
    ]);
    world.setObstacles([]);
    npc = world.addNPC(world.width * 0.2, world.height * 0.4);
    needs.hunger = 0.3; needs.energy = 0.8; needs.curiosity = 0.2;
    currentAction = 'PATROL';
    waypointIdx = 0;
  };

  function evaluate() {
    const playerDist = npc ? npc.distanceTo(world.player) / 300 : 1;
    const danger = 1 - Math.min(1, playerDist);

    scores.PATROL = linear(needs.energy) * inverse(danger) * 0.4;
    scores.EAT = quadratic(needs.hunger) * 0.9;
    scores.SLEEP = quadratic(1 - needs.energy) * 0.85;
    scores.ATTACK = logistic(danger, 8, 0.6) * linear(needs.energy) * 0.95;
    scores.FLEE = logistic(danger, 10, 0.7) * inverse(needs.energy) * 0.9;
    scores.INVESTIGATE = linear(needs.curiosity) * inverse(danger) * 0.5;

    let best = 'PATROL', bestScore = -1;
    for (const [action, score] of Object.entries(scores)) {
      if (score > bestScore) { bestScore = score; best = action; }
    }
    return best;
  }

  brain.update = (dt) => {
    if (!npc) return;

    // Needs drift
    needs.hunger = Math.min(1, needs.hunger + dt * 0.03);
    needs.energy = Math.max(0, needs.energy - dt * 0.015);
    needs.curiosity = Math.min(1, needs.curiosity + dt * 0.02);

    currentAction = evaluate();

    switch (currentAction) {
      case 'PATROL':
        const wp = world.waypoints[waypointIdx];
        if (npc.moveTo(wp.x, wp.y, dt)) waypointIdx = (waypointIdx + 1) % world.waypoints.length;
        break;
      case 'EAT':
        npc.stop();
        needs.hunger = Math.max(0, needs.hunger - dt * 0.15);
        break;
      case 'SLEEP':
        npc.stop();
        needs.energy = Math.min(1, needs.energy + dt * 0.1);
        break;
      case 'ATTACK':
        npc.moveTo(world.player.x, world.player.y, dt);
        if (npc.distanceTo(world.player) < npc.attackRange) {
          actionTimer += dt;
          if (actionTimer > 0.8) { world.player.health -= 10; actionTimer = 0; }
        }
        needs.energy = Math.max(0, needs.energy - dt * 0.05);
        break;
      case 'FLEE':
        const dx = npc.x - world.player.x, dy = npc.y - world.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        npc.moveTo(npc.x + (dx / dist) * 100, npc.y + (dy / dist) * 100, dt);
        break;
      case 'INVESTIGATE':
        npc.moveTo(world.player.x, world.player.y, dt);
        needs.curiosity = Math.max(0, needs.curiosity - dt * 0.1);
        break;
    }
  };

  brain.getState = () => ({
    label: currentAction,
    detail: `H:${needs.hunger.toFixed(2)} E:${needs.energy.toFixed(2)} C:${needs.curiosity.toFixed(2)}`,
  });

  brain.getGraphData = () => {
    const barWidth = 200;
    const barH = 25;
    const startX = 40, startY = 30;

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const nodes = sorted.map(([action, score], i) => ({
      id: action,
      label: `${ACTIONS[action].name}: ${score.toFixed(3)}`,
      fx: startX + score * barWidth,
      fy: startY + i * 40,
      color: ACTIONS[action].color,
      activeColor: ACTIONS[action].color + '33',
    }));

    return { nodes, edges: [], activeNodeId: currentAction, layout: 'force' };
  };

  brain.reset = () => {
    needs.hunger = 0.3; needs.energy = 0.8; needs.curiosity = 0.2;
    currentAction = 'PATROL'; waypointIdx = 0; actionTimer = 0;
  };

  return brain;
}
```

- [ ] **Step 2: Add to `js/main.js`**

```js
import { createUtility } from './ai/utility.js';
registry.register('utility', 'Utility AI', (w) => createUtility(w));
```

- [ ] **Step 3: Verify** — NPC switches actions based on needs. Score bars update real-time.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: utility AI — score-based decisions, response curves, needs system"
```

---

### Task 9: GOAP AI Module

**Files:**
- Create: `js/ai/goap.js`
- Modify: `js/main.js`

- [ ] **Step 1: Create `js/ai/goap.js`**

Goal-Oriented Action Planning. NPC plans action sequences to achieve goals. Backward A* over world state.

```js
import { AIBrain } from './base.js';

function planActions(actions, goal, worldState) {
  const queue = [{ state: { ...goal }, plan: [], cost: 0 }];
  const visited = new Set();
  let best = null;

  for (let iter = 0; iter < 200 && queue.length > 0; iter++) {
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift();
    const stateKey = JSON.stringify(current.state);
    if (visited.has(stateKey)) continue;
    visited.add(stateKey);

    const satisfied = Object.entries(current.state).every(([k, v]) => worldState[k] === v);
    if (satisfied) {
      if (!best || current.cost < best.cost) best = current;
      continue;
    }

    for (const action of actions) {
      const effectKeys = Object.keys(action.effects);
      const matchesGoal = Object.entries(current.state).some(
        ([k, v]) => action.effects[k] === v
      );
      if (!matchesGoal) continue;

      const newState = { ...current.state };
      for (const [k, v] of Object.entries(action.effects)) {
        if (newState[k] === v) delete newState[k];
      }
      for (const [k, v] of Object.entries(action.preconditions)) {
        newState[k] = v;
      }
      queue.push({
        state: newState,
        plan: [action, ...current.plan],
        cost: current.cost + action.cost,
      });
    }
  }
  return best ? best.plan : [];
}

export function createGOAP(world) {
  let npc = null;
  const worldState = { hasWeapon: false, inRange: false, enemyAlive: true, healthy: true };
  let currentPlan = [];
  let planIdx = 0;
  let actionTimer = 0;
  let currentGoal = 'KillEnemy';

  const actions = [
    { name: 'FindWeapon', preconditions: {}, effects: { hasWeapon: true }, cost: 3 },
    { name: 'PickUp', preconditions: { hasWeapon: false }, effects: { hasWeapon: true }, cost: 1 },
    { name: 'Approach', preconditions: { hasWeapon: true }, effects: { inRange: true }, cost: 2 },
    { name: 'Attack', preconditions: { hasWeapon: true, inRange: true }, effects: { enemyAlive: false }, cost: 1 },
    { name: 'Heal', preconditions: {}, effects: { healthy: true }, cost: 2 },
    { name: 'Flee', preconditions: {}, effects: { inRange: false }, cost: 1 },
  ];

  const goals = {
    KillEnemy: { enemyAlive: false },
    StayAlive: { healthy: true },
  };

  const brain = new AIBrain(world);
  brain.name = 'GOAP';
  brain.description = 'Goal-Oriented Action Planning — backward search over world state';

  brain.setupWorld = () => {
    world.setWaypoints([
      { x: world.width * 0.2, y: world.height * 0.5 },
    ]);
    world.setObstacles([
      { x: world.width * 0.3, y: world.height * 0.3, w: 20, h: 20 },
    ]);
    // Weapon pickup location
    world.waypoints.push({ id: 99, x: world.width * 0.15, y: world.height * 0.3 });
    npc = world.addNPC(world.width * 0.1, world.height * 0.6);
    npc.color = '#bc8cff';
    Object.assign(worldState, { hasWeapon: false, inRange: false, enemyAlive: true, healthy: true });
    _replan();
  };

  function _replan() {
    currentPlan = planActions(actions, goals[currentGoal], worldState);
    planIdx = 0;
    actionTimer = 0;
  }

  brain.update = (dt) => {
    if (!npc || currentPlan.length === 0) return;
    if (planIdx >= currentPlan.length) { _replan(); return; }

    const action = currentPlan[planIdx];
    actionTimer += dt;

    switch (action.name) {
      case 'FindWeapon':
      case 'PickUp':
        const wpn = world.waypoints.find(w => w.id === 99) || world.waypoints[0];
        if (npc.moveTo(wpn.x, wpn.y, dt)) {
          worldState.hasWeapon = true;
          npc.color = '#f85149';
          planIdx++; actionTimer = 0;
        }
        break;
      case 'Approach':
        npc.moveTo(world.player.x, world.player.y, dt);
        if (npc.distanceTo(world.player) < npc.attackRange * 2) {
          worldState.inRange = true;
          planIdx++; actionTimer = 0;
        }
        break;
      case 'Attack':
        npc.stop();
        if (actionTimer > 0.5) {
          world.player.health -= 15;
          actionTimer = 0;
          if (world.player.health <= 0) {
            worldState.enemyAlive = false;
            world.player.alive = false;
            planIdx++;
          }
        }
        break;
      case 'Heal':
        npc.stop();
        if (actionTimer > 2) { worldState.healthy = true; planIdx++; actionTimer = 0; }
        break;
      case 'Flee':
        const dx = npc.x - world.player.x, dy = npc.y - world.player.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        npc.moveTo(npc.x + (dx / d) * 80, npc.y + (dy / d) * 80, dt);
        if (npc.distanceTo(world.player) > 150) {
          worldState.inRange = false;
          planIdx++; actionTimer = 0;
        }
        break;
      default:
        planIdx++;
    }
  };

  brain.getState = () => {
    const action = currentPlan[planIdx];
    return {
      label: action ? action.name : 'PLANNING',
      detail: `Goal: ${currentGoal} | Plan: ${currentPlan.map(a => a.name).join('→')} | Step ${planIdx + 1}/${currentPlan.length}`,
    };
  };

  brain.getGraphData = () => {
    const startX = 40, startY = 50, stepW = 50;
    const nodes = currentPlan.map((action, i) => ({
      id: `step-${i}`,
      label: action.name,
      fx: startX + i * stepW,
      fy: startY + (i % 2) * 40,
      color: i < planIdx ? '#3fb950' : i === planIdx ? '#d29922' : '#8b949e',
      activeColor: i === planIdx ? '#d2992233' : '#21262d',
    }));

    // Add goal node
    nodes.push({
      id: 'goal',
      label: currentGoal,
      fx: startX + currentPlan.length * stepW,
      fy: startY + 20,
      color: '#f85149',
      activeColor: '#f8514933',
    });

    const edges = currentPlan.map((_, i) => ({
      source: `step-${i}`,
      target: i < currentPlan.length - 1 ? `step-${i + 1}` : 'goal',
      active: i === planIdx,
    }));

    return { nodes, edges, activeNodeId: `step-${planIdx}`, layout: 'force' };
  };

  brain.reset = () => {
    Object.assign(worldState, { hasWeapon: false, inRange: false, enemyAlive: true, healthy: true });
    npc = null;
    _replan();
  };

  return brain;
}
```

- [ ] **Step 2: Add to `js/main.js`**

```js
import { createGOAP } from './ai/goap.js';
registry.register('goap', 'GOAP', (w) => createGOAP(w));
```

- [ ] **Step 3: Verify** — NPC plans actions: FindWeapon → Approach → Attack. Graph shows action chain.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: GOAP — goal-oriented action planning, backward search, action chain viz"
```

---

### Task 10: HFSM AI Module

**Files:**
- Create: `js/ai/hfsm.js`
- Modify: `js/main.js`

- [ ] **Step 1: Create `js/ai/hfsm.js`**

Hierarchical FSM. Superstates: PEACEFUL(Idle, Patrol), ALERT(Detect, Investigate), COMBAT(Melee, Ranged, Cover).

```js
import { AIBrain } from './base.js';

export function createHFSM(world) {
  let npc = null;
  let superstate = 'PEACEFUL';
  let substate = 'Idle';
  let waypointIdx = 0;
  let timer = 0;
  let investigatePos = null;

  const SUPERSTATES = {
    PEACEFUL: { substates: ['Idle', 'Patrol'], color: '#3fb950' },
    ALERT: { substates: ['Detect', 'Investigate'], color: '#d29922' },
    COMBAT: { substates: ['Melee', 'Ranged', 'Cover'], color: '#f85149' },
  };

  const brain = new AIBrain(world);
  brain.name = 'HFSM';
  brain.description = 'Hierarchical FSM — nested superstates with substates';

  brain.setupWorld = () => {
    world.setWaypoints([
      { x: world.width * 0.1, y: world.height * 0.2 },
      { x: world.width * 0.4, y: world.height * 0.15 },
      { x: world.width * 0.4, y: world.height * 0.7 },
      { x: world.width * 0.1, y: world.height * 0.65 },
    ]);
    world.setObstacles([
      { x: world.width * 0.25, y: world.height * 0.4, w: 50, h: 30 },
    ]);
    npc = world.addNPC(world.width * 0.1, world.height * 0.2, { detectionRange: 140 });
    superstate = 'PEACEFUL'; substate = 'Idle'; timer = 0;
  };

  brain.update = (dt) => {
    if (!npc) return;
    const dist = npc.distanceTo(world.player);
    const canSee = npc.canSee(world.player);
    timer += dt;

    // Superstate transitions
    if (superstate === 'PEACEFUL' && canSee) {
      superstate = 'ALERT'; substate = 'Detect'; timer = 0;
    } else if (superstate === 'ALERT' && canSee && dist < 80) {
      superstate = 'COMBAT'; substate = dist < 40 ? 'Melee' : 'Ranged'; timer = 0;
    } else if (superstate === 'COMBAT' && !canSee && timer > 3) {
      superstate = 'ALERT'; substate = 'Investigate'; timer = 0;
      investigatePos = { x: world.player.x, y: world.player.y };
    } else if (superstate === 'ALERT' && !canSee && timer > 5) {
      superstate = 'PEACEFUL'; substate = 'Patrol'; timer = 0;
    }

    // Substate behavior
    switch (`${superstate}.${substate}`) {
      case 'PEACEFUL.Idle':
        npc.stop();
        if (timer > 2) { substate = 'Patrol'; timer = 0; }
        break;
      case 'PEACEFUL.Patrol':
        const wp = world.waypoints[waypointIdx];
        if (npc.moveTo(wp.x, wp.y, dt)) {
          waypointIdx = (waypointIdx + 1) % world.waypoints.length;
          substate = 'Idle'; timer = 0;
        }
        break;
      case 'ALERT.Detect':
        npc.stop();
        if (timer > 1) { substate = 'Investigate'; investigatePos = { x: world.player.x, y: world.player.y }; timer = 0; }
        break;
      case 'ALERT.Investigate':
        if (investigatePos && npc.moveTo(investigatePos.x, investigatePos.y, dt)) {
          npc.angle += dt * 3;
          if (timer > 3) { investigatePos = null; timer = 0; }
        }
        break;
      case 'COMBAT.Melee':
        npc.moveTo(world.player.x, world.player.y, dt);
        if (dist < npc.attackRange) {
          if (timer > 0.6) { world.player.health -= 12; timer = 0; }
        }
        if (dist > 50) { substate = 'Ranged'; timer = 0; }
        break;
      case 'COMBAT.Ranged':
        npc.stop();
        npc.angle = Math.atan2(world.player.y - npc.y, world.player.x - npc.x);
        if (timer > 1) { world.player.health -= 5; timer = 0; }
        if (dist < 35) substate = 'Melee';
        if (npc.health < 30) { substate = 'Cover'; timer = 0; }
        break;
      case 'COMBAT.Cover':
        const ox = world.obstacles[0];
        if (ox) npc.moveTo(ox.x, ox.y, dt);
        if (timer > 3) { substate = 'Ranged'; timer = 0; }
        break;
    }
  };

  brain.getState = () => ({
    label: `${superstate} > ${substate}`,
    detail: `Timer: ${timer.toFixed(1)}s | Player HP: ${world.player.health}`,
  });

  brain.getGraphData = () => {
    const nodes = [];
    const edges = [];
    const cx = 160;
    let superY = 30;

    Object.entries(SUPERSTATES).forEach(([sName, sDef], si) => {
      // Superstate node
      nodes.push({
        id: sName, label: sName,
        fx: cx, fy: superY + si * 90,
        color: sDef.color,
        activeColor: superstate === sName ? sDef.color + '33' : '#21262d',
      });
      // Substates
      sDef.substates.forEach((sub, i) => {
        const subId = `${sName}.${sub}`;
        nodes.push({
          id: subId, label: sub,
          fx: cx - 60 + i * 60, fy: superY + si * 90 + 35,
          color: (superstate === sName && substate === sub) ? sDef.color : '#8b949e',
          activeColor: (superstate === sName && substate === sub) ? sDef.color + '33' : '#21262d',
        });
        edges.push({ source: sName, target: subId, active: superstate === sName && substate === sub });
      });
    });

    // Superstate transitions
    edges.push({ source: 'PEACEFUL', target: 'ALERT', active: superstate === 'ALERT' });
    edges.push({ source: 'ALERT', target: 'COMBAT', active: superstate === 'COMBAT' });
    edges.push({ source: 'COMBAT', target: 'ALERT', active: false });
    edges.push({ source: 'ALERT', target: 'PEACEFUL', active: false });

    const activeId = `${superstate}.${substate}`;
    return { nodes, edges, activeNodeId: activeId, layout: 'force' };
  };

  brain.reset = () => {
    superstate = 'PEACEFUL'; substate = 'Idle'; timer = 0; waypointIdx = 0;
  };

  return brain;
}
```

- [ ] **Step 2: Add to `js/main.js`**

```js
import { createHFSM } from './ai/hfsm.js';
registry.register('hfsm', 'HFSM', (w) => createHFSM(w));
```

- [ ] **Step 3: Verify + Commit**

```bash
git add -A && git commit -m "feat: HFSM — hierarchical states, PEACEFUL/ALERT/COMBAT superstates"
```

---

### Task 11: Director AI Module

**Files:**
- Create: `js/ai/director.js`
- Modify: `js/main.js`

- [ ] **Step 1: Create `js/ai/director.js`**

L4D-inspired AI Director. Manages tension: BUILD-UP → PEAK → RELAX cycle. Spawns enemies based on stress.

```js
import { AIBrain } from './base.js';

export function createDirector(world) {
  let phase = 'BUILD_UP';
  let tension = 0;
  let phaseTimer = 0;
  let spawnTimer = 0;
  let enemies = [];
  let tensionHistory = [];
  let totalTime = 0;

  const PHASE_DURATIONS = { BUILD_UP: 8, PEAK: 5, RELAX: 6 };
  const SPAWN_RATES = { BUILD_UP: 2.5, PEAK: 1.0, RELAX: 8.0 };

  const brain = new AIBrain(world);
  brain.name = 'Director AI';
  brain.description = 'L4D-inspired AI Director — dynamic tension cycle';

  brain.setupWorld = () => {
    world.setWaypoints([]);
    world.setObstacles([]);
    world.npcs = [];
    enemies = [];
    phase = 'BUILD_UP'; tension = 0; phaseTimer = 0; spawnTimer = 0;
    tensionHistory = [];
    totalTime = 0;
  };

  brain.update = (dt) => {
    totalTime += dt;
    phaseTimer += dt;
    spawnTimer += dt;

    // Phase transitions
    if (phaseTimer >= PHASE_DURATIONS[phase]) {
      phaseTimer = 0;
      if (phase === 'BUILD_UP') phase = 'PEAK';
      else if (phase === 'PEAK') phase = 'RELAX';
      else phase = 'BUILD_UP';
    }

    // Spawn enemies
    if (spawnTimer >= SPAWN_RATES[phase]) {
      spawnTimer = 0;
      const edge = Math.floor(Math.random() * 4);
      let sx, sy;
      if (edge === 0) { sx = 0; sy = Math.random() * world.height; }
      else if (edge === 1) { sx = world.width; sy = Math.random() * world.height; }
      else if (edge === 2) { sx = Math.random() * world.width; sy = 0; }
      else { sx = Math.random() * world.width; sy = world.height; }
      const npc = world.addNPC(sx, sy, { speed: 50 + Math.random() * 40, size: 10, color: '#f85149' });
      enemies.push(npc);
    }

    // Move enemies toward player
    enemies.forEach(e => {
      e.moveTo(world.player.x, world.player.y, dt);
      if (e.distanceTo && e.distanceTo(world.player) < 20) {
        world.player.health -= dt * 5;
      }
    });

    // Remove far enemies during RELAX
    if (phase === 'RELAX') {
      enemies = enemies.filter(e => {
        if (e.distanceTo(world.player) > 250) {
          world.npcs = world.npcs.filter(n => n !== e);
          return false;
        }
        return true;
      });
    }

    // Calculate tension
    const nearbyCount = enemies.filter(e => e.distanceTo(world.player) < 120).length;
    tension = Math.min(1, nearbyCount * 0.2 + (phase === 'PEAK' ? 0.3 : 0));

    // Record history
    if (tensionHistory.length === 0 || totalTime - tensionHistory[tensionHistory.length - 1].t > 0.3) {
      tensionHistory.push({ t: totalTime, v: tension, phase });
      if (tensionHistory.length > 200) tensionHistory.shift();
    }
  };

  brain.getState = () => ({
    label: phase,
    detail: `Tension: ${(tension * 100).toFixed(0)}% | Enemies: ${enemies.length} | Time: ${totalTime.toFixed(0)}s`,
  });

  brain.getGraphData = () => {
    if (tensionHistory.length < 2) return { nodes: [], edges: [], activeNodeId: null };
    const w = 300, h = 200;
    const minT = tensionHistory[0].t;
    const maxT = tensionHistory[tensionHistory.length - 1].t;
    const range = maxT - minT || 1;

    const nodes = tensionHistory.map((pt, i) => ({
      id: `t${i}`,
      label: '',
      fx: 20 + ((pt.t - minT) / range) * (w - 40),
      fy: 20 + (1 - pt.v) * (h - 40),
      color: pt.phase === 'PEAK' ? '#f85149' : pt.phase === 'BUILD_UP' ? '#d29922' : '#3fb950',
      activeColor: '#21262d',
    }));

    const edges = tensionHistory.slice(1).map((_, i) => ({
      source: `t${i}`, target: `t${i + 1}`,
      active: i === tensionHistory.length - 2,
    }));

    // Phase label nodes
    const phaseColors = { BUILD_UP: '#d29922', PEAK: '#f85149', RELAX: '#3fb950' };
    nodes.push({
      id: 'phase-label',
      label: phase,
      fx: w / 2,
      fy: h + 20,
      color: phaseColors[phase],
      activeColor: phaseColors[phase] + '33',
    });

    return { nodes, edges, activeNodeId: 'phase-label', layout: 'force' };
  };

  brain.reset = () => {
    phase = 'BUILD_UP'; tension = 0; phaseTimer = 0; spawnTimer = 0;
    enemies = []; tensionHistory = []; totalTime = 0;
  };

  return brain;
}
```

- [ ] **Step 2: Add to `js/main.js`**

```js
import { createDirector } from './ai/director.js';
registry.register('director', 'Director', (w) => createDirector(w));
```

- [ ] **Step 3: Verify + Commit**

```bash
git add -A && git commit -m "feat: Director AI — L4D tension cycle, dynamic enemy spawning"
```

---

### Task 12: Reinforcement Learning Module

**Files:**
- Create: `js/ai/rl.js`
- Modify: `js/main.js`

- [ ] **Step 1: Create `js/ai/rl.js`**

Q-Learning on 10x10 grid maze. Agent learns optimal path. Heatmap visualization.

```js
import { AIBrain } from './base.js';

export function createRL(world) {
  const COLS = 10, ROWS = 10;
  const ACTIONS = ['up', 'down', 'left', 'right'];
  let qTable = {};
  let agentPos = { col: 0, row: 0 };
  let goalPos = { col: 9, row: 9 };
  let walls = new Set();
  let episode = 0;
  let totalReward = 0;
  let stepCount = 0;
  let rewardHistory = [];
  let alpha = 0.1, gamma = 0.95, epsilon = 0.3;
  let training = true;
  let trainSpeed = 10;
  let cellW, cellH;

  function stateKey(col, row) { return `${col},${row}`; }

  function getQ(state, action) {
    return (qTable[state] || {})[action] || 0;
  }

  function setQ(state, action, value) {
    if (!qTable[state]) qTable[state] = {};
    qTable[state][action] = value;
  }

  function bestAction(state) {
    let best = ACTIONS[0], bestVal = -Infinity;
    for (const a of ACTIONS) {
      const v = getQ(state, a);
      if (v > bestVal) { bestVal = v; best = a; }
    }
    return best;
  }

  function step() {
    const state = stateKey(agentPos.col, agentPos.row);
    const action = Math.random() < epsilon ? ACTIONS[Math.floor(Math.random() * 4)] : bestAction(state);

    let newCol = agentPos.col, newRow = agentPos.row;
    if (action === 'up') newRow--;
    if (action === 'down') newRow++;
    if (action === 'left') newCol--;
    if (action === 'right') newCol++;

    if (newCol < 0 || newCol >= COLS || newRow < 0 || newRow >= ROWS || walls.has(stateKey(newCol, newRow))) {
      newCol = agentPos.col; newRow = agentPos.row;
    }

    const newState = stateKey(newCol, newRow);
    let reward = -0.1;
    let done = false;

    if (newCol === goalPos.col && newRow === goalPos.row) {
      reward = 10;
      done = true;
    }

    const oldQ = getQ(state, action);
    const maxNextQ = Math.max(...ACTIONS.map(a => getQ(newState, a)));
    setQ(state, action, oldQ + alpha * (reward + gamma * maxNextQ - oldQ));

    agentPos = { col: newCol, row: newRow };
    totalReward += reward;
    stepCount++;

    if (done || stepCount > 200) {
      rewardHistory.push(totalReward);
      if (rewardHistory.length > 100) rewardHistory.shift();
      episode++;
      totalReward = 0;
      stepCount = 0;
      agentPos = { col: 0, row: 0 };
      epsilon = Math.max(0.05, epsilon * 0.998);
    }
  }

  const brain = new AIBrain(world);
  brain.name = 'RL (Q-Learning)';
  brain.description = 'Reinforcement Learning — agent learns maze navigation';

  brain.setupWorld = () => {
    world.setWaypoints([]);
    world.setObstacles([]);
    world.npcs = [];
    cellW = world.width / COLS;
    cellH = world.height / ROWS;
    qTable = {};
    agentPos = { col: 0, row: 0 };
    episode = 0; totalReward = 0; stepCount = 0;
    rewardHistory = [];
    epsilon = 0.3;
    walls = new Set();
    // Default maze walls
    [[3,0],[3,1],[3,2],[3,3],[5,4],[5,5],[5,6],[5,7],[5,8],[7,1],[7,2],[7,3],[7,4],[7,5],[2,6],[2,7],[2,8]].forEach(
      ([c,r]) => walls.add(stateKey(c, r))
    );
    world.addNPC(agentPos.col * cellW + cellW / 2, agentPos.row * cellH + cellH / 2, { size: 12, color: '#bc8cff' });
  };

  brain.update = (dt) => {
    if (!training) return;
    for (let i = 0; i < trainSpeed; i++) step();
    // Sync NPC position
    if (world.npcs[0]) {
      world.npcs[0].x = agentPos.col * cellW + cellW / 2;
      world.npcs[0].y = agentPos.row * cellH + cellH / 2;
    }
  };

  brain.customDraw = (p) => {
    // Draw grid + walls + Q-values heatmap
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * cellW, y = r * cellH;
        const sk = stateKey(c, r);
        if (walls.has(sk)) {
          p.fill(48, 54, 61); p.noStroke();
          p.rect(x, y, cellW - 1, cellH - 1, 2);
        } else {
          const maxQ = Math.max(0, ...ACTIONS.map(a => getQ(sk, a)));
          const intensity = Math.min(1, maxQ / 5);
          p.fill(88, 166, 255, intensity * 80);
          p.noStroke();
          p.rect(x, y, cellW - 1, cellH - 1);
        }
        // Grid lines
        p.stroke(48, 54, 61, 40); p.strokeWeight(0.5);
        p.noFill();
        p.rect(x, y, cellW, cellH);
      }
    }
    // Goal
    p.fill(63, 185, 80);
    p.circle(goalPos.col * cellW + cellW / 2, goalPos.row * cellH + cellH / 2, 16);
    // Start
    p.fill(88, 166, 255, 100);
    p.circle(0 * cellW + cellW / 2, 0 * cellH + cellH / 2, 12);
  };

  brain.getState = () => ({
    label: training ? 'TRAINING' : 'PAUSED',
    detail: `Episode: ${episode} | ε: ${epsilon.toFixed(3)} | Steps: ${stepCount}`,
  });

  brain.getGraphData = () => {
    const w = 300, h = 200;
    if (rewardHistory.length < 2) return { nodes: [], edges: [], activeNodeId: null };

    const maxR = Math.max(...rewardHistory);
    const minR = Math.min(...rewardHistory);
    const range = maxR - minR || 1;

    const nodes = rewardHistory.map((r, i) => ({
      id: `r${i}`,
      label: '',
      fx: 20 + (i / rewardHistory.length) * (w - 40),
      fy: 20 + (1 - (r - minR) / range) * (h - 60),
      color: r > 0 ? '#3fb950' : '#f85149',
      activeColor: '#21262d',
    }));

    nodes.push({
      id: 'ep-label',
      label: `Ep ${episode} | ε ${epsilon.toFixed(2)}`,
      fx: w / 2, fy: h - 10,
      color: '#58a6ff',
      activeColor: '#58a6ff33',
    });

    const edges = rewardHistory.slice(1).map((_, i) => ({
      source: `r${i}`, target: `r${i + 1}`, active: false,
    }));

    return { nodes, edges, activeNodeId: 'ep-label', layout: 'force' };
  };

  brain.reset = () => {
    qTable = {}; agentPos = { col: 0, row: 0 };
    episode = 0; totalReward = 0; stepCount = 0;
    rewardHistory = []; epsilon = 0.3;
  };

  return brain;
}
```

- [ ] **Step 2: Add to `js/main.js`**

```js
import { createRL } from './ai/rl.js';
registry.register('rl', 'RL', (w) => createRL(w));
```

- [ ] **Step 3: Verify + Commit**

```bash
git add -A && git commit -m "feat: RL Q-Learning — maze navigation, Q-table heatmap, reward chart"
```

---

### Task 13: LLM NPC Module

**Files:**
- Create: `js/ai/llm-npc.js`
- Modify: `js/main.js`

- [ ] **Step 1: Create `js/ai/llm-npc.js`**

NPC with dialog. Falls back to scripted responses (no API key required). Optional Claude API integration.

```js
import { AIBrain } from './base.js';

const SCRIPTED_RESPONSES = [
  { keywords: ['hello', 'hi', 'hey'], response: "Greetings, traveler. What brings you to these parts?", emotion: 'neutral' },
  { keywords: ['help', 'quest'], response: "I've heard rumors of bandits in the eastern woods. Could you investigate?", emotion: 'concerned' },
  { keywords: ['fight', 'attack', 'kill'], response: "You dare threaten me?! I'll defend myself!", emotion: 'angry' },
  { keywords: ['friend', 'peace', 'ally'], response: "A friend? In these troubled times, that's welcome indeed.", emotion: 'happy' },
  { keywords: ['bye', 'goodbye', 'leave'], response: "Safe travels, stranger. May the road treat you well.", emotion: 'neutral' },
  { keywords: ['name', 'who'], response: "I am Aldric, guardian of this crossroad. Been here thirty years.", emotion: 'neutral' },
  { keywords: ['danger', 'afraid', 'scared'], response: "I... I've seen things in the shadows lately. Please be careful.", emotion: 'scared' },
];

const EMOTIONS = {
  neutral: { color: '#8b949e', behavior: 'idle' },
  happy: { color: '#3fb950', behavior: 'wander' },
  angry: { color: '#f85149', behavior: 'chase' },
  scared: { color: '#d29922', behavior: 'flee' },
  concerned: { color: '#58a6ff', behavior: 'idle' },
};

export function createLLMNPC(world) {
  let npc = null;
  let emotion = 'neutral';
  let chatLog = [];
  let apiKey = '';
  let inputEl = null;
  let chatEl = null;
  let wanderTarget = null;
  let wanderTimer = 0;

  function getScriptedResponse(input) {
    const lower = input.toLowerCase();
    const match = SCRIPTED_RESPONSES.find(r => r.keywords.some(k => lower.includes(k)));
    return match || { response: "Hmm, I don't quite understand. Tell me more.", emotion: 'neutral' };
  }

  const brain = new AIBrain(world);
  brain.name = 'LLM NPC';
  brain.description = 'Dialog-driven NPC — scripted fallback, optional Claude API';

  brain.setupWorld = () => {
    world.setWaypoints([]);
    world.setObstacles([]);
    npc = world.addNPC(world.width * 0.25, world.height * 0.5, { size: 20, color: '#8b949e' });
    emotion = 'neutral';
    chatLog = [{ role: 'npc', text: "Greetings, traveler. What brings you here?", emotion: 'neutral' }];
  };

  brain.update = (dt) => {
    if (!npc) return;
    npc.color = EMOTIONS[emotion].color;
    const behavior = EMOTIONS[emotion].behavior;

    switch (behavior) {
      case 'idle':
        npc.stop();
        npc.angle += dt * 0.5;
        break;
      case 'wander':
        wanderTimer -= dt;
        if (wanderTimer <= 0 || !wanderTarget) {
          wanderTarget = {
            x: world.width * 0.1 + Math.random() * world.width * 0.4,
            y: world.height * 0.2 + Math.random() * world.height * 0.6,
          };
          wanderTimer = 3;
        }
        npc.moveTo(wanderTarget.x, wanderTarget.y, dt);
        break;
      case 'chase':
        npc.moveTo(world.player.x, world.player.y, dt);
        break;
      case 'flee':
        const dx = npc.x - world.player.x, dy = npc.y - world.player.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        npc.moveTo(npc.x + (dx / d) * 80, npc.y + (dy / d) * 80, dt);
        break;
    }
  };

  brain.getState = () => ({
    label: `${emotion.toUpperCase()}`,
    detail: `Messages: ${chatLog.length} | Mode: ${apiKey ? 'Claude API' : 'Scripted'}`,
  });

  brain.getGraphData = () => {
    // Render chat log as HTML overlay
    const chatHtml = `
      <div style="font-family: -apple-system, sans-serif; color: #e6edf3; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 8px 12px; border-bottom: 1px solid #30363d; font-size: 11px; color: #8b949e;">
          CONVERSATION LOG — Aldric (${emotion})
        </div>
        <div style="flex: 1; overflow-y: auto; padding: 12px;" id="chat-messages">
          ${chatLog.map(msg => `
            <div style="margin-bottom: 8px; padding: 8px 12px; border-radius: 8px;
              background: ${msg.role === 'npc' ? '#161b22' : '#0d419d'};
              border: 1px solid ${msg.role === 'npc' ? '#30363d' : '#58a6ff33'};
              max-width: 85%; ${msg.role === 'user' ? 'margin-left: auto;' : ''}">
              <div style="font-size: 10px; color: #8b949e; margin-bottom: 4px;">
                ${msg.role === 'npc' ? '🛡 Aldric' : '👤 You'}
                ${msg.emotion ? `<span style="color: ${EMOTIONS[msg.emotion]?.color || '#8b949e'}"> (${msg.emotion})</span>` : ''}
              </div>
              <div style="font-size: 13px;">${msg.text}</div>
            </div>
          `).join('')}
        </div>
        <div style="padding: 8px 12px; border-top: 1px solid #30363d; display: flex; gap: 8px;">
          <input type="text" id="npc-chat-input" placeholder="Type a message..."
            style="flex: 1; background: #0d1117; border: 1px solid #30363d; border-radius: 6px;
            color: #e6edf3; padding: 6px 10px; font-size: 13px; outline: none;"
          />
          <button id="npc-chat-send"
            style="background: #238636; color: white; border: none; border-radius: 6px;
            padding: 6px 16px; cursor: pointer; font-size: 13px;">Send</button>
        </div>
      </div>
    `;

    // Use HTML rendering instead of SVG
    return { nodes: [], edges: [], activeNodeId: null, html: chatHtml, layout: 'custom' };
  };

  // Override graph renderer to handle HTML
  const origGetGraphData = brain.getGraphData;
  brain.getGraphData = () => {
    const data = origGetGraphData();
    // Signal to graph renderer to use HTML
    data._html = true;
    return data;
  };

  brain.onGraphRendered = (container) => {
    const input = container.querySelector('#npc-chat-input');
    const btn = container.querySelector('#npc-chat-send');
    if (!input || !btn) return;

    const send = () => {
      const text = input.value.trim();
      if (!text) return;
      chatLog.push({ role: 'user', text });
      const resp = getScriptedResponse(text);
      chatLog.push({ role: 'npc', text: resp.response, emotion: resp.emotion });
      emotion = resp.emotion;
      input.value = '';
    };

    btn.onclick = send;
    input.onkeydown = (e) => { if (e.key === 'Enter') send(); };
  };

  brain.reset = () => {
    emotion = 'neutral';
    chatLog = [{ role: 'npc', text: "Greetings, traveler. What brings you here?", emotion: 'neutral' }];
  };

  return brain;
}
```

- [ ] **Step 2: Update `js/core/graph-renderer.js`** — add HTML rendering support

Add this to the `update` method in GraphRenderer, before the layout switch:

```js
// In update() method, after "if (!graphData || !graphData.nodes) return;"
if (graphData.html || graphData._html) {
  this.renderHTML(graphData.html || this._buildChatHTML(graphData));
  // Trigger callback if brain has onGraphRendered
  return;
}
this.showSVG();
```

- [ ] **Step 3: Update `js/main.js`** — add LLM import + handle onGraphRendered

```js
import { createLLMNPC } from './ai/llm-npc.js';
registry.register('llm', 'LLM NPC', (w) => createLLMNPC(w));
```

In the `engine.onRender` callback, after `graphRenderer.update(...)`, add:

```js
if (activeBrain && activeBrain.onGraphRendered) {
  activeBrain.onGraphRendered(document.getElementById('graph-container'));
}
```

- [ ] **Step 4: Verify + Commit**

```bash
git add -A && git commit -m "feat: LLM NPC — scripted dialog, emotion-driven behavior, chat UI"
```

---

### Task 14: Final Polish + Git Push

**Files:**
- Modify: `js/main.js` (ensure all 10 imports)
- Create: `.gitignore`

- [ ] **Step 1: Verify all 10 techniques registered in `js/main.js`**

Ensure all imports and registrations are present:

```js
import { createFSM } from './ai/fsm.js';
import { createBT } from './ai/bt.js';
import { createPathfinding } from './ai/pathfinding.js';
import { createSteering } from './ai/steering.js';
import { createUtility } from './ai/utility.js';
import { createGOAP } from './ai/goap.js';
import { createHFSM } from './ai/hfsm.js';
import { createDirector } from './ai/director.js';
import { createRL } from './ai/rl.js';
import { createLLMNPC } from './ai/llm-npc.js';

registry.register('fsm', 'FSM', (w) => createFSM(w));
registry.register('hfsm', 'HFSM', (w) => createHFSM(w));
registry.register('bt', 'Behavior Tree', (w) => createBT(w));
registry.register('utility', 'Utility AI', (w) => createUtility(w));
registry.register('goap', 'GOAP', (w) => createGOAP(w));
registry.register('pathfinding', 'A* Path', (w) => createPathfinding(w));
registry.register('steering', 'Steering', (w) => createSteering(w));
registry.register('director', 'Director', (w) => createDirector(w));
registry.register('rl', 'RL', (w) => createRL(w));
registry.register('llm', 'LLM NPC', (w) => createLLMNPC(w));
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
.DS_Store
.superpowers/
```

- [ ] **Step 3: Full browser test**

Open `http://localhost:3000`, click through ALL 10 tabs:
1. FSM — guard patrols, chases, attacks
2. HFSM — nested states, superstate transitions
3. Behavior Tree — tree visualization, node statuses
4. Utility AI — score bars, action switching
5. GOAP — action chain planning
6. A* Path — grid, path highlight
7. Steering — 30 boids flocking
8. Director — tension cycle, enemy spawning
9. RL — Q-learning, heatmap
10. LLM NPC — chat, emotion-driven behavior

- [ ] **Step 4: Create GitHub repo and push**

```bash
cd ~/projects/npc-ai-simulator
git add -A && git commit -m "feat: complete NPC AI Simulator — 10 techniques, dark theme, graph viz"
gh repo create npc-ai-simulator --public --source=. --push
```
