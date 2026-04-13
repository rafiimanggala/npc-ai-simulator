import { AIBrain } from './base.js';

class Boid {
  constructor(x, y, id) {
    this.id = id;
    this.x = x; this.y = y;
    this.vx = (Math.random() - 0.5) * 60;
    this.vy = (Math.random() - 0.5) * 60;
    this.ax = 0; this.ay = 0;
    this.maxSpeed = 100;
    this.maxForce = 200;
    this.size = 6;
  }

  applyForce(fx, fy) { this.ax += fx; this.ay += fy; }

  update(dt, w, h) {
    this.vx += this.ax * dt; this.vy += this.ay * dt;
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > this.maxSpeed) {
      this.vx = (this.vx / speed) * this.maxSpeed;
      this.vy = (this.vy / speed) * this.maxSpeed;
    }
    this.x += this.vx * dt; this.y += this.vy * dt;
    // Wrap
    if (this.x < 0) this.x = w; if (this.x > w) this.x = 0;
    if (this.y < 0) this.y = h; if (this.y > h) this.y = 0;
    this.ax = 0; this.ay = 0;
  }
}

function steer(boid, tx, ty, maxSpeed, maxForce) {
  let dx = tx - boid.x, dy = ty - boid.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 0.01) return { x: 0, y: 0 };
  dx = (dx / dist) * maxSpeed - boid.vx;
  dy = (dy / dist) * maxSpeed - boid.vy;
  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag > maxForce) { dx = (dx / mag) * maxForce; dy = (dy / mag) * maxForce; }
  return { x: dx, y: dy };
}

export function createSteering(world) {
  let boids = [];
  const weights = { separation: 2.5, alignment: 1.0, cohesion: 1.0, seek: 0.8 };
  const perception = 60;

  const brain = new AIBrain(world);
  brain.name = 'Steering/Flocking';
  brain.description = 'Craig Reynolds Boids — separation, alignment, cohesion';

  brain.setupWorld = () => {
    world.setWaypoints([]);
    world.setObstacles([]);
    world.npcs = [];
    boids = [];
    for (let i = 0; i < 30; i++) {
      const b = new Boid(
        Math.random() * world.width * 0.5 + world.width * 0.05,
        Math.random() * world.height,
        i
      );
      boids.push(b);
      const npc = world.addNPC(b.x, b.y, { size: 8, speed: 100 });
      npc._boidRef = b;
    }
  };

  brain.update = (dt) => {
    const target = world.player;

    boids.forEach(boid => {
      let sepX = 0, sepY = 0, sepCount = 0;
      let aliVx = 0, aliVy = 0, aliCount = 0;
      let cohX = 0, cohY = 0, cohCount = 0;

      boids.forEach(other => {
        if (other.id === boid.id) return;
        const dx = other.x - boid.x, dy = other.y - boid.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < perception && dist > 0) {
          // Separation
          if (dist < perception * 0.5) {
            sepX -= dx / dist; sepY -= dy / dist; sepCount++;
          }
          // Alignment
          aliVx += other.vx; aliVy += other.vy; aliCount++;
          // Cohesion
          cohX += other.x; cohY += other.y; cohCount++;
        }
      });

      if (sepCount > 0) {
        const s = steer(boid, boid.x + sepX, boid.y + sepY, boid.maxSpeed, boid.maxForce);
        boid.applyForce(s.x * weights.separation, s.y * weights.separation);
      }
      if (aliCount > 0) {
        const s = steer(boid, boid.x + aliVx / aliCount, boid.y + aliVy / aliCount, boid.maxSpeed, boid.maxForce);
        boid.applyForce(s.x * weights.alignment, s.y * weights.alignment);
      }
      if (cohCount > 0) {
        const s = steer(boid, cohX / cohCount, cohY / cohCount, boid.maxSpeed, boid.maxForce);
        boid.applyForce(s.x * weights.cohesion, s.y * weights.cohesion);
      }
      // Seek player
      const sk = steer(boid, target.x, target.y, boid.maxSpeed, boid.maxForce);
      boid.applyForce(sk.x * weights.seek, sk.y * weights.seek);

      boid.update(dt, world.width, world.height);
    });

    // Sync NPC positions
    world.npcs.forEach((npc, i) => {
      if (boids[i]) {
        npc.x = boids[i].x; npc.y = boids[i].y;
        npc.angle = Math.atan2(boids[i].vy, boids[i].vx);
      }
    });
  };

  brain.getState = () => ({
    label: 'FLOCKING',
    detail: `Boids: ${boids.length} | Sep: ${weights.separation} Ali: ${weights.alignment} Coh: ${weights.cohesion}`,
  });

  brain.getGraphData = () => {
    const w = 320, h = 280;
    const barY = 30;
    const barH = 20;
    const bars = [
      { id: 'sep', label: 'Separation', value: weights.separation, max: 5, color: '#f85149' },
      { id: 'ali', label: 'Alignment', value: weights.alignment, max: 5, color: '#58a6ff' },
      { id: 'coh', label: 'Cohesion', value: weights.cohesion, max: 5, color: '#3fb950' },
      { id: 'seek', label: 'Seek', value: weights.seek, max: 5, color: '#f0883e' },
    ];

    const nodes = bars.map((b, i) => ({
      id: b.id,
      label: `${b.label}: ${b.value.toFixed(1)}`,
      fx: 60 + (b.value / b.max) * 200,
      fy: barY + i * 50 + 25,
      color: b.color,
      activeColor: b.color + '33',
    }));

    return { nodes, edges: [], activeNodeId: 'sep', layout: 'force' };
  };

  brain.reset = () => {};

  return brain;
}
