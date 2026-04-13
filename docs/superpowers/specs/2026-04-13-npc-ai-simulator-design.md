# NPC AI Simulator — Design Spec

## Goal
Web-based platform untuk demo dan visualisasi 10 teknik AI NPC secara interaktif. Satu app, switch teknik via tab, lihat NPC behavior + AI decision graph real-time.

## Target User
- Rafii (portfolio piece untuk AI Game Engineer career)
- Recruiters/hiring managers yang review portfolio
- Game dev community (educational tool)

## Architecture: Plugin System

Setiap teknik AI = 1 module yang implement interface `AIBrain`:

```js
// Interface yang SEMUA teknik harus implement
class AIBrain {
  constructor(world) {}     // terima world state
  update(dt) {}             // update logic per frame
  getState() {}             // return current state info
  getGraphData() {}         // return nodes + edges untuk visualization
  reset() {}                // reset ke initial state
  getConfig() {}            // return configurable parameters
}
```

### File Structure

```
npc-ai-simulator/
├── index.html              # Entry point
├── css/
│   └── style.css           # Dark theme, layout
├── js/
│   ├── core/
│   │   ├── engine.js       # Game loop, timing
│   │   ├── world.js        # Shared world (entities, grid, obstacles)
│   │   ├── renderer.js     # p5.js simulation renderer
│   │   ├── graph.js        # D3.js AI decision graph renderer
│   │   └── registry.js     # Plugin registry + technique switcher
│   ├── entities/
│   │   ├── npc.js          # NPC entity (position, velocity, stats)
│   │   └── player.js       # Player entity (mouse-controlled)
│   ├── ai/                 # ← FOKUS UTAMA: engine-agnostic AI logic
│   │   ├── fsm.js          # 1. Finite State Machine
│   │   ├── hfsm.js         # 2. Hierarchical FSM
│   │   ├── bt.js           # 3. Behavior Tree
│   │   ├── utility.js      # 4. Utility AI
│   │   ├── goap.js         # 5. Goal-Oriented Action Planning
│   │   ├── pathfinding.js  # 6. A* Pathfinding
│   │   ├── steering.js     # 7. Steering/Flocking
│   │   ├── director.js     # 8. Director AI / DDA
│   │   ├── rl.js           # 9. Reinforcement Learning (simplified)
│   │   └── llm-npc.js      # 10. LLM-Powered NPC
│   └── ui/
│       ├── controls.js     # Play/Pause/Speed/Reset
│       ├── tabs.js         # Technique selector tabs
│       └── info-panel.js   # State info display
└── docs/
```

## 10 Teknik — Spesifikasi

### 1. FSM (Finite State Machine)
- **States**: IDLE, PATROL, DETECT, CHASE, ATTACK, RETURN
- **Transitions**: timer, distance-based detection, los of sight
- **Graph**: 6 circular nodes, edges = transitions, active node glow blue
- **World**: 1 guard NPC, 4 waypoints, 1 player (mouse)

### 2. HFSM (Hierarchical FSM)
- **Superstates**: PEACEFUL (Idle, Patrol), ALERT (Detect, Investigate), COMBAT (Melee, Ranged, Cover)
- **Nested transitions**: superstate → substate
- **Graph**: Grouped nodes with expand/collapse, parent-child edges

### 3. Behavior Tree
- **Nodes**: Selector, Sequence, Decorator (Inverter, Repeater), Action, Condition
- **Tree**: Root → Selector[Attack sequence, Investigate sequence, Patrol sequence]
- **Graph**: Top-down tree layout, node colors = Running(yellow)/Success(green)/Failure(red)
- **Blackboard**: Shared data (target, lastKnownPos, alertLevel)

### 4. Utility AI
- **Actions**: Patrol, Eat, Sleep, Attack, Flee, Investigate
- **Considerations**: health, hunger, energy, danger, curiosity
- **Response curves**: Linear, Quadratic, Logistic
- **Graph**: Horizontal bar chart per action (score 0-1), response curve editor

