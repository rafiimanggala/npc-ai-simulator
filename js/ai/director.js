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
