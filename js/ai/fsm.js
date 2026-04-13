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
        // Rotate to scan surroundings while idle
        npc.angle += dt * 0.8;
        if (idleTimer >= IDLE_DURATION) {
          state = STATES.PATROL;
          idleTimer = 0;
        }
        if (npc.canSee(player)) {
          state = STATES.DETECT;
          detectTimer = 0;
        }
        break;

      case STATES.PATROL: {
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
      }

      case STATES.DETECT:
        npc.stop();
        npc.angle = Math.atan2(player.y - npc.y, player.x - npc.x);
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
        npc.angle = Math.atan2(player.y - npc.y, player.x - npc.x);
        if (!player.alive) { state = STATES.RETURN; break; }
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

      case STATES.RETURN: {
        const home = world.waypoints[0] || homePos;
        const atHome = npc.moveTo(home.x, home.y, dt);
        if (atHome) {
          state = STATES.IDLE;
          idleTimer = 0;
          waypointIdx = 0;
        }
        break;
      }
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
    npc = null;
  };

  return brain;
}
