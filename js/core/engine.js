export class Engine {
  constructor() {
    this.running = false;
    this.speed = 1.0;
    this.lastTime = 0;
    this.fps = 0;
    this.frameCount = 0;
    this.fpsTime = 0;
    this.onUpdate = null;
    this.onRender = null;
    this._raf = null;
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this._loop(this.lastTime);
  }

  pause() { this.running = false; }

  resume() {
    if (!this.running) {
      this.running = true;
      this.lastTime = performance.now();
      this._loop(this.lastTime);
    }
  }

  setSpeed(s) { this.speed = s; }

  _loop(now) {
    if (!this.running) return;
    const rawDt = (now - this.lastTime) / 1000;
    const dt = Math.min(rawDt, 0.05) * this.speed;
    this.lastTime = now;

    this.frameCount++;
    this.fpsTime += rawDt;
    if (this.fpsTime >= 1) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTime = 0;
    }

    if (this.onUpdate) this.onUpdate(dt);
    if (this.onRender) this.onRender();

    this._raf = requestAnimationFrame((t) => this._loop(t));
  }

  stop() {
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
  }
}
