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
        if (investigatePos) {
          if (npc.moveTo(investigatePos.x, investigatePos.y, dt)) {
            npc.angle += dt * 3;
          }
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
    detail: `Timer: ${timer.toFixed(1)}s | Player HP: ${world.player?.health ?? 'N/A'}`,
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
    investigatePos = null; npc = null;
  };

  return brain;
}
