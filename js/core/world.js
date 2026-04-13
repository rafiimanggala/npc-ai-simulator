import { NPC } from '../entities/npc.js';
import { Player } from '../entities/player.js';

export class World {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.npcs = [];
    this.player = new Player(width * 0.75, height * 0.5);
    this.waypoints = [];
    this.obstacles = [];
    this.grid = null;
    this.gridCellSize = 20;
  }

  addNPC(x, y, options) {
    const npc = new NPC(x, y, options);
    this.npcs.push(npc);
    return npc;
  }

  setWaypoints(points) {
    this.waypoints = points.map((p, i) => ({ id: i, x: p.x, y: p.y }));
  }

  setObstacles(rects) {
    this.obstacles = rects.map((r, i) => ({ id: i, ...r }));
  }

  initGrid(cols, rows) {
    this.grid = { cols, rows, cells: [] };
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.grid.cells.push({ col: c, row: r, walkable: true, cost: 1 });
      }
    }
    return this.grid;
  }

  getGridCell(col, row) {
    if (!this.grid || col < 0 || row < 0 || col >= this.grid.cols || row >= this.grid.rows) return null;
    return this.grid.cells[row * this.grid.cols + col];
  }

  pointInObstacle(x, y) {
    return this.obstacles.some(o => x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h);
  }

  reset() {
    this.npcs = [];
    this.player.x = this.width * 0.75;
    this.player.y = this.height * 0.5;
    this.player.health = 100;
    this.player.alive = true;
  }
}
