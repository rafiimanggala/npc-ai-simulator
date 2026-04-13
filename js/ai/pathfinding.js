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
  brain.description = 'A* pathfinding on grid — navigate around obstacles';

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
      if (i <= pathIdx) {
        p.fill(63, 185, 80);
      } else {
        p.fill(63, 185, 80, 100);
      }
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
    if (npc) {
      npc.x = start.col * cellW + cellW / 2;
      npc.y = start.row * cellH + cellH / 2;
    }
    _recalc();
  };

  return brain;
}
