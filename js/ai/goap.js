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
      case 'PickUp': {
        const wpn = world.waypoints.find(w => w.id === 99) || world.waypoints[0];
        if (npc.moveTo(wpn.x, wpn.y, dt)) {
          worldState.hasWeapon = true;
          npc.color = '#f85149';
          planIdx++; actionTimer = 0;
        }
        break;
      }
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
      case 'Flee': {
        const dx = npc.x - world.player.x, dy = npc.y - world.player.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        npc.moveTo(npc.x + (dx / d) * 80, npc.y + (dy / d) * 80, dt);
        if (npc.distanceTo(world.player) > 150) {
          worldState.inRange = false;
          planIdx++; actionTimer = 0;
        }
        break;
      }
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
