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
    walls = new Set();
    [[3,0],[3,1],[3,2],[3,3],[5,4],[5,5],[5,6],[5,7],[5,8],[7,1],[7,2],[7,3],[7,4],[7,5],[2,6],[2,7],[2,8]].forEach(
      ([c,r]) => walls.add(stateKey(c, r))
    );
    if (world.npcs[0]) {
      world.npcs[0].x = agentPos.col * cellW + cellW / 2;
      world.npcs[0].y = agentPos.row * cellH + cellH / 2;
    }
  };

  return brain;
}
