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

    const prev = currentAction;
    currentAction = evaluate();
    if (currentAction !== prev) actionTimer = 0;

    switch (currentAction) {
      case 'PATROL': {
        const wp = world.waypoints[waypointIdx];
        if (npc.moveTo(wp.x, wp.y, dt)) waypointIdx = (waypointIdx + 1) % world.waypoints.length;
        break;
      }
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
      case 'FLEE': {
        const dx = npc.x - world.player.x, dy = npc.y - world.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        npc.moveTo(npc.x + (dx / dist) * 100, npc.y + (dy / dist) * 100, dt);
        break;
      }
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
    if (Object.keys(scores).length === 0) evaluate();
    const barWidth = 200;
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
    npc = null;
  };

  return brain;
}
