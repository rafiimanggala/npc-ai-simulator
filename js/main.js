import { Engine } from './core/engine.js';
import { World } from './core/world.js';
import { Renderer } from './core/renderer.js';
import { GraphRenderer } from './core/graph-renderer.js';
import { Registry } from './core/registry.js';
import { Controls } from './ui/controls.js';

// AI Module Imports
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

// Init
const engine = new Engine();
const world = new World(800, 600);
const registry = new Registry();

// Register AI techniques
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
      const gd = activeBrain.getGraphData();
      graphRenderer.update(gd);
      if (gd && gd._html && activeBrain.onGraphRendered) {
        activeBrain.onGraphRendered(document.getElementById('graph-container'));
      }
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
