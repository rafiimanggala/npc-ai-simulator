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
