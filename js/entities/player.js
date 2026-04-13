export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 12;
    this.color = '#f0883e';
    this.alive = true;
    this.health = 100;
  }

  updateFromMouse(mx, my, bounds) {
    this.x = Math.max(0, Math.min(mx, bounds.width));
    this.y = Math.max(0, Math.min(my, bounds.height));
  }
}
