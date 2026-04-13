export class Registry {
  constructor() {
    this.techniques = new Map();
    this.active = null;
    this.onSwitch = null;
  }

  register(id, name, factory) {
    this.techniques.set(id, { id, name, factory, instance: null });
  }

  switch(id, world) {
    const entry = this.techniques.get(id);
    if (!entry) return null;
    if (!entry.instance) {
      entry.instance = entry.factory(world);
    } else {
      entry.instance.world = world;
      entry.instance.reset();
    }
    this.active = entry;
    if (this.onSwitch) this.onSwitch(entry);
    return entry.instance;
  }

  getActive() {
    return this.active ? this.active.instance : null;
  }

  getActiveName() {
    return this.active ? this.active.name : '';
  }

  list() {
    return [...this.techniques.values()].map(t => ({ id: t.id, name: t.name }));
  }
}
