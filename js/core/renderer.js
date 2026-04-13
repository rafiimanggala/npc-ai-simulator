export class Renderer {
  constructor(containerId, world) {
    this.world = world;
    this.container = document.getElementById(containerId);
    this.p5instance = null;
    this._initP5();
  }

  _initP5() {
    const self = this;
    const sketch = (p) => {
      p.setup = () => {
        const rect = self.container.getBoundingClientRect();
        const canvas = p.createCanvas(rect.width, rect.height);
        canvas.parent(self.container);
        self.world.width = rect.width;
        self.world.height = rect.height;
      };

      p.draw = () => {
        const w = self.world;
        p.background(13, 17, 23);

        // Grid
        p.stroke(88, 166, 255, 15);
        p.strokeWeight(0.5);
        for (let x = 0; x < w.width; x += 30) p.line(x, 0, x, w.height);
        for (let y = 0; y < w.height; y += 30) p.line(0, y, w.width, y);

        // Obstacles
        p.noStroke();
        w.obstacles.forEach(o => {
          p.fill(48, 54, 61);
          p.rect(o.x, o.y, o.w, o.h, 2);
        });

        // Waypoints + connecting lines
        if (w.waypoints.length > 1) {
          p.stroke(63, 185, 80, 60);
          p.strokeWeight(1);
          for (let i = 0; i < w.waypoints.length; i++) {
            const a = w.waypoints[i];
            const b = w.waypoints[(i + 1) % w.waypoints.length];
            p.line(a.x, a.y, b.x, b.y);
          }
        }
        w.waypoints.forEach(wp => {
          p.noStroke();
          p.fill(63, 185, 80);
          p.circle(wp.x, wp.y, 8);
          p.fill(63, 185, 80, 60);
          p.circle(wp.x, wp.y, 14);
        });

        // NPCs
        w.npcs.forEach(npc => {
          // Vision cone
          p.fill(88, 166, 255, 15);
          p.noStroke();
          p.arc(npc.x, npc.y, npc.detectionRange * 2, npc.detectionRange * 2,
            npc.angle - npc.fov / 2, npc.angle + npc.fov / 2, p.PIE);

          // Body
          p.fill(npc.color);
          p.noStroke();
          p.push();
          p.translate(npc.x, npc.y);
          p.rotate(npc.angle);
          p.rect(-npc.size / 2, -npc.size / 2, npc.size, npc.size, 3);
          // Direction indicator
          p.fill(255, 255, 255, 180);
          p.triangle(npc.size / 2, 0, npc.size / 4, -4, npc.size / 4, 4);
          p.pop();

          // Glow
          p.drawingContext.shadowBlur = 12;
          p.drawingContext.shadowColor = npc.color;
          p.fill(npc.color);
          p.circle(npc.x, npc.y, 4);
          p.drawingContext.shadowBlur = 0;
        });

        // Player
        if (w.player.alive) {
          const pl = w.player;
          p.fill(240, 136, 62);
          p.noStroke();
          p.circle(pl.x, pl.y, pl.size);
          p.drawingContext.shadowBlur = 10;
          p.drawingContext.shadowColor = '#f0883e';
          p.circle(pl.x, pl.y, 6);
          p.drawingContext.shadowBlur = 0;
        }

        // Custom overlay from AI brain
        if (self.customDraw) self.customDraw(p);
      };

      p.mouseMoved = () => {
        const rect = self.container.getBoundingClientRect();
        self.world.player.updateFromMouse(
          p.mouseX, p.mouseY,
          { width: rect.width, height: rect.height }
        );
      };

      p.windowResized = () => {
        const rect = self.container.getBoundingClientRect();
        p.resizeCanvas(rect.width, rect.height);
        self.world.width = rect.width;
        self.world.height = rect.height;
      };
    };

    this.p5instance = new p5(sketch);
  }

  setCustomDraw(fn) { this.customDraw = fn; }
}
