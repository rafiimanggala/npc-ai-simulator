export class NPC {
  constructor(x, y, options = {}) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.speed = options.speed || 80;
    this.size = options.size || 16;
    this.color = options.color || '#58a6ff';
    this.health = options.health || 100;
    this.maxHealth = options.health || 100;
    this.detectionRange = options.detectionRange || 120;
    this.attackRange = options.attackRange || 30;
    this.fov = options.fov || Math.PI / 2;
    this.angle = 0;
  }

  moveTo(tx, ty, dt) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 2) return true;
    const step = this.speed * dt;
    if (step >= dist) {
      this.x = tx;
      this.y = ty;
      this.vx = 0;
      this.vy = 0;
      this.angle = Math.atan2(dy, dx);
      return true;
    }
    this.vx = (dx / dist) * this.speed;
    this.vy = (dy / dist) * this.speed;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.angle = Math.atan2(dy, dx);
    return false;
  }

  distanceTo(entity) {
    const dx = entity.x - this.x;
    const dy = entity.y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  canSee(entity) {
    const dist = this.distanceTo(entity);
    if (dist > this.detectionRange) return false;
    const angleToEntity = Math.atan2(entity.y - this.y, entity.x - this.x);
    let angleDiff = angleToEntity - this.angle;
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    return Math.abs(angleDiff) < this.fov / 2;
  }

  stop() {
    this.vx = 0;
    this.vy = 0;
  }
}