### 5. GOAP (Goal-Oriented Action Planning)
- **Goals**: KillEnemy, StayAlive, Patrol
- **Actions**: FindWeapon, PickUp, Approach, Attack, Heal, Flee
- **Preconditions/Effects**: hasWeapon, inRange, enemyAlive, health>30
- **Graph**: Action chain from goal → planned steps, world state diff per step

### 6. A* Pathfinding
- **Grid**: 20x20 cells, obstacles, start/end points
- **Algorithm**: A* with Manhattan heuristic
- **Visualization**: Open list (light blue), Closed list (dark blue), Path (green), Obstacles (gray)
- **Interactive**: Click to place obstacles, click to set start/end
- **Graph**: Grid overlay with cost values, f/g/h per cell on hover

### 7. Steering / Flocking
- **Agents**: 20-50 boids
- **Behaviors**: Seek, Flee, Arrive, Wander, Pursue, Evade
- **Flocking**: Separation, Alignment, Cohesion (Reynolds rules)
- **Graph**: Per-agent force vectors visualized as arrows, weight sliders
- **Interactive**: Sliders to adjust behavior weights

### 8. Director AI / DDA
- **Model**: L4D AI Director inspired
- **Cycle**: BUILD-UP → PEAK → RELAX → repeat
- **Spawn**: Enemies spawn rate based on player stress level
- **Stress**: Calculated from damage taken, enemies nearby, time since last combat
- **Graph**: Line chart — tension over time, phase markers, spawn events

### 9. RL (Reinforcement Learning — Simplified)
- **Environment**: 10x10 grid maze
- **Agent**: NPC learns to navigate to goal
- **Algorithm**: Q-Learning (tabular, no neural network)
- **Graph**: Q-table as heatmap, cumulative reward chart, episode counter
- **Controls**: Train speed, episodes slider, show/hide Q-values

### 10. LLM NPC (Claude API)
- **Setup**: NPC with personality prompt, RAG memory
- **Input**: User types message, NPC responds with dialog + behavior change
- **Behavior**: NPC emotion state affects movement (happy=wander, angry=chase, scared=flee)
- **Graph**: Conversation log panel, emotion state indicator, memory entries
- **Note**: Requires Claude API key input (optional, falls back to scripted dialog)

## Shared Components

### World
- 2D canvas, dark background, grid overlay
- Entities: NPCs (blue squares), Player (orange circle), Waypoints (green dots), Obstacles (gray blocks)
- Coordinate system: pixel-based, origin top-left

### Graph Renderer (D3.js)
- Force-directed layout by default (Obsidian-style)
- Technique-specific layouts: tree (BT), grid (A*/RL), bar chart (Utility), timeline (Director)
- Active node: glow animation + size pulse
- Edges: animated particles on active transitions
- Dark theme matching simulation panel

### Controls
- Play / Pause / Reset
- Speed: 0.25x, 0.5x, 1x, 2x, 4x
- Info panel: current state, stats, technique description

## Tech Stack
- **Rendering**: p5.js (simulation canvas)
- **Graph**: D3.js v7 (force-directed + tree + bar layouts)
- **UI**: Vanilla HTML/CSS/JS (no framework)
- **Build**: None (vanilla JS with ES modules, or single Vite config)
- **Deploy**: Firebase Hosting or Vercel (static)

## Visual Design
- Dark theme (#0d1117 background, #161b22 panels)
- Color palette: Blue (#58a6ff) NPC, Orange (#f0883e) Player, Green (#3fb950) Safe, Red (#f85149) Danger
- Monospace font for data, sans-serif for labels
- Glow effects on active elements (box-shadow + animation)

## Build Order (Priority)
1. Core shell (layout, engine, world, registry)
2. FSM (simplest — validate architecture)
3. BT (most demanded skill)
4. A* Pathfinding
5. Steering/Flocking
6. Utility AI
7. GOAP
8. HFSM
9. Director AI
10. RL
11. LLM NPC (last — requires API key)

## Non-Goals
- Bukan game — ini simulator/tool
- Bukan mobile responsive (desktop fokus)
- Bukan multiplayer
- Bukan pixel art / fancy graphics — clean, technical look
